import mongoose, { Schema, Document } from "mongoose";


export type platforms = "tiktok" | "facebook" | "instagram" | "linkedin";


// Create interface for User type-safety
export interface ISocialMediaAccount extends Document{

    accountID: mongoose.Types.ObjectId;
    platform: platforms;
    platformAccountID: string;
    accessToken: string;
    refreshToken: string;
    scope: string;
    tokenExpiresIn: Date;
    refreshExpiresIn: Date;

    
}

// Create schema for User
const socialMediaAccountSchema = new Schema<ISocialMediaAccount>({

    accountID: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    platform: { type: String, required: true},
    platformAccountID: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true},
    refreshToken: { type: String, required: true},
    scope: { type: String, required: true},
    tokenExpiresIn: { type: Date, required: true},
    refreshExpiresIn: { type: Date, required: true}, 

},

    { timestamps: true } // Adds cretedAt and updatedAt Dates

);


const SocialMediaAccount = mongoose.model<ISocialMediaAccount>("SocialMediaAccount", socialMediaAccountSchema);
export default SocialMediaAccount;