import fs from "fs";
import path from "path";

import SocialMediaAccount from "../models/socialMediaAccount.ts";

import { updateInstagramPostPublished, updatePostStatus, findAwaitingSchedulePosts } from "../dbcontrollers/postRepository.ts";

import { publishInstagramMedia } from "./instagramPostService.ts";

import {  findSpecificSocialMediaAccount } from "../dbcontrollers/socialMediaAccountRepository.ts";


export async function processInstagramScheduledPosts() {

    const duePosts = await findAwaitingSchedulePosts();

    for (const post of duePosts) {
        console.log(
            "Platform:", post.platform,
            "| Status:", post.status,
            "| Scheduled:", post.scheduledDate
        );
    }


    for (const duePost of duePosts) {

        if (duePost.platform !== "instagram")
            continue;

        try {

            console.log(
                "Processing Instagram scheduled post:",
                duePost._id
            );

            const instagramAccount =
                await findSpecificSocialMediaAccount(
                    String(duePost.userID),
                    "instagram",
                    duePost.platformAccountID
                );

            if (!instagramAccount) {

                console.error("Instagram account not found.");

                await updatePostStatus({
                    publishID: duePost.publishID,
                    status: "failed"
                });

                continue;
            }

            let media:
                | {
                    buffer: Buffer;
                    contentType: string;
                    filename?: string;
                  }
                | undefined;
            
            if (duePost.localFilePath) {

                const buffer = fs.readFileSync(duePost.localFilePath);

                const ext = duePost.localFilePath.split(".").pop()?.toLowerCase();

                let contentType = "image/jpeg";

                if (ext === "png")
                    contentType = "image/png";
                else if (ext === "gif")
                    contentType = "image/gif";
                else if (ext === "mp4")
                    contentType = "video/mp4";
                else if (ext === "mov")
                    contentType = "video/quicktime";

                media = {
                    buffer,
                    contentType,
                    filename: path.basename(duePost.localFilePath)
                };
            }

            const publishID = await publishInstagramMedia(
                instagramAccount.platformAccountID,
                instagramAccount.accessToken, 
                duePost.title ?? "", 
                media!
            );

            console.log("Instagram scheduled post published:", publishID);

            await updateInstagramPostPublished(String(duePost._id), publishID);

        } catch (err) {

            console.error("Instagram scheduled post error:", err);
        }
    }
}