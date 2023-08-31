import type { NextApiRequest, NextApiResponse } from "next"
import { pool } from "@/lib/pg";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user: flowsUser } = req.query;

    if (!flowsUser) {
        return res.status(400).send("Bad request");
    }

    if (typeof flowsUser != "string") {
        return res.status(400).send("Bad request");
    }

    try {
        let queryResult = await pool.query(`
            SELECT github_login, github_access_token FROM login_oauthor
            WHERE flows_user = $1
        `, [flowsUser]);
        if (queryResult.rowCount === 0) {
            return res.status(400).send("no token");
        }

        let results: any[] = [];
        let api = "https://api.github.com/user/installations";

        for (let i in queryResult.rows) {
            let t = queryResult.rows[i];
            let resp = await fetch(api, {
                headers: {
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "GitHub Integration of Second State flows.network",
                    "Authorization": `Bearer ${t.github_access_token}`
                },
                method: "GET",
            });

            let json = await resp.json();
            let installations: any = json["installations"];

            if (!installations) {
                continue;
            }

            for (const installation of installations) {
                let account = installation["account"];
                let login = account["login"];

                results.push(login);
            }
        }

        return res.status(200).json({
            title: "Connected Installations",
            list: results.filter((item, index) => {
                return results.indexOf(item) === index;
            }).map(item => {
                return {name: item};
            })
        });
    } catch (e: any) {
        return res.status(500).send(e.toString());
    }
}

export default fn;
