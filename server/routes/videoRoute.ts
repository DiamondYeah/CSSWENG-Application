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



// Create a multer that will store files in memoryStorage
// WARNING BELOW. CHANGE WHEN ACTUAL SHIPPING
console.warn(`[System Warning]: ${"Change memory storage to diskStorage as server may crash if user uploads large file"}`);
const upload = multer({storage: multer.memoryStorage()})



router.get("/queryinfo", async (req: Request, res: Response) => {
    
    // Get session user id from cookies and check if empty
    const userID = req.cookies.session_user_id;
    if(!userID)
        return res.status(401).json({ success: false, message: "Session User ID not Found!" });

    // Get user info from database and check if empty
    const user = await checkTokenIfExpired(userID as string);
    if(!user)
        return res.status(401).json({ success: false, message: "User not Found with Session User ID!" });


    // Try-catch getting user information basic and profile from Tiktok API
    try{

        const userCreatorQuery = await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", 
            {

                method: "POST",
                headers:{

                    "Authorization": `Bearer ${user.accessToken}`,
                    "Content-Type": "application/json; charset=UTF-8",

                }
            }
        );

        // Convert the fetch to JSON and store it in const. Print details aswell
        const userQuery = await userCreatorQuery.json();
        console.log("User Query Details: ", userQuery);

        // Check if there is error when fetching information
        if(userQuery.error && userQuery.error.code != "ok")
            return res.status(401).json({ success: false, message: "userQuery error." });


        // Send successful JSON 
        return res.json({ success: true, message: userQuery.data})




    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching information!" });

    }


});


router.post("/initupload", async (req: Request, res: Response) => {
    
    // Get session user id from cookies and check if empty
    const userID = req.cookies.session_user_id;
    if(!userID)
        return res.status(401).json({ success: false, message: "Session User ID not Found!" });

    // Get user info from database and check if empty
    const user = await checkTokenIfExpired(userID as string);
    if(!user)
        return res.status(401).json({ success: false, message: "User not Found with Session User ID!" });


    // Get info from request
    const {title, privacyLevel, videoSize} = req.body;


    // Try-catch getting user information basic and profile from Tiktok API
    try{

        const userInitUploadFetch = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", 
            {

                method: "POST",
                headers:{

                    "Authorization": `Bearer ${user.accessToken}`,
                    "Content-Type": "application/json; charset=UTF-8"

                },
                body: JSON.stringify({
                    
                post_info:{

                    title: title,
                    privacy_level: privacyLevel,
                    disable_duet: false,
                    disable_comment: false,
                    disable_stitch: false,
                    video_cover_timestamp_ms: 1000

                },
                source_info:{

                    source: "FILE_UPLOAD",
                    video_size: videoSize,
                    chunk_size:  videoSize,
                    total_chunk_count: 1


                }

                })
            }
        );

        // Convert the fetch to JSON and store it in const. Print details aswell
        const userInitUpload = await userInitUploadFetch.json();
        console.log("User Initial Upload Details: ", userInitUpload);

        // Check if there is error when fetching information
        if(userInitUpload.error && userInitUpload.error.code != "ok")
            return res.status(401).json({ success: false, message: "userInitUpload error." });


        // Send successful JSON 
        return res.json({ success: true, data: userInitUpload.data})

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when performing upload!" });

    }


});



router.post("/upload", upload.single('videoFile'), async (req: Request, res: Response) => {

    const userID = req.cookies.session_user_id;
    if(!userID)
        return res.status(401).json({ success: false, message: "Session User ID not Found!" });

    // Get user info from database and check if empty
    const user = await checkTokenIfExpired(userID as string);
    if(!user)
        return res.status(401).json({ success: false, message: "User not Found with Session User ID!" });

    // Get upload url from request and videoFile
    const {uploadURL} = req.body;
    const videoFile = req.file;

    if(!videoFile)
        return res.status(401).json({ success: false, message: "Video file not found!" });


    // Try-catch for uploading video to Tiktok API
    try{

        const userUploadFetch = await fetch(uploadURL, 
            {

                method: "PUT",
                headers:{

                    "Content-Type": "video/mp4",
                    "Content-Length": `${videoFile.size}`,
                    "Content-Range": `bytes 0-${videoFile.size - 1}/${videoFile.size}`,

                },
                body: new Uint8Array(videoFile.buffer),

            }
        );


        // DEBUG
        console.log("Upload Status: ", userUploadFetch.status);


        // Check if there is error when fetching information
        if(!userUploadFetch.ok){

            console.log("Upload Error:", userUploadFetch);
            return res.status(400).json({ success: false, message: "Video upload to TikTok error!" });

        }


        // Send successful JSON 
        return res.json({ success: true, message: "Video upload to TikTok successful!"})

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when performing upload!" });

    }

});



router.post("/poststatus", async (req: Request, res: Response) => {
    
    // Get session user id from cookies and check if empty
    const userID = req.cookies.session_user_id;
    if(!userID)
        return res.status(401).json({ success: false, message: "Session User ID not Found!" });

    // Get user info from database and check if empty
    const user = await checkTokenIfExpired(userID as string);
    if(!user)
        return res.status(401).json({ success: false, message: "User not Found with Session User ID!" });

    
    // Get publish id from req body
    const {publishID} = req.body;


    // Try-catch getting user information basic and profile from Tiktok API
    try{

        const userStatusUploadFetch = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", 
            {

                method: "POST",
                headers:{

                    "Authorization": `Bearer ${user.accessToken}`,
                    "Content-Type": "application/json; charset=UTF-8"

                },
                body: JSON.stringify({"publish_id": publishID})
            }
        );

        // Convert the fetch to JSON and store it in const. Print details aswell
        const userStatusUpload = await userStatusUploadFetch.json();
        console.log("User Status Upload Details: ", userStatusUpload);

        // Check if there is error when fetching information
        if(userStatusUpload.error && userStatusUpload.error.code != "ok")
            return res.status(401).json({ success: false, message: "userStatusUpload error." });


        // Send successful JSON 
        return res.json({ success: true, data: userStatusUpload.data})

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when getting post status!" });

    }


});

export default router;