import axios from "axios";

const FB_API_VERSION = "v21.0";
const FACEBOOK_AUTH_URL = `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`;
const FACEBOOK_TOKEN_URL = `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token`;
const FACEBOOK_GRAPH_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

export interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
    category?: string;
    tasks?: string[];
    perms?: string[];
}

export interface InstagramAccount {
    id: string;
    username?: string;
}

export function createFacebookAuth(state: string): string {
    const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID as string,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI as string,
        state,
        response_type: "code",
        auth_type: "reauthenticate",
        scope: [
            "pages_show_list",
            "pages_manage_posts",
            "pages_read_engagement",
            "pages_manage_metadata",
            "instagram_basic",
            "instagram_content_publish",
            ].join(",")
    });

    return `${FACEBOOK_AUTH_URL}?${params.toString()}`;
}

export async function obtainFacebookToken(code: string) {
    const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID as string,
        client_secret: process.env.FACEBOOK_APP_SECRET as string,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI as string,
        code,
    });

    const response = await axios.get(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);
    return response.data;
}

export async function exchangeForLongLivedToken(shortLivedToken: string) {
    const params = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.FACEBOOK_APP_ID as string,
        client_secret: process.env.FACEBOOK_APP_SECRET as string,
        fb_exchange_token: shortLivedToken,
    });

    const response = await axios.get(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);
    return response.data;
}

// export async function getManagedFacebookPages(userAccessToken: string): Promise<FacebookPage[]> {
//     try {
//         const debugToken = await axios.get(`${FACEBOOK_GRAPH_BASE}/debug_token`, {
//             params: {
//                 input_token: userAccessToken,
//                 access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`,
//             },
//         });

//         console.log("FACEBOOK TOKEN DEBUG:", JSON.stringify(debugToken.data, null, 2));
//     } catch (err: any) {
//         console.error(
//             "FACEBOOK TOKEN DEBUG ERROR:",
//             err?.response?.data ? JSON.stringify(err.response.data, null, 2) : err
//         );
//     }

//     const response = await axios.get(`${FACEBOOK_GRAPH_BASE}/me/accounts`, {
//         params: {
//             fields: "id,name,category,access_token,tasks,perms",
//             access_token: userAccessToken,
//         },
//     });

//     console.log("FACEBOOK /me/accounts RESPONSE:", JSON.stringify(response.data, null, 2));

//     return response.data.data ?? [];
// }

export async function getManagedFacebookPages(userAccessToken: string): Promise<FacebookPage[]> {
    const debugToken = await axios.get(`${FACEBOOK_GRAPH_BASE}/debug_token`, {
        params: {
            input_token: userAccessToken,
            access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`,
        },
    });

    const granular = debugToken.data?.data?.granular_scopes ?? [];
    const pageScope = granular.find((g: any) => g.scope === "pages_show_list");
    const pageIds: string[] = pageScope?.target_ids ?? [];

    if (pageIds.length === 0) return [];

    const pages = await Promise.all(
        pageIds.map((id) =>
            axios
                .get(`${FACEBOOK_GRAPH_BASE}/${id}`, {
                    params: {
                        fields: "id,name,category,access_token",
                        access_token: userAccessToken,
                    },
                })
                .then((r) => r.data)
        )
    );

    return pages;
}