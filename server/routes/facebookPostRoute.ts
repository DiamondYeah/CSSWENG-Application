import pkg from "express";
import type { Response } from "express";
import multer from "multer";
import axios from "axios";
import { findUserAuth, type AuthUserRequest } from "../middleware/tiktokAuthMiddleware.ts";
import { findOwnedSocialConnection } from "../dbcontrollers/userRepository.ts";

const { Router } = pkg;
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const FB_API_VERSION = "v21.0";
const FACEBOOK_GRAPH_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

router.post("/upload", findUserAuth, upload.single("media"), async (req: AuthUserRequest, res: Response) => {
    const user = req.user!;
    const { title, connectionId } = req.body;
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
        let postID: string;

        if (mediaFile) {
            const isVideo = mediaFile.mimetype.startsWith("video/");
            const endpoint = isVideo ? "videos" : "photos";
            const fieldName = isVideo ? "source" : "source";
            const captionField = isVideo ? "description" : "caption";

            const form = new (await import("form-data")).default();
            form.append(fieldName, mediaFile.buffer, { filename: mediaFile.originalname, contentType: mediaFile.mimetype });
            form.append(captionField, title);
            form.append("access_token", pageAccessToken);

            const response = await axios.post(`${FACEBOOK_GRAPH_BASE}/${pageID}/${endpoint}`, form, {
                headers: form.getHeaders(),
            });

            postID = response.data.id ?? response.data.post_id;
        } else {
            const response = await axios.post(`${FACEBOOK_GRAPH_BASE}/${pageID}/feed`, null, {
                params: { message: title, access_token: pageAccessToken },
            });
            postID = response.data.id;
        }

        return res.json({ success: true, data: { postID } });

    } catch (err: any) {
        console.error("Facebook post error: " + (err?.response?.data ? JSON.stringify(err.response.data) : err));
        return res.status(500).json({ success: false, message: "Unexpected error when posting to Facebook!" });
    }
});

export default router;