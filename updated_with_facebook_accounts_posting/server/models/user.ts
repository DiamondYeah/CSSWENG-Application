import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    tiktokOpenID?: string;
    linkedinOpenID?: string;
    accessToken: string;
    refreshToken?: string;
    scope: string;
    tokenExpiresIn: Date;
    refreshExpiresIn?: Date;

}

const userSchema = new Schema<IUser>({
    tiktokOpenID: { type: String, required: false, unique: true, sparse: true },
    linkedinOpenID: { type: String, required: false, unique: true, sparse: true },
    accessToken: { type: String, required: false }, 
    refreshToken: { type: String, required: false },
    scope: { type: String, required: false },          
    tokenExpiresIn: { type: Date, required: false },   
    refreshExpiresIn: { type: Date, required: false },
}, { timestamps: true });

const User = mongoose.model<IUser>("User", userSchema);
export default User;