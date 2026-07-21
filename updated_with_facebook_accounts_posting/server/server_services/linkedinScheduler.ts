import Post from "../models/post.ts";
import { getFileFromGridFS } from "./gridfsService.ts";
import { ObjectId } from "mongodb";
import { findOwnedSocialConnection } from "../dbcontrollers/userRepository.ts";
import { publishLinkedInMedia } from "./linkedinPostService.ts";


export async function checkScheduledLinkedInPosts() {
    let post = await Post.findOneAndUpdate({
        platform: "linkedin",
        status: "pending",
        scheduledDate: { $lte: new Date() }
    }, { $set: { status: "processing" } }, { sort: { scheduledDate: 1 }, returnDocument: "after" });

    while (post) {
      try {
        if (!post.gridfsFileId) {
            throw new Error("No media found for scheduled LinkedIn post.");
        }

        const media = await getFileFromGridFS(
            post.gridfsFileId as ObjectId
        );
        
        console.log("Retrieved media:", media.buffer.length, "bytes");
        console.log("Content Type:", media.contentType);

        if (!post.connectionId) {
            throw new Error("No LinkedIn connection is associated with this post.");
        }

        const connection = await findOwnedSocialConnection(post.userID.toString(), post.connectionId.toString());
        
        if (!connection || connection.platform !== "linkedin") {
            throw new Error("LinkedIn connection not found for this user.");
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

        await Post.findOneAndUpdate(
            { _id: post._id, status: "processing" },
            { $set: { status: "published", publishID: postURN } }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 500) : "Unexpected scheduler error.";
        console.error(`Scheduled LinkedIn post ${post._id} failed:`, message);
        await Post.findOneAndUpdate(
            { _id: post._id, status: "processing" },
            { $set: { status: "failed", rawResponse: { message } } }
        );
      }

      post = await Post.findOneAndUpdate({
          platform: "linkedin",
          status: "pending",
          scheduledDate: { $lte: new Date() }
      }, { $set: { status: "processing" } }, { sort: { scheduledDate: 1 }, returnDocument: "after" });
    }
}