import pkg from "express";
import type { Response } from "express";
import { type IUser } from "../models/user.ts";
import { findUserAuth, type AuthUserRequest } from "../middleware/tiktokAuthMiddleware.ts";
import { createLinkedInPost, registerImageUpload, registerVideoUpload, uploadImageBinary, createLinkedInImagePost, createLinkedInVideoPost, checkVideoStatus} from "../server_services/linkedinPostService.ts";
import multer from "multer";
import { findOwnedSocialConnection } from "../dbcontrollers/userRepository.ts";

const { Router } = pkg;
const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
});

router.post("/upload", findUserAuth, upload.single("media"), async (req: AuthUserRequest, res: Response) => {

    const user: IUser = req.user as IUser;
    const { title, connectionId } = req.body;
    const mediaFile = req.file;

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

       const isVideo = mediaFile.mimetype.startsWith("video/");

const uploadInfo = isVideo
    ? await registerVideoUpload(
          accessToken,
          personURN
      )
    : await registerImageUpload(
          accessToken,
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
            accessToken,
            uploadInfo.asset
        );
        console.dir(status, { depth: null });
        console.log(status);

       videoStatus = status.recipes?.[0]?.status;

    }

    console.log("Video is ready!");

    postURN = await createLinkedInVideoPost(
        accessToken,
        personURN,
        title,
        uploadInfo.asset
    );

} else {

    postURN = await createLinkedInImagePost(
        accessToken,
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