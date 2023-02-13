import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from "@/lib/upstash";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user, flow_id, owner, repo } = req.query;

    if (!flows_user || !flow_id || !owner || !repo) {
        return res.status(400).send("Bad request");
    }

    if (typeof flow_id == "string") {
        let flows_user_in = await redis.hget(`${owner}/${repo}:ch:trigger`, flow_id);
        if (!flows_user_in) {
            await redis.hset(`${owner}/${repo}:ch:trigger`, { [flow_id]: flows_user });
        }
    }

    // TODO: request github to create webhook

    return res.status(200).json({
        // TODO: fill json
    });
}

export default fn;
