export const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export async function getAuthedToken(code: string): Promise<string> {

    const github_base = "https://github.com/login/oauth/access_token"
    let res = await fetch(
        `${github_base}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}`,
        {
            headers: {
                Accept: "application/json",
            }
        }
    );
    const access = await res.json();

    if (!access.access_token) {
        throw "Can not access user of github";
    }

    return access.access_token;
}
