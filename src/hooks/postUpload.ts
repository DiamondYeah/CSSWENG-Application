import {useState} from "react";

// Import functions from controller and utilities
import {initializeUploadPost, uploadToTikTok, checkUploadStatus} from "../controller/fetchController.ts" 
import {timer} from "../frontend_utilities//genericUtilities.ts";

// Constants for Status Checking
const TERMINAL_STATUS: string[] = ["Your upload is now live!", "Your media upload failed. Try uploading again."];
const MAX_LOOP_CHECKS = 1; // How many loops before status checking stops (1 to not poll)
const POLL_INTERVALS = 5000; // 1000 = 1 second

// Interface for Post Upload
interface PostUpload{

    title: string;
    mediaFile: File;
    privacyLevel: string;
    allowComments: boolean;
    allowDuet: boolean;
    allowStitch: boolean;

}


// Function hook primarily to perform upload to social media API. Returns booleans for upload string, status, and function to call upload.
export function usePostUpload(){

    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");


    async function uploadPost(postDetails: PostUpload){

        setIsUploading(true);
        setUploadStatus("Preparing Upload")


        try{
    
          // Get initial upload info from initializeUploadPost and store info result
          const initUploadResult = await initializeUploadPost(postDetails.title, postDetails.privacyLevel, postDetails.mediaFile.size, 
                                                                postDetails.allowComments, postDetails.allowDuet, postDetails.allowStitch);
    
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

        // If max loop checks is 1, dont loop and just return successful message
        if(MAX_LOOP_CHECKS == 1){

            await timer(POLL_INTERVALS);
            const successfulMessage = TERMINAL_STATUS[0];
            setUploadStatus(successfulMessage)
            return successfulMessage;

        }
        

        // Loop through checks until status returns one from the terminal array or timed out.
        for(let i = 0; i < MAX_LOOP_CHECKS; i++){

        // Wait between each check
        await timer(POLL_INTERVALS);

        // fetch videoStatus result and obtain the status result
        const videoStatusFetch = await checkUploadStatus(initUploadResult.data.publish_id);
        console.log("Raw status response:", videoStatusFetch); // add this
        const status = videoStatusFetch.data.status;
        console.log("Status value:", status, "| Type:", typeof status);
        setUploadStatus(`Processing... (${status})`);


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