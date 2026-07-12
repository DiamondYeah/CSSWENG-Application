import dotenv from "dotenv";
import fs from "fs";


// Load env file
dotenv.config();

// Import IUser interface
import {type IUser} from "../models/user.ts"

// Interface for video upload
interface TikTokVideoUpload{

    user: IUser;
    title: string;
    privacyLevel: string;
    videoSize: number;
    allowComments: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
    isYourOwnBrand: boolean;
    isBrandedContent: boolean;

}

// Constants for Tiktok Paths
const TIKTOK_GETINITUPLOAD_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/"
const TIKTOK_GETVIDEOSTATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"



// Function initializes/prepares the video for upload to the website
// Return JSON result of fetch including publish_id and upload_url
export async function obtainInitialUpload(video: TikTokVideoUpload){

    // Post video details to TikTok for publishing and initial upload via the video parameter and API URL
    const userInitUploadFetch = await fetch(TIKTOK_GETINITUPLOAD_URL, 
        {

            method: "POST",
            headers:{

                "Authorization": `Bearer ${video.user.accessToken}`,
                "Content-Type": "application/json; charset=UTF-8"

            },
            body: JSON.stringify({
                
            post_info:{

                title: video.title,
                privacy_level: video.privacyLevel,
                disable_duet: !video.allowDuet,
                disable_comment: !video.allowComments,
                disable_stitch: !video.allowStitch,
                video_cover_timestamp_ms: 1000,
                brand_content_toggle: video.isBrandedContent,
                brand_organic_toggle: video.isYourOwnBrand,

            },
            source_info:{

                source: "FILE_UPLOAD",
                video_size: video.videoSize,
                chunk_size:  video.videoSize,
                total_chunk_count: 1

            }

            })
        }
    );

    // Convert the fetch to JSON and store it in const. 
    const userInitUpload = await userInitUploadFetch.json();

    // Check if there is error when posting information
    if(userInitUpload.error && userInitUpload.error.code != "ok"){

        // Check if user is not allowed to post
        if(userInitUpload.error.code == "spam_risk_too_many_posts")
            throw new Error("POSTING_CAP_REACHED", {cause: userInitUpload.error})
        else if(userInitUpload.error.code == "spam_risk_user_banned_from_posting")
            throw new Error("BANNED_FROM_POSTING", {cause: userInitUpload.error})

        throw new Error("userInitUpload error!", {cause: userInitUpload.error});

    }


    // Send successful JSON 
    return userInitUpload
    
}


// Function uploads the video to the user's TikTok account via video and uploadURL parameters
// Returns upload results
export async function uploadVideo(video: Express.Multer.File, uploadURL: string){

    // Read file to buffer by finding its path location via fileSystem
    const videoBuffer = await fs.promises.readFile(video.path);

    //  Performs fetch to put the video to the user's TikTok account and return results
    const userUploadFetch = await fetch(uploadURL, 
        {

            method: "PUT",
            headers:{

                "Content-Type": "video/mp4",
                "Content-Length": `${video.size}`,
                "Content-Range": `bytes 0-${video.size - 1}/${video.size}`,

            },
            body: videoBuffer,

        }
    );


    // Check if there is error when fetching information
    if(!userUploadFetch.ok)
        throw new Error("Video upload to TikTok error!");


    // Send successful JSON 
    return userUploadFetch

}


// Function obtains information of the video upload to the TikTok website via user, publishID and API URL
// Returns information of post status such as whether it was successful or not. If not, shares the fail error
export async function obtainPostStatus(user: IUser, publishID: string){

    //  Performs fetch to obtain the video status results from the user's TikTok account and return results of status
    const userStatusUploadFetch = await fetch(TIKTOK_GETVIDEOSTATUS_URL, 
        {

            method: "POST",
            headers:{

                "Authorization": `Bearer ${user.accessToken}`,
                "Content-Type": "application/json; charset=UTF-8"

            },
            body: JSON.stringify({"publish_id": publishID})
        }
    );


    // Convert the fetch to JSON and store it in const. 
    const userStatusUpload = await userStatusUploadFetch.json();

    // Check if there is error when fetching information
    if(userStatusUpload.error && userStatusUpload.error.code != "ok")
        throw new Error("userStatusUpload error!", {cause: userStatusUpload.error});

    // Send successful JSON 
    return userStatusUpload;

}