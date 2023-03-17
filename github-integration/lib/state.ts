import crypto from "crypto";
import { env, exit } from "process";
import { APP_NAME } from "./github";

export const REDIRECT_URL = env.REDIRECT_URL || exit();

const STATE_KEY = Buffer.from(env.STATE_KEY || exit(), "hex");
const algorithm = "aes-192-cbc";

export type State = {
    iv: string,
    data: string,
}

export function encrypt(data: string, iv: Buffer): State {
    const cipher = crypto.createCipheriv(algorithm, STATE_KEY, iv);

    let encryptedData = cipher.update(data, "utf-8", "base64");
    encryptedData += cipher.final("base64");

    return { iv: iv.toString("base64"), data: encryptedData };
};

export function decrypt(data: string, iv: Buffer): string {
    let decipher = crypto.createDecipheriv(algorithm, STATE_KEY, iv);

    let decrypted = decipher.update(data, "base64", "utf-8");
    decrypted += decipher.final("utf-8");

    return decrypted;
};

export function createInstallLink(flows_user: string): string {
    let iv = crypto.randomBytes(16);

    let state = encrypt(flows_user, iv);
    let stateInUrl = encodeURIComponent(JSON.stringify(state));

    return `https://github.com/apps/${APP_NAME}/installations/new?state=${stateInUrl}`;
}
