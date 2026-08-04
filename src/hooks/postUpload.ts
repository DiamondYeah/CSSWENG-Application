import {useState} from "react";

import { 
    initializeUploadPost, 
    uploadToTikTok, 
    checkUploadStatus, 
    performPostUpdateToFilePath, 
    uploadToLinkedIn,
    uploadToFacebook,
    uploadToInstagram,
    uploadPhotos
} from "../controller/fetchController.ts";

import {timer} from "../frontend_utilities//genericUtilities.ts";


const TERMINAL_STATUS: string[] = [
    "Your upload is now live!", 
    "Your media upload failed. Try uploading again."
];

const MAX_LOOP_CHECKS: number = 15;
const POLL_INTERVALS = 12000;


interface PostUpload{

    title: string;
    mediaFile?: File;   // only change: allow LinkedIn text posts
    mediaFiles?: File[];

    privacyLevel: string;
    allowComments: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
    isYourOwnBrand: boolean;
    isBrandedContent: boolean;

    scheduleDate?: Date;
    socialMediaAccountsIDs: string[]; 

    platforms: string[];
    linkedinConnectionIds?: string[];
    facebookConnectionIds?: string[];
    instagramConnectionIds?: string[];

    scheduleMode?: "now" | "schedule" | "queue";
    scheduledDate?: string;
}


export function usePostUpload(){

    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");

    async function uploadPost(postDetails: PostUpload){

        setIsUploading(true);
        setUploadStatus("Preparing Upload...");

        try{

            if(postDetails.platforms.includes("linkedin")){

                setUploadStatus("Posting to LinkedIn... It may take a few minutes for the content to appear on your profile");

                if(!postDetails.linkedinConnectionIds || postDetails.linkedinConnectionIds.length === 0){

                    throw new Error("No LinkedIn account selected.");
                }

                for(const connectionId of postDetails.linkedinConnectionIds){

                    await uploadToLinkedIn(
                        postDetails.title,
                        connectionId,
                        postDetails.mediaFile,
                        postDetails.scheduleMode,
                        postDetails.scheduledDate
                    );
                }

                if(postDetails.scheduleMode === "schedule"){

                    setUploadStatus("LinkedIn post scheduled successfully!");
                }
                else{

                    setUploadStatus("LinkedIn post successful!");
                }

                // return;
            }

            if (postDetails.platforms.includes("facebook")) {

                setUploadStatus("Posting to Facebook... It may take a few minutes for the content to appear on your profile");

                if (!postDetails.facebookConnectionIds || postDetails.facebookConnectionIds.length === 0) {
                    throw new Error("No Facebook account selected.");
                }

                for (const connectionId of postDetails.facebookConnectionIds) {

                    await uploadToFacebook(
                        postDetails.title,
                        connectionId,
                        postDetails.mediaFile,
                        postDetails.scheduleMode,
                        postDetails.scheduledDate
                    );

                }

                if (postDetails.scheduleMode === "schedule") {

                    setUploadStatus("Facebook post scheduled successfully!");

                } else {

                    setUploadStatus("Facebook post successful!");

                }

                // return;
            }

            if (postDetails.platforms.includes("instagram")) {

                setUploadStatus("Posting to Instagram... It may take a few minutes for the content to appear on your profile");

                if (!postDetails.instagramConnectionIds || postDetails.instagramConnectionIds.length === 0) {
                    throw new Error("No Instagram account selected.");
                }

                for (const connectionId of postDetails.instagramConnectionIds) {

                    await uploadToInstagram(
                        postDetails.title,
                        connectionId,
                        postDetails.mediaFile!,
                        postDetails.scheduleMode,
                        postDetails.scheduledDate
                    );
                }

                if (postDetails.scheduleMode === "schedule") {
                    setUploadStatus("Instagram post scheduled successfully!");
                } else {
                    setUploadStatus("Instagram post successful!");
                }

            }

            if (!postDetails.platforms.includes("tiktok")) {

                setIsUploading(false);
                return;
            }


        setUploadStatus("Posting to TikTok... It may take a few minutes for the content to appear on your profile");


        // Checks if the given media upload is all photos.
        const isPhotoUpload = !!postDetails.mediaFiles && postDetails.mediaFiles.length > 0 && postDetails.mediaFiles.every((f) => f.type.startsWith("image/"));


        if(isPhotoUpload){

            const photoUploadResults = await uploadPhotos(

                postDetails.mediaFiles!,
                postDetails.title,
                postDetails.title ?? "",
                postDetails.privacyLevel,
                postDetails.allowComments,
                postDetails.isYourOwnBrand,
                postDetails.isBrandedContent,
                postDetails.scheduleDate,
                postDetails.socialMediaAccountsIDs,

            );


            if(photoUploadResults?.success){


                const results: any[] = photoUploadResults.data ?? [];
                const totalAccountsCount  = postDetails.socialMediaAccountsIDs.length;


                // Check if count and data length are equal, meaning every post has been posted and display results
                if(postDetails.scheduleDate)
                    setUploadStatus("Post has been scheduled successfully! Please check the calendar to view the schedule.")            
                else if(results.length == totalAccountsCount)
                    setUploadStatus("Post has been successfully published to all accounts! Please check accounts to check if it has been reflected.");
                else if(results.length > 0)
                    setUploadStatus(`Post has been successfully published to ${results.length} out of ${totalAccountsCount} accounts! Please check accounts to check if it has been reflected.`);
                else
                    setUploadStatus("Error! Post was not able to be published to any accounts! Please try again.");

            }else
                setUploadStatus(photoUploadResults.message ?? `Error! Photo Upload Failed! Please try again.`);  


            return;

        }




    
        // Get initial upload info from initializeUploadPost and store info result
        const initUploadResults = await initializeUploadPost(postDetails.title, postDetails.privacyLevel, postDetails.mediaFile!.size, 
                                                              postDetails.allowComments, postDetails.allowDuet, postDetails.allowStitch,
                                                              postDetails.isYourOwnBrand, postDetails.isBrandedContent, postDetails.scheduleDate, 
                                                              postDetails.socialMediaAccountsIDs);


        if(initUploadResults?.code == "POSTING_CAP_REACHED")  
          return setUploadStatus(initUploadResults.message ?? "Error! You have reached your posting limit. Please try again later.");                                                        
        else if(initUploadResults?.code == "BANNED_FROM_POSTING")  
          return setUploadStatus(initUploadResults.message ?? "Error! Your account is banned from posting. Please use a different account.");  

        if(!initUploadResults?.data || initUploadResults.data.length <= 0)
          throw new Error("Error! No data returned!");            


        // Upload video to the TikTok API given upload url found from initUploadResult
        setUploadStatus("Uploading...")


          // Check if postDetails has a scheduled date, if so don't immediately post them and save them for now
          if(postDetails.scheduleDate){

            // Upload to route the details of the scheduled post
            const scheduleUploadResult = await uploadToTikTok(postDetails.mediaFile!, initUploadResults.data[0].upload_url, true);

            if(scheduleUploadResult.data?.localFilePath){

              // Add all posts to the same local file path
              for(const result of initUploadResults.data)
                await performPostUpdateToFilePath(result.publish_id, scheduleUploadResult.data?.localFilePath);

            }else{ // Show error if no file path was found

              console.error("Error! No local file path found with given upload. Scheduled Posts wont have a file path.");
              setUploadStatus("Error! Scheduled uplaod not saved due to not finding file path. Please try again!");
              return;

            }

            setUploadStatus("Post has been scheduled successfully! Please check the calendar to view the schedule.");

          }
          else{

              // Counter that checks if a post was successful or not
              let successCount = 0;

            for(const result of initUploadResults.data){

              if(!result.upload_url)
                throw new Error("Error! No Upload URL found for post!");

              setUploadStatus(`Uploading to Social Media Account ${initUploadResults.data.indexOf(result) + 1} out of ${initUploadResults.data.length}...`)

              // Inner try-catch to check for individual errors in posts
              try{

                // Upload to TikTok each immediate post
                await uploadToTikTok(postDetails.mediaFile!, result.upload_url, false);

                // Call loopCheckMediaStatus to continously check for final status until it either stops processing or timeout occurs in loop
                await loopCheckMediaStatus({data: result}, result.platformAccountID); 

                successCount++; // Increment counter

              }catch(err){

                setUploadStatus(`Error! Video Uploading Failed of Post to Account ${result.platformAccountID}! Please check if other accounts have succeded.`);

              }

            }

            // Check if count and data length are equal, meaning every post has been posted and display results
            if(successCount == initUploadResults.data.length)
              setUploadStatus("Post has been successfully published to all accounts! Please check accounts to check if it has been reflected.");
            else if(successCount > 0)
              setUploadStatus(`Post has been successfully published to ${successCount} out of ${initUploadResults.data.length} accounts! Please check accounts to check if it has been reflected.`);
            else
              setUploadStatus("Error! Post was not able to be published to any accounts! Please try again.");

          }

        }

        catch(e){

            console.error(e);

            setUploadStatus(
                "Error! Upload Failed! Please check error for more details!"
            );
        }

        finally{

            setIsUploading(false);
        }
    }

    async function loopCheckMediaStatus(initUploadResult: any, platformAccountID?: string): Promise<string>{

        setUploadStatus("Processing...");

        for(let i = 0; i < MAX_LOOP_CHECKS; i++){

            await timer(POLL_INTERVALS);

            const videoStatusFetch = await checkUploadStatus(
                initUploadResult.data.publish_id,
                platformAccountID
            );

            const status = videoStatusFetch.data.status;

            setUploadStatus(status);

            if(TERMINAL_STATUS.includes(status)){
                return status;
            }
        }

        return "Error! Upload is still processing...";
      
    }
    return {
        isUploading,
        uploadStatus,
        uploadPost
    };

}
