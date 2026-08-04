import mongoose, { Schema, Document, Types } from "mongoose";
import {type PostApprovalStatus} from "../types/post.ts"; // Import PostApprovalStatus

export type Platform = "tiktok" | "linkedin" | "facebook" | "instagram"

export type PostMediaType = "photo" | "video" | "document"

export type PostMediaStatus = "pending" | "processing" | "failed" | "expired" | "published"

export type PublishMediaStatus = "awaiting_schedule" | "published_to_platform";


// Create interface for Comments stored in Posts
export interface IComment{

    commentID: Types.ObjectId,
    username?: string,
    text: string,


}

// Create interface for Post type-safety
export interface IPost extends Document{

    userID: Types.ObjectId;
    platformAccountID: string; // Stores tiktokOpenId, LinkedInId , etc.
    platform: Platform;
    postType: PostMediaType;

    publishID: string // TikTok = Publish ID 
    uploadURL?: string // TikTok = Upload URL (Upload Location for publishing videos)

    status: PostMediaStatus // Determines current status of post
    postApprovalStatus: PostApprovalStatus // Determines whether post was reject, approved, or pending for approval
    uploadURLExpiration?: Date  // TikTok = 1 Hour (Determines how long until the upload url expires)
    rejectionReason?: String // Stores the reason for rejecting post

    scheduledDate?: Date // If null/undefined = Post right away
    publishMediaStatus: PublishMediaStatus // Determines the status of the scheduled post whether it is awaiting or already published
    localFilePath?: string;
    localFilePaths?: string[] // Location of file path for scheduled post to be accessed later

    title?: string
    description?: string

    comments: IComment[] // Store string of comments

    // TikTok specific settings
    privacyLevel?: string
    allowComments?: boolean
    allowDuet?: boolean
    allowStitch?: boolean
    isYourOwnBrand?: boolean
    isBrandedContent?: boolean

    rawResponse?: Record<string, unknown>       // Last raw status from platform, mainly for debugging purposes

}


// Create schema for Comments
const commentSchema = new Schema<IComment>({

    username: {type: String, required: false},
    text: {type: String, required: true},

},   

    { timestamps: true } // Adds cretedAt and updatedAt Dates);

);

// Create schema for Post
const postSchema = new Schema<IPost>({

    userID: {type: Schema.Types.ObjectId, ref: "Account", required: true},
    platformAccountID: {type: String, required: true},
    platform: {type: String, enum:["tiktok", "linkedin", "facebook","instagram"], required: true},
    postType: {type: String, enum:["photo","video", "document"], required: true},

    publishID: {type: String, required: true},           
    uploadURL:  {type: String, required: false} ,     

    status: {type: String, enum:["pending", "processing", "failed", "expired", "published"], required: true}, 
    postApprovalStatus: {type: String, enum:["pending", "approved", "rejected"], required: false, default: "pending"},
    rejectionReason: { type: String, required: false },
    uploadURLExpiration: {type: Date, required: false},  

    scheduledDate: {type: Date, required: false} ,
    publishMediaStatus: {type: String, enum:["awaiting_schedule", "published_to_platform"], required: true, default: "published_to_platform"},
    localFilePath: {type: String, required: false},
    localFilePaths: {type: [String], required: false},
    
    title: {type: String, required: false},
    description: {type: String, required: false},

    comments: {type: [commentSchema], default: []},

    privacyLevel: {type: String, required: false, default: "SELF_ONLY"},
    allowComments: {type: Boolean, required: false, default: true},
    allowDuet: {type: Boolean, required: false, default: false},
    allowStitch: {type: Boolean, required: false, default: false},
    isYourOwnBrand: {type: Boolean, required: false, default: false},
    isBrandedContent: {type: Boolean, required: false, default: false},

    rawResponse: {type: Schema.Types.Mixed, required: false}     

},

    { timestamps: true } // Adds cretedAt and updatedAt Dates

)

const Post = mongoose.model<IPost>("Post", postSchema);
export default Post;