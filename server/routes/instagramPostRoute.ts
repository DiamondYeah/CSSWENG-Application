import pkg from "express";
import type { Response } from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { findUserAuth, type AuthUserRequest } from "../middleware/tiktokAuthMiddleware.ts";
import { findOwnedSocialConnection } from "../dbcontrollers/userRepository.ts";
import { createMediaContainer, checkContainerStatus, publishContainer } from "../server_services/instagramPostService.ts";

const { Router } = pkg;
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const PUBLIC_MEDIA_DIR = path.join(process.cwd(), "publicfiles", "instagram");

router.post("/upload", findUserAuth, upload.single("media"), async (req: AuthUserRequest, res: Response) => {
    const user = req.user!;
    const { title, connectionId } = req.body;
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

    let savedFilePath: string | null = null;

    try {
        // Instagram's container API needs a public URL, not raw binary — so we
        // temporarily host the uploaded file under /publicfiles/instagram.
        await fs.mkdir(PUBLIC_MEDIA_DIR, { recursive: true });

        const ext = mediaFile.originalname.split(".").pop() || (isVideo ? "mp4" : "jpg");
        const filename = `${crypto.randomUUID()}.${ext}`;
        savedFilePath = path.join(PUBLIC_MEDIA_DIR, filename);

        await fs.writeFile(savedFilePath, mediaFile.buffer);

        const mediaUrl = `${process.env.PUBLIC_URL}/publicfiles/instagram/${filename}`;

        const container = await createMediaContainer(igUserId, accessToken, mediaUrl, title, isVideo);

        // Videos need processing time; poll until FINISHED (or fail on ERROR/EXPIRED).
        let status = await checkContainerStatus(container.id, accessToken);
        let attempts = 0;
        const MAX_ATTEMPTS = 20; // ~60s at 3s intervals

        while (status.status_code === "IN_PROGRESS" && attempts < MAX_ATTEMPTS) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            status = await checkContainerStatus(container.id, accessToken);
            attempts++;
        }

        if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
            return res.status(500).json({ success: false, message: `Instagram failed to process the media (${status.status_code}).` });
        }

        if (status.status_code === "IN_PROGRESS") {
            return res.status(504).json({ success: false, message: "Instagram is still processing the media. Try again shortly." });
        }

        const mediaId = await publishContainer(igUserId, accessToken, container.id);

        return res.json({ success: true, data: { mediaId } });

    } catch (err: any) {
        console.error("Instagram post error: " + (err?.response?.data ? JSON.stringify(err.response.data) : err));
        return res.status(500).json({ success: false, message: "Unexpected error when posting to Instagram!" });
    } finally {
        // Clean up the temp public file regardless of outcome.
        if (savedFilePath) {
            fs.unlink(savedFilePath).catch(() => {});
        }
    }
});

export default router;