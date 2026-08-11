import fs from "fs";
import path from "path";
import axios from "axios";
import SocialMediaAccount from "../models/socialMediaAccount.ts";

import { updateInstagramPostPublished, updatePostStatus, findAwaitingSchedulePosts } from "../dbcontrollers/postRepository.ts";

import { publishInstagramMedia, publishInstagramCarousel, addInstagramFirstComment } from "./instagramPostService.ts";

import {  findSpecificSocialMediaAccount } from "../dbcontrollers/socialMediaAccountRepository.ts";


export async function processInstagramScheduledPosts() {

    const duePosts = await findAwaitingSchedulePosts();


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
                    publishID: duePost.publishID || duePost._id.toString(),
                    status: "failed"
                });

                continue;
            }

            console.log("Scheduled Instagram account ID:", instagramAccount.platformAccountID);
            console.log("Scheduled post account ID:", duePost.platformAccountID);
            console.log("Scheduled Instagram token length:", instagramAccount.accessToken?.length);
            console.log(
                "Scheduled Instagram token ending:",
                instagramAccount.accessToken?.slice(-6)
            );

            try {
                const tokenTest = await axios.get(
                    `https://graph.instagram.com/${instagramAccount.platformAccountID}`,
                    {
                        params: {
                            fields: "id,username",
                            access_token: instagramAccount.accessToken
                        }
                    }
                );

                console.log("Scheduled Instagram token TEST:", tokenTest.data);
            } catch (error: any) {
                console.error(
                    "Scheduled Instagram token TEST ERROR:",
                    error.response?.data || error.message
                );
            }

            let mediaFiles: {
                buffer: Buffer;
                contentType: string;
                filename?: string;
            }[] = [];
            
            if (duePost.localFilePaths && duePost.localFilePaths.length > 0) {

                for (const filePath of duePost.localFilePaths) {

                    const buffer = fs.readFileSync(filePath);

                    const ext = path.extname(filePath).toLowerCase();

                    let contentType = "image/jpeg";

                    if (ext === ".png")
                        contentType = "image/png";
                    else if (ext === ".gif")
                        contentType = "image/gif";
                    else if (ext === ".mp4")
                        contentType = "video/mp4";
                    else if (ext === ".mov")
                        contentType = "video/quicktime";

                    mediaFiles.push({
                        buffer,
                        contentType,
                        filename: path.basename(filePath)
                    });
                }
            }
            else if  (duePost.localFilePath) {
                
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

                mediaFiles.push({
                    buffer,
                    contentType,
                    filename: path.basename(duePost.localFilePath)
                });
            }

            let publishID: string;

            if (mediaFiles.length > 1) {

                publishID = await publishInstagramCarousel(
                    instagramAccount.platformAccountID,
                    instagramAccount.accessToken,
                    duePost.caption ?? "",
                    mediaFiles,
                    duePost.instagramCollaborator,
                    true
                );
            } 
            else {

                publishID = await publishInstagramMedia(
                    instagramAccount.platformAccountID,
                    instagramAccount.accessToken,
                    duePost.title ?? "",
                    mediaFiles[0],
                    duePost.instagramCollaborator
                );
            }

            console.log("Instagram scheduled post published:", publishID);

            if (duePost.firstComment && duePost.firstComment.trim()) {

                await new Promise(resolve => setTimeout(resolve, 5000));

                await addInstagramFirstComment(
                    publishID,
                    instagramAccount.accessToken,
                    duePost.firstComment
                );

                console.log("Instagram scheduled first comment posted.");
            }

            await updateInstagramPostPublished(String(duePost._id), publishID);


            // Get files that will be removed from system
            const filesToRemove = duePost.localFilePaths?.length
                ? duePost.localFilePaths : duePost.localFilePath ? [duePost.localFilePath] : [];


            // Remove link
            filesToRemove.forEach((p : string) => {

                fs.unlink(p, (err) => {

                    if(err)
                        console.error(`Error in deleting instagram post ${duePost._id} from fileSystem: `, err);

                });

            });

        } catch (err) {

            console.error("Instagram scheduled post error:", err);
            await updatePostStatus({ publishID: duePost.publishID || duePost._id.toString(), status: "failed"});

        }
    }
}