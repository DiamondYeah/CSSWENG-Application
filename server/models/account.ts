import mongoose, { Schema, Document } from "mongoose";


// Create interface for User type-safety
export interface IAccount extends Document{

    username: string;
    email: string;
    cryptedPassword: string;
    shareToken?: string;
    shareTokenExpiresIn?: Date;
    
}

// Create schema for User
const accountSchema = new Schema<IAccount>({

    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true},
    cryptedPassword: { type: String, required: true},
    shareToken: { type: String, required: false, unique: true, sparse: true},
    shareTokenExpiresIn: { type: Date, required: false}, 

},

    { timestamps: true } // Adds cretedAt and updatedAt Dates

);


const Account = mongoose.model<IAccount>("Account", accountSchema);
export default Account;