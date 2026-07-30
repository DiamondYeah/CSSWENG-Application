import fs from "fs";
import path from "path";

import { 
    findAwaitingSchedulePosts,
    updateFacebookPostPublished,
    updatePostStatus,
} from "../dbcontrollers/postRepository.ts";

import { 
    findSpecificSocialMediaAccount 
} from "../dbcontrollers/socialMediaAccountRepository.ts";

import {
    publishFacebookPost
} from "./facebookPostService.ts";


export async function processFacebookScheduledPosts() {

    const duePosts = await findAwaitingSchedulePosts();

    for (const post of duePosts) {
        console.log(
            "Platform:", post.platform,
            "| Status:", post.status,
            "| Scheduled:", post.scheduledDate
        );
    }


    for (const duePost of duePosts) {

        if (duePost.platform !== "facebook")
            continue;

        try {

            console.log(
                "Processing Facebook scheduled post:",
                duePost._id
            );

            const facebookAccount =
                await findSpecificSocialMediaAccount(
                    String(duePost.userID),
                    "facebook",
                    duePost.platformAccountID
                );

            if (!facebookAccount) {

                console.error("Facebook account not found.");

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

            const publishID = await publishFacebookPost(
                facebookAccount.platformAccountID,
                facebookAccount.accessToken,
                duePost.title ?? "",
                media
            );

            console.log(
                "Facebook scheduled post published:",
                publishID
            );

            await updateFacebookPostPublished(
                String(duePost._id),
                publishID
            );

        } catch (err) {

            console.error(
                "Facebook scheduled post error:",
                err
            );
        }
    }
}