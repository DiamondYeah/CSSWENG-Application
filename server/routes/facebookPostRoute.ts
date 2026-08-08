import pkg from "express";
import type { Response } from "express";
import multer from "multer";
import Post from "../models/post.ts";
import { publishFacebookPost } from "../server_services/facebookPostService.ts";
import { findAccountAuth } from "../middleware/accountAuthMiddleware.ts";
import type { AuthUserRequest } from "../types/express.ts";
import { type IAccount } from "../models/account.ts";
import { findSpecificSocialMediaAccount } from "../dbcontrollers/socialMediaAccountRepository.ts";

import fs from "fs";
import path from "path";
import { schedule } from "node-cron";

const { Router } = pkg;
const router = Router();
const upload = multer({
    storage: multer.diskStorage({
        destination: "./mediauploads/",
        filename: (_req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        },
    }),
});

router.post("/upload", findAccountAuth, upload.array("media", 10), async (req: AuthUserRequest, res: Response) => {
    const account: IAccount = req.account as IAccount;
    const { title, connectionId, scheduleMode, scheduledDate } = req.body;
    const mediaFiles = req.files as Express.Multer.File[] || [];

    const mediaFile = (mediaFiles.length === 1) ? mediaFiles[0] : undefined;

    if (!title || !title.trim())
        return res.status(400).json({ success: false, message: "Post text is required." });

    if (!connectionId)
        return res.status(400).json({ success: false, message: "No Facebook Page specified for this post." });

    const connection = await findSpecificSocialMediaAccount(
        account._id.toString(),
        "facebook",
        connectionId
    );

    if (!connection || connection.platform !== "facebook") {
        return res.status(400).json({
            success: false,
            message: "Facebook Page not found for this session."
        });
    }

    const pageID = connection.platformAccountID;
    const pageAccessToken = connection.accessToken;

    try {
        
        if (scheduleMode === "schedule") {

            const localFilePaths: string[] = [];

            for (const file of mediaFiles) {
                localFilePaths.push(file.path);
            }

            const post = await Post.create({

                userID: account._id,
                platformAccountID: connectionId,
                platform: "facebook",
                postType: mediaFiles[0]?.mimetype.startsWith("video/")
                    ? "video"
                    : "photo",
                publishID: "pending",
                status: "pending",
                publishMediaStatus: "awaiting_schedule",
                scheduledDate: new Date(scheduledDate),
                title,
                description: title,
                localFilePaths: localFilePaths,
            
            });

            console.log("Scheduled Facebook post saved:", post._id);

            return res.json({
                success: true,
                message: "Facebook post scheduled successfully."
            });
        }

        const formattedMediaFiles = mediaFiles.map(file => ({
            path: file.path,
            contentType: file.mimetype,
            filename: file.originalname,
        }));

        const postID = await publishFacebookPost(
            pageID,
            pageAccessToken,
            title,
            formattedMediaFiles.length === 1 
                ? formattedMediaFiles[0]
                : undefined,
            formattedMediaFiles.length > 1
                ? formattedMediaFiles
                : undefined
        );

        return res.json({ success: true, data: { postID } });

    } catch (err: any) {
        console.error("Facebook post error: " + (err?.response?.data ? JSON.stringify(err.response.data) : err));
        return res.status(500).json({ success: false, message: "Unexpected error when posting to Facebook!" });
    }
});

export default router;