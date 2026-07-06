import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

import {type IUser} from "../models/user.ts"

import {obtainUserInfo, obtainQueryInfo} from "../server_services/tiktokUserService.ts"
import {getLinkedInUserInfo} from "../server_services/linkedinAuthService.ts";
import {findUserAuth, type AuthUserRequest} from "../middleware/tiktokAuthMiddleware.ts";

const { Router } = pkg;
const router = Router();


router.get("/getuserinfo", findUserAuth, async (req: AuthUserRequest, res: Response) => {

    // Get user from req
    const user: IUser = req.user as IUser;

    // This session's user hasn't linked a TikTok account — nothing to fetch, don't attempt the call
    if (!user.tiktokOpenID || !user.accessToken) {
        return res.json({ success: false, message: "No TikTok account linked for this session." });
    }

    try {

        // Get user TikTok info by calling obtainUserInfo and passing user as argument
        const userInfo = await obtainUserInfo(user);

        // Send successful JSON 
        if (userInfo)
            return res.json({ success: true, data: userInfo.data.user })

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "userInfo returned with no data from service call!" });

    } catch (err) {

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching information!" });

    }

});

router.get("/queryinfo", findUserAuth, async (req: AuthUserRequest, res: Response) => {

    const user: IUser = req.user as IUser;

    if (!user.tiktokOpenID || !user.accessToken) {
        return res.json({ success: false, message: "No TikTok account linked for this session." });
    }

    try {

         // Get user TikTok query by calling obtainQueryInfo and passing user as argument
        const userQuery = await obtainQueryInfo(user);

        // Send successful JSON 
        if(userQuery)
            return res.json({ success: true, data: userQuery.data})

        // Fallback in case nothing was returned
        return res.json({ success: false, message: "userQuery returned with no data from service call!"});

    }catch(err){

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching information!" });

    }


});

router.get("/getconnectedaccounts", findUserAuth, async (req: AuthUserRequest, res: Response) => {

    const user: IUser = req.user as IUser;

    // Array holding account information
    const accounts = [];

    // TikTok API check — only attempt if this user actually has a TikTok identity
    if (user.tiktokOpenID && user.accessToken) {

        try {
            const tiktokInfo = await obtainUserInfo(user);
            accounts.push({
                platform: "tiktok",
                id: tiktokInfo.data.open_id,
                name: `@${tiktokInfo.data.username ?? "unknown"}`,
                handle: tiktokInfo.data.display_name ?? "unknown"
            });
        } catch (err) {
            console.error("Error fetching TikTok info: " + err);
        }

    }

    // LinkedIn API check — only attempt if this user actually has a LinkedIn identity
    if (user.linkedinOpenID && user.accessToken) {

        try {
            const linkedinInfo = await getLinkedInUserInfo(user.accessToken);
            accounts.push({
                platform: "linkedin",
                id: linkedinInfo.sub,
                name: linkedinInfo.name ?? "unknown",
                handle: linkedinInfo.email ?? "unknown"
            });
        } catch (err) {
            console.error("Error fetching LinkedIn info: " + err);
        }

    }

    return res.json({ success: true, data: accounts });

});

router.get("/linkedin", findUserAuth, async (req: AuthUserRequest, res: Response) => {

    const user: IUser = req.user as IUser;

    // This session's user hasn't linked a LinkedIn account — nothing to fetch
    if (!user.linkedinOpenID || !user.accessToken) {
        return res.json({ success: false, message: "No LinkedIn account linked for this session." });
    }

    try {

        const profile = await getLinkedInUserInfo(user.accessToken);

        if (profile)
            return res.json({ success: true, data: profile });

        return res.json({ success: false, message: "LinkedIn profile returned with no data." });

    } catch (err) {

        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching LinkedIn information!" });

    }

});

export default router;