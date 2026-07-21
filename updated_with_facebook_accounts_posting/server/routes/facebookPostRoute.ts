import pkg from "express";
import type { Response } from "express";
import multer from "multer";
import { findUserAuth, type AuthUserRequest } from "../middleware/tiktokAuthMiddleware.ts";
import { findOwnedSocialConnection } from "../dbcontrollers/userRepository.ts";
import Post from "../models/post.ts";
import { saveFileToGridFS } from "../server_services/gridfsService.ts";
import { publishFacebookPost } from "../server_services/facebookPostService.ts";

const { Router } = pkg;
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", findUserAuth, upload.single("media"), async (req: AuthUserRequest, res: Response) => {
    const user = req.user!;
    const { title, connectionId, scheduleMode, scheduledDate } = req.body;
    const mediaFile = req.file;

    if (!title || !title.trim())
        return res.status(400).json({ success: false, message: "Post text is required." });

    if (!connectionId)
        return res.status(400).json({ success: false, message: "No Facebook Page specified for this post." });

    const connection = await findOwnedSocialConnection(user._id.toString(), connectionId);
    if (!connection || connection.platform !== "facebook")
        return res.status(400).json({ success: false, message: "Facebook Page not found for this session." });

    const pageID = connection.platformOpenID;
    const pageAccessToken = connection.accessToken;

    try {
        if (scheduleMode === "schedule") {
            const schedule = new Date(scheduledDate);
            if (!scheduledDate || Number.isNaN(schedule.getTime()) || schedule.getTime() <= Date.now()) {
                return res.status(400).json({ success: false, message: "Choose a valid future date and time." });
            }

            const gridfsFileId = mediaFile
                ? await saveFileToGridFS(mediaFile.buffer, mediaFile.originalname, mediaFile.mimetype)
                : undefined;

            const post = await Post.create({
                userID: user._id,
                platform: "facebook",
                connectionId: connection._id,
                postType: mediaFile?.mimetype.startsWith("video/") ? "video" : "photo",
                publishID: "",
                status: "pending",
                scheduledDate: schedule,
                title,
                description: title,
                gridfsFileId,
            });

            return res.json({ success: true, message: "Facebook post scheduled successfully.", data: { postId: post._id } });
        }

        const postID = await publishFacebookPost(pageID, pageAccessToken, title, mediaFile ? {
            buffer: mediaFile.buffer,
            contentType: mediaFile.mimetype,
            filename: mediaFile.originalname,
        } : undefined);

        return res.json({ success: true, data: { postID } });

    } catch (err: any) {
        console.error("Facebook post error: " + (err?.response?.data ? JSON.stringify(err.response.data) : err));
        return res.status(500).json({ success: false, message: "Unexpected error when posting to Facebook!" });
    }
});

export default router;