import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import { createFacebookAuth, obtainFacebookToken, exchangeForLongLivedToken, getManagedFacebookPages } from "../server_services/facebookAuthService.ts";

import { createOwnerLinkToken, verifyOwnerLinkToken } from "../server_services/connectionLinkService.ts";
import { createSocialMediaAccount } from "../dbcontrollers/socialMediaAccountRepository.ts";
import { findAccountByID } from "../dbcontrollers/accountRepository.ts";
import { findAccountAuth } from "../middleware/accountAuthMiddleware.ts";
import type { AuthUserRequest } from "../types/express.ts";

const { Router } = pkg;
const router = Router();


router.get("/facebook/connect-link", findAccountAuth, (req: AuthUserRequest, res: Response) => {

    const account = req.account!;

    const ownerToken = createOwnerLinkToken(account._id!.toString());

    const url =
        `${process.env.PUBLIC_URL}/facebookAuth/facebooklogin?ownerToken=${encodeURIComponent(ownerToken)}`;

    return res.json({
        success: true,
        url
    });

});


router.get("/facebooklogin", (req: Request, res: Response) => {
    const csrfState = Math.random().toString(36).substring(2);
    const ownerToken =
        typeof req.query.ownerToken === "string"
            ? req.query.ownerToken
            : "";

    const combinedState = `${csrfState}::${ownerToken}`;

    res.cookie("csrfStateFacebook", csrfState, {
        maxAge: 5 * 60 * 1000,
        secure: true,
        sameSite: "none",
        path: "/"
    });

    res.redirect(createFacebookAuth(combinedState));
});


router.get("/facebook/oauth2/callback", async (req: AuthUserRequest, res: Response) => {
    const { code, state } = req.query;
    const savedState = req.cookies.csrfStateFacebook;

    if (typeof state !== "string")
        return res.status(403).json({
            success: false,
            message: "Invalid or missing state!"
        });
    
    const separatorIndex = state.indexOf("::");

    const csrfState = (separatorIndex === -1) ? state : state.slice(0, separatorIndex);

    const ownerToken = (separatorIndex === -1) ? "" : state.slice(separatorIndex + 2);

    if (csrfState !== savedState)
        return res.status(403).json({
            success: false,
            message: "Invalid or missing CSRF State!"
        });

    res.clearCookie("csrfStateFacebook", {
        path: "/"
    });

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

        let ownerID: string | null = null;

        if (ownerToken) {

            ownerID = verifyOwnerLinkToken(ownerToken);

            if (!ownerID) {
                return res.status(403).json({
                    success: false,
                    message: "This connection link has expired. Please generate a new one and try again."
                });
            }
        }

        const account = ownerID ? await findAccountByID(ownerID) : req.account!;

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Could not find the account to attach this connection to."
            });
        }

        for (const page of pages) {

            await createSocialMediaAccount(account._id.toString(), {

                platform: "facebook",
                platformAccountID: page.id,
                accessToken: page.access_token,
                scope: "pages_show_list,pages_manage_posts,pages_read_engagement",
                tokenExpiresIn: 60 * 24 * 60 * 60,

            });
        }

        if (!ownerID) {
            res.cookie("session_user_id", account._id.toString(), {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/"
            });
        }

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