import http from "http";
import { URL } from "url";
import qs from "qs";
import {
  initSession,
  InitialOptions,
  decode,
  initialHtmlServing,
} from "./NiceAuthorization.module";

const PORT = process.env.PORT || 8888;

const requestHandler: http.RequestListener = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const { method, url } = req;
  const _url = new URL(<string>url, process.env.NICE_SERVER_HOSTNAME);

  const CORSHeader = {
  'Access-Control-Allow-Origin': 'https://buy-car.chabot.co.kr',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept',
  'Access-Control-Max-Age': 0,
  'Content-type': 'text/html; charset=utf-8',
  };

  switch (`${method?.toUpperCase()} ${_url.pathname}`) {
    case "GET /nice": {
      const successUrl =
        _url.searchParams.get("success-url") ||
        <string>process.env.NICE_SERVER_HOSTNAME;
      const failUrl =
        _url.searchParams.get("fail-url") ||
        <string>process.env.NICE_SERVER_HOSTNAME;
      const popGubun = _url.searchParams.has("popup") ? "Y" : "N";
      const customize = _url.searchParams.has("mobile") ? "Mobile" : undefined;
      const opt: InitialOptions = {
        successUrl,
        failUrl,
        popGubun,
        customize,
      };

      const html = await initialHtmlServing(res, opt);
      res.writeHead(200, CORSHeader);
      res.write(html);
      res.end();
      break;
    }

    case "GET /api/nice-auth/session": {
      const opt: InitialOptions = {
        successUrl:
          _url.searchParams.get("success-url") ||
          <string>process.env.NICE_SERVER_HOSTNAME,
        failUrl:
          _url.searchParams.get("fail-url") ||
          <string>process.env.NICE_SERVER_HOSTNAME,
        popGubun: "N",
        customize: "Mobile",
      };
      if (Object.values(opt).some((optValue) => !optValue)) {
        res
          .writeHead(500, {
            "Content-type": "text/plain; charset=utf-8",
          })
          .end();
        return;
      }
      res.writeHead(200, CORSHeader);
      res.write((await initSession(opt)) || "Empty");
      res.end();
      break;
    }

    case "GET /api/nice-auth/user-info": {
      const encodeData = _url.searchParams.get("EncodeData");

      if (encodeData === null || /^0-9a-zA-Z+\/=/.test(encodeData!)) {
        res.writeHead(400);
        res.end("입력값 오류");
        return;
      }
      decode(encodeData)
        .then((parsed) => {
          res.writeHead(200, CORSHeader);
          res.end(JSON.stringify(parsed, null, 2));
        })
        .catch((err) => {
          console.log(err);
          res.writeHead(400, {
            "Content-type": "text/plain; charset=utf-8",
          });
          res.end("복호화 실패");
        });
      break;
    }
    case "POST /api/nice-auth/user-info": {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        if (!req.complete) {
          res.writeHead(500, {
            "Content-type": "text/plain; charset=utf-8",
          });
          res.end();
          return;
        }

        const { EncodeData: encodeData }: { EncodeData?: string } =
          qs.parse(body);
        if (!encodeData || /^0-9a-zA-Z+\/=/.test(encodeData)) {
          res.writeHead(400, {
            "Content-type": "text/plain; charset=utf-8",
          });
          res.end("입력값 오류");
          return;
        }
        decode(encodeData)
          .then((parsed) => {
            res.writeHead(200, CORSHeader);
            res.end(JSON.stringify(parsed, null, 2));
          })
          .catch((err) => {
            console.log(err);
            res.writeHead(400, {
              "Content-type": "text/plain; charset=utf-8",
            });
            res.end("복호화 실패");
          });
      });
      break;
    }
    case "GET /user": {
      const encodeData = _url.searchParams.get("EncodeData");

      if (encodeData === null || /^0-9a-zA-Z+\/=/.test(encodeData!)) {
        res.writeHead(400, {
          "Content-type": "text/plain; charset=utf-8",
        });
        res.end("입력값 오류");
        return;
      }
      const html = [
        "<!DOCTYPE html>",
        '<html lang="ko">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        "</head>",
        "<body>",
        "<p>Success</p>",
        `<input type="hidden" name="EncodeData" value="${encodeData}">`,
        "</form>",
        "</body>",
        "</html>",
      ].join("\n");
      res.writeHead(200, {
        "Content-type": "text/html; charset=utf-8",
      });
      res.end(html);

      break;
    }
    case "POST /user": {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        if (!req.complete) {
          res.writeHead(500, {
            "Content-type": "text/plain; charset=utf-8",
          });
          res.end();
          return;
        }

        const { EncodeData: encodeData }: { EncodeData?: string } =
          qs.parse(body);
        if (!encodeData || /^0-9a-zA-Z+\/=/.test(encodeData)) {
          res.writeHead(400, {
            "Content-type": "text/plain; charset=utf-8",
          });
          res.end("입력값 오류");
          return;
        }
        const html = [
          "<!DOCTYPE html>",
          '<html lang="ko">',
          "<head>",
          '<meta charset="utf-8">',
          '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
          "</head>",
          "<body>",
          "<p>Success</p>",
          `<input type="hidden" name="EncodeData" value="${encodeData}">`,
          "</form>",
          "</body>",
          "</html>",
        ].join("\n");
        res.writeHead(200, CORSHeader);
        res.end(html);
      });
      break;
    }
    default:
      res.writeHead(405, {
        "Content-type": "text/plain; charset=utf-8",
      });
      res.end();
  }
};

async function main() {
  const app = http.createServer(requestHandler);
  app.listen(PORT);
}

main().catch(console.error);
