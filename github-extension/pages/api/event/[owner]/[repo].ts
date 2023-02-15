import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from "@/lib/upstash";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { owner, repo, events } = req.query;

    if (!owner || !repo || !events) {
        return res.status(400).send("Bad request");
    }

    try {
        let allFlows = await redis.hgetall(`${owner}/${repo}:ch:trigger`);

        // console.log(allFlows);

        if (allFlows) {
            let flowArray: string[] = [];
            // for (let flows in allFlows) {
            //     let user: any = allFlows[flows];
            //     flowArray.push({
            //         flows_user: user,
            //         flow_id: flows,
            //     });
            // }

            return res.status(200).json(flowArray);
        } else {
            return res.status(404).send("No flow binding with the address")
        }
    } catch (e: any) {
        return res.status(500).send(e.toString());
    }
}

export default fn;
