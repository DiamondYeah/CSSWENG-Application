import axios from "axios";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export function createLinkedInAuth(csrfState: string): string {
    const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.LINKEDIN_CLIENT_ID as string,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI as string,
        state: csrfState,
        scope: "openid profile email w_member_social"
    });

    return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export async function obtainLinkedInToken(code: string) {
    const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI as string,
        client_id: process.env.LINKEDIN_CLIENT_ID as string,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET as string
    });

    const response = await axios.post(LINKEDIN_TOKEN_URL, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    console.log("LinkedIn token response scope:", response.data.scope);

    return response.data;
}

export async function getLinkedInUserInfo(accessToken: string) {
    const response = await axios.get(LINKEDIN_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    return response.data;
}