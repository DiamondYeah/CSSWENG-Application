// fetchController.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const DISCONNECT_DIRECT = `${API_BASE}/logAuth/disconnect`;
const USERINFO_API = `${API_BASE}/userInfo/getuserinfo`;
const USER_TOKEN_DIRECT = `${API_BASE}/userInfo/getuser`
const QUERY_DIRECT = `${API_BASE}/userInfo/queryinfo`;
const INITIAL_UPLOAD_DIRECT = `${API_BASE}/videoUpload/initupload`;
const UPLOAD_VIDEO_DIRECT = `${API_BASE}/videoUpload/upload`;
const UPLOAD_STATUS_DIRECT = `${API_BASE}/videoUpload/poststatus`;
const UPLOAD_PHOTOS_DIRECT = `${API_BASE}/photoUpload/photoUpload`;
const SCHEDULED_POSTS_DIRECT = `${API_BASE}/postInfo/getscheduledposts`;
const GENERATE_SHARE_CALENDAR_DIRECT = `${API_BASE}/userInfo/createsharetoken`
const OPEN_SHARE_CALENDAR_DIRECT = `${API_BASE}/userInfo/sharecalendar`

// Import type
import {type PostMediaStatus} from "../types/tiktok.ts"


// Funcation calls router to disconnect TikTok user
export async function disconnectTikTokUser(){

    const res = await fetch(DISCONNECT_DIRECT,
    {

        method: "POST",
        credentials: "include",


    })

    // Convert res to json and return
    const disconnectInfo = await res.json();

    return disconnectInfo;

}

// Function calls router user info from API to obtain user information
export async function fetchUserInfo(){

    // Fetch router with credentials
    const res = await fetch(USERINFO_API, 
    {
        credentials: "include",

    })

    // Convert res to json and return
    const userInfo = await res.json();

    return userInfo;

}


// Function calls router user info from API via the shared token to obtain user information
export async function fetchUserInfoViaToken(token: string){

    // Fetch router with credentials
    const res = await fetch(`${USER_TOKEN_DIRECT}/${token}`, 
    {

    })

    // Convert res to json and return
    const userInfo = await res.json();

    return userInfo;

}



// Function calls router to fetch query info of user from API to determine publish and video settings
export async function fetchQueryInfo(){

    // Fetch router with credentials
    const res = await fetch(QUERY_DIRECT, {

        credentials: "include",

    })

    // Convert res to json and return
    const queryInfo = await res.json();

    return queryInfo;


}


// Function calls router to prepare video for upload from API by giving parameter details to obtain publishID and uploadURL
export async function initializeUploadPost(title: string, privacyLevel: string, videoSize: number, allowComments: boolean,
                                            allowDuet: boolean, allowStitch: boolean, isYourOwnBrand: boolean, isBrandedContent: boolean,
                                             scheduleDate?: Date){

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
            scheduleDate: scheduleDate?.toISOString() ?? null

        })

    })

    // Convert res to json and return
    const intialUploadInfo = await res.json();

    return intialUploadInfo;


}


// Function calls router to upload videoFile to TikTok API with given uploadURL 
export async function uploadToTikTok(videoFile: File, uploadURL: string){

    // Create FormData object and append videoFile and uploadURL
    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('uploadURL', uploadURL);

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
export async function checkUploadStatus(publishID: string){

    // Fetch router with credentials
    const res = await fetch(UPLOAD_STATUS_DIRECT, {

        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({publishID})

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

    })

    // Convert res to json and return
    const sharedCalendarInfo = await res.json();

    return sharedCalendarInfo;


}