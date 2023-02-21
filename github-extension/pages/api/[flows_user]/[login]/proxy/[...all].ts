import { redis } from "@/lib/upstash";
import type { NextApiRequest, NextApiResponse } from "next"
import httpProxyMiddleware from "next-http-proxy-middleware";

import * as jwt from "jsonwebtoken";
import { APP_ID, PRIVATE_KEY } from "@/lib/github";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    // flows_user: github login
    let { flows_user, login } = req.query;

    if (!flows_user || !login) {
        return res.status(400).send("Bad request");
    }

    let ins_id = await redis.get(`github:${login}:${flows_user}:installation`);
    if (!ins_id) {
        return res.status(401);
    }

    let ins_token: string | null = await redis.get(`github:${flows_user}:ins_token`);

    if (!ins_token) {
        let now = Date.now()

        var token = jwt.sign({
            iat: Math.floor(now / 1000) - (1 * 60),
            exp: Math.floor(now / 1000) + (9 * 60),
            iss: APP_ID,
        }, PRIVATE_KEY, { algorithm: "RS256" });

        let token_api = `https://api.github.com/app/installations/${ins_id}/access_tokens`;

        let resp = await fetch(token_api, {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "GitHub Extention of Second State flows.network",
                "Authorization": `Bearer ${token}`
            }
        });

        let ins_json = await resp.json();

        ins_token = ins_json["token"];
        if (!ins_token) {
            return res.status(500).send("no token");
        }

        let expiresAt = ins_json["expires_at"];
        let e = new Date(expiresAt);

        await redis.set(`github:${flows_user}:ins_token`, ins_token, { exat: e.getTime() - (30 * 1000) });
    }

    return httpProxyMiddleware(req, res, {
        target: "https://api.github.com",
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub Extention of Second State flows.network",
            "Authorization": `Bearer ${ins_token}`
        },
        pathRewrite: [{
            patternStr: `^/api/${flows_user}/${login}/proxy`,
            replaceStr: "",
        }]
    })
};

export default fn;
