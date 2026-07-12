import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

// Import types
import {type IUser} from "../models/user.ts"
import {type AuthUserRequest} from "../types/express.ts"

// Load env file
dotenv.config();

// Import Database Functions and Service Functions
import {createOrSaveUserTokensFromSeconds} from "../dbcontrollers/userRepository.ts";
import {createTikTokAuth, disconnectTikTokAuth, obtainTikTokToken} from "../server_services/tiktokAuthService.ts";
import { findUserAuth } from "../middleware/tiktokAuthMiddleware.ts";

// Creater router
const { Router } = pkg;
const router = Router();


router.get("/tiktoklogin", (req: Request, res: Response) => {

    // Create security token to avoid CSRF attacks when authenticating
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfState', csrfState, { maxAge: 60000 ,secure: true, sameSite: "none", path: "/"});

    // Call createTikTokAuth function to redirect user to login and authentication page via the crsfState
    res.redirect(createTikTokAuth(csrfState)); 

});


router.get("/oauth2/callback", async (req: Request, res: Response) => {

    // Get code and state from URL query and the saved csrf state
    const {code, state} = req.query;
    const savedState = req.cookies.csrfState;

    // Check if state query is the same as csrfState, if so, return with refusal request.
    // Helps check if its from your actual request, and not an attack.
    if(state !== savedState)
        return res.status(403).json({ success: false, message: "Invalid or missing CSRF State!" });

    // Remove csrfState from cookies once checked
    res.clearCookie('csrfState', {path: "/"})
    

    // Check if code has value as is type string, if not, return error.
    if(!code || typeof code !== "string")
        return res.status(500).json({ success: false, message: "Unexpected error of code!" });
 
    try{

        // Call obtainTikTokToken function and obtain userToken with code as argument
        const userToken = await obtainTikTokToken(code);

        // Save tokenAuth to database to create/update user, and update cookie to store id
        // To access info in database just use the user id stored in cookies which is safer than access tokens
        const user = await createOrSaveUserTokensFromSeconds({
            
            tiktokOpenID: userToken.open_id,
            accessToken: userToken.access_token,
            refreshToken: userToken.refresh_token,
            scope: userToken.scope,
            tokenExpiresIn: userToken.expires_in,
            refreshExpiresIn: userToken.refresh_expires_in

        });

        if(!user)
            return res.status(500).json({success: false, message: "Failed to save user info!"})

        // Add session user id to cookies to be called later for user info and posting
        res.cookie("session_user_id", user._id.toString(), {httpOnly: true, secure: true, sameSite: "none", path: "/"})

        // Redirect user back
        res.redirect(process.env.ACCOUNTS_REIDRECT_URL as string);


    }catch(err){

        console.error("OAuth callback error:", err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching token!" });

    }

});


router.post("/disconnect", findUserAuth, async (req: AuthUserRequest, res: Response) => {

    const user = req.user as IUser;

    try{

        const disconnectUser = await disconnectTikTokAuth(user);

        // Remove session_user_id from cookies
        res.clearCookie('session_user_id', {path: "/", secure: true, sameSite: "none"});

        return res.json({ success: true, message: "User was disconnected successfully!", data: disconnectUser})


    }catch(err){

        return res.status(500).json({ success: false, message: "Failed to disconnect user!" });
    }

    
});


export default router;