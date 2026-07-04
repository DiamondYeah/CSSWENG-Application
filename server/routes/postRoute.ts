import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";

// Load env file
dotenv.config();

// Import IUser interface
import {type IUser} from "../models/user.ts"

// Import Service Functions, Middleware Functions, Database Controller Functions, and Util Functions
import {obtainInitialUpload, uploadVideo, obtainPostStatus} from "../server_services/tiktokVideoService.ts"
import {findUserAuth, type AuthUserRequest} from "../middleware/tiktokAuthMiddleware.ts";
import {createUserPost, findScheduledPosts, updatePostSchedule, updatePostStatus} from "../dbcontrollers/postRepository.ts";
import {mapTikTokPostStatus, mapPostStatusToView} from "../server_utilities/videoUtilities.ts"


// Creater router
const { Router } = pkg;
const router = Router();


// UPDATE ROUTE FOR OTHER APIs
router.get("/getscheduledposts", findUserAuth, async (req: AuthUserRequest, res: Response) => {

    const user: IUser = req.user as IUser;

    try{

        const posts = await findScheduledPosts(String(user._id));


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


export default router;