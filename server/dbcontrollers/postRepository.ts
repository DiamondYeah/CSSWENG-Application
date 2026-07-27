// Import User and interface
import Post, { type IPost, type Platform, type PostMediaType, type PostMediaStatus, type IComment, type PublishMediaStatus } from "../models/post.ts"; 
import mongoose, { Types } from "mongoose";

// Import types
import {type PostApprovalStatus} from "../types/post.ts";

// Interface for PostInput
interface PostInput{

    userID: Types.ObjectId;
    platformAccountID: string;
    platform: Platform;
    postType: PostMediaType;
    publishID: string;
    status: PostMediaStatus;
    scheduledDate?: Date;
    title?: string;
    description?: string;

    publishMediaStatus: PublishMediaStatus 
    localFilePath?: string 

    // TikTok specific settings
    privacyLevel?: string
    allowComments?: boolean
    allowDuet?: boolean
    allowStitch?: boolean
    isYourOwnBrand?: boolean
    isBrandedContent?: boolean

};


// Interface for PostStatusUpdate
interface PostStatusUpdate{

    publishID: string;
    status: IPost["status"],
    rawResponse?: Record<string, unknown>

}

// Interface for PostScheduleUpdate
interface PostScheduleUpdate{

    publishID: string,
    scheduleDate: Date,
    rawResponse?: Record<string, unknown>;

}


// Interface for Post Comments
interface PostComments{

    postID: string,
    username?: string,
    text: string,

}


// Interface for Post Approval Rejection
interface PostApproval{

    postID: string,
    approvalStatus: PostApprovalStatus,
    reason?: string,

}


// Function creates a new user document if open id has not yet existed. Else, updates current one
// Returns created post document
export async function createUserPost(postDetails: PostInput): Promise<IPost>{

    return await Post.create({
        
        userID: postDetails.userID,
        platformAccountID: postDetails.platformAccountID,
        platform: postDetails.platform,
        postType: postDetails.postType,
        publishID: postDetails.publishID,
        status: postDetails.status ?? "pending",
        scheduledDate: postDetails.scheduledDate,
        title: postDetails.title ?? "",
        description: postDetails.description ?? "",

        publishMediaStatus: postDetails.publishMediaStatus ?? "published_to_platform",
        localFilePath: postDetails.localFilePath,

        privacyLevel: postDetails.privacyLevel ?? "SELF_ONLY",
        allowComments: postDetails.allowComments ?? true,
        allowDuet: postDetails.allowDuet ?? false,
        allowStitch: postDetails.allowStitch ?? false,
        isYourOwnBrand: postDetails.isYourOwnBrand ?? false,
        isBrandedContent: postDetails.isBrandedContent ?? false,
        
    });

}


// Function updates the status of the post via the publishID sent to the parameter. Also updates the rawResponse
// Returns modified document
export async function updatePostStatus(postUpdateDetails: PostStatusUpdate): Promise<IPost | null>{
// Create new document if ID not found
    return await Post.findOneAndUpdate(

        {publishID: postUpdateDetails.publishID},  // Identifier
        {status: postUpdateDetails.status, rawResponse: postUpdateDetails.rawResponse}, // Update with new values
        {returnDocument: "after"} // Return modified document
    
    );
}


// Function updates the date of the post via the publishID sent to the parameter. Also updates the rawResponse
// Returns modified document
export async function updatePostSchedule(postUpdateDetails: PostScheduleUpdate): Promise<IPost | null>{
// Create new document if ID not found
    return await Post.findOneAndUpdate(

        {publishID: postUpdateDetails.publishID},  // Identifier
        {scheduleDate: postUpdateDetails.scheduleDate, rawResponse: postUpdateDetails.rawResponse}, // Update with new values
        {returnDocument: "after"} // Return modified document
    
    );
}



// Function finds posts of the user in the database via the accountID sent to the parameter
// Returns array of Post document starting from the newest one
export async function findPostsOfUser(userID: Types.ObjectId): Promise<IPost[]>{

    return await Post.find({userID: userID}).sort({ updatedAt: -1 });

}


// Function finds a specific post of the user in the database via the accountID and postID sent to the parameter
// Returns either a Post document or null
export async function findSpecificPostOfUser(postID: Types.ObjectId, accountID: Types.ObjectId): Promise<IPost | null>{

    return await Post.findOne({_id: postID, userID: accountID, });

}


// Function returns Account Info by checking userID parameter
// Mongoose and schema already provide implicit annotation of type
export async function findScheduledPosts(userID: string, status: PostMediaStatus): Promise<IPost[]>{

    return await Post.find({

        userID: userID,
        scheduledDate: {$exists: true, $ne: null},
        status: status,

    }).sort({ scheduledDate: 1});

}


// Function updates specific post with a comment by checking the commentDetails parameter
// Returns updated post with comment
export async function addComment(commentDetails: PostComments): Promise<IPost | null>{

    return await Post.findByIdAndUpdate(

        commentDetails.postID,
        {$push: {comments: {username: commentDetails.username, text: commentDetails.text}}},
        {returnDocument: "after"}

    )

}


// Function updates specific post with a new approval status by checking the approvalDetails parameter
// Returns updated post with new approval status
export async function updatePostApproval(approvalDetails: PostApproval){

    return await Post.findByIdAndUpdate(

        approvalDetails.postID,
        {postApprovalStatus: approvalDetails.approvalStatus, rejectionReason: approvalDetails.reason ?? null},
        {returnDocument: "after"}

    )
}


// Function updates all posts associated with account with a new approval status by checking the accoundID and approvalDetails parameter
// Returns array of updated posts with new approval status
export async function updateAllPostsForApproval(accountID: string, approvalDetails: PostApproval){

    return await Post.updateMany(

        {userID: accountID},
        {postApprovalStatus: approvalDetails.approvalStatus, rejectionReason: approvalDetails.reason ?? null},

    )

}


// Function finds all posts that have an awaiting schedule in their publishMediaStatus 
// Returns array of  posts with awaiting schedule
export async function findAwaitingSchedulePosts(): Promise<IPost[]>{

    return await Post.find({

        publishMediaStatus: "awaiting_schedule",
        scheduledDate: {$lte: new Date()},

    })

}


// Function updates posts associated with publish statis to be ready to be uploaded to the platform by checking the postID parameter
// Returns updated post with new publish status
export async function updatePublishToPlatformPost(postID: string, publishID: string, uploadURL?: string): Promise<IPost| null>{

    return await Post.findByIdAndUpdate(

        postID,
        {publishMediaStatus: "published_to_platform", publishID, uploadURL, status: "processing"},
        {returnDocument: "after"},

    )

}


// Function finds post with associated publishID in parameter and updates posts with given localFilePath 
// Returns updated post with given localFilePath
export async function updatePostFilePathInDisk(publishID: string, localFilePath: string): Promise<IPost| null>{

    return await Post.findOneAndUpdate(

        {publishID},
        {localFilePath},
        {returnDocument: "after"},

    )

}

// Updates a LinkedIn post after it has been successfully published
export async function updateLinkedInPostPublished(
    postID: string,
    publishID: string
): Promise<IPost | null>{

    return await Post.findByIdAndUpdate(
        postID,
        {
            publishID,
            status: "published",
            publishMediaStatus: "published_to_platform"
        },
        {
            returnDocument: "after"
        }
    );

}