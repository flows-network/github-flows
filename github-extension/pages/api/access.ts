import type { NextApiRequest, NextApiResponse } from "next"
import httpProxyMiddleware from "next-http-proxy-middleware";

const fn = async (req: NextApiRequest, res: NextApiResponse) => {
    let body = req.body;

    if (body["installation"]) {
        let action = body["action"];
        if (action == "created") {
            console.log("saved installation id");
            console.log(body["installation"]["access_tokens_url"])
        } else if (action == "deleted") {
            console.log("deleted installation id");
            console.log(body["installation"]["access_tokens_url"])
        }
    }

    return httpProxyMiddleware(req, res, {
        // target: "https://code.flows.network/hook/github/message",
        target: "https://httpbin.org/anything",
        pathRewrite: [{
            patternStr: `^/api/access`,
            replaceStr: "",
        }]
    })
};

export default fn;
