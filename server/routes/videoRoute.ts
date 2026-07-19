import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Load env file
dotenv.config();

// Import types
import {type ISocialMediaAccount} from "../models/socialMediaAccount.ts"
import {type AuthUserRequest} from "../types/express.ts"

// Import Service Functions, Middleware Functions, Database Controller Functions, and Util Functions
import {obtainInitialUpload, uploadVideo, obtainPostStatus} from "../server_services/tiktokVideoService.ts"
import {findAccountAuth} from "../middleware/accountAuthMiddleware.ts";
import {findTikTokAccount} from "../middleware/tiktokAccountConnectMiddleware.ts";
import {createUserPost, updatePostSchedule, updatePostStatus} from "../dbcontrollers/postRepository.ts";
import {mapTikTokPostStatus, mapPostStatusToView} from "../server_utilities/videoUtilities.ts"

// Creater router
const { Router } = pkg;
const router = Router();



// Create a directory to store the uploaded videos at
const VIDEO_STORAGE_DIRECTORY = "mediauploads/"

// Check if directory exists, if not create one 
if(!fs.existsSync(VIDEO_STORAGE_DIRECTORY))
    fs.mkdirSync(VIDEO_STORAGE_DIRECTORY, { recursive: true })

// Create a multer that will store files in diskStorage
const videoDiskStorage = multer.diskStorage({

    destination: (req, file, cb) => { cb(null, VIDEO_STORAGE_DIRECTORY); },
    filename:  (req, file, cb) => { 

        // Use crypto on file name and get the extension of the path via extname
        const encryptedName = crypto.randomBytes(16).toString("hex") + path.extname(file.originalname);
        cb(null, encryptedName);

    }

});

const upload = multer({storage: videoDiskStorage})



router.post("/initupload", findAccountAuth, findTikTokAccount, async (req: AuthUserRequest, res: Response) => {

    // Get tiktok account from req
    const tiktokAccount: ISocialMediaAccount = req.tiktokAccount as ISocialMediaAccount;

    // Get info from request
    const {title, privacyLevel, videoSize, allowComments, allowDuet, allowStitch, isYourOwnBrand, 
            isBrandedContent, scheduleDate} = req.body;


    // Try-catch getting user information basic and profile from Tiktok API
    try{

        // Get user TikTok initial upload info results by calling obtainInitialUpload and passing arguments below and return result
        const userInitUpload = await obtainInitialUpload({ 
            tiktokUser: tiktokAccount, 
            title: title, 
            privacyLevel: privacyLevel, 
            videoSize: videoSize,
            allowComments: allowComments,
            allowDuet: allowDuet,
            allowStitch: allowStitch,
            isYourOwnBrand: isYourOwnBrand,
            isBrandedContent: isBrandedContent})


        if(userInitUpload){

            // Create document of initial post status by callindgcareateUserPost from db controller repo
            await createUserPost({

                userID: tiktokAccount.accountID,
                platformAccountID: tiktokAccount.platformAccountID,
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

        console.error("Full error object:", err);
        console.error("Cause:", (err as Error).cause);

        if((err as Error).message == "POSTING_CAP_REACHED")
            return res.status(429).json({ success: false, code: "POSTING_CAP_REACHED", message: "You have reached your posting limit. Please try again later."})
        else if((err as Error).message == "BANNED_FROM_POSTING")
            return res.status(429).json({ success: false, code: "BANNED_FROM_POSTING", message: "Your account is banned from posting. Please use a different account."})



        return res.status(500).json({ success: false, message: "Unexpected error when performing upload!" });

    }


});


router.post("/upload", findAccountAuth, findTikTokAccount, upload.single('videoFile'), async (req: AuthUserRequest, res: Response) => {

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
    finally{

        // Remove/clean up file from fileSystem
        fs.unlink(videoFile.path, (err) => {

            // Display error for unlink
            if(err)
                console.error("Error in deleting file from fileSystem: ", err);
            
        });

    }

});



router.post("/poststatus", findAccountAuth, findTikTokAccount, async (req: AuthUserRequest, res: Response) => {

    // Get tiktok account from req
    const tiktokAccount: ISocialMediaAccount = req.tiktokAccount as ISocialMediaAccount;


    // Get publish id from req body
    const {publishID} = req.body;


    // Try-catch getting user information basic and profile from Tiktok API
    try{

        // Get user TikTok initial upload info results by calling obtainPostStatus and passing user and publishID and return status result
        const userStatusUpload = await obtainPostStatus(tiktokAccount, publishID);


        if(userStatusUpload){

            const mappedStatus = mapTikTokPostStatus(userStatusUpload.data.status)

            // Perform nested try-catch to check if there are any database errors
            try{

                await updatePostStatus({

                    publishID: publishID,
                    status: mappedStatus,
                    rawResponse: userStatusUpload.data

                });

            }catch(dbErr){

                console.log("Failed to update DB error: ", dbErr);

            }


            // Send successful JSON and map status
            return res.json({ success: true, data: {

                ...userStatusUpload.data,
                status: mapPostStatusToView(mappedStatus)
                
                }  
        
            })

        }


        // Fallback in case nothing was returned
        return res.json({ success: false, message: "userStatusUpload returned with no data from service call!"});

    }catch(err){

        console.error("Full error object:", err);
        console.error("Cause:", (err as Error).cause);
        return res.status(500).json({ success: false, message: "Unexpected error when getting post status!" });

    }


});


export default router;