import pkg from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import {type IUser} from "../models/user.ts"
import {obtainUserInfo, obtainQueryInfo} from "../server_services/tiktokUserService.ts"
import {getLinkedInUserInfo} from "../server_services/linkedinAuthService.ts";
import {findUserAuth, type AuthUserRequest} from "../middleware/tiktokAuthMiddleware.ts";
import { deleteSocialConnection, listSocialConnections } from "../dbcontrollers/userRepository.ts";

const { Router } = pkg;
const router = Router();

router.get("/getuserinfo", findUserAuth, async (req: AuthUserRequest, res: Response) => {
    const user: IUser = req.user as IUser;

    if (!user.tiktokOpenID || !user.accessToken) {
        return res.json({ success: false, message: "No TikTok account linked for this session." });
    }

    try {
        const userInfo = await obtainUserInfo(user);

        if (userInfo)
            return res.json({ success: true, data: userInfo.data.user })

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
        const userQuery = await obtainQueryInfo(user);

        if(userQuery)
            return res.json({ success: true, data: userQuery.data})

        return res.json({ success: false, message: "userQuery returned with no data from service call!"});
    } catch(err) {
        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching information!" });
    }
});

router.get("/getconnectedaccounts", findUserAuth, async (req: AuthUserRequest, res: Response) => {
    const user: IUser = req.user as IUser;
    const accounts = [];

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

    try {
        const linkedinConnections = await listSocialConnections(user._id.toString(), "linkedin");
        linkedinConnections.forEach((conn) => {
            accounts.push({
                platform: "linkedin",
                id: conn._id.toString(),
                name: conn.label ?? "unknown",
                handle: conn.handle ?? "unknown"
            });
        });
    } catch (err) {
        console.error("Error fetching LinkedIn connections: " + err);
    }

    try {
        const facebookConnections = await listSocialConnections(user._id.toString(), "facebook");
        facebookConnections.forEach((conn) => {
            accounts.push({
                platform: "facebook",
                id: conn._id.toString(),
                name: conn.label ?? "unknown",
                handle: conn.handle ?? "Page"
            });
        });
    } catch (err) {
        console.error("Error fetching Facebook connections: " + err);
    }

    try {
        const instagramConnections = await listSocialConnections(user._id.toString(), "instagram");
        instagramConnections.forEach((conn) => {
            accounts.push({
                platform: "instagram",
                id: conn._id.toString(),
                name: conn.label ?? "unknown",
                handle: conn.handle ?? "Instagram"
            });
        });
    } catch (err) {
        console.error("Error fetching Instagram connections: " + err);
    }

    return res.json({ success: true, data: accounts });
});

router.get("/linkedin", findUserAuth, async (req: AuthUserRequest, res: Response) => {
    const user: IUser = req.user as IUser;

    try {
        const connections = await listSocialConnections(user._id.toString(), "linkedin");

        const data = connections.map((conn) => ({
            id: conn._id.toString(),
            sub: conn.platformOpenID,
            name: conn.label ?? "unknown",
            email: conn.handle ?? "unknown",
        }));

        return res.json({ success: true, data });
    } catch (err) {
        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching LinkedIn information!" });
    }
});

router.get("/facebook", findUserAuth, async (req: AuthUserRequest, res: Response) => {
    const user: IUser = req.user as IUser;
    try {
        const connections = await listSocialConnections(user._id.toString(), "facebook");
        const data = connections.map((conn) => ({
            id: conn._id.toString(),
            pageId: conn.platformOpenID,
            name: conn.label ?? "unknown",
            handle: conn.handle ?? "Page",
        }));
        return res.json({ success: true, data });
    } catch (err) {
        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching Facebook information!" });
    }
});

router.delete("/connection/:connectionId", findUserAuth, async (req: AuthUserRequest, res: Response) => {
    const user: IUser = req.user as IUser;
    const connectionId = req.params.connectionId as string;

    try {
        const deleted = await deleteSocialConnection(user._id!.toString(), connectionId);

        if (!deleted)
            return res.status(404).json({ success: false, message: "Connection not found." });

        return res.json({ success: true });
    } catch (err) {
        console.error("Error deleting connection: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when disconnecting account." });
    }
});

router.get("/instagram", findUserAuth, async (req: AuthUserRequest, res: Response) => {
    const user: IUser = req.user as IUser;
    try {
        const connections = await listSocialConnections(user._id.toString(), "instagram");
        const data = connections.map((conn) => ({
            id: conn._id.toString(),
            igId: conn.platformOpenID,
            name: conn.label ?? "unknown",
            handle: conn.handle ?? "Instagram",
        }));
        return res.json({ success: true, data });
    } catch (err) {
        console.error("Error: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error when fetching Instagram information!" });
    }
});

export default router;