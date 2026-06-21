import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

// Load env file
dotenv.config();

// Import Database Functions
import createorUpdateUserAPI from "../dbcontrollers/userController.ts";


// Creater router
const { Router } = pkg;
const router = Router();


// Login router redirecting user to Tiktok Login Page
router.get("/tiktoklogin", (req: Request, res: Response) => {

    // Create security token to avoid CSRF attacks when authenticating
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfState', csrfState, { maxAge: 60000 ,secure: true, sameSite: "none", path: "/"});

    // Create url to redirect user to login and authentication page with following parameters below
    // Includes both client key and redirect url in params
    let url = 'https://www.tiktok.com/v2/auth/authorize/';
    url += `?client_key=${process.env.TIKTOK_CLIENT_KEY}`;
    url += `&scope=user.info.basic,user.info.profile,user.info.stats,video.publish,video.upload`;
    url += `&response_type=code`;
    url += `&redirect_uri=${process.env.REDIRECT_URI}`;
    url += `&state=${csrfState}`;

    res.redirect(url); // Redirect user

});


router.get("/oauth2/callback", async (req: Request, res: Response) => {

    // Get code and state from URL query and the saved csrf state
    const {code, state} = req.query;
    const savedState = req.cookies.csrfState;

    let message: string = "State from URL: " + state + "Saved state from cookie: " + savedState + "All Cookies: " + req.cookies

    // Check if state query is the same as csrfState, if so, return with refusal request.
    // Helps check if its from your actual request, and not an attack.
    //if(state !== savedState)
    //    return res.status(403).json({ success: false, message: {message} });

    // Debugging and checking what code was sent
    console.log("Code recieved: ", code);


    try{

        const tokenFetch = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {

            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ 
                client_key: process.env.TIKTOK_CLIENT_KEY as string, 
                client_secret: process.env.TIKTOK_CLIENT_SECRET as string,
                code: code as string, 
                grant_type: "authorization_code", 
                redirect_uri: process.env.REDIRECT_URI as string})
        
        });


        // Convert the fetch to JSON and store it in const. Print details aswell
        const tokenAuth = await tokenFetch.json();
        console.log("Token Details: ", tokenAuth);


        // Save tokenAuth to database to create/update user, and update cookie to store id
        // To access info in database just use the user id stored in cookies which is safer than access tokens
        const user = await createorUpdateUserAPI({
            
            tiktokOpenID: tokenAuth.open_id,
            accessToken: tokenAuth.access_token,
            refreshToken: tokenAuth.refresh_token,
            scope: tokenAuth.scope,
            tokenExpiresIn: tokenAuth.expires_in,
            refreshExpiresIn: tokenAuth.refresh_expires_in

        });

        // Add session user id to cookies to be called later for user info and posting
        res.cookie("session_user_id", user._id.toString(), {httpOnly: true, secure: true, sameSite: "none", path: "/"})

        // Redirect user back
        res.redirect(process.env.BASE_URL as string);


    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching token!" });
    }

});



export default router;