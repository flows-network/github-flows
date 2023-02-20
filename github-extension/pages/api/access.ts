import { redis } from "@/lib/upstash";
import type { NextApiRequest, NextApiResponse } from "next"
import httpProxyMiddleware from "next-http-proxy-middleware";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    let body = req.body;

    let installation = body["installation"];
    if (installation) {
        let action = body["action"];
        if (action == "created") {
            // TODO: not sure for every kind of installation.
            let nodeId = installation["account"]["node_id"];

            // TODO: update on already exits.
            await redis.hset("github:installations", {
                [nodeId]: [
                    installation["id"]
                ],
            })
            // TODO: is it work?...
        } else if (action == "deleted") {
            // TODO: delete installation token.
        }
    }

    return httpProxyMiddleware(req, res, {
        // TODO:
        // target: "https://code.flows.network/hook/github/message",
        target: "https://httpbin.org/anything",
        pathRewrite: [{
            patternStr: `^/api/access`,
            replaceStr: "",
        }]
    })
};

export default fn;
