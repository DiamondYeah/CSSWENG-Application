import {useState} from "react";

// Import functions from controller and utilities
import {initializeUploadPost, uploadToTikTok, checkUploadStatus, performPostUpdateToFilePath} from "../controller/fetchController.ts" 
import {timer} from "../frontend_utilities//genericUtilities.ts";

// Constants for Status Checking
const TERMINAL_STATUS: string[] = ["Your upload is now live!", "Your media upload failed. Try uploading again."];
const MAX_LOOP_CHECKS: number = 15; // How many loops before status checking stops (1 to not poll)
const POLL_INTERVALS = 12000; // 1000 = 1 second

// Interface for Post Upload
interface PostUpload{

    title: string;
    mediaFile: File;
    privacyLevel: string;
    allowComments: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
    isYourOwnBrand: boolean,
    isBrandedContent: boolean,
    scheduleDate?: Date;
    socialMediaAccountsIDs: string[];

}


// Function hook primarily to perform upload to social media API. Returns booleans for upload string, status, and function to call upload.
export function usePostUpload(){

    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");


    async function uploadPost(postDetails: PostUpload){


        setIsUploading(true);
        setUploadStatus("Preparing Upload - it may take a few minutes for the content to appear on your profile");


        try{
    
          // Get initial upload info from initializeUploadPost and store info result
          const initUploadResults = await initializeUploadPost(postDetails.title, postDetails.privacyLevel, postDetails.mediaFile.size, 
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
              const scheduleUploadResult = await uploadToTikTok(postDetails.mediaFile, initUploadResults.data[0].upload_url, true);

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
                  await uploadToTikTok(postDetails.mediaFile, result.upload_url, false);

                  // Call loopCheckMediaStatus to continously check for final status until it either stops processing or timeout occurs in loop
                  await loopCheckMediaStatus({data: result}, result.platformAccountID); 

                  successCount++; // Increment counter

                }catch(err){

                  setUploadStatus(`Error! Uploading Failed of Post to Account ${result.platformAccountID}! Please check if other accounts have succeded.`);

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
    
          setUploadStatus("Error! Upload Failed! Please check error for more details!")
    
        }
        finally{
    
          setIsUploading(false);
          
        }

    }


    // Function continously checks upload status until either it reaches the max loop limit, or upload was complete
    async function loopCheckMediaStatus(initUploadResult: any, platformAccountID?: string): Promise<string>{

        // Initial sstatus
        setUploadStatus("Processing...")


        // Loop through checks until status returns one from the terminal array or timed out.
        for(let i = 0; i < MAX_LOOP_CHECKS; i++){

          // Wait between each check
          await timer(POLL_INTERVALS);

          // fetch videoStatus result and obtain the status result
          const videoStatusFetch = await checkUploadStatus(initUploadResult.data.publish_id, platformAccountID);
          const status = videoStatusFetch.data.status;
          setUploadStatus(status);


          // If status rettained is includes in the terminalStatus array, then set the upload status and stop.
          if(TERMINAL_STATUS.includes(status)){

              setUploadStatus(status);
              return status;

          }

        }

        // If loop stops after reaching maxLoopChecks, then video is still processing
        const timeoutMessage = "Error! Upload is still processing... Please check TikTok for the result.";
        setUploadStatus(timeoutMessage)
        return timeoutMessage;


    }

    return{isUploading, uploadStatus, uploadPost};

}
