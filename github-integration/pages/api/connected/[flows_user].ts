import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from "@/lib/upstash";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user } = req.query;

    if (!flows_user) {
        return res.status(400).send("Bad request");
    }

    if (typeof flows_user != "string") {
        return res.status(400).send("Bad request");
    }

    try {
        let tokens = await redis.hgetall(`github:${flows_user}:access_token`);
        if (!tokens) {
            return res.status(400).send("no token");
        }

        let results = [];
        let api = "https://api.github.com/user/installations";

        for (let login in tokens) {
            let token = tokens[login];
            let resp = await fetch(api, {
                headers: {
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "GitHub Integration of Second State flows.network",
                    "Authorization": `Bearer ${token}`
                },
                method: "GET",
            });

            let json = await resp.json();
            let installations: any = json["installations"];

            if (!installations) {
                return res.status(400).send("no installations");
            }

            for (const installation of installations) {
                let account = installation["account"];
                let login = account["login"];

                results.push({
                    name: login
                });
            }
        }

        return res.status(200).json({
            title: "Connected Installations",
            list: results
        });
    } catch (e: any) {
        return res.status(500).send(e.toString());
    }
}

export default fn;
