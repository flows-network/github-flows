import type { NextApiRequest, NextApiResponse } from "next";
import { CLIENT_ID, CLIENT_SECRET, whoami } from "lib/github";
import { decrypt, REDIRECT_URL, State } from "@/lib/state";
import { pool } from "@/lib/pg";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    let { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).send("Bad request");
    }

    if (typeof code != "string" || typeof state != "string") {
        return res.status(400).send("Bad request");
    }

    let url = "https://github.com/login/oauth/access_token";
    let resp = await fetch(url
        + `?client_id=${CLIENT_ID}`
        + `&client_secret=${CLIENT_SECRET}`
        + `&code=${code}`,
        {
            method: "POST",
            headers: {
                "Accept": "application/vnd.github.v3+json",
            },
        }
    );

    let state_json: State = JSON.parse(state);
    let data = state_json.data;
    let iv = state_json.iv;

    let flows_user = decrypt(data, Buffer.from(iv, "base64"));

    if (resp.ok) {
        let json = await resp.json();

        let token = json["access_token"];

        if (token) {
            let login = await whoami(token);
            if (login) {
                await pool.query(`
                    INSERT INTO login_oauthor (flows_user, github_login, github_access_token)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (flows_user, github_login) DO UPDATE SET
                    github_access_token = excluded.github_access_token
                `, [flows_user, login, token]);
            } else {
                return res.status(400).send("login inconsistent");
            }
        } else {
            return res.status(400).send("no access_token");
        }
    } else {
        return res.status(400).send(await resp.text());
    }

    return res.redirect(REDIRECT_URL);
}

export default fn;
