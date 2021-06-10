import { execFile, execFileSync } from "child_process";
import { promisify } from "util";
import path from "path";
import scuid from "scuid";

const execFileAsync = promisify(execFile);

// NICE평가정보에서 발급한 본인인증 서비스 개발 정보(사이트 코드 , 사이트 패스워드)
const SITE_CODE = process.env.SITE_CODE || "";
const SITE_PASSWORD = process.env.SITE_PASSWORD || "";
const PLATFORM: "Mac" | "Linux" | "Linux_x64" | "Window" = "Mac";
const CPClientPath = path.join(process.cwd(), "bin", PLATFORM, "CPClient");

export type InitialOptions = {
  // 없으면 기본 선택화면, X: 공인인증서, M: 핸드폰, C: 카드
  authType?: "X" | "M" | "C";
  // Y : 취소버튼 있음 / N : 취소버튼 없음
  popGubun?: "Y" | "N";
  // 없으면 기본 웹페이지 / Mobile : 모바일페이지
  customize?: "Mobile";
  // 없으면 기본 선택화면, 0: 여자, 1: 남자
  gender?: "0" | "1";
  // 성공시 이동될 URL (방식 : 프로토콜을 포함한 절대 주소)
  successUrl: string;
  // 실패시 이동될 URL (방식 : 프로토콜을 포함한 절대 주소)
  failUrl: string;
};

function flatten(obj: object) {
  let itemsFlatten = "";
  for (const keyValue of Object.entries(obj)) {
    // console.log("keyValue", keyValue);
    const [_key, _value] = keyValue;
    // console.log("_key, _value", _key, _value);
    itemsFlatten += `${_key.length + ":" + _key}${
      _value.length + ":" + _value
    }`;
  }
  return itemsFlatten;
}

function extractTextRecursive(text: string, parsed: string[] = []): string[] {
  if (text.length < 2) {
    return parsed;
  }
  // 최소 단위 0:
  const reResult = /\d*:/.exec(text);
  const lengthText = reResult![0];
  const valueLength = parseInt(lengthText.slice(0, -1));
  const value = text.slice(lengthText.length, lengthText.length + valueLength);
  parsed.push(value);
  return extractTextRecursive(
    text.slice(lengthText.length + valueLength),
    parsed
  );
}

const parse = (decodePlainText: string) => {
  const _decodedPlainTexts = extractTextRecursive(decodePlainText);
  if (_decodedPlainTexts.length % 2 !== 0) {
    throw new Error("Bad decoded format detected.");
  }
  const decodedPlainTexts: { [key: string]: string } = {};
  for (let idx = 0; idx < _decodedPlainTexts.length / 2; idx += 1) {
    decodedPlainTexts[_decodedPlainTexts[2 * idx].toLowerCase()] =
      _decodedPlainTexts[2 * idx + 1];
  }
  // const name = Buffer.from(decodedPlainTexts["NAME"]);
  // const utf8Name = decodedPlainTexts["UTF8_NAME"];

  if (decodedPlainTexts["utf8_name"]) {
    decodedPlainTexts["utf8_name"] = decodeURIComponent(
      decodedPlainTexts["utf8_name"]
    );
  }

  return decodedPlainTexts;
};

export const initSession = async (opt: InitialOptions) => {
  try {
    const { stdout } = await execFileAsync(
      CPClientPath,
      [
        "ENC",
        SITE_CODE,
        SITE_PASSWORD,
        flatten({
          REQ_SEQ: scuid(),
          // REQ_SEQ: SITE_CODE + "_" + Date.now(),
          SITECODE: SITE_CODE,
          AUTH_TYPE: "",
          RTN_URL: opt.successUrl,
          ERR_URL: opt.failUrl,
          POPUP_GUBUN: "N",
          CUSTOMIZE: "Mobile",
          GENDER: "",
        }),
      ],
      { encoding: "utf8" }
    );
    return stdout;
  } catch (err) {
    // console.log(err.cmd);
    // 바이너리 모듈의 정상 종료 코드가 1이다  - 난감
    if (err.code === 1) {
      switch (err.stdout) {
        case "-1":
          throw new Error("암/복호화 시스템 오류");
        case "-2":
          throw new Error("암호화 처리 오류");
        case "-3":
          throw new Error("암호화 데이터 오류");
        case "-9":
          throw new Error(
            "입력값 오류 : 암호화 처리시, 필요한 파라미터 값 확인 필요"
          );
        default:
          return err.stdout;
      }
    }
  }
};

export const decode = async (encodedText: string) => {
  try {
    // exit code 로 1 을 뱉어서 무조건 에러 발생한다.
    const { stdout } = await execFileAsync(
      CPClientPath,
      ["DEC", SITE_CODE, SITE_PASSWORD, encodedText],
      { encoding: "utf8" }
    );
    return stdout;
  } catch (err) {
    // console.log("err.cmd", err.cmd);
    if (err.code === 1) {
      switch (err.stdout) {
        case "-1":
          throw new Error("암/복호화 시스템 오류");
        case "-4":
          throw new Error("복호화 처리 오류");
        case "-5":
          throw new Error("HASH값 불일치 - 복호화 데이터는 리턴됨");
        case "-6":
          throw new Error("복호화 데이터 오류");
        case "-9":
          throw new Error("입력값 오류");
        case "-12":
          throw new Error("사이트 비밀번호 오류");
        default:
          return parse(err.stdout);
      }
    }
    throw err;
  }
};
