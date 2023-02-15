import type { NextApiRequest, NextApiResponse } from "next"
import httpProxyMiddleware from "next-http-proxy-middleware";

const fn = async (req: NextApiRequest, res: NextApiResponse) => httpProxyMiddleware(req, res, {
    target: "https://api.github.com"
});

export default fn;

export const config = {
    runtime: 'experimental-edge',
};
