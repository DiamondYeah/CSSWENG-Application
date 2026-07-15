import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

import { getOrCreateAccount, linkSocialConnection, findUserByID } from "../dbcontrollers/userRepository.ts";
import { createLinkedInAuth, obtainLinkedInToken, getLinkedInUserInfo } from "../server_services/linkedinAuthService.ts";
import { createOwnerLinkToken, verifyOwnerLinkToken } from "../server_services/connectionLinkService.ts";
import { findUserAuth, type AuthUserRequest } from "../middleware/tiktokAuthMiddleware.ts";

const { Router } = pkg;
const router = Router();

router.get("/linkedin/connect-link", findUserAuth, (req: AuthUserRequest, res: Response) => {
    const user = req.user!;
    const ownerToken = createOwnerLinkToken(user._id!.toString());
    const url = `${process.env.PUBLIC_URL}/auth/linkedinlogin?ownerToken=${encodeURIComponent(ownerToken)}`;
    return res.json({ success: true, url });
});

router.get("/linkedinlogin", (req: Request, res: Response) => {

    const csrfState = Math.random().toString(36).substring(2);
    const ownerToken = typeof req.query.ownerToken === "string" ? req.query.ownerToken : "";

    // Pack the CSRF state and optional owner token together; LinkedIn just
    // echoes whatever we send back to us in the callback's `state` param.
    const combinedState = `${csrfState}::${ownerToken}`;

    res.cookie('csrfStateLinkedIn', csrfState, { maxAge: 5 * 60 * 1000, secure: true, sameSite: "none", path: "/" });

    res.redirect(createLinkedInAuth(combinedState));

});

router.get("/linkedin/oauth2/callback", async (req: Request, res: Response) => {
    const { code, state } = req.query;
    const savedState = req.cookies.csrfStateLinkedIn;

    if (typeof state !== "string")
        return res.status(403).json({ success: false, message: "Invalid or missing state!" });

    const separatorIndex = state.indexOf("::");
    const csrfState = separatorIndex === -1 ? state : state.slice(0, separatorIndex);
    const ownerToken = separatorIndex === -1 ? "" : state.slice(separatorIndex + 2);

    if (csrfState !== savedState)
        return res.status(403).json({ success: false, message: "Invalid or missing CSRF State!" });

    res.clearCookie('csrfStateLinkedIn', { path: "/" });

    if (!code || typeof code !== "string")
        return res.status(500).json({ success: false, message: "Unexpected error of code!" });

    try {
        const tokenData = await obtainLinkedInToken(code);
        const profile = await getLinkedInUserInfo(tokenData.access_token);

        // Prefer the signed owner token when present (incognito / cross-session flow).
        // Otherwise fall back to the normal cookie-based flow (same-tab connect).
        let ownerID: string | null = null;

        if (ownerToken) {
            ownerID = verifyOwnerLinkToken(ownerToken);
            if (!ownerID) {
                return res.status(403).json({ success: false, message: "This connection link has expired. Please generate a new one and try again." });
            }
        }

        const account = ownerID
            ? await findUserByID(ownerID)
            : await getOrCreateAccount(req.cookies.session_user_id);

        if (!account)
            return res.status(404).json({ success: false, message: "Could not find the account to attach this connection to." });

        const connection = await linkSocialConnection(account._id.toString(), {
            platform: "linkedin",
            platformOpenID: profile.sub,
            accessToken: tokenData.access_token,
            scope: tokenData.scope,
            tokenExpiresIn: tokenData.expires_in,
            handle: profile.email,
            label: profile.name,
        });

        if (!connection)
            return res.status(500).json({ success: false, message: "Failed to save LinkedIn connection!" });

        // Only mint a session cookie for this browser when we DIDN'T come in
        // via the owner token — an incognito tab used purely to add a second
        // account shouldn't become a logged-in session itself.
        if (!ownerID) {
            res.cookie("session_user_id", account._id.toString(), { httpOnly: true, secure: true, sameSite: "none", path: "/" });
        }

        res.redirect(process.env.ACCOUNTS_REDIRECT_URL as string);

    } catch (err) {
        console.error("Error in LinkedIn callback: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching token!" });
    }

});

export default router;