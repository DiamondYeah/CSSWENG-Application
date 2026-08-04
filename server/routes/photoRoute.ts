import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";
import crypto from "crypto";
import path from "path"
import fs from "fs";

// Load env file
dotenv.config();

// Import types
import {type ISocialMediaAccount} from "../models/socialMediaAccount.ts"
import {type AuthUserRequest} from "../types/express.ts"

// Import Service Functions, and Middleware Functions
import {uploadUserPhoto} from "../server_services/tiktokPhotoService.ts"
import {findAccountAuth} from "../middleware/accountAuthMiddleware.ts";
import {findTikTokAccount} from "../middleware/tiktokAccountConnectMiddleware.ts";
import { createUserPost } from "../dbcontrollers/postRepository.ts";

// Constant for the max media file size
const MAX_MEDIA_FILE_SIZE: number = 750 * 1024 * 1024;


// Creater router
const { Router } = pkg;
const router = Router();

// Create a directory to store the uploaded photos at
const PHOTO_STORAGE_DIRECTORY = "publicfiles/"

// Check if directory exists, if not create one 
if(!fs.existsSync(PHOTO_STORAGE_DIRECTORY))
    fs.mkdirSync(PHOTO_STORAGE_DIRECTORY, { recursive: true })

// Create a multer that will store files in diskStorage as link needs to be persistent due to photos 
// only allowing upload through URL
const photoStorage = multer.diskStorage({

    destination: (req, file, cb) => { cb(null, PHOTO_STORAGE_DIRECTORY); },
    filename:  (req, file, cb) => { 

        // Use crypto on file name and get the extension of the path via extname
        const encryptedName = crypto.randomBytes(16).toString("hex") + path.extname(file.originalname);
        cb(null, encryptedName);

    }

});

const upload = multer({ storage: photoStorage, limits: { fileSize: MAX_MEDIA_FILE_SIZE }});


router.post("/photoUpload", findAccountAuth, findTikTokAccount, upload.array("photos", 35), async (req: AuthUserRequest, res: Response) => {

    // Coerce a to bool expression 
    const toBool = (v: unknown) => v === true || v === "true";


    // Get tiktok account from req
    const tiktokAccounts: ISocialMediaAccount[] = req.tiktokAccounts as ISocialMediaAccount[];

    // Get info from request
    const {title, description, privacyLevel, allowComments, isYourOwnBrand, isBrandedContent, scheduleDate} = req.body;
    const socialMediaAccountsIDs: string[] = req.body.socialMediaAccountsIDs
        ? JSON.parse(req.body.socialMediaAccountsIDs)
        : tiktokAccounts.map(acc => acc.platformAccountID);


    // Convert the expressions via toBool function
    const allowCommentsBool = toBool(allowComments);
    const isYourOwnBrandBool = toBool(isYourOwnBrand);
    const isBrandedContentBool = toBool(isBrandedContent);


    const isScheduledForLaterDate = !!scheduleDate && new Date(scheduleDate) > new Date(); // Check if post is scheduled

    // Get files from request and check if not empty
    const files = req.files as Express.Multer.File[];
    if(!files || files.length == 0)
        return res.status(400).json({ success: false, message: "No photos have been uploaded!" });

    // Create URLs of each photo
    const photoURLs: string[] = files.map(file => `${process.env.PUBLIC_URL}/publicfiles/${file.filename}`);


    // Only upload to tiktok accounts that were selected for photo upload
    const selectedTikTokAccounts = tiktokAccounts.filter(acc => socialMediaAccountsIDs.includes(acc.platformAccountID));

    // Store array of upload results
    const results = [];

    try{

     // Loop through tiktokAccounts
        for(const tiktokAccount of selectedTikTokAccounts){

            // Checks if the post is scheduled to be posted at a later date. If so, create a document and return it
            // Will not call TikTok API
            if(isScheduledForLaterDate){

                // Create a random encryped placeholder ID for later
                const encryptedPlaceholderID = `scheduled_${crypto.randomUUID()}`;

                // Create document of initial scheduled post status by calling createUserPost from db controller repo 
                await createUserPost({

                    userID: tiktokAccount.accountID,
                    platformAccountID: tiktokAccount.platformAccountID,
                    platform: "tiktok",
                    postType: "photo",
                    publishID: encryptedPlaceholderID,
                    status: "pending",
                    title: title,
                    scheduledDate: new Date(scheduleDate) ?? undefined,
                    publishMediaStatus: "awaiting_schedule",
                    privacyLevel: privacyLevel,
                    allowComments: allowCommentsBool,
                    allowDuet: false,
                    allowStitch: false,
                    isYourOwnBrand: isYourOwnBrandBool,
                    isBrandedContent: isBrandedContentBool,     
                    localFilePath: files.map(f => f.path).join(","), // Create file path for each file    

                });

                // Push successful scheduled document. 
                results.push({platformAccountID: tiktokAccount.platformAccountID, publish_id: encryptedPlaceholderID, upload_url: "scheduled"})
                continue;

            }


            // Inner try-catch block to check for any errors on photo upload
            try{

                // Upload user photos to their account by calling uploadUserPhoto function in services and receive result of upload
                const photoUploadResult = await uploadUserPhoto({
                    
                    tiktokUser: tiktokAccount, 
                    title: title, 
                    description: description,
                    photoURLs: photoURLs,
                    privacyLevel: privacyLevel, 
                    allowComments: allowCommentsBool,
                    isYourOwnBrand: isYourOwnBrandBool,
                    isBrandedContent: isBrandedContentBool,   

                });

                // Create document of initial upload post result by calling createUserPost from db controller repo 
                if(photoUploadResult)       
                    await createUserPost({

                        userID: tiktokAccount.accountID,
                        platformAccountID: tiktokAccount.platformAccountID,
                        platform: "tiktok",
                        postType: "photo",
                        publishID: photoUploadResult.data.publish_id,
                        status: "pending",
                        title: title,
                        scheduledDate: scheduleDate ? new Date(scheduleDate) : undefined,
                        publishMediaStatus: "published_to_platform",
                        privacyLevel: privacyLevel,
                        allowComments: allowCommentsBool,
                        isYourOwnBrand: isYourOwnBrandBool,
                        isBrandedContent: isBrandedContentBool,    

                    });

                    // Push photo upload results into results
                    results.push({platformAccountID: tiktokAccount.platformAccountID, ...photoUploadResult.data});

            }catch(err){

                console.error(`Photo upload failed for account ${tiktokAccount.platformAccountID}: `, err);
                
                results.push({
                    platformAccountID: tiktokAccount.platformAccountID,
                    error: true,
                    message: (err as Error).message,
                    cause: (err as Error).cause,
                });

            }


        }

        // Return data if there is content in results
        if(results.length > 0)
            return res.json({success: true, data: results});

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "photoUploadResult returned with no data from service call!"});

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when performing photo upload!" });

    }

});

router.post("/checkstatus", findAccountAuth, findTikTokAccount, async (req: AuthUserRequest, res: Response) => {

    const tiktokAccounts: ISocialMediaAccount[] = req.tiktokAccounts as ISocialMediaAccount[];
    const { publishID, platformAccountID } = req.body;

    const account = tiktokAccounts.find(acc => acc.platformAccountID === platformAccountID);
    if (!account)
        return res.status(404).json({ success: false, message: "Account not found" });

    const statusFetch = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${account.accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({ publish_id: publishID }),
    });

    const statusData = await statusFetch.json();
    console.log("STATUS CHECK RESULT:", JSON.stringify(statusData, null, 2));
    return res.json(statusData);

});
export default router;
