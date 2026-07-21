// Import PostMedia Status interface
import {type PostMediaStatus} from "../models/post.ts"; 

// Function maps tiktokStatus from API to the PostMediaStatus in the Post Database Model
// DEV: Please call these whenever you have status to be stored in the database or to be returned from a fetch for consistaency
export function mapTikTokPostStatus(tiktokStatus: string): PostMediaStatus{

    // switch case to return PostMediaStatus map from tiktokStatus content
    switch(tiktokStatus){

        case "PUBLISH_COMPLETE": return "published";
        case "PROCESSING_DOWNLOAD":
        case "PROCESSING_UPLOAD": return "processing";
        case "FAILED": return "failed";
        default: return "processing";

    }


}


export function mapPostStatusToView(status: string){

    // switch case to return PostMediaStatus map from tiktokStatus content
    switch(status){

        case "published": return "Your upload is now live!";
        case "processing": return "Processing...";
        case "failed": return "Your media upload failed. Try uploading again.";
        default: return "Processing...";

    }


}


