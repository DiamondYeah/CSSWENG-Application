import fs from "fs";
import path from "path";
import pkg from "express";
import type { Response } from "express";
import multer from "multer";
import { findSpecificSocialMediaAccount } from "../dbcontrollers/socialMediaAccountRepository.ts";import { publishInstagramMedia } from "../server_services/instagramPostService.ts";
import Post from "../models/post.ts";
import { findAccountAuth } from "../middleware/accountAuthMiddleware.ts";
import type { AuthUserRequest } from "../types/express.ts";
import { type IAccount } from "../models/account.ts";

const { Router } = pkg;
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", findAccountAuth, upload.single("media"), async (req: AuthUserRequest, res: Response) => {
    const account: IAccount = req.account as IAccount;
    const { title, connectionId, scheduleMode, scheduledDate } = req.body;
    const mediaFile = req.file;

    if (!mediaFile) {
        // Instagram has no text-only post type — every post needs an image or video.
        return res.status(400).json({ success: false, message: "Instagram requires an image or video for every post." });
    }

    if (!connectionId)
        return res.status(400).json({ success: false, message: "No Instagram account specified for this post." });

    const connection = await findSpecificSocialMediaAccount(account._id.toString(), "instagram", connectionId);

    if (!connection || connection.platform !== "instagram")
        return res.status(400).json({
            success: false,
            message: "Instagram account not found."
        });

    const igUserId = connection.platformAccountID;
    const accessToken = connection.accessToken;
    const isVideo = mediaFile.mimetype.startsWith("video/");

    try {
        if (scheduleMode === "schedule") {
            const schedule = new Date(scheduledDate);
            if (!scheduledDate || Number.isNaN(schedule.getTime()) || schedule.getTime() <= Date.now()) {
                return res.status(400).json({ success: false, message: "Choose a valid future date and time." });
            }

            // use local file path
            const uploadDir = path.join(process.cwd(), "publicfiles", "scheduled");
            await fs.promises.mkdir(uploadDir, { recursive: true });

            const filename = `${Date.now()}-${mediaFile.originalname}`;
            const filePath = path.join(uploadDir, filename);

            await fs.promises.writeFile(filePath, mediaFile.buffer);

            const post = await Post.create({
                userID: account._id,
                platform: "instagram",
                platformAccountID: connection.platformAccountID,
                postType: isVideo ? "video" : "photo",
                publishID: "pending",
                status: "pending",
                publishMediaStatus: "awaiting_schedule",
                scheduledDate: schedule,
                title,
                description: title,
                localFilePath: filePath,
            });  

            console.log("Scheduled Instagram post saved:", post._id);

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