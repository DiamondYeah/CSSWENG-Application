import pkg from "express";
import type { Response } from "express";

import { type IUser } from "../models/user.ts";
import { findUserAuth, type AuthUserRequest } from "../middleware/tiktokAuthMiddleware.ts";
import { createLinkedInPost, registerImageUpload, registerVideoUpload, uploadImageBinary, createLinkedInImagePost, createLinkedInVideoPost, checkVideoStatus} from "../server_services/linkedinPostService.ts";

import multer from "multer";

const { Router } = pkg;
const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
});

router.post("/upload", findUserAuth, upload.single("media"), async (req: AuthUserRequest, res: Response) => {

    const user: IUser = req.user as IUser;

    // This route is LinkedIn-only — bail early if the session's user has no LinkedIn identity
    if (!user.linkedinOpenID || !user.accessToken) {
        return res.status(400).json({ success: false, message: "No LinkedIn account linked for this session." });
    }

    const { title } = req.body;
    const mediaFile = req.file;

    if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: "Post text is required." });
    }

    const personURN = `urn:li:person:${user.linkedinOpenID}`;

try {

    if (mediaFile) {
        console.log("Media uploaded!");
        console.log("Filename:", mediaFile.originalname);
        console.log("MIME Type:", mediaFile.mimetype);
        console.log("Size:", mediaFile.size);

       const isVideo = mediaFile.mimetype.startsWith("video/");

const uploadInfo = isVideo
    ? await registerVideoUpload(
          user.accessToken,
          personURN
      )
    : await registerImageUpload(
          user.accessToken,
          personURN
      );

const uploadRequest =
    uploadInfo.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ];
console.dir(uploadRequest, { depth: null });

await uploadImageBinary(
    uploadRequest.uploadUrl,
    mediaFile.buffer,
    mediaFile.mimetype,
    
);

let postURN: string;

if (isVideo) {

    console.log("Waiting for LinkedIn to process video...");

    let videoStatus = "";

    while (videoStatus !== "AVAILABLE") {

        await new Promise(resolve => setTimeout(resolve, 3000));

        const status = await checkVideoStatus(
            user.accessToken,
            uploadInfo.asset
        );
        console.dir(status, { depth: null });
        console.log(status);

       videoStatus = status.recipes?.[0]?.status;

    }

    console.log("Video is ready!");

    postURN = await createLinkedInVideoPost(
        user.accessToken,
        personURN,
        title,
        uploadInfo.asset
    );

} else {

    postURN = await createLinkedInImagePost(
        user.accessToken,
        personURN,
        title,
        uploadInfo.asset
    );

}

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
        user.accessToken,
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