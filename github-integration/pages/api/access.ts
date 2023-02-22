import { redis } from "@/lib/upstash";
import type { NextApiRequest, NextApiResponse } from "next"
import httpProxyMiddleware from "next-http-proxy-middleware";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    let body = req.body;

    let installation = body["installation"];
    if (installation) {
        let action = body["action"];
        let login = installation["account"]["login"];
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

    return httpProxyMiddleware(req, res, {
        target: "https://code.flows.network/hook/github/message",
        pathRewrite: [{
            patternStr: `^/api/access`,
            replaceStr: "",
        }]
    })
};

export default fn;
