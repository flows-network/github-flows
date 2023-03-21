import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from "@/lib/upstash";

import issueCommentEvent from "resources/issue_comment_event.json";
import { createInstallLink } from "@/lib/state";
import { isCollaborator } from "@/lib/github";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user, flow_id, owner, repo, login, events } = req.query;

    if (!flows_user || !flow_id || !owner || !repo || !events || !login) {
        return res.status(400).send("Bad request");
    }

    if (typeof flows_user != "string"
        || typeof flow_id != "string"
        || typeof owner != "string"
        || typeof repo != "string"
        || typeof login != "string"
    ) {
        return res.status(400).send("Bad request");
    }

    let install_link = createInstallLink(flows_user);
    let unauthed = "User has not been authorized, you need to "
        + `[install the App](${install_link}) to GitHub \`${owner}\` first`;

    let token: string | null = await redis.hget(`github:${flows_user}:access_token`, owner);
    if (!token) {
        return res.status(400).send(unauthed);
    }

    if (!isCollaborator(token, owner, repo, login)) {
        return res.status(400).send(`${login} cannot access ${owner}/${repo}`);
    }

    let eventsRealList;
    if (typeof events == "string") {
        eventsRealList = [events];
    } else {
        eventsRealList = events;
    }

    if (typeof flow_id == "string") {
        let listen: { owner: string, repo: string } | null = await redis.get(`github:${flow_id}:listen`);

        const pipe = redis.pipeline();

        if (listen) {
            let old_owner = listen["owner"];
            let old_repo = listen["repo"];
            // IF owner/repo changed
            if (old_owner != owner || old_repo != repo) {
                // delete old trigger
                pipe.hdel(`github:${old_owner}/${old_repo}:trigger`, flow_id);
                // set new listen
                pipe.set(`github:${flow_id}:listen`, {
                    "owner": owner,
                    "repo": repo,
                });
            }
        } else {
            pipe.set(`github:${flow_id}:listen`, {
                "owner": owner,
                "repo": repo,
            });
        }

        pipe.hset(`github:${owner}/${repo}:trigger`, {
            [flow_id]: {
                flows_user: flows_user,
                events: eventsRealList,
            }
        });

        await pipe.exec();
    }

    return res.status(200).json(issueCommentEvent);
}

export default fn;
