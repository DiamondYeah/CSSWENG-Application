import dotenv from "dotenv";
import fs from "fs";


// Load env file
dotenv.config();

// Import ItiktokUser interface
import {type ISocialMediaAccount} from "../models/socialMediaAccount.ts"

// Interface for video upload
interface TikTokVideoUpload{

    tiktokUser: ISocialMediaAccount;
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


// Determins Chunk Constraints
const MIN_SIZE_PER_CHUNK: number = 5 * 1024 * 1024;
const MAX_SIZE_PER_CHUNK: number = 64 * 1024 * 1024;


// Function computes how many chunk counts are needed for the file. Needed for large file uploads
// Each chunk is a minimum of 5 MB and a max of 64 MB (Any file larger than 64 MB needs to be split into chunks)
// Return number of chunk counts needed
async function calculateChunkCount(videoSize: number){

    // If smaller than MAX size, just return 1 chunk
    if(videoSize <= MAX_SIZE_PER_CHUNK)
        return {chunk_size: videoSize, total_chunk_count: 1};


    // If larger, then divide videoSize with the max size per chunk. Any remainder gets sent to the final chunk
    let numberofChunks = Math.floor(videoSize / MAX_SIZE_PER_CHUNK)

    return {chunk_size: MAX_SIZE_PER_CHUNK, total_chunk_count: numberofChunks};


}



// Function initializes/prepares the video for upload to the website
// Return JSON result of fetch including publish_id and upload_url
export async function obtainInitialUpload(video: TikTokVideoUpload){

    // Get the chunk size and chunk count by calling calculateChunkCount function
    const  {chunk_size, total_chunk_count} = await calculateChunkCount(video.videoSize);

    // Post video details to TikTok for publishing and initial upload via the video parameter and API URL
    const tiktokUserInitUploadFetch = await fetch(TIKTOK_GETINITUPLOAD_URL, 
        {

            method: "POST",
            headers:{

                "Authorization": `Bearer ${video.tiktokUser.accessToken}`,
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
                chunk_size:  chunk_size,
                total_chunk_count: total_chunk_count

            }

            })
        }
    );

    // Convert the fetch to JSON and store it in const. 
    const tiktokUserInitUpload = await tiktokUserInitUploadFetch.json();

    // Check if there is error when posting information
    if(tiktokUserInitUpload.error && tiktokUserInitUpload.error.code != "ok"){

        // Check if tiktokUser is not allowed to post
        if(tiktokUserInitUpload.error.code == "spam_risk_too_many_posts")
            throw new Error("POSTING_CAP_REACHED", {cause: tiktokUserInitUpload.error})
        else if(tiktokUserInitUpload.error.code == "spam_risk_tiktokUser_banned_from_posting")
            throw new Error("BANNED_FROM_POSTING", {cause: tiktokUserInitUpload.error})

        throw new Error("tiktokUserInitUpload error!", {cause: tiktokUserInitUpload.error});

    }


    // Send successful JSON 
    return tiktokUserInitUpload
    
}


// Function uploads the video to the tiktokUser's TikTok account via video and uploadURL parameters
// Returns upload results
export async function uploadVideo(video: Express.Multer.File, uploadURL: string){

    // Open file to allow any reading of the file. Avoids directly reading the entire video size especially for large videos
    const videoFileHandle = await fs.promises.open(video.path, 'r');

    // Get the chunk size and chunk count by calling calculateChunkCount function
    const  {chunk_size, total_chunk_count} = await calculateChunkCount(video.size);


    // Stores the res of the video uploaded in chunks
    let lastRes;

    try{


        // Loop through each chunk count, and upload each chunk 
        for(let i = 0; i < total_chunk_count; i++){

            // Checks i if its the last chunk that will be used in endRange to put any remainder sizes into last chunk
            const isLastChunk = i == total_chunk_count - 1;

            // Computes the start and end range for the chunk, and the chunk itself
            const startRange = i * chunk_size; // For max chunk size its i * 64MB
            const endRange = isLastChunk ? (video.size - 1) :(startRange + chunk_size - 1);

            // Computes the range of bytes to read
            const bytesToRead = endRange - startRange + 1;

            // Allocate a read for only a chunk instead of whole file
            const chunkBuffer = Buffer.alloc(bytesToRead); 
            await videoFileHandle.read(chunkBuffer, 0, bytesToRead, startRange); // Reads needed bytes for said chunk

            lastRes = await fetch(uploadURL, 
                    {

                        method: "PUT",
                        headers:{

                            "Content-Type": "video/mp4",
                            "Content-Length": `${bytesToRead}`,
                            "Content-Range": `bytes ${startRange}-${endRange}/${video.size}`,

                        },

                        body: chunkBuffer,

                    }
                );


            // Check if there is error when uploading chunk
            if(!lastRes.ok)
                throw new Error(`Video chunk ${i + 1} upload to TikTok error!`);

        }

    }finally{

        await videoFileHandle.close(); // Close file handler

    }

    return lastRes;

}


// Function obtains information of the video upload to the TikTok website via tiktokUser, publishID and API URL
// Returns information of post status such as whether it was successful or not. If not, shares the fail error
export async function obtainPostStatus(tiktokUser: ISocialMediaAccount, publishID: string){

    //  Performs fetch to obtain the video status results from the tiktokUser's TikTok account and return results of status
    const tiktokUserStatusUploadFetch = await fetch(TIKTOK_GETVIDEOSTATUS_URL, 
        {

            method: "POST",
            headers:{

                "Authorization": `Bearer ${tiktokUser.accessToken}`,
                "Content-Type": "application/json; charset=UTF-8"

            },
            body: JSON.stringify({"publish_id": publishID})
        }
    );


    // Convert the fetch to JSON and store it in const. 
    const tiktokUserStatusUpload = await tiktokUserStatusUploadFetch.json();

    // Check if there is error when fetching information
    if(tiktokUserStatusUpload.error && tiktokUserStatusUpload.error.code != "ok")
        throw new Error("tiktokUserStatusUpload error!", {cause: tiktokUserStatusUpload.error});

    // Send successful JSON 
    return tiktokUserStatusUpload;

}