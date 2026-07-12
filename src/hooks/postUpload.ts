import {useState} from "react";

// Import functions from controller and utilities
import {initializeUploadPost, uploadToTikTok, checkUploadStatus} from "../controller/fetchController.ts" 
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

}


// Function hook primarily to perform upload to social media API. Returns booleans for upload string, status, and function to call upload.
export function usePostUpload(){

    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");


    async function uploadPost(postDetails: PostUpload){

        setIsUploading(true);
        setUploadStatus("Preparing Upload - it may take a few minutes for the content to appear on your profile")


        try{
    
          // Get initial upload info from initializeUploadPost and store info result
          const initUploadResult = await initializeUploadPost(postDetails.title, postDetails.privacyLevel, postDetails.mediaFile.size, 
                                                                postDetails.allowComments, postDetails.allowDuet, postDetails.allowStitch,
                                                                postDetails.isYourOwnBrand, postDetails.isBrandedContent, postDetails.scheduleDate);

          if(initUploadResult?.code == "POSTING_CAP_REACHED")  
            return setUploadStatus(initUploadResult.message ?? "You have reached your posting limit. Please try again later.");                                                        
          else if(initUploadResult?.code == "BANNED_FROM_POSTING")  
            return setUploadStatus(initUploadResult.message ?? "Your account is banned from posting. Please use a different account.");  


          if(!initUploadResult?.data?.upload_url)
            throw new Error("No upload url found from initial upload!");
    
    
          // Upload video to the TikTok API given upload url found from initUploadResult
          setUploadStatus("Uploading...")
          await uploadToTikTok(postDetails.mediaFile, initUploadResult.data.upload_url);
    
          // Call loopCheckMediaStatus to continously check for final status until it either stops processing or timeout occurs in loop
          await loopCheckMediaStatus(initUploadResult);
    
    
        }
        catch(e){
    
          setUploadStatus("Upload Failed! Please check error for more details!")
    
        }
        finally{
    
          setIsUploading(false);
          
        }



    }


    // Function continously checks upload status until either it reaches the max loop limit, or upload was complete
    async function loopCheckMediaStatus(initUploadResult: any): Promise<string>{

        // Initial sstatus
        setUploadStatus("Processing...")


        // Loop through checks until status returns one from the terminal array or timed out.
        for(let i = 0; i < MAX_LOOP_CHECKS; i++){

        // Wait between each check
        await timer(POLL_INTERVALS);

        // fetch videoStatus result and obtain the status result
        const videoStatusFetch = await checkUploadStatus(initUploadResult.data.publish_id);
        const status = videoStatusFetch.data.status;
        setUploadStatus(status);


        // If status rettained is includes in the terminalStatus array, then set the upload status and stop.
        if(TERMINAL_STATUS.includes(status)){

            setUploadStatus(status);
            return status;

        }

        }

        // If loop stops after reaching maxLoopChecks, then video is still processing
        const timeoutMessage = "Upload is still processing... Please check TikTok for the result.";
        setUploadStatus(timeoutMessage)
        return timeoutMessage;


    }

    return{isUploading, uploadStatus, uploadPost};

}