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
                    continue;
                }

                let api = "https://api.github.com/installation/repositories";

                let resp = await fetch(api, {
                    headers: {
                        "Accept": "application/vnd.github.v3+json",
                        "User-Agent": "GitHub Integration of Second State flows.network",
                        "Authorization": `Bearer ${ins_token}`
                    },
                    method: "GET",
                });


                let json = await resp.json();
                let repositories: any = json["repositories"];

                if (!repositories) {
                    continue;
                }

                for (const repositorie of repositories) {
                    let full_name = repositorie["full_name"];
                    let private_ = repositorie["private"];

                    let name = full_name;

                    if (private_) {
                        name += " (private)"
                    }

                    results.push({
                        name: name
                    });
                }
            }

            return res.status(200).json({
                title: 'Connected Repositories',
                list: results
            });
        } else {
            return res.status(404).send("no installed app");
        }
    } catch (e: any) {
        return res.status(500).send(e.toString());
    }
}

export default fn;
