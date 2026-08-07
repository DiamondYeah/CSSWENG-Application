import pkg from "express";
import type { Response } from "express";
import { ObjectId } from "mongodb";
import { createLinkedInPost, publishLinkedInMedia } from "../server_services/linkedinPostService.ts";
import multer from "multer";
import Post from "../models/post.ts";
import { type IAccount } from "../models/account.ts";
import { findAccountAuth } from "../middleware/accountAuthMiddleware.ts";
import type { AuthUserRequest } from "../types/express.ts";
import { findSpecificSocialMediaAccount } from "../dbcontrollers/socialMediaAccountRepository.ts";
import fs from "fs";
import path from "path";

const { Router } = pkg;
const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
});


router.post("/upload", findAccountAuth, upload.array("media"), async (req: AuthUserRequest, res: Response) => {

    const account: IAccount = req.account as IAccount;
    const { 
        title, 
        connectionId,
        scheduleMode,
        scheduledDate 
    } = req.body;

    console.log("Received scheduled date:", scheduledDate);
    
    const mediaFiles = req.files as Express.Multer.File[];

    console.log("Files received:", mediaFiles.length);

    if (scheduleMode === "schedule") {

        let localFilePath: string | undefined;

        if (mediaFiles.length > 0) {
            const uploadDir = "./mediauploads/";

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(
                uploadDir,
                `${Date.now()}-${mediaFiles[0].originalname}`
            );

            fs.writeFileSync(
                filePath,
                mediaFiles[0].buffer
            );

            localFilePath = filePath;
        }

        const post = await Post.create({
            
            userID: account._id,
            platformAccountID: connectionId,
            platform: "linkedin",
            postType: 
                mediaFiles[0]?.mimetype.startsWith("video/") 
                    ? "video" 
                    : mediaFiles[0]?.mimetype === "application/pdf" 
                        ? "document"
                        : "photo",
            publishID: "pending",
            status: "pending",
            publishMediaStatus: "awaiting_schedule",
            scheduledDate: new Date(`${scheduledDate}+08:00`),
            title,
            description: title,
            localFilePath: localFilePath,
        });

        console.log("Scheduled LinkedIn post saved:", post._id);

        return res.json({
            success: true,
            message: "LinkedIn post scheduled successfully."
        });
    }

    if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: "Post text is required." });
    }

    if (!connectionId) {
        return res.status(400).json({ success: false, message: "No LinkedIn account specified for this post." });
    }

    const connection = await findSpecificSocialMediaAccount(account._id.toString(),"linkedin",connectionId);
    if (!connection || connection.platform !== "linkedin") {
        return res.status(400).json({ success: false, message: "LinkedIn account not found for this session." });
    }

    const personURN = `urn:li:person:${connection.platformAccountID}`;
    const accessToken = connection.accessToken;

try {

    if (mediaFiles.length > 0) {
        console.log("Media uploaded!");
        console.log("Filename:", mediaFiles[0].originalname);
        console.log("MIME Type:", mediaFiles[0].mimetype);
        console.log("Size:", mediaFiles[0].size);

        const postURN = await publishLinkedInMedia(
            accessToken,
            personURN,
            title,
            mediaFiles.map(file => ({
                buffer: file.buffer,
                mimetype: file.mimetype
            }))
        );

        return res.json({
            success: true,
            data: {
                postURN
            }
        });

    } else {
        console.log("No media uploaded.");
    }

    const postURN = await createLinkedInPost(
        accessToken,
        personURN,
        title
    );

    return res.json({
        success: true,
        data: { postURN }
    });


} catch (err: any) {

        console.error("LinkedIn post error: " + (err?.response?.data ? JSON.stringify(err.response.data) : err));
        return res.status(500).json({ success: false, message: "Unexpected error when posting to LinkedIn!" });

    }

});



export default router;
