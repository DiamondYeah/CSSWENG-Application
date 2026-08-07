import fs from "fs";
import path from "path";

import { 
    findAwaitingSchedulePosts,
    updatePostStatus,
    updateLinkedInPostPublished
} from "../dbcontrollers/postRepository.ts";

import { 
    findSpecificSocialMediaAccount 
} from "../dbcontrollers/socialMediaAccountRepository.ts";

import { 
    createLinkedInPost,
    publishLinkedInMedia
} from "./linkedinPostService.ts";


export async function processLinkedInScheduledPosts(){

    const duePosts = await findAwaitingSchedulePosts();

    for(const duePost of duePosts){

        if(duePost.platform !== "linkedin")
            continue;

        try{

            console.log("Processing LinkedIn scheduled post:", duePost._id);

            const linkedinAccount = await findSpecificSocialMediaAccount(
                String(duePost.userID),
                "linkedin",
                duePost.platformAccountID
            );

            if(!linkedinAccount){

                console.error("LinkedIn account not found.");
                await updatePostStatus({
                    publishID: duePost.publishID || duePost._id.toString(),
                    status: "failed"
                });

                continue;
            }

            const personURN = `urn:li:person:${linkedinAccount.platformAccountID}`;
            const accessToken = linkedinAccount.accessToken;

            let postURN;

            if(duePost.localFilePaths && duePost.localFilePaths.length > 0) {

                const mediaFiles = duePost.localFilePaths.map((filePath) => {
                    
                    const buffer = fs.readFileSync(filePath);

                    let mimetype = "image/jpeg";

                    if(duePost.postType === "video"){
                        mimetype = "video/mp4";
                    }
                    else if(duePost.postType === "document"){
                        mimetype = "application/pdf";
                    }

                    return {
                        buffer,
                        mimetype
                    };

                });

                let mimeType = "image/jpeg";

                if(duePost.postType === "video"){
                    mimeType = "video/mp4";
                }
                else if(duePost.postType === "document"){
                    mimeType = "application/pdf";
                }
                
                postURN = await publishLinkedInMedia(
                    accessToken,
                    personURN,
                    duePost.title ?? "",
                    mediaFiles
                );
            }
            else if(duePost.localFilePath) {

                const buffer = fs.readFileSync(duePost.localFilePath);

                let mimetype = "image/jpeg";

                if(duePost.postType === "video"){
                    mimetype = "video/mp4";
                }
                else if(duePost.postType === "document"){
                    mimetype = "application/pdf";
                }

                postURN = await publishLinkedInMedia(
                    accessToken,
                    personURN,
                    duePost.title ?? "",
                    [
                        {
                            buffer,
                            mimetype
                        }
                    ]
                );
            }
            else {

                postURN = await createLinkedInPost(
                    accessToken,
                    personURN,
                    duePost.title ?? ""
                );

            }

            console.log("LinkedIn scheduled post published:", postURN);

            await updateLinkedInPostPublished(
                String(duePost._id),
                postURN
            );

            
        }
        catch(err){

            console.error("LinkedIn scheduled post error:", err);
            await updatePostStatus({ publishID: duePost.publishID || duePost._id.toString(), status: "failed"});

        }
    }
}