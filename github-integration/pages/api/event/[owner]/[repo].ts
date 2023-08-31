import type { NextApiRequest, NextApiResponse } from "next"
import { pool } from '@/lib/pg';

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { owner, repo, events } = req.query;

    if (!owner || !repo || !events) {
        return res.status(400).send("Bad request");
    }

    let eventsRealList;
    if (typeof events == "string") {
        eventsRealList = [events];
    } else {
        eventsRealList = events;
    }

    try {
        const queryResult = await pool.query(`
            SELECT flows_user, flow_id, handler_fn, events from listener
            WHERE github_owner = $1 AND github_repo = $2
        `, [owner, repo]);

        if (queryResult.rowCount > 0) {
            let flowArray = [];
            for (let i in queryResult.rows) {
                let t: any = queryResult.rows[i];
                let intersection = eventsRealList.filter(v => { return t.events.indexOf(v) > -1 });
                if (intersection.length != 0) {
                    flowArray.push({
                        flows_user: t.flows_user,
                        flow_id: t.flow_id,
                        handler_fn: t.handler_fn
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
