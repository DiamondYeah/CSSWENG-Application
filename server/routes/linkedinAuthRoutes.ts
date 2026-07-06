import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

import { createOrSaveUserTokensFromSeconds } from "../dbcontrollers/userRepository.ts";
import { createLinkedInAuth, obtainLinkedInToken, getLinkedInUserInfo } from "../server_services/linkedinAuthService.ts";

const { Router } = pkg;
const router = Router();

router.get("/linkedinlogin", (req: Request, res: Response) => {

    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfStateLinkedIn', csrfState, { maxAge: 60000, secure: true, sameSite: "none", path: "/" });

    res.redirect(createLinkedInAuth(csrfState));

});

router.get("/linkedin/oauth2/callback", async (req: Request, res: Response) => {

    const { code, state } = req.query;
    const savedState = req.cookies.csrfStateLinkedIn;

    console.log("Incoming state:", state);
    console.log("Saved cookie state:", savedState);
    console.log("All cookies received:", req.cookies);

    if (state !== savedState)
        return res.status(403).json({ success: false, message: "Invalid or missing CSRF State!" });

    // ...rest unchanged

    res.clearCookie('csrfStateLinkedIn', { path: "/" });

    if (!code || typeof code !== "string")
        return res.status(500).json({ success: false, message: "Unexpected error of code!" });

    try {

        const tokenData = await obtainLinkedInToken(code);
        const profile = await getLinkedInUserInfo(tokenData.access_token);

        const user = await createOrSaveUserTokensFromSeconds({

            linkedinOpenID: profile.sub,
            accessToken: tokenData.access_token,
            // LinkedIn's OIDC flow does not return a refresh_token by default
            // (refresh tokens require the separate "programmatic refresh" product approval)
            scope: tokenData.scope,
            tokenExpiresIn: tokenData.expires_in

        });

        if (!user)
            return res.status(500).json({ success: false, message: "Failed to save user info!" });

        res.cookie("session_user_id", user._id.toString(), { httpOnly: true, secure: true, sameSite: "none", path: "/" });

        res.redirect(process.env.ACCOUNTS_REIDRECT_URL as string);

    } catch (err) {

        return res.status(500).json({ success: false, message: "Unexpected error when fetching token!" });

    }

});

export default router;