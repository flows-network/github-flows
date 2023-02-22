import { env, exit } from "process";
import { redis } from "./upstash";
import * as jwt from "jsonwebtoken";

export const APP_ID = env.GITHUB_APP_ID || exit();
export const APP_NAME = env.GITHUB_APP_NAME || exit();
export const CLIENT_ID = env.GITHUB_CLIENT_ID || exit();
export const CLIENT_SECRET = env.GITHUB_CLIENT_SECRET || exit();
export const PRIVATE_KEY = env.GITHUB_PRIVATE_KEY || exit();

export async function get_ins_token(flows_user: string, login: string): Promise<string | null> {
    let ins_id = await redis.get(`github:${flows_user}:${login}:installations`);
    if (!ins_id) {
        // return res.status(401).send(`${flow_id} does not belong to ${flows_user}`);
        return null;
    }

    let ins_token: string | null = await redis.get(`github:${flows_user}:ins_token`);

    if (!ins_token) {
        let now = Date.now()

        var token = jwt.sign({
            iat: Math.floor(now / 1000) - (1 * 60),
            exp: Math.floor(now / 1000) + (9 * 60),
            iss: APP_ID,
        }, PRIVATE_KEY, { algorithm: "RS256" });

        let token_api = `https://api.github.com/app/installations/${ins_id}/access_tokens`;

        let resp = await fetch(token_api, {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "GitHub Integration of Second State flows.network",
                "Authorization": `Bearer ${token}`
            },
            method: "POST",
        });

        let ins_json = await resp.json();

        ins_token = ins_json["token"];
        if (!ins_token) {
            // return res.status(500).send("no token");
            return null;
        }

        let expiresAt = ins_json["expires_at"];
        let e = new Date(expiresAt);

        await redis.set(`github:${flows_user}:ins_token`, ins_token, { exat: e.getTime() - (30 * 1000) });
    }

    return ins_token;
}
