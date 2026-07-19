import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import crypto from "crypto";

// Load env file
dotenv.config();

// Import types
import {type IAccount} from "../models/account.ts"
import {type ISocialMediaAccount} from "../models/socialMediaAccount.ts"
import {type AuthUserRequest} from "../types/express.ts"
import {type PostMediaStatus} from "../models/post.ts";

// Import Service Functions, Middleware, and Database Functions
import {obtainUserInfo, obtainQueryInfo} from "../server_services/tiktokUserService.ts"
import {findAccountAuth} from "../middleware/accountAuthMiddleware.ts";
import {findTikTokAccount} from "../middleware/tiktokAccountConnectMiddleware.ts";
import {createAccountShareToken, findAccountByShareToken} from "../dbcontrollers/accountRepository.ts";
import { findScheduledPosts } from "../dbcontrollers/postRepository.ts";
import { findAllSocialMediaAccounts } from "../dbcontrollers/socialMediaAccountRepository.ts";


// Constants for expiraition of share token calendar
const DAYS_UNTIL_SHARE_TOKEN_EXPIRY: number = 14;


// Creater router
const { Router } = pkg;
const router = Router();




router.get("/getuserinfo", findAccountAuth, findTikTokAccount, async (req: AuthUserRequest, res: Response) => {

    // Get tiktok account from req
    const tiktokAccount: ISocialMediaAccount = req.tiktokAccount as ISocialMediaAccount;

    try{

        // Get user TikTok info by calling obtainUserInfo and passing user as argument
        const tiktokAccountInfo = await obtainUserInfo(tiktokAccount);

        // Send successful JSON 
        if(tiktokAccountInfo)
            return res.json({ success: true, data: tiktokAccountInfo.data.user})

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "userInfo returned with no data from service call!"});

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching information!" });

    }

});


// Used for shared calendar
router.get("/getuser/:token", async (req: Request, res: Response) => {
        
    const { token } = req.params;

    try{

        // Get user from database by calling findUserByShareToken and passing token as argument
        const account: IAccount = await findAccountByShareToken(String(token)) as IAccount;

        // Check if user is undefined 
        if(!account)
            return res.status(404).json({ success: false, message: "Invalid share link!"});

        // Check if shareToken exists and is not expired yet
        if(!account.shareTokenExpiresIn || account.shareTokenExpiresIn < new Date())
            return res.status(401).json({ success: false, message: "Share link is expired!"});

        // Returned json with userInfo data
        return res.json({ success: true, data: {name: account.username}});

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching information!" });

    }

});



router.get("/queryinfo", findAccountAuth, findTikTokAccount, async (req: AuthUserRequest, res: Response) => {

    // Get tiktok account from req
    const tiktokAccount: ISocialMediaAccount = req.tiktokAccount as ISocialMediaAccount;

    try{

         // Get user TikTok query by calling obtainQueryInfo and passing user as argument
        const userQuery = await obtainQueryInfo(tiktokAccount);

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
router.get("/getconnectedaccounts", findAccountAuth, async (req: AuthUserRequest, res: Response) => {

    // Get account information from request
    const account = req.account as IAccount;
    const socialMediaAccounts: ISocialMediaAccount[] = await findAllSocialMediaAccounts(String(account._id));


    // Empty array holding account information
    const accounts = [];

    for(const socialAccount of socialMediaAccounts){

        // Currently has TikTok but other APIs can be added here
        if(socialAccount.platform == "tiktok"){ // TikTok API check

            const tiktokInfo = await obtainUserInfo(socialAccount);

            accounts.push({

                platform: "tiktok",
                id: tiktokInfo.data.user.open_id,
                name: tiktokInfo.data.user.display_name ?? "unkonwn",
                handle: `@${tiktokInfo.data.user.username ?? "unknown"}`,


            });

        }

    }


    // Return empty array if theres nothing in accounts array
    if(accounts.length == 0)
        return res.json({ success: true, data: [] });


    return res.json({ success: true, data: accounts});
})



router.post("/createsharetoken", findAccountAuth, async (req: AuthUserRequest, res: Response) => {

    const account: IAccount = req.account as IAccount;


    try{

        // Create a random generted bytes data via crypto library and convert to hex
        const cryptoToken = crypto.randomBytes(32).toString("hex");
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + DAYS_UNTIL_SHARE_TOKEN_EXPIRY); // Set expiration date of token to 2 weeks from now


        await createAccountShareToken(String(account._id), cryptoToken, expireDate);

        return res.json({ success: true, data: {cryptoToken, expireDate}})



    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when generating share token!" });

    }

});


// No authentication as it is meant to be shared
router.get("/sharecalendar/:token", async (req: Request, res: Response) => {

    const {token} = req.params;

    const status = (req.query.status as PostMediaStatus) ?? "pending";

    try{

        // Function also accepts tokens
        const account: IAccount = await findAccountByShareToken(String(token)) as IAccount;

        // Check if account is undefined 
        if(!account)
            return res.status(404).json({ success: false, message: "Invalid share link!"});

        // Check if shareToken exists and is not expired yet
        if(!account.shareTokenExpiresIn || account.shareTokenExpiresIn < new Date())
            return res.status(401).json({ success: false, message: "Share link is expired!"});


        const sharedPosts = await findScheduledPosts(String(account._id), status)

        // Check if sharedPosts is undefined
        if(!sharedPosts)
            return res.json({ success: false, message: "No posts found form share link!"});    

        // Returned json with sharedPosts data
        return res.json({ success: true, data: sharedPosts});

    }catch(err){

        console.error(err);
        return res.status(500).json({ success: false, message: "Unexpected error when obtaining shared calendar" });

    }

})


export default router;