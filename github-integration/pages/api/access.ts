import type { NextApiRequest, NextApiResponse } from "next";
import { CLIENT_ID, CLIENT_SECRET } from "lib/github";
import { decrypt, State } from "@/lib/state";
import { redis } from "@/lib/upstash";

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

    let dec = JSON.parse(decrypt(data, Buffer.from(iv, "base64")));
    let flows_user = dec["flows_user"];
    let login = dec["login"];

    if (resp.ok) {
        let json = await resp.json();

        let token = json["access_token"];

        if (token) {
            if (await isItMe(login, token)) {
                await redis.hset(`github:${flows_user}:access_token`, {
                    [login]: token
                });
            } else {
                return res.status(400).send("login inconsistent");
            }
        } else {
            return res.status(400).send("no access_token");
        }
    } else {
        return res.status(400).send(await resp.text());
    }

    return res.redirect("https://flows.network/flows");
}

async function isItMe(login: string, token: string): Promise<Boolean> {
    let url = "https://api.github.com/user";
    let resp = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub Integration of Second State flows.network",
            "Authorization": `Bearer ${token}`
        },
    });


    try {
        if (resp.ok) {
            let json = await resp.json();
            return json["login"] == login;
        }
        return false;
    } catch {
        return false;
    }
}

export default fn;
