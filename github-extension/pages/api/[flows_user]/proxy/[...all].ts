// import { redis } from "@/lib/upstash";
import type { NextApiRequest, NextApiResponse } from "next"
import httpProxyMiddleware from "next-http-proxy-middleware";

import * as fs from 'node:fs';
import * as jwt from "jsonwebtoken";
import { APP_ID } from "@/lib/github";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    let { flows_user } = req.query;

    // let token = await redis.get(`github:${flows_user}:token`);

    let now = Date.now()

    var privateKey = fs.readFileSync("private-key.pem");
    var token = jwt.sign({
        iat: Math.floor(now / 1000) - (1 * 60),
        exp: Math.floor(now / 1000) + (9 * 60),
        iss: APP_ID,
    }, privateKey, { algorithm: "RS256" });

    return httpProxyMiddleware(req, res, {
        target: "https://api.github.com",
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub Extention of Second State flows.network",
            "Authorization": `Bearer ${token}`
        },
        pathRewrite: [{
            patternStr: `^/api/${flows_user}/proxy`,
            replaceStr: "",
        }]
    })
};

export default fn;
