// Import User and interface
import Post, { type IPost, type Platform, type PostMediaType, type PostMediaStatus, type IComment } from "../models/post.ts"; 
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
        status: "pending",
        scheduledDate: postDetails.scheduledDate,
        title: postDetails.title,
        description: postDetails.description,
        
    });

}


// Function updates the status of the post via the publishID sent to the parameter. Also updates the rawResponse
// Returns modified document
export async function updatePostStatus(postUpdateDetails: PostStatusUpdate): Promise<IPost | null>{
// Create new document if ID not found
    return await Post.findOneAndUpdate(

        {publishID: postUpdateDetails.publishID},  // Identifier
        {status: postUpdateDetails.status, rawResponse: postUpdateDetails.rawResponse}, // Update with new values
        {returnDocument: 'after'} // Return modified document
    
    );
}


// Function updates the date of the post via the publishID sent to the parameter. Also updates the rawResponse
// Returns modified document
export async function updatePostSchedule(postUpdateDetails: PostScheduleUpdate): Promise<IPost | null>{
// Create new document if ID not found
    return await Post.findOneAndUpdate(

        {publishID: postUpdateDetails.publishID},  // Identifier
        {scheduleDate: postUpdateDetails.scheduleDate, rawResponse: postUpdateDetails.rawResponse}, // Update with new values
        {returnDocument: 'after'} // Return modified document
    
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
        {new: true}

    )

}


// Function updates specific post with a new approval status by checking the approvalDetails parameter
// Returns updated post with new approval status
export async function updatePostApproval(approvalDetails: PostApproval){

    return await Post.findByIdAndUpdate(

        approvalDetails.postID,
        {postApprovalStatus: approvalDetails.approvalStatus, rejectionReason: approvalDetails.reason ?? null},
        {new: true}

    )


}


// Function updates all posts associated with account with a new approval status by checking the accoundID and approvalDetails parameter
// Returns arraw of updated posts with new approval status
export async function updateAllPostsForApproval(accountID: string, approvalDetails: PostApproval){

    return await Post.updateMany(

        {userID: accountID},
        {postApprovalStatus: approvalDetails.approvalStatus, rejectionReason: approvalDetails.reason ?? null},

    )


}