import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from "@/lib/upstash";

import issueCommentEvent from "resources/issue_comment_event.json";
import { APP_NAME, get_ins_token } from "@/lib/github";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user, flow_id, owner, repo, events } = req.query;

    if (!flows_user || !flow_id || !owner || !repo || !events) {
        return res.status(400).send("Bad request");
    }

    if (typeof flows_user != "string" || typeof flow_id != "string" || typeof owner != "string" || typeof repo != "string") {
        return res.status(400).send("Bad request");
    }

    let ins_id: string | null = await redis.hget(`github:${flows_user}:installations`, owner);
    if (!ins_id) {
        return res.status(401).send(`${owner} does not belong to ${flows_user}`);
    }

    let token = await get_ins_token(flows_user, ins_id);
    if (!token) {
        return res.status(400).send(
            "User has not been authorized, you need to "
            + `[install the App](https://github.com/apps/${APP_NAME}/installations/new) to GitHub \`${owner}\` first`
        );
    }

    let eventsRealList;
    if (typeof events == "string") {
        eventsRealList = [events];
    } else {
        eventsRealList = events;
    }


    if (typeof flow_id == "string") {
        let flows_user_in = await redis.hget(`github:${owner}/${repo}:trigger`, flow_id);
        if (!flows_user_in) {
            await redis.hset(`github:${owner}/${repo}:trigger`, {
                [flow_id]: {
                    flows_user: flows_user,
                    events: eventsRealList,
                }
            });
        }
    }

    return res.status(200).json(issueCommentEvent);
}

export default fn;
