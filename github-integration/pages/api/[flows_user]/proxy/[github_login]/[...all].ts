import type { NextApiRequest, NextApiResponse } from "next"
import httpProxyMiddleware from "next-http-proxy-middleware";

import { redis } from "@/lib/upstash";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    let { flows_user, github_login } = req.query;

    if (!flows_user || !github_login) {
        return res.status(400).send("Bad request");
    }

    if (typeof flows_user != "string" || typeof github_login != "string") {
        return res.status(400).send("Bad request");
    }

    let token = await redis.hget(`github:${flows_user}:access_token`, github_login);

    return httpProxyMiddleware(req, res, {
        target: "https://api.github.com",
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub Integration of Second State flows.network",
            "Authorization": `Bearer ${token}`
        },
        pathRewrite: [{
            patternStr: `^/api/${flows_user}/proxy/${github_login}/`,
            replaceStr: "",
        }]
    })
};

export default fn;
