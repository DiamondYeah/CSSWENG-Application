import { ObjectId } from "mongodb";
import Post, { type IPost } from "../models/post.ts";
import { findOwnedSocialConnection } from "../dbcontrollers/userRepository.ts";
import { getFileFromGridFS } from "./gridfsService.ts";
import { publishFacebookPost } from "./facebookPostService.ts";
import { publishInstagramMedia } from "./instagramPostService.ts";

function safeError(error: unknown): string {
    if (error instanceof Error) return error.message.slice(0, 500);
    return "Unexpected error while publishing the scheduled post.";
}

async function claimNextMetaPost(): Promise<IPost | null> {
    return await Post.findOneAndUpdate(
        {
            platform: { $in: ["facebook", "instagram"] },
            status: "pending",
            scheduledDate: { $lte: new Date() },
        },
        { $set: { status: "processing" } },
        { sort: { scheduledDate: 1 }, returnDocument: "after" }
    );
}

export async function checkScheduledMetaPosts(): Promise<void> {
    let post = await claimNextMetaPost();

    while (post) {
        try {
            if (!post.connectionId) throw new Error("No social connection is associated with this post.");

            const connection = await findOwnedSocialConnection(
                post.userID.toString(),
                post.connectionId.toString()
            );
            if (!connection || connection.platform !== post.platform) {
                throw new Error(`${post.platform} connection was not found for this user.`);
            }

            const media = post.gridfsFileId
                ? await getFileFromGridFS(post.gridfsFileId as ObjectId)
                : undefined;

            let publishID: string;
            if (post.platform === "facebook") {
                publishID = await publishFacebookPost(
                    connection.platformOpenID,
                    connection.accessToken,
                    post.title ?? "",
                    media
                );
            } else {
                if (!media) throw new Error("Instagram scheduled post media is missing.");
                publishID = await publishInstagramMedia(
                    connection.platformOpenID,
                    connection.accessToken,
                    post.title ?? "",
                    media
                );
            }

            await Post.findOneAndUpdate(
                { _id: post._id, status: "processing" },
                { $set: { status: "published", publishID, rawResponse: undefined } }
            );
        } catch (error) {
            console.error(`Scheduled ${post.platform} post ${post._id} failed:`, safeError(error));
            await Post.findOneAndUpdate(
                { _id: post._id, status: "processing" },
                { $set: { status: "failed", rawResponse: { message: safeError(error) } } }
            );
        }

        post = await claimNextMetaPost();
    }
}