const API_BASE                  = import.meta.env.VITE_API_BASE_URL;
const USERINFO_API              = `${API_BASE}/userInfo/getuserinfo`;
const LINKEDIN_USERINFO_API     = `${API_BASE}/userInfo/linkedin`;
const QUERY_DIRECT              = `${API_BASE}/userInfo/queryinfo`;
const INITIAL_UPLOAD_DIRECT     = `${API_BASE}/videoUpload/initupload`;
const UPLOAD_VIDEO_DIRECT       = `${API_BASE}/videoUpload/upload`;
const UPLOAD_STATUS_DIRECT      = `${API_BASE}/videoUpload/poststatus`;
const UPLOAD_PHOTOS_DIRECT      = `${API_BASE}/photoUpload/photoUpload`;
const LINKEDIN_UPLOAD_DIRECT    = `${API_BASE}/linkedinPost/upload`;
const LINKEDIN_CONNECT_LINK_API = `${API_BASE}/auth/linkedin/connect-link`;
const FACEBOOK_USERINFO_API     = `${API_BASE}/userInfo/facebook`;
const FACEBOOK_UPLOAD_DIRECT    = `${API_BASE}/facebookPost/upload`;
const INSTAGRAM_USERINFO_API    = `${API_BASE}/userInfo/instagram`;
const INSTAGRAM_UPLOAD_DIRECT = `${API_BASE}/instagramPost/upload`;
const POSTS_API = `${API_BASE}/userInfo/posts`;

const CORS_HEADER: Record<string, string> = { "ngrok-skip-browser-warning": "true"}

export async function fetchUserInfo(){
    const res = await fetch(USERINFO_API, 
    {
        credentials: "include",
        headers: CORS_HEADER

    },
   )
    const userInfo = await res.json();
    return userInfo;
}

export async function fetchLinkedInUserInfo() {
    const res = await fetch(LINKEDIN_USERINFO_API, {
        credentials: "include",
        headers: CORS_HEADER
    });
    const userInfo = await res.json();
    return userInfo;
}

export async function fetchQueryInfo(){
    const res = await fetch(QUERY_DIRECT, {
        credentials: "include",
        headers: CORS_HEADER
    })
    const queryInfo = await res.json();
    return queryInfo;
}

export async function initializeUploadPost(title: string, privacyLevel: string, videoSize: number, allowComments: boolean,
                                            allowDuet: boolean, allowStitch: boolean){
    const res = await fetch(INITIAL_UPLOAD_DIRECT, {
        method: "POST",
        credentials: "include",
        headers: { ...CORS_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({
            title: title,
            privacyLevel: privacyLevel,
            videoSize: videoSize,
            allowComments: allowComments,
            allowDuet: allowDuet,
            allowStitch: allowStitch

        })
    })
    const intialUploadInfo = await res.json();
    return intialUploadInfo;
}

export async function uploadToTikTok(videoFile: File, uploadURL: string){
    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('uploadURL', uploadURL);
    const res = await fetch(UPLOAD_VIDEO_DIRECT, {
        method: "POST",
        credentials: "include",
        headers: CORS_HEADER,
        body: formData

    })
    const uploadInfo = await res.json();
    return uploadInfo;
}

export async function checkUploadStatus(publishID: string){
    const res = await fetch(UPLOAD_STATUS_DIRECT, {
        method: "POST",
        credentials: "include",
        headers: { ...CORS_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({publishID})
    })
    const statusInfo = await res.json();
    return statusInfo;
}

export async function uploadPhotos(photos: File[], title: string, description: string, ){
    const formData = new FormData();

    photos.forEach(photo => {
        formData.append("photos", photo);
    })
    formData.append('title', title);
    formData.append('description', description);
    const res = await fetch(UPLOAD_PHOTOS_DIRECT, {
        method: "POST",
        credentials: "include",
        headers: CORS_HEADER,
        body: formData

    })

    const photosInfo = await res.json();
    console.log("Photo Info Result: ", photosInfo);
    return photosInfo;
}

export async function uploadToLinkedIn(
    title: string,
    connectionId: string,
    mediaFile?: File,
    scheduleMode?: string,
    scheduledDate?: string
) {
    console.log("uploadToLinkedIn triggered");
    
    const formData = new FormData();
    formData.append("title", title);
    formData.append("connectionId", connectionId);

    if (mediaFile) {
        formData.append("media", mediaFile);
    }

    // draft
    if (scheduleMode) {
        formData.append("scheduleMode", scheduleMode);
    }

    if (scheduledDate) {
        formData.append("scheduledDate", scheduledDate);
    }

    const res = await fetch(LINKEDIN_UPLOAD_DIRECT, {
        method: "POST",
        credentials: "include",
        headers: CORS_HEADER,
        body: formData
    });

    return res.json();
}

export async function fetchLinkedInConnectLink() {
    const response = await fetch(LINKEDIN_CONNECT_LINK_API, {
        credentials: "include",
        headers: CORS_HEADER
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.json();
}

export async function fetchFacebookUserInfo() {
    const res = await fetch(FACEBOOK_USERINFO_API, { credentials: "include", headers: CORS_HEADER });
    return await res.json();
}

export async function uploadToFacebook(title: string, connectionId: string, mediaFile?: File) {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("connectionId", connectionId);
    if (mediaFile) formData.append("media", mediaFile);

    const res = await fetch(FACEBOOK_UPLOAD_DIRECT, {
        method: "POST",
        credentials: "include",
        headers: CORS_HEADER,
        body: formData,
    });
    return res.json();
}

export async function deleteSocialConnection(connectionId: string) {
    const res = await fetch(`${API_BASE}/userInfo/connection/${connectionId}`, {
        method: "DELETE",
        credentials: "include",
        headers: CORS_HEADER,
    });
    return await res.json();
}

export async function fetchInstagramUserInfo() {
    const res = await fetch(INSTAGRAM_USERINFO_API, { credentials: "include", headers: CORS_HEADER });
    return await res.json();
}

export async function uploadToInstagram(title: string, connectionId: string, mediaFile?: File) {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("connectionId", connectionId);
    if (mediaFile) formData.append("media", mediaFile);

    const res = await fetch(INSTAGRAM_UPLOAD_DIRECT, {
        method: "POST",
        credentials: "include",
        headers: CORS_HEADER,
        body: formData,
    });
    return res.json();
}

export async function fetchPosts() {

    const res = await fetch(POSTS_API, {
        credentials: "include",
        headers: CORS_HEADER
    });

    return await res.json();

}