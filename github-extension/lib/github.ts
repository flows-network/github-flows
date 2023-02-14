export async function getAuthedToken(code: string): Promise<string> {
    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;

    const github_base = "https://github.com/login/oauth/access_token"
    let res = await fetch(
        `${github_base}?client_id=${client_id}&client_secret=${client_secret}&code=${code}`,
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
