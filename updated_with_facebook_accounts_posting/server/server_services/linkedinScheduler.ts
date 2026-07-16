import Post from "../models/post.ts";
import { getFileFromGridFS } from "./gridfsService.ts";
import { ObjectId } from "mongodb";
import { findOwnedSocialConnection } from "../dbcontrollers/userRepository.ts";
import { publishLinkedInMedia } from "./linkedinPostService.ts";


export async function checkScheduledLinkedInPosts() {

    console.log("Checking scheduled LinkedIn posts...");

    const posts = await Post.find({
        platform: "linkedin",
        status: "pending",
        scheduledDate: {
            $lte: new Date()
        }
    });

    console.log("Posts ready to publish:", posts.length)

    for (const post of posts) {
        
        console.log("Processing:", post._id);

        await Post.findByIdAndUpdate(post._id, { status: "processing" });
        
        if (!post.gridfsFileId) {
            
            console.log("No media found for post:", post._id);

            await Post.findByIdAndUpdate(post._id, { status: "failed" });

            continue;
        }

        const media = await getFileFromGridFS(
            post.gridfsFileId as ObjectId
        );
        
        console.log("Retrieved media:", media.buffer.length, "bytes");
        console.log("Content Type:", media.contentType);

        if (!post.connectionId) {
            
            console.log("No LinkedIn connection");
            continue;
        }

        const connection = await findOwnedSocialConnection(post.userID.toString(), post.connectionId.toString());
        
        if (!connection) {
            console.log("LinkedIn connection not found:", post.connectionId);

            await Post.findByIdAndUpdate(post._id, { status: "failed" });

            continue;
        }

        const personURN = `urn:li:person:${connection.platformOpenID}`;

        const postURN = await publishLinkedInMedia(
            connection.accessToken,
            personURN,
            post.title ?? "",
            media.buffer,
            media.contentType
        );

        console.log("Published LinkedIn Post:", postURN);

        await Post.findByIdAndUpdate(post._id, { status: "published", publishID: postURN });
    }

}