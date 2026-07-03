import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

// Load env file
dotenv.config();

// Import IUser interface
import {type IUser} from "../models/user.ts"

// Import Service Functions, and Middleware Functions
import {obtainUserInfo, obtainQueryInfo} from "../server_services/tiktokUserService.ts"
import {findUserAuth, type AuthUserRequest} from "../middleware/tiktokAuthMiddleware.ts";

// Creater router
const { Router } = pkg;
const router = Router();



router.get("/getuserinfo", findUserAuth, async (req: AuthUserRequest, res: Response) => {
        
    // Get user from req
    const user: IUser = req.user as IUser;

    try{

        // Get user TikTok info by calling obtainUserInfo and passing user as argument
        const userInfo = await obtainUserInfo(user);

        // Send successful JSON 
        if(userInfo)
            return res.json({ success: true, data: userInfo.data.user})

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "userInfo returned with no data from service call!"});

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching information!" });

    }

});



router.get("/queryinfo", findUserAuth, async (req: AuthUserRequest, res: Response) => {
    
    // Get user from req
    const user: IUser = req.user as IUser;

    try{

         // Get user TikTok query by calling obtainQueryInfo and passing user as argument
        const userQuery = await obtainQueryInfo(user);

        // Send successful JSON 
        if(userQuery)
            return res.json({ success: true, data: userQuery.data})

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "userQuery returned with no data from service call!"});

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching information!" });

    }


});


// UPDATE ROUTE FOR OTHER APIs
router.get("/getconnectedaccounts", findUserAuth, async (req: AuthUserRequest, res: Response) => {

    const user:IUser = req.user as IUser;


    // Empty array holding account information
    const accounts = [];

    // Currently has TikTok but other APIs can be added here
    if(user.accessToken){ // TikTok API check

        const tiktokInfo = await obtainUserInfo(user);
        accounts.push({

            platform: "tiktok",
            id: tiktokInfo.data.open_id,
            name: `@${tiktokInfo.data.username ?? "unknown"}`,
            handle: tiktokInfo.data.display_name ?? "unkonwn"

        });


        return res.json({ success: true, data: tiktokInfo.data.user})
    }


})



export default router;