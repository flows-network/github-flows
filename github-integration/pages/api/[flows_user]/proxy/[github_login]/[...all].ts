import type { NextApiRequest, NextApiResponse } from "next"
import httpProxyMiddleware from "next-http-proxy-middleware";

import { pool } from "@/lib/pg";
import { createInstallLink } from "@/lib/state";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    let { flows_user, github_login } = req.query;

    if (!flows_user || !github_login) {
        return res.status(400).send("Bad request");
    }

    if (typeof flows_user != "string" || typeof github_login != "string") {
        return res.status(400).send("Bad request");
    }

    // '_' as the convension literal for default `github_login` 
    let login = github_login === '_' ? undefined : github_login;

    let token: string | null = null;

    if (login) {
        const queryResult = await pool.query(`
            SELECT github_access_token FROM login_oauthor
            WHERE flows_user = $1 and github_login = $2
        `, [flows_user, github_login]);
        if (queryResult.rowCount > 0) {
            token = queryResult.rows[0].github_access_token;
        }
    } else {
        const queryResult = await pool.query(`
            SELECT github_login, github_access_token FROM login_oauthor
            WHERE flows_user = $1
        `, [flows_user]);

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

    let install_link = createInstallLink(flows_user);
    let unauthed = "User has not been authorized, you need to "
        + `[install the App](${install_link}) to GitHub first`;
    if (!token) {
        return res.status(400).send(unauthed);
    }

    return httpProxyMiddleware(req, res, {
        target: "https://api.github.com",
        headers: {
            "User-Agent": "GitHub Integration of Second State flows.network",
            "Authorization": `Bearer ${token}`
        },
        pathRewrite: [{
            patternStr: `^/api/${flows_user}/proxy/${github_login}/`,
            replaceStr: "",
        }]
    })
};

export default fn;

export const config = {
  api: {
    bodyParser: false,
  },
}
