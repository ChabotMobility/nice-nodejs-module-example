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
      res.writeHead(200, { "Content-Type": "text/html" });
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
        res.writeHead(500).end();
        return;
      }
      res.writeHead(200, { "Content-Type": "text/plain" });
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
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(parsed, null, 2));
        })
        .catch((err) => {
          console.log(err);
          res.writeHead(400);
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
          res.writeHead(500);
          res.end();
          return;
        }

        const { EncodeData: encodeData }: { EncodeData?: string } =
          qs.parse(body);
        if (!encodeData || /^0-9a-zA-Z+\/=/.test(encodeData)) {
          res.writeHead(400);
          res.end("입력값 오류");
          return;
        }
        decode(encodeData)
          .then((parsed) => {
            res.writeHead(200);
            res.end(JSON.stringify(parsed, null, 2));
          })
          .catch((err) => {
            console.log(err);
            res.writeHead(400);
            res.end("복호화 실패");
          });
      });
      break;
    }
    default:
      res.writeHead(405);
      res.end();
  }
};

async function main() {
  const app = http.createServer(requestHandler);
  app.listen(PORT);
}

main().catch(console.error);
