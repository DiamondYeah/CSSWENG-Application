import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

// Import types, database and services functions
import { createCategory, findCategoriesOfUser, updateCategoryOfUser, deleteCategoryOfUser } from "../dbcontrollers/categoryRepository.ts";
import { findAccountAuth } from "../middleware/accountAuthMiddleware.ts";
import { type AuthUserRequest } from "../types/express.ts";
import { type IAccount } from "../models/account.ts";


// Load env file
dotenv.config();



// Creater router
const { Router } = pkg;
const router = Router();



router.get("/getcategories", findAccountAuth, async (req: AuthUserRequest, res: Response) => {

    // Get account information from request
    const account = req.account as IAccount;


    try{

        // Call function to get categories of account
        const userCategories = await findCategoriesOfUser(String(account._id));


        // Return if anything was fetched from function call
        if(userCategories.length > 0 )
            return res.json({success: true, data: userCategories});


        // Fallback in case nothing was returned
        return res.json({ success: false, message: "userQuery returned with no data from service call!"});

    }catch(err){

        console.error("Create Category error: ", err);
        return res.status(500).json({ success: false, message: "Unexpected error when creating a category!" });

    }
    
});


router.post("/createcategory", findAccountAuth, async (req: AuthUserRequest, res: Response) => {

    // Get account information from request
    const account = req.account as IAccount;
    const {name, color, socialMediaAccountIDs} = req.body;

    // Immediately reuturn if no name was given from req.body
    if(!name)
        return res.status(400).json({ success: false, message: "Category name is required." });


    try{

        // Call function to get categories of account
        const newCategory = await createCategory({

            accountID: account._id,
            name: name,
            color: color,
            socialMediaAccountIDs: socialMediaAccountIDs,
        
        });


        // Return if anything was fetched from function call
        if(newCategory)
            return res.json({success: true, data: newCategory});


        // Fallback in case nothing was returned
        return res.json({ success: false, message: "newCategory returned with no data from service call!"});

    }catch(err){

        console.error("Create Category error: ", err);
        return res.status(500).json({ success: false, message: "Unexpected error when creating a category!" });

    }

});


router.patch("/updatecategory/:categoryID", findAccountAuth, async (req: AuthUserRequest, res: Response) => {

    // Get account information from request
    const account = req.account as IAccount;
    const {categoryID} = req.params;
    const {name, color, socialMediaAccountIDs} = req.body;


    try{

        // Call function to get categories of account
        const updatedCategory = await updateCategoryOfUser(String(categoryID), String(account._id),

            {

                // Only update if the the variables have values. If not, keep the one that is already stored in categories
                ...(name != undefined && {name}),
                ...(color != undefined && {color}),
                ...(socialMediaAccountIDs != undefined && {socialMediaAccountIDs}),

            }
        
        );

        // Return if anything was fetched from function call
        return res.json({success: true, data: updatedCategory});

    }catch(err){

        console.error("Create Category error: ", err);
        return res.status(500).json({ success: false, message: "Unexpected error when updating a category!" });

    }

});


router.delete("/deletecategory/:categoryID", findAccountAuth, async (req: AuthUserRequest, res: Response) => {

    // Get account information from request
    const account = req.account as IAccount;
    const {categoryID} = req.params;


    try{

        // Call function to get categories of account
        const deleteCategory = await deleteCategoryOfUser(String(categoryID), String(account._id));


        // Return if anything was fetched from function call
        if(deleteCategory)
            return res.json({success: true, data: deleteCategory});


        // Fallback in case nothing was returned
        return res.json({ success: false, message: "deleteCategory returned with no data from service call!"});

    }catch(err){

        console.error("Create Category error: ", err);
        return res.status(500).json({ success: false, message: "Unexpected error when deleting a category!" });

    }

});

export default router;