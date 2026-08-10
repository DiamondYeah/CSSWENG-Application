import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

// Load env file
dotenv.config();

// Import types
import {type ISocialMediaAccount} from "../models/socialMediaAccount.ts"
import {type PostMediaStatus} from "../models/post.ts";
import {type AuthUserRequest} from "../types/express.ts"

// Import Middleware Functions, and Database Controller Functions Functions
import {findAccountAuth} from "../middleware/accountAuthMiddleware.ts";
import {findTikTokAccount} from "../middleware/tiktokAccountConnectMiddleware.ts";
import {cancelScheduledPost, deleteSpecificPostOfUser, findPostsOfUser, findScheduledPosts, findSpecificPostOfUser, updatePostFilePathInDisk} from "../dbcontrollers/postRepository.ts";
import { type IAccount } from "../models/account.ts";
import mongoose from "mongoose";


// Creater router
const { Router } = pkg;
const router = Router();


// Updated to account level, to fetch all posts
router.get("/getscheduledposts", findAccountAuth, async (req: AuthUserRequest, res: Response) => {

    const account: IAccount = req.account as IAccount;
    const status = (req.query.status as PostMediaStatus) ?? "pending";


    try{

        const posts = await findScheduledPosts(String(account._id), status);


        // Send successful JSON with data holding posts
        if(posts)
            return res.json({ success: true, data: posts})

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "getScheduledPosts returned with no data from service call!"});

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching scheduled posts!" });

    }


})


router.patch("/updatepostfilepath", findAccountAuth, async (req: AuthUserRequest, res: Response) => {

    const {publishID, localFilePath} = req.body;

    try{

        // Call database function to update post with given publishID and localFilePath
        const updatedPostWithPath = await updatePostFilePathInDisk(publishID, localFilePath);


        // Send successful JSON with data holding updated post
        if(updatedPostWithPath)
            return res.json({ success: true, message: "Updated the post with a file path!" ,data: updatedPostWithPath})

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "updatedPostWithPath returned with no data from service call!"});


    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when updated file path of post!" });

    }


})


router.patch("/cancelscheduledpost", findAccountAuth, async (req: AuthUserRequest, res: Response) => {

    const account: IAccount = req.account as IAccount;
    const {postID} = req.body;

    if(!postID)
                return res.status(400).json({ success: false, message: "postID returned with no data!"})

    try{



        // Checks if post is actually from the user. If the userPosts does not return with anything, it is not their post
        // Prevents guessing postID
        const userPost = await findSpecificPostOfUser(new mongoose.Types.ObjectId(postID), account._id);

        if(!userPost)
            return res.status(404).json({ success: false, message: "userPosts returned with no data!"});


        console.log(userPost.status);

        if(userPost.status != "pending")
            return res.status(400).json({ success: false, message: "Only pending schedules may be cancelled!"});            


        // Call database function to update post with given publishID and localFilePath
        const cancelledScheduledPost = await cancelScheduledPost(String(postID));



        // Remove any file/s in local file path since they are cancelled now
        const filesPathToRemove = userPost.localFilePaths?.length ? userPost.localFilePaths // Get file paths
                                : (userPost.localFilePath ? [userPost.localFilePath] : []); // Get file path

        
        for(const filePath of filesPathToRemove)
            fs.unlink(filePath, (err) => {

                // Display error for unlink
                if(err)
                    console.error("Error in deleting file from fileSystem: ", err);
                
            });

        
        // Send successful JSON with data holding updated post
        return res.json({ success: true, message: "Cancelled scheduled post" , data: cancelledScheduledPost})

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when cancellind scheduled post!" });

    }


})


router.delete("/deletepost", findAccountAuth, async (req: AuthUserRequest, res: Response) => {

    // Get account information from request
    const account = req.account as IAccount;
    const {postID} = req.body;


    try{

        // Call function to get delete post of user
        const deletePost = await deleteSpecificPostOfUser(new mongoose.Types.ObjectId(String(postID)), account._id);


        // Return if anything was fetched from function call
        if(deletePost)
            return res.json({success: true, data: deletePost});


        // Fallback in case nothing was returned
        return res.json({ success: false, message: "deletePost returned with no data from service call!"});

    }catch(err){

        console.error("Error: ", err);
        return res.status(500).json({ success: false, message: "Unexpected error when deleting a post!" });

    }

});



export default router;