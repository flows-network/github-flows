import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from "@/lib/upstash";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user, flow_id, owner, repo } = req.query;

    if (!flows_user || !flow_id || !owner || !repo) {
        return res.status(400).send("Bad request");
    }

    if (typeof flow_id != "string") {
        return res.status(400).send("Bad request");
    }

    await redis.hdel(`${owner}/${repo}:ch:trigger`, flow_id);

    return res.status(200).send("ok");
}

export default fn;
