import mongoose, { Schema, Document } from "mongoose";


// Create interface for User type-safety
export interface IUser{

    tiktokOpenID: string;
    accessToken: string;
    refreshToken: string;
    scope: string;
    tokenExpiresIn: Date;
    refreshExpiresIn: Date;
    

}

// Create schema for User
const userSchema = new Schema<IUser>({

    tiktokOpenID: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true},
    refreshToken: { type: String, required: true},
    scope: { type: String, required: true},
    tokenExpiresIn: { type: Date, required: true},
    refreshExpiresIn: { type: Date, required: true}, 
},

    { timestamps: true } // Adds cretedAt and updatedAt Dates

);


const User = mongoose.model<IUser>("User", userSchema);
export default User;