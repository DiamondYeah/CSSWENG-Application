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
                    publishID: duePost.publishID || duePost._id.toString(),
                    status: "failed"
                });

                continue;
            }

            let mediaFiles: {
                buffer: Buffer;
                contentType: string;
                filename?: string;
            }[] = [];
            
            if (duePost.localFilePaths && duePost.localFilePaths.length > 0) {

                for (const filePath of duePost.localFilePaths) {
                    
                    const buffer = fs.readFileSync(filePath);

                    const ext = filePath.split(".").pop()?.toLowerCase();

                    let contentType = "image/jpeg";

                    if (ext === "png")
                        contentType = "image/png";
                    else if (ext === "gif")
                        contentType = "image/gif";
                    else if (ext === "mp4")
                        contentType = "video/mp4";
                    else if (ext === "mov")
                        contentType = "video/quicktime";

                    mediaFiles.push({
                        buffer,
                        contentType,
                        filename: path.basename(filePath)
                    });
                }   
            }

            const publishID = await publishFacebookPost(
                facebookAccount.platformAccountID,
                facebookAccount.accessToken,
                duePost.title ?? "",
                mediaFiles.length === 1
                    ? mediaFiles[0]
                    : undefined,
                mediaFiles.length > 1
                    ? mediaFiles
                    : undefined
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

            console.error("Facebook scheduled post error:", err);
            await updatePostStatus({ publishID: duePost.publishID || duePost._id.toString(), status: "failed"});

        }
    }
}