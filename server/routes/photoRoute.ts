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

const upload = multer({ storage: photoStorage });


router.post("/photoUpload", findAccountAuth, findTikTokAccount, upload.array("photos", 35), async (req: AuthUserRequest, res: Response) => {

    // Get tiktok account from req
    const tiktokAccount: ISocialMediaAccount = req.tiktokAccount as ISocialMediaAccount;

    // Get title and description from req body
    const {title, description} = req.body;

    // Get files from request and check if not empty
    const files = req.files as Express.Multer.File[];
    if(!files || files.length == 0)
        return res.status(400).json({ success: false, message: "No photos have been uploaded!" });

    // Create URLs of each photo
    const photoURLs: string[] = files.map(file => `${process.env.PUBLIC_URL}/publicfiles/${file.filename}`);


    try{

        // Upload user photos to their account by calling uploadUserPhoto function in services and receive result of upload
        const photoUploadResult = await uploadUserPhoto({tiktokUser: tiktokAccount, title, description, photoURLs});

        // Send successful JSON 
        if(photoUploadResult)
            return res.json({ success: true, message: "Photo upload to TikTok successful!", data: photoUploadResult})

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "photoUploadResult returned with no data from service call!"});

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when performing photo upload!" });

    }

});


export default router;