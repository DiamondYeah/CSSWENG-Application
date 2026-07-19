import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

// Import types
import {type IAccount} from "../models/account.ts"
import {type AuthUserRequest} from "../types/express.ts"

// Load env file
dotenv.config();

// Import Database Functions and Service Functions
import {createOrSaveUserTokensFromSeconds} from "../dbcontrollers/tiktokRepository.ts";
import {createTikTokAuth, disconnectTikTokAuth, obtainTikTokToken} from "../server_services/tiktokAuthService.ts";
import { findAccountAuth } from "../middleware/accountAuthMiddleware.ts";
import { findSpecificSocialMediaAccount } from "../dbcontrollers/socialMediaAccountRepository.ts";

// Creater router
const { Router } = pkg;
const router = Router();


router.get("/tiktoklogin", findAccountAuth, (req: AuthUserRequest, res: Response) => {

    const account = req.account as IAccount;

    // Create security token to avoid CSRF attacks when authenticating and the account linked accountID through the OAuth
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfState', csrfState, { maxAge: 60000 ,secure: true, sameSite: "none", path: "/"});
    res.cookie('savedLinkedAccountID', account._id.toString(), { maxAge: 60000 ,secure: true, sameSite: "none", path: "/"});
    
    // Call createTikTokAuth function to redirect user to login and authentication page via the crsfState
    res.redirect(createTikTokAuth(csrfState)); 

});


router.get("/oauth2/callback", async (req: Request, res: Response) => {

    // Get code and state from URL query and the saved csrf state and account ID
    const {code, state} = req.query;
    const savedState = req.cookies.csrfState;
    const savedLinkedAccountID = req.cookies.savedLinkedAccountID;

    // Check if state query is the same as csrfState, if so, return with refusal request.
    // Helps check if its from your actual request, and not an attack.
    if(state !== savedState)
        return res.status(403).json({ success: false, message: "Invalid or missing CSRF State!" });

    // Remove csrfState from cookies once checked
    res.clearCookie('csrfState', {path: "/"})

    // Check if saved account ID from the cookies exists
    if(!savedLinkedAccountID)
        return res.status(401).json({ success:false, message: "No account session when returning from OAuth. Please log in!"});

    // Remove csrfState from cookies once checked
    res.clearCookie('savedLinkedAccountID', {path: "/"})
   
    
    // Check if code has value as is type string, if not, return error.
    if(!code || typeof code !== "string")
        return res.status(500).json({ success: false, message: "Unexpected error of code!" });
 
    try{

        // Call obtainTikTokToken function and obtain userToken with code as argument
        const userToken = await obtainTikTokToken(code);

        // Save tokenAuth to database to create/update user, and update cookie to store id
        // To access info in database just use the user id stored in cookies which is safer than access tokens
        const user = await createOrSaveUserTokensFromSeconds({
            
            accountID: savedLinkedAccountID,
            platform: "tiktok",
            platformAccountID: userToken.open_id,
            accessToken: userToken.access_token,
            refreshToken: userToken.refresh_token,
            scope: userToken.scope,
            tokenExpiresIn: userToken.expires_in,
            refreshExpiresIn: userToken.refresh_expires_in

        });

        if(!user)
            return res.status(500).json({success: false, message: "Failed to save user info!"})


        // Redirect user back
        res.redirect(process.env.ACCOUNTS_REIDRECT_URL as string);


    }catch(err){

        console.error("OAuth callback error:", err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching token!" });

    }

});


router.post("/disconnect", findAccountAuth, async (req: AuthUserRequest, res: Response) => {

    const account: IAccount = req.account as IAccount;

    try{

        // Find specific tiktok account with the given account id
        const tiktokAccount = await findSpecificSocialMediaAccount(String(account._id), "tiktok");

        // Checks if tiktokAccount exists
        if(!tiktokAccount)
            return res.status(404).json({ success: false, message: "No TikTok Account Found!"})

        const disconnectUser = await disconnectTikTokAuth(tiktokAccount);

        return res.json({ success: true, message: "User was disconnected successfully!", data: disconnectUser})

    }catch(err){

        console.error("Disconnect Error: ", err);
        return res.status(500).json({ success: false, message: "Failed to disconnect user!" });
    }

    
});


export default router;