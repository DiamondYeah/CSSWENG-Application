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
import {createUserPost, updatePostSchedule, updatePostStatus} from "../dbcontrollers/postRepository.ts";
import {mapTikTokPostStatus, mapPostStatusToView} from "../server_utilities/videoUtilities.ts"

// Creater router
const { Router } = pkg;
const router = Router();



// Create a multer that will store files in memoryStorage
// WARNING BELOW. CHANGE WHEN ACTUAL SHIPPING
console.warn(`[System Warning]: ${"Change memory storage to diskStorage as server may crash if user uploads large file"}`);
const upload = multer({storage: multer.memoryStorage()})



router.post("/initupload", findUserAuth, async (req: AuthUserRequest, res: Response) => {
    
    // Get user from req
    const user: IUser = req.user as IUser;

    // Get info from request
    const {title, privacyLevel, videoSize, allowComments, allowDuet, allowStitch, scheduleDate} = req.body;


    // Try-catch getting user information basic and profile from Tiktok API
    try{

        // Get user TikTok initial upload info results by calling obtainInitialUpload and passing arguments below and return result
        const userInitUpload = await obtainInitialUpload({ 
            user: user, 
            title: title, 
            privacyLevel: privacyLevel, 
            videoSize: videoSize,
            allowComments: allowComments,
            allowDuet: allowDuet,
            allowStitch: allowStitch})


        if(userInitUpload){

            // Create document of initial post status by callindgcareateUserPost from db controller repo
            await createUserPost({

                userID: user._id,
                platformAccountID: user.tiktokOpenID,
                platform: "tiktok",
                postType: "video",
                publishID: userInitUpload.data.publish_id,
                status: "pending",
                title: title,
                scheduledDate: scheduleDate ? new Date(scheduleDate) : undefined

            });


            // Send successful JSON 
            return res.json({ success: true, data: userInitUpload.data})

        }
  

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "userInitUpload returned with no data from service call!"});

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when performing upload!" });

    }


});



router.post("/upload", findUserAuth, upload.single('videoFile'), async (req: AuthUserRequest, res: Response) => {

    // Get upload url from request and videoFile
    const {uploadURL} = req.body;
    const videoFile = req.file;

    if(!videoFile)
        return res.status(401).json({ success: false, message: "Video file not found!" });


    // Try-catch for uploading video to Tiktok API
    try{

        // Upload user videos to the user's TikTok account by calling obtainInitialUpload with the arguments below and return result
        const userUpload = await uploadVideo(videoFile, uploadURL);


        // Send successful JSON 
        if(userUpload)
            return res.json({ success: true, message: "Video upload to TikTok successful!"})

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "userUpload returned with no data from service call!"});

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when performing upload!" });

    }

});



router.post("/poststatus", findUserAuth, async (req: AuthUserRequest, res: Response) => {
    
    // Get user from req
    const user: IUser = req.user as IUser;

    // Get publish id from req body
    const {publishID} = req.body;


    // Try-catch getting user information basic and profile from Tiktok API
    try{

        // Get user TikTok initial upload info results by calling obtainPostStatus and passing user and publishID and return status result
        const userStatusUpload = await obtainPostStatus(user, publishID);


        if(userStatusUpload){

            await updatePostStatus({

                publishID: publishID,
                status: mapTikTokPostStatus(userStatusUpload.data.status),
                rawResponse: userStatusUpload.data
            });


            // Send successful JSON and map status
            return res.json({ success: true, data: {

                ...userStatusUpload.data,
                status: mapPostStatusToView(userStatusUpload.data.status)
                
                }  
        
            })

        }


        // Fallback in case nothing was returned
        return res.json({ success: false, message: "userStatusUpload returned with no data from service call!"});

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when getting post status!" });

    }


});


export default router;