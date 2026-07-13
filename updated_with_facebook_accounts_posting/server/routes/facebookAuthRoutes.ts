import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import { getOrCreateAccount, linkSocialConnection } from "../dbcontrollers/userRepository.ts";
import { createFacebookAuth, obtainFacebookToken, exchangeForLongLivedToken, getManagedFacebookPages } from "../server_services/facebookAuthService.ts";

const { Router } = pkg;
const router = Router();

router.get("/facebooklogin", (req: Request, res: Response) => {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie("csrfStateFacebook", csrfState, { maxAge: 5 * 60 * 1000, secure: true, sameSite: "none", path: "/" });
    res.redirect(createFacebookAuth(csrfState));
});

router.get("/facebook/oauth2/callback", async (req: Request, res: Response) => {
    const { code, state } = req.query;
    const savedState = req.cookies.csrfStateFacebook;

    if (state !== savedState)
        return res.status(403).json({ success: false, message: "Invalid or missing CSRF State!" });

    res.clearCookie("csrfStateFacebook", { path: "/" });

    if (!code || typeof code !== "string")
        return res.status(500).json({ success: false, message: "Unexpected error of code!" });

    try {
        const shortLived = await obtainFacebookToken(code);
        const longLived = await exchangeForLongLivedToken(shortLived.access_token);
        const pages = await getManagedFacebookPages(longLived.access_token);

        if (!pages || pages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No Facebook Pages found for this account. You need to manage at least one Page to connect it.",
            });
        }

        const account = await getOrCreateAccount(req.cookies.session_user_id);

        // One login can yield several Pages — save each as its own connection.
        const savedConnections = [];
        for (const page of pages) {
            const connection = await linkSocialConnection(account._id.toString(), {
                platform: "facebook",
                platformOpenID: page.id,
                accessToken: page.access_token,
                scope: "pages_show_list,pages_manage_posts,pages_read_engagement",
                tokenExpiresIn: 60 * 24 * 60 * 60,
                handle: page.category ?? "Page",
                label: page.name,
            });
            if (connection) savedConnections.push(connection);
        }

        res.cookie("session_user_id", account._id.toString(), { httpOnly: true, secure: true, sameSite: "none", path: "/" });
        res.redirect(process.env.ACCOUNTS_REDIRECT_URL as string);

    } catch (err: any) {
        console.error("Facebook auth error: " + (err?.response?.data ? JSON.stringify(err.response.data) : err));
        return res.status(500).json({ success: false, message: "Unexpected error when connecting Facebook." });
    }
});

// router.get("/facebook/oauth2/callback", async (req: Request, res: Response) => {
//     const { code, state } = req.query;
//     const savedState = req.cookies.csrfStateFacebook;

//     if (state !== savedState)
//         return res.status(403).json({ success: false, message: "Invalid or missing CSRF State!" });

//     res.clearCookie("csrfStateFacebook", { path: "/" });

//     if (!code || typeof code !== "string")
//         return res.status(500).json({ success: false, message: "Unexpected error of code!" });

//     try {
//         const shortLived = await obtainFacebookToken(code);
//         const longLived = await exchangeForLongLivedToken(shortLived.access_token);
//         const pages = await getManagedFacebookPages(longLived.access_token);

//         if (!pages || pages.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No Facebook Pages found for this account. You need to manage at least one Page to connect it.",
//             });
//         }

//         const account = await getOrCreateAccount(req.cookies.session_user_id);

//         // One login can yield several Pages — save each as its own connection.
//         const savedConnections = [];
//         for (const page of pages) {
//             const connection = await linkSocialConnection(account._id.toString(), {
//                 platform: "facebook",
//                 platformOpenID: page.id,
//                 accessToken: page.access_token,
//                 scope: "pages_show_list,pages_manage_posts,pages_read_engagement",
//                 tokenExpiresIn: 60 * 24 * 60 * 60,
//                 handle: page.category ?? "Page",
//                 label: page.name,
//             });
//             if (connection) savedConnections.push(connection);
//         }

//         res.cookie("session_user_id", account._id.toString(), { httpOnly: true, secure: true, sameSite: "none", path: "/" });
//         res.redirect(process.env.ACCOUNTS_REDIRECT_URL as string);

//     } catch (err: any) {
//         console.error("Facebook auth error: " + (err?.response?.data ? JSON.stringify(err.response.data) : err));
//         return res.status(500).json({ success: false, message: "Unexpected error when connecting Facebook." });
//     }
// });

export default router;