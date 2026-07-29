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

router.post("/upload", findAccountAuth, upload.single("media"), async (req: AuthUserRequest, res: Response) => {

    const account: IAccount = req.account as IAccount;
    const { 
        title, 
        connectionId,
        scheduleMode,
        scheduledDate 
    } = req.body;
    
    const mediaFile = req.file;


    if (scheduleMode === "schedule") {

        let localFilePath: string | undefined;

        if (mediaFile) {
            const uploadDir = "./mediauploads/";

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(
                uploadDir,
                `${Date.now()}-${mediaFile.originalname}`
            );

            fs.writeFileSync(
                filePath,
                mediaFile.buffer
            );

            localFilePath = filePath;
        }

        const post = await Post.create({
            
            userID: account._id,
            platformAccountID: connectionId,
            platform: "linkedin",
            postType: 
                mediaFile?.mimetype.startsWith("video/") 
                    ? "video" 
                    : mediaFile?.mimetype === "application/pdf" 
                        ? "document"
                        : "photo",
            publishID: "pending",
            status: "pending",
            publishMediaStatus: "awaiting_schedule",
            scheduledDate: new Date(scheduledDate),
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

    if (mediaFile) {
        console.log("Media uploaded!");
        console.log("Filename:", mediaFile.originalname);
        console.log("MIME Type:", mediaFile.mimetype);
        console.log("Size:", mediaFile.size);

        const postURN = await publishLinkedInMedia(
            accessToken,
            personURN,
            title,
            mediaFile.buffer,
            mediaFile.mimetype
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