import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from "@/lib/upstash";
import { get_ins_token } from "@/lib/github";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user } = req.query;

    if (!flows_user) {
        return res.status(400).send("Bad request");
    }

    if (typeof flows_user != "string") {
        return res.status(400).send("Bad request");
    }

    try {
        let ins_ids = await redis.hgetall(`github:${flows_user}:installations`);

        if (ins_ids) {
            let results = [];
            for (const login in ins_ids) {
                const ins_id: any = ins_ids[login];

                let ins_token = await get_ins_token(flows_user, ins_id);
                if (!ins_token) {
                    return res.status(500).send("no token");
                }

                let api = "https://api.github.com/user/installations";

                let resp = await fetch(api, {
                    headers: {
                        "Accept": "application/vnd.github.v3+json",
                        "User-Agent": "GitHub Integration of Second State flows.network",
                        "Authorization": `Bearer ${ins_token}`
                    },
                    method: "GET",
                });


                let json = await resp.json();
                console.log(json);
                let installations: any = json["installations"];

                for (const installation of installations) {
                    let account = installation["account"];
                    let login = account["login"];
                    let target_type = account["target_type"];
                    results.push({
                        name: `${login} (${target_type})`
                    });
                }
            }

            return res.status(200).json({
                title: 'Connected Workspaces',
                list: results
            });
        }
    } catch (e: any) {
        return res.status(500).send(e.toString());
    }
}

export default fn;
