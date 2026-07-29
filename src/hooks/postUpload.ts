import {useState} from "react";

import { 
    initializeUploadPost, 
    uploadToTikTok, 
    checkUploadStatus, 
    performPostUpdateToFilePath, 
    uploadToLinkedIn 
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

    privacyLevel: string;
    allowComments: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
    isYourOwnBrand: boolean;
    isBrandedContent: boolean;

    scheduleDate?: Date;

    platforms: string[];
    linkedinConnectionIds?: string[];

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

                setUploadStatus("Posting to LinkedIn...");

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

                return;
            }

            const initUploadResult = await initializeUploadPost(
                postDetails.title,
                postDetails.privacyLevel,
                postDetails.mediaFile!.size,
                postDetails.allowComments,
                postDetails.allowDuet,
                postDetails.allowStitch,
                postDetails.isYourOwnBrand,
                postDetails.isBrandedContent,
                postDetails.scheduleDate
            );

            if(initUploadResult?.code == "POSTING_CAP_REACHED")

                return setUploadStatus(
                    initUploadResult.message ?? 
                    "Error! You have reached your posting limit."
                );

            else if(initUploadResult?.code == "BANNED_FROM_POSTING")

                return setUploadStatus(
                    initUploadResult.message ??
                    "Error! Your account is banned from posting."
                );

            if(!initUploadResult?.data?.upload_url && !postDetails.scheduleDate)

                throw new Error("Error! No upload url found.");

            setUploadStatus("Uploading...");

            const uploadToTikTokResult = await uploadToTikTok(
                postDetails.mediaFile!,
                initUploadResult.data.upload_url,
                !!postDetails.scheduleDate
            );

            if(!!postDetails.scheduleDate && uploadToTikTokResult.data.localFilePath){

                await performPostUpdateToFilePath(
                    initUploadResult.data.publish_id,
                    uploadToTikTokResult.data.localFilePath
                );
                setUploadStatus(
                    "Post has been scheduled successfully!"
                );
                return;
            }
            await loopCheckMediaStatus(initUploadResult);

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

    async function loopCheckMediaStatus(initUploadResult:any): Promise<string>{

        setUploadStatus("Processing...");

        for(let i = 0; i < MAX_LOOP_CHECKS; i++){

            await timer(POLL_INTERVALS);

            const videoStatusFetch = await checkUploadStatus(
                initUploadResult.data.publish_id
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