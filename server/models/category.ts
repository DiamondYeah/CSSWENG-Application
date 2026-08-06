import mongoose, { Schema, Document, Types } from "mongoose";


// Create interface for Post type-safety
export interface ICategory extends Document{

    accountID: Types.ObjectId;
    name: string; 
    color: string;
    socialMediaAccountIDs: string[]; // Stores array of social media accounts.

}

// Create schema for Post
const categorySchema = new Schema<ICategory>({

    accountID: {type: Schema.Types.ObjectId, ref: "Account", required: true},
    name: {type: String, required: true, trim: true},
    color: {type: String, required: true, default: "#2563eb"},
    socialMediaAccountIDs: {type: [String], required: false, default: []},

},

    { timestamps: true } // Adds cretedAt and updatedAt Dates
     
);


// Make names unique per account.
categorySchema.index({accountID: 1, name: 1}, {unique: true});

const Category = mongoose.model<ICategory>("Category", categorySchema);
export default Category;