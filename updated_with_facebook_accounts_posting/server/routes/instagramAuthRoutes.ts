import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import { getOrCreateAccount, linkSocialConnection } from "../dbcontrollers/userRepository.ts";
import { createInstagramAuth, obtainInstagramToken, exchangeForLongLivedInstagramToken, getInstagramProfile } from "../server_services/instagramAuthService.ts";

const { Router } = pkg;
const router = Router();

router.get("/instagramlogin", (req: Request, res: Response) => {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie("csrfStateInstagram", csrfState, { maxAge: 60000, secure: true, sameSite: "none", path: "/" });
    res.redirect(createInstagramAuth(csrfState));
});

router.get("/instagram/oauth2/callback", async (req: Request, res: Response) => {
    const { code, state } = req.query;
    const savedState = req.cookies.csrfStateInstagram;

    if (state !== savedState)
        return res.status(403).json({ success: false, message: "Invalid or missing CSRF State!" });

    res.clearCookie("csrfStateInstagram", { path: "/" });

    if (!code || typeof code !== "string")
        return res.status(500).json({ success: false, message: "Unexpected error of code!" });

    try {
        const shortLived = await obtainInstagramToken(code);
        const longLived = await exchangeForLongLivedInstagramToken(shortLived.access_token);
        const profile = await getInstagramProfile(longLived.access_token);

        const account = await getOrCreateAccount(req.cookies.session_user_id);

        const connection = await linkSocialConnection(account._id.toString(), {
            platform: "instagram",
            platformOpenID: profile.user_id,
            accessToken: longLived.access_token,
            scope: "instagram_business_basic,instagram_business_content_publish",
            tokenExpiresIn: longLived.expires_in ?? 60 * 24 * 60 * 60,
            handle: `@${profile.username}`,
            label: profile.username,
        });

        if (!connection)
            return res.status(500).json({ success: false, message: "Failed to save Instagram connection!" });

        res.cookie("session_user_id", account._id.toString(), { httpOnly: true, secure: true, sameSite: "none", path: "/" });
        res.redirect(process.env.ACCOUNTS_REDIRECT_URL as string);

    } catch (err: any) {
        console.error("Instagram auth error: " + (err?.response?.data ? JSON.stringify(err.response.data) : err));
        return res.status(500).json({ success: false, message: "Unexpected error when connecting Instagram." });
    }
});

export default router;