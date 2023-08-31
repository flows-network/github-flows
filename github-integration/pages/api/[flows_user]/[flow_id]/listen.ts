import type { NextApiRequest, NextApiResponse } from "next"
import { pool } from "@/lib/pg";

import issueCommentEvent from "resources/issue_comment_event.json";
import { createInstallLink } from "@/lib/state";
import { isCollaborator } from "@/lib/github";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    let { flows_user: flowsUser, flow_id: flowId, owner, repo, handler_fn: handlerFn, login, events } = req.query;

    if (!flowsUser || !flowId || !owner || !repo || !events) {
        return res.status(400).send("Bad request");
    }

    if (typeof flowsUser != "string"
        || typeof flowId != "string"
        || typeof owner != "string"
        || typeof repo != "string"
        || (login && typeof login != "string")
    ) {
        return res.status(400).send("Bad request");
    }

    let install_link = createInstallLink(flowsUser);
    let unauthed = "User has not been authorized, you need to "
        + `[install the App](${install_link}) to GitHub \`${owner}\` first`;

    let token: string | null = null;
    if (login) {
        const queryResult = await pool.query(`
            SELECT github_access_token FROM login_oauthor
            WHERE flows_user = $1 and github_login = $2
        `, [flowsUser, login]);
        if (queryResult.rowCount > 0) {
            token = queryResult.rows[0].github_access_token;
        }
    } else {
        const queryResult = await pool.query(`
            SELECT github_login, github_access_token FROM login_oauthor
            WHERE flows_user = $1
        `, [flowsUser]);

        const rows = queryResult.rows;

        for (let i in rows) {
            if (!login) {
                // login will be set in the first loop
                login = rows[i].github_login;
                token = rows[i].github_access_token;
            } else {
                // Reset login to undefined if there are more than one connected account.
                login = undefined;
                token = null;
                break;
            }
        }

        if (!login) {
            return res.status(400).send("More than one GitHub account has been connected. Please clearly provide an account to SDK.");
        }
    }

    if (!token) {
        return res.status(400).send(unauthed);
    }

    if (!await isCollaborator(token, owner, repo, login as string)) {
        return res.status(400).send(`${login} cannot access ${owner}/${repo}`);
    }

    let eventsRealList;
    if (typeof events == "string") {
        eventsRealList = [events];
    } else {
        eventsRealList = events;
    }

    await pool.query(`
        INSERT INTO listener (flows_user, flow_id, github_owner, github_repo, handler_fn, events)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (flows_user, flow_id, github_owner, github_repo) DO UPDATE SET
        handler_fn = excluded.handler_fn, events = excluded.events
    `, [flowsUser, flowId, owner, repo, handlerFn, eventsRealList]);

    return res.status(200).json(issueCommentEvent);
}

export default fn;
