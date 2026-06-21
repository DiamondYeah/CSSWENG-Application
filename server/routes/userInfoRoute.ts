import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

// Load env file
dotenv.config();

// Import Controller Functions
import {checkTokenIfExpired} from "../dbcontrollers/userController.ts";

// Creater router
const { Router } = pkg;
const router = Router();



router.get("/getuserinfo", async (req: Request, res: Response) => {
        
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

        const userInfoFetch = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=${process.env.USER_INFO_FIELDS as string}`, 
            {

                method: "GET",
                headers:{

                    Authorization: `Bearer ${user.accessToken}`

                }
            }
        )

        // Convert the fetch to JSON and store it in const. Print details aswell
        const userInfo = await userInfoFetch.json();
        console.log("User Info Details: ", userInfo);

        // Check if there is error when fetching information
        if(userInfo.error && userInfo.error.code != "ok")
            return res.status(401).json({ success: false, message: "userInfo error." });

        // Send successful JSON 
        return res.json({ success: true, message: userInfo.data.user})


    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching information!" });

    }


});


export default router;