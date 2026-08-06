import Category, { type ICategory } from "../models/category.ts";
import { Types } from "mongoose";


// Interface for CategoryInput
interface CategoryInput{

    accountID: Types.ObjectId;
    name: string; 
    color: string;
    socialMediaAccountIDs: string[]; 

};


// Interface for CategoryUpdate
interface CategoryUpdate{

    name?: string; 
    color?: string;
    socialMediaAccountIDs?: string[]; 

}


// Function creates new Category by fetching info from parameter and returning it.
export async function createCategory(categoryDetails : CategoryInput): Promise<ICategory>{

    return await Category.create({

        accountID: categoryDetails.accountID,
        name: categoryDetails.name,
        color: categoryDetails.color,
        socialMediaAccountIDs: categoryDetails.socialMediaAccountIDs,

    });

}


// Function finds categories of the user in the database via the accountID sent to the parameter
export async function findCategoriesOfUser(accountID : string): Promise<ICategory[]>{

    return await Category.find({ accountID: accountID }).sort({ createdAt: 1 });

}


// Function finds a specific category of the user in the database via the categoryID and accountID sent to the parameter
// Returns either a Category document or null
export async function findSpecificCategoryOfUser(categoryID: string, accountID : string): Promise<ICategory | null>{

    return await Category.findOne({_id: categoryID, accountID: accountID });

}


// Function updates the data of the category via the categoryID, accountID, and updateDeatils sent to the parameter.
// Returns either a Category document or null
export async function updateCategoryOfUser(categoryID: string, accountID : string, categoryUpdatesDetails: CategoryUpdate): Promise<ICategory | null>{

    return await Category.findOneAndUpdate(

        {_id: categoryID, accountID: accountID },  // Identifier
        {$set: categoryUpdatesDetails}, // Update with new values in categoryUpdatesDetails
        {returnDocument: "after"} // Return modified document
    
    );

}


// Function deletes a category owned by the user ia the categoryID and accountID sent to the parameter.
// Returns either a Category document or null
export async function deleteCategoryOfUser(categoryID: string, accountID : string): Promise<ICategory | null>{

    return await Category.findOneAndDelete({_id: categoryID, accountID: accountID });

}