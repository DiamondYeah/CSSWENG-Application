import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";

// Load env file
dotenv.config();

// Import types
import {type ISocialMediaAccount} from "../models/socialMediaAccount.ts"
import {type PostMediaStatus} from "../models/post.ts";
import {type AuthUserRequest} from "../types/express.ts"

// Import Middleware Functions, and Database Controller Functions Functions
import {findAccountAuth} from "../middleware/accountAuthMiddleware.ts";
import {findTikTokAccount} from "../middleware/tiktokAccountConnectMiddleware.ts";
import {findScheduledPosts, updatePostFilePathInDisk} from "../dbcontrollers/postRepository.ts";
import { type IAccount } from "../models/account.ts";


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
            return res.json({ success: true, message: "Upated the post with a file path!" ,data: updatedPostWithPath})

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "updatedPostWithPath returned with no data from service call!"});


    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when updated file path of post!" });

    }


})




export default router;