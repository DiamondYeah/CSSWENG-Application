import dotenv from "dotenv";

// Load env file
dotenv.config();

// Import IUser interface
import {type IUser} from "../models/user.ts"

// Constants for Tiktok Paths
const TIKTOK_GETUSERINFO_URL = "https://open.tiktokapis.com/v2/user/info/?fields="
const TIKTOK_GETQUERYINFO_URL = "https://open.tiktokapis.com/v2/post/publish/creator_info/query/"


// Function obtains user information from their TikTok API via accessToken and API URL and return info details.
export async function obtainUserInfo(user: IUser){

    // Perform fetch to get user's TikTok account given accessToken of user
    const userInfoFetch = await fetch(`${TIKTOK_GETUSERINFO_URL}${process.env.USER_INFO_FIELDS as string}`, 
        {


            method: "GET",
            headers:{

                Authorization: `Bearer ${user.accessToken}`

            }
        }
    )

    // Convert the fetch to JSON and store it in const.
    const userInfo = await userInfoFetch.json();

    // Check if there is error when fetching information
    if(userInfo.error && userInfo.error.code != "ok")
        throw new Error("userInfo error!", {cause: userInfo.error});

    
    // Send successful JSON 
    return userInfo;

}


// Function obtains user query information from their TikTok API via their accesstoken and API URL and returns info details.
export async function obtainQueryInfo(user: IUser){
        
    // Perform fetch on user's TikTok query info given accessToken of user
    const userCreatorQuery = await fetch(TIKTOK_GETQUERYINFO_URL, 
        {

            method: "POST",
            headers:{

                "Authorization": `Bearer ${user.accessToken}`,
                "Content-Type": "application/json; charset=UTF-8",

            }
        }
    );

    // Convert the fetch to JSON and store it in const. 
    const userQuery = await userCreatorQuery.json();
    
    // Check if there is error when fetching information
    if(userQuery.error && userQuery.error.code != "ok")
        throw new Error("userQuery error!", {cause: userQuery.error});


    // Send successful JSON 
    return userQuery;

}