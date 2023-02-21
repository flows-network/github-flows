import { env, exit } from "process";

export const APP_ID = env.GITHUB_APP_ID || exit();
export const CLIENT_ID = env.GITHUB_CLIENT_ID || exit();
export const CLIENT_SECRET = env.GITHUB_CLIENT_SECRET || exit();
export const PRIVATE_KEY = env.GITHUB_PRIVATE_KEY || exit();
