// fetchController.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const LOGIN_DIRECT = `${API_BASE}/account/login`;
const REGISTER_DIRECT = `${API_BASE}/account/register`;
const LOGOUT_DIRECT = `${API_BASE}/account/logout`;
const DISCONNECT_DIRECT = `${API_BASE}/logAuth/disconnect`;
const ACCOUNTINFO_DIRECT = `${API_BASE}/account/accountinfo`;
const USERINFO_DIRECT = `${API_BASE}/userInfo/getuserinfo`;
const CONNECTEDACCCOUNTS_DIRECT = `${API_BASE}/userInfo/getconnectedaccounts`;
const USER_TOKEN_DIRECT = `${API_BASE}/userInfo/getuser`
const QUERY_DIRECT = `${API_BASE}/userInfo/queryinfo`;
const INITIAL_UPLOAD_DIRECT = `${API_BASE}/videoUpload/initupload`;
const UPLOAD_VIDEO_DIRECT = `${API_BASE}/videoUpload/upload`;
const UPLOAD_STATUS_DIRECT = `${API_BASE}/videoUpload/poststatus`;
const UPLOAD_PHOTOS_DIRECT = `${API_BASE}/photoUpload/photoUpload`;
const SCHEDULED_POSTS_DIRECT = `${API_BASE}/postInfo/getscheduledposts`;
const GENERATE_SHARE_CALENDAR_DIRECT = `${API_BASE}/userInfo/createsharetoken`
const OPEN_SHARE_CALENDAR_DIRECT = `${API_BASE}/userInfo/sharecalendar`
const UPDATE_POST_FILEPATH_DIRECT = `${API_BASE}/postInfo/updatepostfilepath`

// for linkedin
const LINKEDIN_UPLOAD_DIRECT = `${API_BASE}/linkedinPost/upload`;
const LINKEDIN_USERINFO_API = `${API_BASE}/userInfo/getconnectedaccounts`;
const LINKEDIN_DISCONNECT_DIRECT = `${API_BASE}/account/disconnect/linkedin`;

// for facebook
const FACEBOOK_UPLOAD_DIRECT = `${API_BASE}/facebookPost/upload`;
const FACEBOOK_DISCONNECT_DIRECT = `${API_BASE}/account/disconnect/facebook`;

// for instagram
const INSTAGRAM_UPLOAD_DIRECT = `${API_BASE}/instagramPost/upload`;
const INSTAGRAM_DISCONNECT_DIRECT = `${API_BASE}/account/disconnect/instagram`;

// Import type
import {type PostMediaStatus} from "../types/tiktok.ts"


// Function calls router to create a new account
export async function registerAccount(username: string, email: string, password: string){

    const res = await fetch(REGISTER_DIRECT,
    {

        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({username, email, password}),

    })

    // Convert res to json and return
    const registerInfo = await res.json();

    return registerInfo;


}


// Function calls router to log to an existing account
export async function loginAccount(username: string, password: string){

    const res = await fetch(LOGIN_DIRECT,
    {

        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({username, password}),

    })

    // Convert res to json and return
    const loginInfo = await res.json();

    return loginInfo;

}


// Function calls router to log out of logged in account
export async function logoutAccount(){

    const res = await fetch(LOGOUT_DIRECT,
    {

        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },

    })

    // Convert res to json and return
    const logoutInfo = await res.json();

    return logoutInfo;


}


// Function calls router to get account information from credentials/cookie with session_account_id
export async function fetchAccountInfo(){

    const res = await fetch(ACCOUNTINFO_DIRECT,{

        credentials: "include",

    })


    // Convert res to json and return
    const accountInfo = await res.json();

    return accountInfo;

}


// Funcation calls router to disconnect TikTok user
export async function disconnectTikTokUser(platformAccountID: string){

    const res = await fetch(DISCONNECT_DIRECT,
    {

        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({platformAccountID}),


    })

    // Convert res to json and return
    const disconnectInfo = await res.json();

    return disconnectInfo;

}

export async function disconnectLinkedInUser(accountId: string){

    const res = await fetch(
        `${LINKEDIN_DISCONNECT_DIRECT}/${accountId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    const disconnectInfo = await res.json();

    return disconnectInfo;
}


export async function disconnectFacebookUser(accountId: string){

    const res = await fetch(
        `${FACEBOOK_DISCONNECT_DIRECT}/${accountId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    return await res.json();

}

export async function disconnectInstagramUser(accountId: string){

    const res = await fetch(
        `${INSTAGRAM_DISCONNECT_DIRECT}/${accountId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    return await res.json();

}

// Function calls router user info from API to obtain user information
export async function fetchUserInfo(){

    // Fetch router with credentials
    const res = await fetch(USERINFO_DIRECT, 
    {
        credentials: "include",

    })

    // Convert res to json and return
    const userInfo = await res.json();

    return userInfo;

}

// for linkedin
export async function fetchLinkedInUserInfo(){

    const res = await fetch(LINKEDIN_USERINFO_API, {

        credentials: "include",

    });

    const userInfo = await res.json();

    return userInfo;

}

// for facebook
export async function fetchFacebookUserInfo(){

    const res = await fetch(LINKEDIN_USERINFO_API, {

        credentials: "include",

    });

    return await res.json();

}

// Function calls router user info from API to obtain connnected social media acccounts of user
export async function fetchConnectedAccounts(){

    // Fetch router with credentials
    const res = await fetch(CONNECTEDACCCOUNTS_DIRECT, 
    {
        credentials: "include",

    })

    // Convert res to json and return
    const connectedAccountsInfo = await res.json();

    return connectedAccountsInfo;

}


// Function calls router user info from API via the shared token to obtain user information
export async function fetchUserInfoViaToken(token: string){

    // Fetch router with credentials
    const res = await fetch(`${USER_TOKEN_DIRECT}/${token}`, 
    {
        headers: { "ngrok-skip-browser-warning": "true" },
    })

    // Convert res to json and return
    const userInfo = await res.json();

    return userInfo;

}



// Function calls router to fetch query info of user from API to determine publish and video settings
export async function fetchQueryInfo(socialMediaAccountsIDs: string[]){

    // Fetch router with credentials
    const res = await fetch(QUERY_DIRECT, {

        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({socialMediaAccountsIDs}),
        
    })

    // Convert res to json and return
    const queryInfo = await res.json();

    return queryInfo;


}


// Function calls router to prepare video for upload from API by giving parameter details to obtain publishID and uploadURL
export async function initializeUploadPost(title: string, privacyLevel: string, videoSize: number, allowComments: boolean,
                                            allowDuet: boolean, allowStitch: boolean, isYourOwnBrand: boolean, isBrandedContent: boolean,
                                             scheduleDate?: Date, socialMediaAccountsIDs?: string[]){

    // Fetch router with credentials
    const res = await fetch(INITIAL_UPLOAD_DIRECT, {

        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

            title: title,
            privacyLevel: privacyLevel,
            videoSize: videoSize,
            allowComments: allowComments,
            allowDuet: allowDuet,
            allowStitch: allowStitch,
            isYourOwnBrand: isYourOwnBrand,
            isBrandedContent: isBrandedContent,
            scheduleDate: scheduleDate?.toISOString() ?? null,
            socialMediaAccountsIDs,

        })

    })

    // Convert res to json and return
    const intialUploadInfo = await res.json();

    return intialUploadInfo;


}


// Function calls router to upload videoFile to TikTok API with given uploadURL 
export async function uploadToTikTok(videoFile: File, uploadURL: string, isScheduled: boolean = false){

    // Create FormData object and append videoFile and uploadURL
    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('uploadURL', uploadURL);
    formData.append('isScheduled', String(isScheduled));

    // Fetch router with credentials
    const res = await fetch(UPLOAD_VIDEO_DIRECT, {

        method: "POST",
        credentials: "include",
        body: formData

    })

    // Convert res to json and return
    const uploadInfo = await res.json();

    return uploadInfo;


}


// Function calls router to check the status of uploaded video from API to check if it was successful or not
export async function checkUploadStatus(publishID: string, platformAccountID?: string){

    // Fetch router with credentials
    const res = await fetch(UPLOAD_STATUS_DIRECT, {

        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({publishID, socialMediaAccountsIDs: platformAccountID ? [platformAccountID] : undefined}),

    })

    // Convert res to json and return
    const statusInfo = await res.json();

    return statusInfo;


}


// Function calls router to upload photos to Tiktok API 
export async function uploadPhotos(photos: File[], title: string, description: string, ){

    // Create FormData object and append videoFile and uploadURL
    const formData = new FormData();

    photos.forEach(photo => {
        formData.append("photos", photo);
    })
    formData.append('title', title);
    formData.append('description', description);

    // Fetch router with credentials
    const res = await fetch(UPLOAD_PHOTOS_DIRECT, {

        method: "POST",
        credentials: "include",
        body: formData

    })

    const photosInfo = await res.json();

    return photosInfo;


}


// Function calls router to fetch posts with scheduled dates connected to the user
export async function fetchScheduledPosts(status: PostMediaStatus = "pending"){

    // Fetch router with credentials
    const res = await fetch(`${SCHEDULED_POSTS_DIRECT}?status=${status}`, 
    {
        credentials: "include",

    })

    // Convert res to json and return
    const scheduledPostInfo = await res.json();

    return scheduledPostInfo;

}


// Function calls router to generate a shared calendar token of the user to be shared to other users
export async function generateShareCalenderToken(){

    // Fetch router with credentials
    const res = await fetch(GENERATE_SHARE_CALENDAR_DIRECT, 
    {

        method: "POST",
        credentials: "include",

    })

    // Convert res to json and return
    const generatedTokenInfo = await res.json();

    return generatedTokenInfo;



}


// Function calls router to open read-only view of calendar showing scheduled posts of user who shared
export async function fetchSharedCalenderToken(token: string, status: PostMediaStatus = "pending"){

    // Fetch router with credentials
    const res = await fetch(`${OPEN_SHARE_CALENDAR_DIRECT}/${token}?status=${status}`, 
    {
        headers: { "ngrok-skip-browser-warning": "true" },
    })

    // Convert res to json and return
    const sharedCalendarInfo = await res.json();

    return sharedCalendarInfo;


}


// Function calls router to update a post to give it an post approval status for publishing
export async function fetchPostToApprove(token: string, postID: string){

    // Fetch router with credentials
    const res = await fetch(`${OPEN_SHARE_CALENDAR_DIRECT}/${token}/${postID}/approve`, 
    {
        headers: { "ngrok-skip-browser-warning": "true" },
        method: "PATCH",

    })

    // Convert res to json and return
    const approvePostInfo = await res.json();

    return approvePostInfo;



}


// Function calls router to update a post to give it an post rejection status for publishing with an optional reason
export async function fetchPostToReject(token: string, postID: string, reason?: string){

    // Fetch router with credentials
    const res = await fetch(`${OPEN_SHARE_CALENDAR_DIRECT}/${token}/${postID}/reject`, 
    {

        method: "PATCH",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({reason}),

    })

    // Convert res to json and return
    const rejectedPostInfo = await res.json();

    return rejectedPostInfo;



}


// Function calls router to update all posts in the calendar to give it an post approval status for publishing
export async function fetchAllPostsToApprove(token: string){

    // Fetch router with credentials
    const res = await fetch(`${OPEN_SHARE_CALENDAR_DIRECT}/${token}/approveallposts`, 
    {

        method: "PATCH",
        
    })

    // Convert res to json and return
    const approvedPostsInfo = await res.json();

    return approvedPostsInfo;



}


// Function calls router to update all posts in the calendar to give it an post rejection status for publishing with an optional reason
export async function fetchAllPostsToReject(token: string, reason?: string){

    // Fetch router with credentials
    const res = await fetch(`${OPEN_SHARE_CALENDAR_DIRECT}/${token}/rejectallposts`, 
    {

        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({reason}),
        
    })

    // Convert res to json and return
    const rejectPostsInfo = await res.json();

    return rejectPostsInfo;

}


// Function calls router to update a post to give it an attached comment based on the text parameter
export async function fetchPostToComment(token: string, postID: string, text: string, username?: string){

    // Fetch router with credentials
    const res = await fetch(`${OPEN_SHARE_CALENDAR_DIRECT}/${token}/${postID}/comment`, 
    {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({username, text}),
        
    })

    // Convert res to json and return
    const commentPostInfo = await res.json();

    return commentPostInfo;

}


// Function calls router to update post with a local file path. (Mainly for scheduled posts as they don't post immediately)
export async function performPostUpdateToFilePath(publishID: string, localFilePath: string){

    // Fetch router with credentials
    const res = await fetch(UPDATE_POST_FILEPATH_DIRECT, 
    {

        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({publishID, localFilePath}),
        
    })

    // Convert res to json and return
    const postWithPathInfo = await res.json();

    return postWithPathInfo;
}

export async function uploadToLinkedIn(
    title: string,
    connectionId: string,
    mediaFile?: File,
    scheduleMode?: string,
    scheduledDate?: string
) {

    const formData = new FormData();

    formData.append("title", title);
    formData.append("connectionId", connectionId);

    if (mediaFile)
        formData.append("media", mediaFile);

    if (scheduleMode)
        formData.append("scheduleMode", scheduleMode);

    if (scheduledDate)
        formData.append("scheduledDate", scheduledDate);

    const res = await fetch(LINKEDIN_UPLOAD_DIRECT, {

        method: "POST",
        credentials: "include",
        body: formData

    });

    return await res.json();

}

export async function uploadToFacebook(title: string, connectionId: string, mediaFile?: File, scheduleMode?: string, scheduledDate?: string) {

    const formData = new FormData();

    formData.append("title", title);
    formData.append("connectionId", connectionId);

    if (mediaFile)
        formData.append("media", mediaFile);

    if (scheduleMode)
        formData.append("scheduleMode", scheduleMode);

    if (scheduledDate)
        formData.append("scheduledDate", scheduledDate);

    const res = await fetch(FACEBOOK_UPLOAD_DIRECT, {

        method: "POST",
        credentials: "include",
        body: formData

    });

    return await res.json();

}


export async function uploadToInstagram(title: string, connectionId: string, mediaFile?: File, scheduleMode?: string, scheduledDate?: string) {

    const formData = new FormData();

    formData.append("title", title);
    formData.append("connectionId", connectionId);

    if (mediaFile)
        formData.append("media", mediaFile);

    if (scheduleMode)
        formData.append("scheduleMode", scheduleMode);

    if (scheduledDate)
        formData.append("scheduledDate", scheduledDate);

    const res = await fetch(INSTAGRAM_UPLOAD_DIRECT, {

        method: "POST",
        credentials: "include",
        body: formData

    });

    return await res.json();

}