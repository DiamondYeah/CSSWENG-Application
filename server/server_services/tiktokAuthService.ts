import dotenv from "dotenv";

// Load env file
dotenv.config();

// Import IUser interface
import {type IUser} from "../models/user.ts"

// Constants for Tiktok Paths
const TIKTOK_AUTORIZE_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_GETTOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_REFRESHTOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_DISCONNECT_URL = 'https://open.tiktokapis.com/v2/oauth/revoke/';
const SCOPE = '&scope=user.info.basic,user.info.profile,user.info.stats,video.publish,video.upload'


// Function creates URL for the tiktok authentication with csrfState and returns it to the router
export function createTikTokAuth(csrfState: string): string{

    // Create url to redirect user to login and authentication page with following parameters below
    // Includes both client key and redirect url in params
    let url = TIKTOK_AUTORIZE_URL;
    url += `?client_key=${process.env.TIKTOK_CLIENT_KEY}`;
    url += SCOPE;
    url += `&response_type=code`;
    url += `&redirect_uri=${process.env.REDIRECT_URI}`;
    url += `&state=${csrfState}`;

    return url.toString();
}


// Function fetches a user token with the code string and link and returns it to router
export async function obtainTikTokToken(code: string){

    // Perform fetch on token using the get token URL with the code parameter to get for the specific user
    const tokenFetch = await fetch(TIKTOK_GETTOKEN_URL, {

        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ 
            client_key: process.env.TIKTOK_CLIENT_KEY as string, 
            client_secret: process.env.TIKTOK_CLIENT_SECRET as string,
            code: code, 
            grant_type: "authorization_code", 
            redirect_uri: process.env.REDIRECT_URI as string})
    
    });

    // Convert the fetch to JSON and store it in const.
    const tokenAuth = await tokenFetch.json();

    // Check if there is error when fetching information
    if(tokenAuth.error && tokenAuth.error.code != "ok")
        throw new Error("Token Auth Error!", {cause: tokenAuth.error});

    // Send successful JSON 
    return tokenAuth;

}

// Function refereshes user token to prevent relogin when expired
export async function refreshTikTokToken(user: IUser){


    // Perform token fetch but for refreshing the token (grant type is refresh_token)
    const tokenFetch = await fetch(TIKTOK_REFRESHTOKEN_URL, {

        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ 
            client_key: process.env.TIKTOK_CLIENT_KEY as string, 
            client_secret: process.env.TIKTOK_CLIENT_SECRET as string,
            grant_type: "refresh_token", 
            refresh_token: user.refreshToken,
        }),

    });

    // Convert the fetch to JSON and store it in const.
    const refreshUserData = await tokenFetch.json();

    // Check if there is error when fetching information
    if(refreshUserData.error && refreshUserData.error.code != "ok")
        throw new Error("Token Refresh Auth Error!", {cause: refreshUserData.error});
    
    // Send successful JSON 
    return refreshUserData;
        

}


export async function disconnectTikTokAuth(user: IUser){


    const disconnectAuth = await fetch(TIKTOK_DISCONNECT_URL, {

        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ 
            client_key: process.env.TIKTOK_CLIENT_KEY as string, 
            client_secret: process.env.TIKTOK_CLIENT_SECRET as string,
            token: user.accessToken
        }),

    });

    const disconnectAuthData = await disconnectAuth.json();


    if(disconnectAuthData.error)
        throw new Error("Token Disconnect Auth Error!", {cause: disconnectAuthData.error});

    // Send successful JSON 
    return disconnectAuth;
}