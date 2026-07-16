import {useState} from "react";
import {initializeUploadPost, uploadToTikTok, checkUploadStatus, uploadToLinkedIn, uploadToFacebook, uploadToInstagram} from "../controller/fetchController.ts"
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

                if (!postDetails.linkedinConnectionIds || postDetails.linkedinConnectionIds.length === 0)
                    throw new Error("No LinkedIn account selected for this post.");

                let linkedInSuccessCount = 0;
                const linkedInFailures: string[] = [];

                for (const connectionId of postDetails.linkedinConnectionIds) {
                    try {
                        const linkedInResult = await uploadToLinkedIn(
                            postDetails.title,
                            connectionId,
                            postDetails.mediaFile,
                            postDetails.scheduleMode,
                            postDetails.scheduledDate
                        );

                        if (linkedInResult?.success) {
                            linkedInSuccessCount++;
                        } else {
                            linkedInFailures.push(linkedInResult?.message ?? `Account ${connectionId} failed`);
                        }
                    } catch (e: any) {
                        linkedInFailures.push(e?.message ?? `Account ${connectionId} failed`);
                    }
                }

                const linkedInTotal = postDetails.linkedinConnectionIds.length;

                if (linkedInFailures.length === 0) {

                    if (postDetails.scheduleMode == "schedule") {
                        results.push(`LinkedIn: scheduled for all ${linkedInTotal} account(s)`);
                    } else {
                        results.push(`LinkedIn: posted to all ${linkedInTotal} account(s)`);
                    }
                } else if (linkedInSuccessCount > 0) {
                    results.push(
                        `LinkedIn: ${linkedInSuccessCount} succeeded, ${linkedInFailures.length} failed (${linkedInFailures.join("; ")})`
                    );
                } else {
                    throw new Error(`LinkedIn: all ${linkedInTotal} post(s) failed (${linkedInFailures.join("; ")})`);
                }
            }

            if (postDetails.platforms.includes("facebook")) {
                setUploadStatus("Posting to Facebook...");

                if (!postDetails.facebookConnectionIds || postDetails.facebookConnectionIds.length === 0)
                    throw new Error("No Facebook Page selected for this post.");

                let facebookSuccessCount = 0;
                const facebookFailures: string[] = [];

                for (const connectionId of postDetails.facebookConnectionIds) {
                    try {
                        const facebookResult = await uploadToFacebook(
                            postDetails.title,
                            connectionId,
                            postDetails.mediaFile
                        );

                        if (facebookResult?.success) {
                            facebookSuccessCount++;
                        } else {
                            facebookFailures.push(facebookResult?.message ?? `Page ${connectionId} failed`);
                        }
                    } catch (e: any) {
                        facebookFailures.push(e?.message ?? `Page ${connectionId} failed`);
                    }
                }

                const facebookTotal = postDetails.facebookConnectionIds.length;

                if (facebookFailures.length === 0) {
                    results.push(`Facebook: posted to all ${facebookTotal} Page(s)`);
                } else if (facebookSuccessCount > 0) {
                    results.push(
                        `Facebook: ${facebookSuccessCount} succeeded, ${facebookFailures.length} failed (${facebookFailures.join("; ")})`
                    );
                } else {
                    throw new Error(`Facebook: all ${facebookTotal} post(s) failed (${facebookFailures.join("; ")})`);
                }
            }

            if (postDetails.platforms.includes("instagram")) {
                setUploadStatus("Posting to Instagram...");

                if (!postDetails.instagramConnectionIds || postDetails.instagramConnectionIds.length === 0)
                    throw new Error("No Instagram account selected for this post.");

                if (!postDetails.mediaFile)
                    throw new Error("Instagram requires an image or video for every post.");

                let instagramSuccessCount = 0;
                const instagramFailures: string[] = [];

                for (const connectionId of postDetails.instagramConnectionIds) {
                    try {
                        const instagramResult = await uploadToInstagram(
                            postDetails.title,
                            connectionId,
                            postDetails.mediaFile
                        );

                        if (instagramResult?.success) {
                            instagramSuccessCount++;
                        } else {
                            instagramFailures.push(instagramResult?.message ?? `Account ${connectionId} failed`);
                        }
                    } catch (e: any) {
                        instagramFailures.push(e?.message ?? `Account ${connectionId} failed`);
                    }
                }

                const instagramTotal = postDetails.instagramConnectionIds.length;

                if (instagramFailures.length === 0) {
                    results.push(`Instagram: posted to all ${instagramTotal} account(s)`);
                } else if (instagramSuccessCount > 0) {
                    results.push(
                        `Instagram: ${instagramSuccessCount} succeeded, ${instagramFailures.length} failed (${instagramFailures.join("; ")})`
                    );
                } else {
                    throw new Error(`Instagram: all ${instagramTotal} post(s) failed (${instagramFailures.join("; ")})`);
                }
            }

            const finalStatus = results.length > 0
                ? results.join(" | ")
                : "Your upload is now live!";
            setUploadStatus(finalStatus);

        } catch (e: any) {
            console.error("Upload error:", e);
            setUploadStatus(e?.message || "Upload Failed! Please check error for more details!");
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
        await timer(POLL_INTERVALS);
        return TERMINAL_STATUS[0];
    }

    return {isUploading, uploadStatus, uploadPost};
}