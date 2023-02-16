import { redis } from "@/lib/upstash";
import type { NextApiRequest, NextApiResponse } from "next"
import httpProxyMiddleware from "next-http-proxy-middleware";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    let { flows_user } = req.query;

    let token = await redis.get(`github:${flows_user}:token`);

    return httpProxyMiddleware(req, res, {
        target: "https://api.github.com",
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub Extention of Second State flows.network",
            "Authorization": `Bearer ${token}`
        },
    })
};

export default fn;
