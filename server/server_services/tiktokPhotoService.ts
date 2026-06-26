import dotenv from "dotenv";

// Load env file
dotenv.config();

// Import IUser interface
import {type IUser} from "../models/user.ts"

// Interface for photo upload
interface TikTokPhotoUpload{

    user: IUser;
    title: string;
    description: string;
    photoURLs: string[];


}

// Constants for Tiktok Paths
const TIKTOK_PUBLISHPHOTO_URL = "https://open.tiktokapis.com/v2/post/publish/content/init/"


// Function uploads user photos to the user's TikTok account via API URL and photo interface parameter.
// Returns results of the upload.
export async function uploadUserPhoto(photos: TikTokPhotoUpload){

    // Perform fetch to post photos from the photos parameter in the user's TikTok account
    const userPhotoUploadFetch = await fetch(TIKTOK_PUBLISHPHOTO_URL, 
        {

            method: "POST",
            headers:{

                "Authorization": `Bearer ${photos.user.accessToken}`,
                "Content-Type": "application/json; charset=UTF-8",

            },
            body: JSON.stringify({

                post_info:{

                    title: photos.title,
                    description: photos.description,
                    privacy_level: "SELF_ONLY",
                    brand_content_toggle: false,
                    brand_organic_toggle: false



                },
                source_info:{

                    source: "PULL_FROM_URL",
                    photo_images: photos.photoURLs,
                    photo_cover_index: 0,

                },

                media_type: "PHOTO",
                post_mode: "MEDIA_UPLOAD"


            }),

        }
    );


    // Convert the fetch to JSON and store it in const.
    const userPhotoUpload = await userPhotoUploadFetch.json();

    // Check if there is error when fetching information
    if(userPhotoUpload.error && userPhotoUpload.error.code != "ok")
        throw new Error("Photo Upload Error!", {cause: userPhotoUpload.error});

    
    // Send successful JSON 
    return userPhotoUpload;

    
}