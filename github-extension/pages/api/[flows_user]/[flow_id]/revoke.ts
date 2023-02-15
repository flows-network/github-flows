import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from "@/lib/upstash";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user, flow_id, owner, repo, events } = req.query;

    if (!flows_user || !flow_id || !owner || !repo || !events) {
        return res.status(400).send("Bad request");
    }

    if (typeof flow_id != "string") {
        return res.status(400).send("Bad request");
    }

    let tb = `${owner}/${repo}:ch:trigger`;

    let fae: {
        flows_user: string,
        events: string[]
    } | null = await redis.hget(tb, flow_id);

    if (!fae) {
        return res.status(500).send(`no ${flow_id} in ${tb}`);
    }

    let eventsRealList: string[];
    if (typeof events == "string") {
        eventsRealList = [events];
    } else {
        eventsRealList = events;
    }

    let s = fae.events.filter(v => eventsRealList.indexOf(v) == -1);
    if (s.length == 0) {
        await redis.hdel(tb, flow_id);
    } else {
        await redis.hset(tb, {
            [flow_id]: {
                flows_user: flows_user,
                events: s,
            }
        });
    }

    return res.status(200).send("ok");
}

export default fn;
