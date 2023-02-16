import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from "@/lib/upstash";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { owner, repo, events } = req.query;

    if (!owner || !repo || !events) {
        return res.status(400).send("Bad request");
    }

    if (typeof events != "string") {
        return res.status(400).send("Bad request");
    }

    try {
        let allFlows = await redis.hgetall(`github:${owner}/${repo}:trigger`);

        if (allFlows) {
            let flowArray = [];
            for (let flows in allFlows) {
                let t: any = allFlows[flows];
                if (events in t.events) {
                    flowArray.push({
                        flows_user: t.user,
                        flow_id: flows,
                    });
                }
            }

            return res.status(200).json(flowArray);
        } else {
            return res.status(404).send("No flow binding with the address")
        }
    } catch (e: any) {
        return res.status(500).send(e.toString());
    }
}

export default fn;
