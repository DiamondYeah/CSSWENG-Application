import pkg from "express";
import type { Response } from "express";
import multer from "multer";
import { findUserAuth, type AuthUserRequest } from "../middleware/tiktokAuthMiddleware.ts";
import { findOwnedSocialConnection } from "../dbcontrollers/userRepository.ts";
import { publishInstagramMedia } from "../server_services/instagramPostService.ts";
import { saveFileToGridFS } from "../server_services/gridfsService.ts";
import Post from "../models/post.ts";

const { Router } = pkg;
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", findUserAuth, upload.single("media"), async (req: AuthUserRequest, res: Response) => {
    const user = req.user!;
    const { title, connectionId, scheduleMode, scheduledDate } = req.body;
    const mediaFile = req.file;

    if (!mediaFile) {
        // Instagram has no text-only post type — every post needs an image or video.
        return res.status(400).json({ success: false, message: "Instagram requires an image or video for every post." });
    }

    if (!connectionId)
        return res.status(400).json({ success: false, message: "No Instagram account specified for this post." });

    const connection = await findOwnedSocialConnection(user._id.toString(), connectionId);
    if (!connection || connection.platform !== "instagram")
        return res.status(400).json({ success: false, message: "Instagram account not found for this session." });

    const igUserId = connection.platformOpenID;
    const accessToken = connection.accessToken;
    const isVideo = mediaFile.mimetype.startsWith("video/");

    try {
        if (scheduleMode === "schedule") {
            const schedule = new Date(scheduledDate);
            if (!scheduledDate || Number.isNaN(schedule.getTime()) || schedule.getTime() <= Date.now()) {
                return res.status(400).json({ success: false, message: "Choose a valid future date and time." });
            }

            const gridfsFileId = await saveFileToGridFS(mediaFile.buffer, mediaFile.originalname, mediaFile.mimetype);
            const post = await Post.create({
                userID: user._id,
                platform: "instagram",
                connectionId: connection._id,
                postType: isVideo ? "video" : "photo",
                publishID: "",
                status: "pending",
                scheduledDate: schedule,
                title,
                description: title,
                gridfsFileId,
            });

            return res.json({ success: true, message: "Instagram post scheduled successfully.", data: { postId: post._id } });
        }

        const mediaId = await publishInstagramMedia(igUserId, accessToken, title, {
            buffer: mediaFile.buffer,
            contentType: mediaFile.mimetype,
            filename: mediaFile.originalname,
        });

        return res.json({ success: true, data: { mediaId } });

    } catch (err: any) {
        console.error("Instagram post error: " + (err?.response?.data ? JSON.stringify(err.response.data) : err));
        return res.status(500).json({ success: false, message: "Unexpected error when posting to Instagram!" });
    }
});

export default router;