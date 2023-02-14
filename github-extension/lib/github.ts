export async function getAuthedToken(code: string): Promise<string> {
    let res = await fetch(`https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`);
    const access = await res.json();

    if (!access.access_token) {
        throw "Can not access user of github";
    }

    return access.access_token;
}
