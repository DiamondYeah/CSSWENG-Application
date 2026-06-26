// fetchController.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const USERINFO_API = `${API_BASE}/userInfo/getuserinfo`;
const QUERY_DIRECT = `${API_BASE}/userInfo/queryinfo`;
const INITIAL_UPLOAD_DIRECT = `${API_BASE}/videoUpload/initupload`;
const UPLOAD_VIDEO_DIRECT = `${API_BASE}/videoUpload/upload`;
const UPLOAD_STATUS_DIRECT = `${API_BASE}/videoUpload/poststatus`;
const UPLOAD_PHOTOS_DIRECT = `${API_BASE}/photoUpload/photoUpload`;


// Function calls router user info from API to display user information
export async function fetchUserInfo(){

    // Fetch router with credentials
    const res = await fetch(USERINFO_API, {

        credentials: "include"

    })

    // Convert res to json and return
    const userInfo = await res.json();
    return userInfo;

}


// Function calls router to fetch query info of user from API to determine publish and video settings
export async function fetchQueryInfo(){

    // Fetch router with credentials
    const res = await fetch(QUERY_DIRECT, {

        credentials: "include"

    })

    const queryInfo = await res.json();

    return queryInfo;


}


// Function calls router to prepare video for upload from API by giving parameter details to obtain publishID and uploadURL
export async function initializeUploadPost(title: string, privacyLevel: string, videoSize: number){

    // Fetch router with credentials
    const res = await fetch(INITIAL_UPLOAD_DIRECT, {

        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

            title: title,
            privacyLevel: privacyLevel,
            videoSize: videoSize

        })

    })

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
    console.log("Photo Info Result: ", photosInfo);

    return photosInfo;


}