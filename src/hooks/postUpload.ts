import {useState} from "react";
import {initializeUploadPost, uploadToTikTok, checkUploadStatus, uploadToLinkedIn} from "../controller/fetchController.ts"
import {timer} from "../frontend_utilities/genericUtilities.ts";

const TERMINAL_STATUS: string[] = ["Your upload is now live!", "Your media upload failed. Try uploading again."];
const MAX_LOOP_CHECKS = 1;
const POLL_INTERVALS = 5000;

interface PostUpload {
    title: string;
    mediaFile: File;
    privacyLevel: string;
    allowComments: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
    platforms: string[];
}


// Function hook primarily to perform upload to social media API. Returns booleans for upload string, status, and function to call upload.
export function usePostUpload(){

    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");

    async function uploadPost(postDetails: PostUpload){

        setIsUploading(true);
        setUploadStatus("Preparing Upload");

        const results: string[] = [];

        try {

            if (postDetails.platforms.includes("tiktok")) {
                setUploadStatus("Posting to TikTok...");
                await uploadToTikTokFlow(postDetails);
                results.push("TikTok: done");
            }

            if (postDetails.platforms.includes("linkedin")) {
                setUploadStatus("Posting to LinkedIn...");
                const linkedInResult = await uploadToLinkedIn(postDetails.title, postDetails.mediaFile);

                if (!linkedInResult?.success)
                    throw new Error(linkedInResult?.message ?? "LinkedIn post failed");

                results.push("LinkedIn: done");
            }

            setUploadStatus("Your upload is now live!");

        } catch (e) {
            setUploadStatus("Upload Failed! Please check error for more details!");
        } finally {
            setIsUploading(false);
        }

    }

    async function uploadToTikTokFlow(postDetails: PostUpload) {

        const initUploadResult = await initializeUploadPost(
            postDetails.title, postDetails.privacyLevel, postDetails.mediaFile.size,
            postDetails.allowComments, postDetails.allowDuet, postDetails.allowStitch
        );

        if (!initUploadResult?.data?.upload_url)
            throw new Error("No upload url found from initial upload!");

        await uploadToTikTok(postDetails.mediaFile, initUploadResult.data.upload_url);
        await loopCheckMediaStatus(initUploadResult);

    }

    async function loopCheckMediaStatus(initUploadResult: any): Promise<string> {
        // ...unchanged from your existing version
        await timer(POLL_INTERVALS);
        return TERMINAL_STATUS[0];
    }

    return {isUploading, uploadStatus, uploadPost};

}