import { env, exit } from "process";

export const APP_NAME = env.GITHUB_APP_NAME || exit();
export const CLIENT_ID = env.GITHUB_CLIENT_ID || exit();
export const CLIENT_SECRET = env.GITHUB_CLIENT_SECRET || exit();

export async function whoami(token: string): Promise<string | null> {
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
            return json["login"];
        }
        return null;
    } catch {
        return null;
    }
}
