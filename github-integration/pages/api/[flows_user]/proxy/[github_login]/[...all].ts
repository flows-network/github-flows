import type { NextApiRequest, NextApiResponse } from "next"
import httpProxyMiddleware from "next-http-proxy-middleware";

import { redis } from "@/lib/upstash";
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
        token = await redis.hget(`github:${flows_user}:access_token`, github_login);
    } else {
        let allLogins = await redis.hgetall(`github:${flows_user}:access_token`);
        for (let l in allLogins) {
            if (!login) {
                // login will be set in the first loop
                login = l;
                token = allLogins[l] as string;
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
