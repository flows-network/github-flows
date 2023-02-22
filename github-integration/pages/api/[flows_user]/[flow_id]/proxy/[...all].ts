import type { NextApiRequest, NextApiResponse } from "next"
import httpProxyMiddleware from "next-http-proxy-middleware";

import { get_ins_token } from "@/lib/github";
import { redis } from "@/lib/upstash";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    // flows_user: flows user
    // flow_id: github login
    let { flows_user, flow_id } = req.query;

    if (!flows_user || !flow_id) {
        return res.status(400).send("Bad request");
    }

    if (typeof flows_user != "string" || typeof flow_id != "string") {
        return res.status(400).send("Bad request");
    }

    let ins_id: string | null = await redis.hget(`github:${flows_user}:installations`, flow_id);
    if (!ins_id) {
        return res.status(401).send(`${flow_id} does not belong to ${flows_user}`);
    }

    let ins_token = await get_ins_token(flows_user, ins_id);
    if (!ins_token) {
        return res.status(500).send("no token");
    }

    return httpProxyMiddleware(req, res, {
        target: "https://api.github.com",
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub Integration of Second State flows.network",
            "Authorization": `Bearer ${ins_token}`
        },
        pathRewrite: [{
            patternStr: `^/api/${flows_user}/${flow_id}/proxy`,
            replaceStr: "",
        }]
    })
};

export default fn;
