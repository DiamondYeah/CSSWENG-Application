import fs from "fs";

// Import needed controllers, models, and service functions
import { updatePostStatus, findAwaitingSchedulePosts, updatePublishToPlatformPost } from "../dbcontrollers/postRepository.ts";
import { findSpecificSocialMediaAccount } from "../dbcontrollers/socialMediaAccountRepository.ts";
import { type ISocialMediaAccount } from "../models/socialMediaAccount.ts";
import { checkTokenIfExpired } from "./tiktokAuthService.ts";
import { obtainInitialUpload, uploadVideo } from "./tiktokVideoService.ts";
import path from "path";
import { uploadUserPhoto } from "./tiktokPhotoService.ts";


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

            // Check if file path(s) exist depending on post type
            const hasValidFiles = duePost.postType === "photo"
                ? !!duePost.localFilePaths?.length && duePost.localFilePaths.every((p: string) => fs.existsSync(p))
                : !!duePost.localFilePath && fs.existsSync(duePost.localFilePath);

            // Check if file path exists. If not, show error and update post status of media to failed
            if(!hasValidFiles){

                console.error(`Cannot find post file path ${duePost._id}. Updating status with failure.`);
                await updatePostStatus({publishID: duePost.publishID || duePost._id.toString(), status: "failed"});
                continue; // Skip to next post

            }


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


            // Check post type of scheduled post and perform different upload paths depending if photo or video
            if(duePost.postType == "photo"){

                if(!duePost.localFilePaths?.length){

                    console.error(`No Photo Paths for: ${duePost._id}. Updating status with failure.`);
                    await updatePostStatus({publishID: duePost.publishID || duePost._id.toString(), status: "failed"});
                    continue; // Skip to next post

                }


                // Get the mapped photoURLs from localFilePaths by using PUBLIC_URL/publicfile/basename
                const photoURLs = duePost.localFilePaths.map((p: string) => `${process.env.PUBLIC_URL}/publicfiles/${path.basename(p)}`);


                // Upload user photos to their account by calling uploadUserPhoto function in services and receive result of upload
                const photoUploadResult = await uploadUserPhoto({
                    
                    tiktokUser: refreshTikTokAccount, 
                    title: duePost.title ?? "", 
                    description: duePost.description ?? "",
                    photoURLs: photoURLs,
                    privacyLevel: duePost.privacyLevel ?? "SELF_ONLY", 
                    allowComments: duePost.allowComments ?? true,
                    isYourOwnBrand: duePost.isYourOwnBrand ?? false,
                    isBrandedContent: duePost.isBrandedContent ?? false,
 
                });


                // Change status of post to be submitted to platform
                await updatePublishToPlatformPost(String(duePost._id), photoUploadResult.data.publish_id, "")


                // Remove the photo posts paths of duePost
                duePost.localFilePaths.forEach((p: string) => {

                    fs.unlink(p, (err) => {
            
                        // Display error for unlink
                        if(err)
                            console.error(`Error in deleting photo post ${duePost._id} from fileSystem: `, err);
                        
                    });

                });


                
            }
            else{


                // Check if local file path exists
                if(!duePost.localFilePath){

                    console.error(`No Post Paths for: ${duePost._id}. Updating status with failure.`);
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


            }


 


        }catch(err){

            console.error(`Error processing post ${duePost._id}: `, err);
            await updatePostStatus({ publishID: duePost.publishID || duePost._id.toString(), status: "failed"});

        }


    }


}