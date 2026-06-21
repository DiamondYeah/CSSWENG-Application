import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";

// Load env file
dotenv.config();

// Import Controller Functions
import {checkTokenIfExpired} from "../dbcontrollers/userController.ts";

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



router.post("/photoUpload", upload.array("photos", 35), async (req: Request, res: Response) => {

    const userID = req.cookies.session_user_id;
    if(!userID)
        return res.status(401).json({ success: false, message: "Session User ID not Found!" });

    // Get user info from database and check if empty
    const user = await checkTokenIfExpired(userID as string);
    if(!user)
        return res.status(401).json({ success: false, message: "User not Found with Session User ID!" });

    // Get title and description from req body
    const {title, description} = req.body;

    // Get files from request and check if not empty
    const files = req.files as Express.Multer.File[];
    if(!files || files.length == 0)
        return res.status(400).json({ success: false, message: "No photos have been uploaded!" });

    // Create URLs of each photo
    const photoURLS = files.map(file => `${process.env.PUBLIC_URL}/public/${file.filename}`);


    // Try-catch for uploading photos to Tiktok API
    try{

        const userPhotoUploadFetch = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", 
            {

                method: "POST",
                headers:{

                    "Authorization": `Bearer ${user.accessToken}`,
                    "Content-Type": "application/json; charset=UTF-8",

                },
                body: JSON.stringify({

                    post_info:{

                        title: title,
                        description: description,
                        privacy_level: "SELF_ONLY",
                        brand_content_toggle: false,
                        brand_organic_toggle: false

   

                    },
                    source_info:{

                        source: "PULL_FROM_URL",
                        photo_images: photoURLS,
                        photo_cover_index: 0,

                    },

                    media_type: "PHOTO",
                    post_mode: "MEDIA_UPLOAD"


                }),

            }
        );


        // Convert the fetch to JSON and store it in const. Print details aswell
        const userPhotoUpload = await userPhotoUploadFetch.json();
        console.log("Photo Response: ", userPhotoUpload);



        // Check if there is error when fetching information
        if(userPhotoUpload.error && userPhotoUpload.error.code != "ok"){

            console.log("Photo Upload Error:", userPhotoUpload.error);
            return res.status(400).json({ success: false, message: "Photo upload to TikTok error!" });

        }


        // Send successful JSON 
        return res.json({ success: true, message: "Photo upload to TikTok successful!"})

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when performing photo upload!" });

    }

});


export default router;