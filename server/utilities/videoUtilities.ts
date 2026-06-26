// Import PostMedia Status interface
import {type PostMediaStatus} from "../models/post.ts"; 

// Function maps tiktokStatus from API to the PostMediaStatus in the Post Database Model
export function mapTikTokPostStatus(tiktokStatus: string): PostMediaStatus{

    // switch case to return PostMediaStatus map from tiktokStatus content
    switch(tiktokStatus){

        case "PUBLISH_COMPLETE": return "published";
        case "PROCESSING_DOWNLOAD":
        case "PROCESSING_UPLOAD": return "processing"
        case "FAILED": return "failed";
        default: return "processing";

    }


}