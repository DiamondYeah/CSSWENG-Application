import mongoose, { Schema, Document } from "mongoose";


// Create interface for User type-safety
export interface IUser extends Document {

    tiktokOpenID?: string;
    linkedinOpenID?: string;
    accessToken: string;
    refreshToken?: string;
    scope: string;
    tokenExpiresIn: Date;
    refreshExpiresIn?: Date;

}

// Create schema for User
const userSchema = new Schema<IUser>({

    tiktokOpenID: { type: String, required: false, unique: true, sparse: true },
    linkedinOpenID: { type: String, required: false, unique: true, sparse: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: false },
    scope: { type: String, required: true },
    tokenExpiresIn: { type: Date, required: true },
    refreshExpiresIn: { type: Date, required: false },

},

    { timestamps: true } // Adds createdAt and updatedAt Dates

);


const User = mongoose.model<IUser>("User", userSchema);
export default User;