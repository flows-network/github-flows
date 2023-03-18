import type { NextApiRequest, NextApiResponse } from "next";
import { createInstallLink } from "@/lib/state";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user } = req.query;

    if (!flows_user) {
        return res.status(400).send("Bad request");
    }

    if (typeof flows_user != "string") {
        return res.status(400).send("Bad request");
    }

    let install_link = createInstallLink(flows_user);
    return res.redirect(install_link);
}

export default fn;
