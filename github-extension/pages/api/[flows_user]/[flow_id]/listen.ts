import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from "@/lib/upstash";

import issueCommentEvent from "resources/issue_comment_event.json";

const FLOW_API = "https://code.flows.network/hook/github/message";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user, flow_id, owner, repo, events } = req.query;

    if (!flows_user || !flow_id || !owner || !repo || !events) {
        return res.status(400).send("Bad request");
    }

    let eventsRealList;
    if (typeof events == "string") {
        eventsRealList = [events];
    } else {
        eventsRealList = events;
    }

    if (typeof flows_user != "string" || typeof flow_id != "string" || typeof owner != "string" || typeof repo != "string") {
        return res.status(400).send("Bad request");
    }

    if (typeof flow_id == "string") {
        let flows_user_in = await redis.hget(`${owner}/${repo}:ch:trigger`, flow_id);
        if (!flows_user_in) {
            await redis.hset(`${owner}/${repo}:ch:trigger`, {
                [flow_id]: {
                    flows_user: flows_user,
                    events: eventsRealList,
                }
            });
        }
    }

    let param = {
        "name": "web",
        "active": true,
        "events": eventsRealList,
        "config": {
            "url": FLOW_API,
            "content_type": "form",
        }
    };

    let token = await redis.hget("auth", flows_user);

    if (!token) {
        return res.status(400).send(`User has not been authorized, you need to [install the App](https://slack-flows.vercel.app/api/auth?%FLOWS_USER%) to GitHub \`${owner}\` first`);
    }

    let result = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub Extention of Second State flows.network",
            "Authorization": `Bearer ${token}`
        },
        method: "post",
        body: JSON.stringify(param),
    });

    if (result.status == 200) {
        return res.status(200).json(issueCommentEvent);
    } else {
        return res.status(500).json(result.json);
    }
}

export default fn;

export const config = {
    runtime: 'experimental-edge',
};
