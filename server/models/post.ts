import mongoose, { Schema, Document, Types } from "mongoose";


export type Platform = "tiktok" | "linkedin" | "facebook" | "instagram"

export type PostMediaType = "photo" | "video"

export type PostMediaStatus = "pending" | "processing" | "failed" | "expired" | "published"

// Create interface for Post type-safety
export interface IPost extends Document{

    userID: Types.ObjectId;
    platformAccountID: string; // Stores tiktokOpenId, LinkedInId , etc.
    platform: Platform;
    postType: PostMediaType;

    publishID: string           // TikTok = Publish ID 
    uploadURL?: string           // TikTok = Upload URL (Upload Location for publishing videos)

    status: PostMediaStatus     // Determins current status of post
    uploadURLExpiration?: Date  // TikTok = 1 Hour (Determines how long until the upload url expires)

    scheduledDate?: Date        // If null/undefined = Post right away
    title?: string
    description?: string

    rawResponse?: Record<string, unknown>       // Last raw status from platform, mainly for debugging purposes

}


// Create schema for Post
const postSchema = new Schema<IPost>({

    userID: {type: Schema.Types.ObjectId, ref: "Account", required: true},
    platformAccountID: {type: String, required: true},
    platform: {type: String, enum:["tiktok", "linkedin", "facebook","instagram"], required: true},
    postType: {type: String, enum:["photo","video"], required: true},

    publishID: {type: String, required: true},           
    uploadURL:  {type: String, required: false} ,     

    status: {type: String, enum:["pending", "processing", "failed", "expired", "published"], required: true}, 
    uploadURLExpiration: {type: Date, required: false},  

    scheduledDate: {type: Date, required: false} ,         
    title: {type: String, required: false},
    description: {type: String, required: false},

    rawResponse: {type: Schema.Types.Mixed, required: false}     

},

    { timestamps: true } // Adds cretedAt and updatedAt Dates

)

const Post = mongoose.model<IPost>("Post", postSchema);
export default Post;