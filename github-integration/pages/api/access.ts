import { redis } from "@/lib/upstash";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { NextApiRequest, NextApiResponse } from "next"

const restream = function(proxyReq: any, req: any, _res: any, _options: any) {
    if (req.body) {
        let bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
}

const proxyMiddleware: any = createProxyMiddleware({
    target: "https://code.flows.network/hook/github/message",
    changeOrigin: true,
    pathRewrite: {
        "^/api/access": "",
    },
    onProxyReq: restream,
});

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    let body = req.body;

    let installation = body["installation"];
    if (installation) {
        let account = installation["account"];
        if (account) {
            let action = body["action"];

            let login = account["login"];
            let sender = body["sender"]["login"];

            if (action == "created") {
                let id = installation["id"]
                await redis.hset(`github:${sender}:installations`, {
                    [login]: id,
                });
            } else if (action == "deleted") {
                await redis.hdel(`github:${sender}:installations`, login);
            }
        }
    }

    proxyMiddleware(req, res, (result: unknown) => {
        if (result instanceof Error) {
            throw result;
        }
    });
};

export default fn;

export const config = {
    api: {
        externalResolver: true,
    },
};
