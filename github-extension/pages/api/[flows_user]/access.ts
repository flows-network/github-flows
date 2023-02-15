import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from '@/lib/upstash';
import { CLIENT_ID } from "@/lib/github";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user } = req.query;

    if (!flows_user) {
        return res.status(400).send("Bad request");
    }

    if (typeof flows_user != "string") {
        return res.status(400).send("Bad request");
    }

    try {
        await redis.set(flows_user, true, { 'ex': 10 * 60 });
    } catch (e: any) {
        return res.status(500).send(e.toString());
    }

    let github_base = "https://github.com/login/oauth/authorize";
    return res.redirect(
        github_base
        + `?client_id=${CLIENT_ID}`
        + "&scope=write:repo_hook"
        + `&state=${flows_user}`
        + "&redirect_uri=https://github-flows.vercel.app/api/auth"
    );
};

export default fn;
