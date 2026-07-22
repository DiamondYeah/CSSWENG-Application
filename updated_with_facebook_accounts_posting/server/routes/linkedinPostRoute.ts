import pkg from "express";
import type { Response } from "express";
import { ObjectId } from "mongodb";
import { type IUser } from "../models/user.ts";
import { findUserAuth, type AuthUserRequest } from "../middleware/tiktokAuthMiddleware.ts";
import { createLinkedInPost, publishLinkedInMedia } from "../server_services/linkedinPostService.ts";
import multer from "multer";
import { findOwnedSocialConnection } from "../dbcontrollers/userRepository.ts";
import Post from "../models/post.ts";
import { saveFileToGridFS, getFileFromGridFS } from "../server_services/gridfsService.ts";


const { Router } = pkg;
const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
});

router.post("/upload", findUserAuth, upload.single("media"), async (req: AuthUserRequest, res: Response) => {

    const user: IUser = req.user as IUser;
    const { 
        title, 
        connectionId,
        scheduleMode,
        scheduledDate 
    } = req.body;
    
    const mediaFile = req.file;


    if (scheduleMode === "schedule") {

        let gridfsFileId;

        if (mediaFile) {

            gridfsFileId = await saveFileToGridFS(mediaFile.buffer, mediaFile.originalname, mediaFile.mimetype);
            
            console.log("Saved media to GridFS:", gridfsFileId);
        }

        const post = await Post.create({
            
            userID: user._id,
            platform: "linkedin",
            connectionId,
            postType: mediaFile?.mimetype.startsWith("video/") ? "video" : "photo",
            publishID: "",
            status: "pending",
            scheduledDate: new Date(scheduledDate),
            title,
            description: title,
            gridfsFileId

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

    const connection = await findOwnedSocialConnection(user._id.toString(), connectionId);
    if (!connection || connection.platform !== "linkedin") {
        return res.status(400).json({ success: false, message: "LinkedIn account not found for this session." });
    }

    const personURN = `urn:li:person:${connection.platformOpenID}`;
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

router.get("/media/:fileId", async (req, res) => {

    try {

        const media = await getFileFromGridFS(
            new ObjectId(req.params.fileId)
        );

        res.setHeader("Content-Type", media.contentType);

        return res.send(media.buffer);

    } catch (err) {

        console.error(err);

        return res.status(404).json({
            success: false,
            message: "Media not found."
        });

    }

});

export default router;