import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import { createInstagramAuth, obtainInstagramToken, exchangeForLongLivedInstagramToken, getInstagramProfile } from "../server_services/instagramAuthService.ts";
import { createOwnerLinkToken, verifyOwnerLinkToken } from "../server_services/connectionLinkService.ts";
import { createSocialMediaAccount } from "../dbcontrollers/socialMediaAccountRepository.ts";
import { findAccountByID } from "../dbcontrollers/accountRepository.ts";
import { findAccountAuth } from "../middleware/accountAuthMiddleware.ts";
import type { AuthUserRequest } from "../types/express.ts";

const { Router } = pkg;
const router = Router();

router.get("/instagram/connect-link", findAccountAuth, (req: AuthUserRequest, res: Response) => {

    const account = req.account!;

    const ownerToken = createOwnerLinkToken(account._id!.toString());

    const url =
        `${process.env.PUBLIC_URL}/instagramAuth/instagramlogin?ownerToken=${encodeURIComponent(ownerToken)}`;

    return res.json({
        success: true,
        url
    });

});


router.get("/instagramlogin", (req: Request, res: Response) => {

    const csrfState = Math.random().toString(36).substring(2);

    const ownerToken =
        typeof req.query.ownerToken === "string"
            ? req.query.ownerToken
            : "";

    const combinedState = `${csrfState}::${ownerToken}`;

    res.cookie("csrfStateInstagram", csrfState, {
        maxAge: 5 * 60 * 1000,
        secure: true,
        sameSite: "none",
        path: "/"
    });

    res.redirect(createInstagramAuth(combinedState));

});


router.get("/instagram/oauth2/callback", async (req: AuthUserRequest, res: Response) => {
    const { code, state } = req.query;
    const savedState = req.cookies.csrfStateInstagram;

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

    res.clearCookie("csrfStateInstagram", {
        path: "/"
    });

    if (!code || typeof code !== "string")
        return res.status(500).json({ success: false, message: "Unexpected error of code!" });

    try {
        const shortLived = await obtainInstagramToken(code);
        const longLived = await exchangeForLongLivedInstagramToken(shortLived.access_token);
        const profile = await getInstagramProfile(longLived.access_token);

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

        await createSocialMediaAccount(account._id.toString(), {

            platform: "instagram",
            platformAccountID: profile.user_id,
            accessToken: longLived.access_token,
            scope: "instagram_business_basic,instagram_business_content_publish",
            tokenExpiresIn: longLived.expires_in ?? 60 * 24 * 60 * 60,
        });

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
        console.error("Instagram auth error: " + (err?.response?.data ? JSON.stringify(err.response.data) : err));
        return res.status(500).json({ success: false, message: "Unexpected error when connecting Instagram." });
    }
});

export default router;