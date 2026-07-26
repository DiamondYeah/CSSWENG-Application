import fs from "fs";

// Import needed controllers, models, and service functions
import { updatePostStatus, findAwaitingSchedulePosts, updatePublishToPlatformPost } from "../dbcontrollers/postRepository.ts";
import { findSpecificSocialMediaAccount } from "../dbcontrollers/socialMediaAccountRepository.ts";
import { type ISocialMediaAccount } from "../models/socialMediaAccount.ts";
import { checkTokenIfExpired } from "./tiktokAuthService.ts";
import { obtainInitialUpload, uploadVideo } from "./tiktokVideoService.ts";


// Function checks lists of posts that have an awaiting schedule and checks if theyre due for an upload. If so, upload them to TikTok
// Returns nothing as it just processes posts
export async function processScheduledDuePosts(){

    
    // Get array of posts that have an awaiting schedule
    const duePosts = await findAwaitingSchedulePosts();


    // Loop through each posts in duePosts to see if it should be ready for submission
    for(const duePost of duePosts){

        if(duePost.platform !== "tiktok")
            continue;

        try{

            // Set each posts to a processing status
            await updatePostStatus({publishID: duePost.publishID || duePost._id.toString(), status: "processing"})


            // Check if file path exists. If not, show error and update post status of media to failed
            if(!duePost.localFilePath || !fs.existsSync(duePost.localFilePath)){

                console.error(`Cannot find post file path ${duePost._id}. Updating status with failure.`);
                await updatePostStatus({publishID: duePost.publishID || duePost._id.toString(), status: "failed"});
                continue; // Skip to next post

            }
            else if(duePost.platform != "tiktok") // Skip if not tiktok
                continue;


            // Find tiktok account associated with post
            const tiktokAccount: ISocialMediaAccount | null = await findSpecificSocialMediaAccount(String(duePost.userID), "tiktok", duePost.platformAccountID);

            // Checks if tiktok account exists.
            if(!tiktokAccount){

                console.error(`Cannot find a tiktok account associated with post: ${duePost._id}. Updating status with failure.`);
                await updatePostStatus({publishID: duePost.publishID || duePost._id.toString(), status: "failed"});
                continue; // Skip to next post

            }

            // Check for the tiktok token to see if expired.
            const refreshTikTokAccount: ISocialMediaAccount | null = await checkTokenIfExpired(String(tiktokAccount._id));

            // Checks if tiktok account token is expired or not 
            if(!refreshTikTokAccount){

                console.error(`Tiktok account token associated with post: ${duePost._id} is expired/invalid. Updating status with failure.`);
                await updatePostStatus({publishID: duePost.publishID || duePost._id.toString(), status: "failed"});
                continue; // Skip to next post

            }


            // Return information and stats about the file in given path
            const postInfo = fs.statSync(duePost.localFilePath);

            // Perform initial upload with due post
            const userInitUpload = await obtainInitialUpload({

                tiktokUser: refreshTikTokAccount, 
                title: duePost.title ?? "", 
                privacyLevel: duePost.privacyLevel ?? "SELF_ONLY", 
                videoSize: postInfo.size,
                allowComments: duePost.allowComments ?? true,
                allowDuet: duePost.allowDuet ?? false,
                allowStitch: duePost.allowStitch ?? false,
                isYourOwnBrand: duePost.isYourOwnBrand ?? false,
                isBrandedContent: duePost.isBrandedContent ?? false,

            });
            
            // Check if returned data has an upload_url to upload video to.
            if(!userInitUpload?.data.upload_url){

                console.error(`Returned result has no upload url for post ${duePost._id}. Updating status with failure.`);
                await updatePostStatus({publishID: duePost.publishID || duePost._id.toString(), status: "failed"});
                continue; // Skip to next post

            }


            // Create a buffer to store the file and perform videoUpload
            const fileBuffer = {path: duePost.localFilePath, size: postInfo.size } as Express.Multer.File;
            await uploadVideo(fileBuffer, userInitUpload.data.upload_url);

            // Change status of post to be submitted to platform
            await updatePublishToPlatformPost(String(duePost._id), userInitUpload.data.publish_id, userInitUpload.data.upload_url)


            // Remove/clean up file from fileSystem
            fs.unlink(duePost.localFilePath, (err) => {
    
                // Display error for unlink
                if(err)
                    console.error(`Error in deleting post ${duePost._id} from fileSystem: `, err);
                
            });


        }catch(err){

            console.error(`Error processing post ${duePost._id}: `, err);

        }




    }




}