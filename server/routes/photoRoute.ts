import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";

// Load env file
dotenv.config();

// Import IUser interface
import {type IUser} from "../models/user.ts"

// Import Service Functions, and Middleware Functions
import {uploadUserPhoto} from "../server_services/tiktokPhotoService.ts"
import {findUserAuth, type AuthUserRequest} from "../middleware/tiktokAuthMiddleware.ts";

// Creater router
const { Router } = pkg;
const router = Router();



// Create a multer that will store files in diskStorage as link needs to be persistent due to photos 
// only allowing upload through URL
const photoStorage = multer.diskStorage({

    destination: (req, file, cb) => { cb(null, "publicfiles/"); },
    filename:  (req, file, cb) => { cb(null, `${Date.now()}-${file.originalname}`);

  }

});

const upload = multer({ storage: photoStorage });



router.post("/photoUpload", upload.array("photos", 35), findUserAuth, async (req: AuthUserRequest, res: Response) => {

    // Get user from req
    const user: IUser = req.user as IUser;

    // Get title and description from req body
    const {title, description} = req.body;

    // Get files from request and check if not empty
    const files = req.files as Express.Multer.File[];
    if(!files || files.length == 0)
        return res.status(400).json({ success: false, message: "No photos have been uploaded!" });

    // Create URLs of each photo
    const photoURLs: string[] = files.map(file => `${process.env.PUBLIC_URL}/public/${file.filename}`);


    try{

        // Upload user photos to their account by calling uploadUserPhoto function in services and receive result of upload
        const photoUploadResult = await uploadUserPhoto({user, title, description, photoURLs});

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