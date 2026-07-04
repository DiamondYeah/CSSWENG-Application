// Import User and interface
import Post, { type IPost, type Platform, type PostMediaType, type PostMediaStatus } from "../models/post.ts"; 
import mongoose, { Types } from "mongoose";

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

        {userID: postUpdateDetails.publishID},  // Identifier
        {scheduleDate: postUpdateDetails.scheduleDate, rawResponse: postUpdateDetails.rawResponse}, // Update with new values
        {returnDocument: 'after'} // Return modified document
    
    );
}




// Function Finds  Posts of the user in the database via the userID send to the parameter
// Returns array of Post document starting from the newest one
export async function findPostsOfUser(userID: Types.ObjectId): Promise<IPost[]>{

    return await Post.find({userID: userID}).sort({ updatedAt: -1 });

}


// Function returns User Info by checking userID parameter
// Mongoose and schema already provide implicit annotation of type
export async function findScheduledPosts(userID: string): Promise<IPost[]>{

    return await Post.find({

        userID: userID,
        scheduledDate: {$exists: true, $ne: null},
        status: "pending"

    }).sort({ scheduledDate: 1});

}