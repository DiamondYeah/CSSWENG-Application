import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

// Import types and services functions
import {type IAccount} from "../models/account.ts"
import { loginAccount, registerAccount } from "../server_services/accountService.ts";
import { findAccountAuth } from "../middleware/accountAuthMiddleware.ts";
import { type AuthUserRequest } from "../types/express.ts";

// Load env file
dotenv.config();



// Creater router
const { Router } = pkg;
const router = Router();



router.post("/register", async (req: Request, res: Response) => {

    // Get username, email, password form req
    const {username, email, password} = req.body;

    // Checks if any of the fields from body is empty
    if(!username || !email || !password)
        return res.status(400).json({ success: false, message: "Incompleete information, please fill out information." });


    try{

        // Call register account function in sevices to create new account
        const account: IAccount | null = await registerAccount({username, email, plainPassword: password});

        // Add session account id to cookies to be called later for user info and posting
        res.cookie("session_account_id", account._id.toString(), {httpOnly: true, secure: true, sameSite: "none", path: "/"})

        // Return account information
        return res.json({ success: true, data: {id: account._id, name: account.username, email: account.email}});


    }catch(err){

        // Display specific error if account already exists in database
        if((err as Error).message == "ACCOUNT_ALREADY_EXISTS")
            return res.status(409).json({ success: false, message: "Account with existing username exists!"});

        console.error("Registration error:", err);
        return res.status(500).json({ success: false, message: "Unexpected error when registering!" });

    }


});



router.post("/login", async (req: Request, res: Response) => {

    // Get username and password form req
    const {username, password} = req.body;

    // Checks if any of the fields from body is empty
    if(!username || !password)
        return res.status(400).json({ success: false, message: "Incompleete information, please fill out information." });


    try{

        // Call register account function in sevices to call existing account
        const account: IAccount | null = await loginAccount(username, password);

        // Add session account id to cookies to be called later for user info and posting
        res.cookie("session_account_id", account._id.toString(), {httpOnly: true, secure: true, sameSite: "none", path: "/"})

        // Return account information
        return res.json({ success: true, data: {id: account._id, name: account.username, email: account.email}});

    }catch(err){


        // Display specific error for username not found or password mismatch
        if((err as Error).message == "PASSWORD_MISMATCH" || (err as Error).message == "USERNAME_NOT_FOUND")
            return res.status(401).json({ success: false, message: "Invalid username or password!"});

        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "Unexpected error when logging!" });

    }


});


router.post("/logout", (req: Request, res: Response) => {

    // Remove session account id cookie and return success
    res.clearCookie("session_account_id", { path: "/", secure: true, sameSite: "none" })
    return res.json({ success: true, message: "Account was logged out successfully! "});

});


router.get("/accountinfo", findAccountAuth, (req: AuthUserRequest, res: Response) => {

    const account = req.account as IAccount;

    return res.json({

        success: true,
        data: {id: account._id, username: account.username, email: account.email}

    });

});

export default router;