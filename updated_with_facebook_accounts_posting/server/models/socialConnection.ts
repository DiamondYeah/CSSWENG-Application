import mongoose, { Schema, Document, Types } from "mongoose";

export type SocialPlatform = "linkedin" | "tiktok" | "facebook" | "instagram";

export interface ISocialConnection extends Document {
    owner: Types.ObjectId;
    platform: SocialPlatform;
    platformOpenID: string;
    accessToken: string;
    refreshToken?: string;
    scope: string;
    tokenExpiresIn: Date;
    refreshExpiresIn?: Date;
    handle?: string;
    label?: string;
}

const socialConnectionSchema = new Schema<ISocialConnection>({
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    platform: { type: String, required: true },
    platformOpenID: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: false },
    scope: { type: String, required: true },
    tokenExpiresIn: { type: Date, required: true },
    refreshExpiresIn: { type: Date, required: false },
    handle: { type: String, required: false },
    label: { type: String, required: false },
}, { timestamps: true });

// The same external LinkedIn account can't be claimed by two different owners,
// but one owner can have as many connections as they want.
socialConnectionSchema.index({ platform: 1, platformOpenID: 1 }, { unique: true });

const SocialConnection = mongoose.model<ISocialConnection>("SocialConnection", socialConnectionSchema);
export default SocialConnection;