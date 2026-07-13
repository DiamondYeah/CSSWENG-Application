import axios from "axios";

const IG_AUTH_URL           = "https://www.instagram.com/oauth/authorize";
const IG_TOKEN_URL          = "https://api.instagram.com/oauth/access_token";
const IG_LONG_LIVED_URL     = "https://graph.instagram.com/access_token";
const IG_GRAPH_BASE         = "https://graph.instagram.com";

export function createInstagramAuth(state: string): string {
    const params = new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID as string,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI as string,
        response_type: "code",
        scope: "instagram_business_basic,instagram_business_content_publish",
        state,
        // Instagram's native login supports this natively — connecting
        // another account will actually show the login screen, unlike LinkedIn.
        force_reauth: "true",
    });

    return `${IG_AUTH_URL}?${params.toString()}`;
}

// Short-lived token — valid ~1 hour, only usable once to get a long-lived token.
export async function obtainInstagramToken(code: string) {
    const form = new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID as string,
        client_secret: process.env.INSTAGRAM_APP_SECRET as string,
        grant_type: "authorization_code",
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI as string,
        code,
    });

    const response = await axios.post(IG_TOKEN_URL, form);
    return response.data; // { access_token, user_id, permissions }
}

// Long-lived token — valid 60 days, refreshable.
export async function exchangeForLongLivedInstagramToken(shortLivedToken: string) {
    const response = await axios.get(IG_LONG_LIVED_URL, {
        params: {
            grant_type: "ig_exchange_token",
            client_secret: process.env.INSTAGRAM_APP_SECRET as string,
            access_token: shortLivedToken,
        },
    });
    return response.data; // { access_token, token_type, expires_in }
}

export interface InstagramProfile {
    user_id: string;
    username: string;
}

export async function getInstagramProfile(accessToken: string): Promise<InstagramProfile> {
    const response = await axios.get(`${IG_GRAPH_BASE}/me`, {
        params: {
            fields: "user_id,username",
            access_token: accessToken,
        },
    });
    return response.data;
}