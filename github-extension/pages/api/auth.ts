import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from '@/lib/upstash';
import { getAuthedInstallation } from "@/lib/github";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    // state: flows_user
    const { state, code } = req.query;

    if (!state || !code) {
        return res.status(400).send("Bad request");
    }

    if (typeof state != "string" || typeof code != "string") {
        return res.status(400).send("Bad request");
    }

    try {
        const d = await redis.del(state);
        // Return if flow user not found in Redis
        if (d !== 1) {
            return res.status(400).send("Expired authorization");
        }
    } catch (e: any) {
        return res.status(500).send(e.toString());
    }

    try {
        const authedIns = await getAuthedInstallation(code);

        const pipeline = redis.pipeline();
        // github extention works because flows.network username == github username
        pipeline.set(`${state}:token`, authedIns.access_token);
        pipeline.set(state, true);
        await pipeline.exec();

        return res.redirect(process.env.FLOWS_NETWORK_APP_URL || "");
    } catch (e: any) {
        return res.status(500).send(e.toString());
    }
};

export default fn;
