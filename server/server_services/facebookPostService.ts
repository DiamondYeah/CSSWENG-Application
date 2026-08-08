import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const FB_API_VERSION = "v21.0";
const FACEBOOK_GRAPH_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

type MediaFile = {
    buffer?: Buffer;
    path?: string;
    contentType: string;
    filename?: string;
};

function getMediaBuffer(media: MediaFile): Buffer {
    if (media.buffer) {
        return media.buffer;
    }

    if (media.path) {
        return fs.readFileSync(media.path);
    }

    throw new Error("Facebook media file has no buffer or path.");
}


async function uploadFacebookVideo(
    pageID: string,
    pageAccessToken: string,
    filePath: string,
    description: string
): Promise<string> {

    const fileSize = fs.statSync(filePath).size;

    console.log("Starting Facebook resumable video upload...");
    console.log("Video size:", fileSize);

    const startResponse = await axios.post(
        `${FACEBOOK_GRAPH_BASE}/${pageID}/videos`,
        null,
        {
            params: {
                upload_phase: "start",
                file_size: fileSize,
                access_token: pageAccessToken
            }
        }
    );

    const {
        upload_session_id,
        video_id,
        start_offset,
        end_offset
    } = startResponse.data;

    console.log("Facebook upload session:", upload_session_id);

    let currentOffset = Number(start_offset);
    let currentEndOffset = Number(end_offset);

    const fileHandle = await fs.promises.open(filePath, "r");

    try {

        while (currentOffset < fileSize) {

            const chunkSize = currentEndOffset - currentOffset;

            console.log(
                `Uploading Facebook chunk: ${currentOffset}-${currentEndOffset}`
            );

            const chunkBuffer = Buffer.alloc(chunkSize);

            await fileHandle.read(
                chunkBuffer,
                0,
                chunkSize,
                currentOffset
            );

            const form = new FormData();

            form.append(
                "video_file_chunk",
                chunkBuffer,
                {
                    filename: "video_chunk",
                    contentType: "application/octet-stream"
                }
            );

            form.append("upload_phase", "transfer");
            form.append("upload_session_id", upload_session_id);
            form.append("start_offset", currentOffset.toString());
            form.append("access_token", pageAccessToken);

            const transferResponse = await axios.post(
                `${FACEBOOK_GRAPH_BASE}/${pageID}/videos`,
                form,
                {
                    headers: form.getHeaders()
                }
            );

            currentOffset = Number(
                transferResponse.data.start_offset
            );

            currentEndOffset = Number(
                transferResponse.data.end_offset
            );

            console.log(
                `Facebook upload progress: ${currentOffset}/${fileSize}`
            );
        }

    } finally {

        await fileHandle.close();

    }

    console.log("Finishing Facebook video upload...");

    const finishResponse = await axios.post(
        `${FACEBOOK_GRAPH_BASE}/${pageID}/videos`,
        null,
        {
            params: {
                upload_phase: "finish",
                upload_session_id,
                description,
                access_token: pageAccessToken
            }
        }
    );

    console.log("Facebook video upload finished.");

    return finishResponse.data.id ?? video_id;
}

export async function publishFacebookPost(
    pageID: string,
    pageAccessToken: string,
    title: string,
    media?: MediaFile,
    mediaFiles?: MediaFile[]
): Promise<string> {


    // Text-only post
    if (!media && (!mediaFiles || mediaFiles.length === 0)) {

        const response = await axios.post(
            `${FACEBOOK_GRAPH_BASE}/${pageID}/feed`,
            null,
            {
                params: {
                    message: title,
                    access_token: pageAccessToken,
                },
            }
        );

        return response.data.id;
    }



    // Multiple image upload
    if (mediaFiles && mediaFiles.length > 1 && mediaFiles.every(file => file.contentType.startsWith("image/"))) {

        const uploadedMediaIDs: string[] = [];


        for (const file of mediaFiles) {

            const form = new FormData();

            form.append("source", getMediaBuffer(file), {
                filename: file.filename ?? "image.jpg",
                contentType: file.contentType,
            });


            // Upload image but do not publish
            form.append("published", "false");
            form.append("access_token", pageAccessToken);


            const response = await axios.post(
                `${FACEBOOK_GRAPH_BASE}/${pageID}/photos`,
                form,
                {
                    headers: form.getHeaders()
                }
            );


            uploadedMediaIDs.push(response.data.id);
        }



        // Attach uploaded images into one Facebook post
        const attachedMedia = uploadedMediaIDs.map(id => ({
            media_fbid: id
        }));


        const postResponse = await axios.post(
            `${FACEBOOK_GRAPH_BASE}/${pageID}/feed`,
            null,
            {
                params: {
                    message: title,
                    attached_media: attachedMedia,
                    access_token: pageAccessToken
                }
            }
        );


        return postResponse.data.id;
    }



    // Existing single image/video upload
    if (media) {

        const isVideo = media.contentType.startsWith("video/");

        if (isVideo && media.path) {

            return await uploadFacebookVideo(
                pageID,
                pageAccessToken,
                media.path,
                title
            );
        }

        const form = new FormData();


        form.append("source", getMediaBuffer(media), {
            filename: media.filename ?? (
                isVideo
                ? "scheduled-video.mp4"
                : "scheduled-image.jpg"
            ),
            contentType: media.contentType,
        });


        form.append(
            isVideo ? "description" : "caption",
            title
        );


        form.append(
            "access_token",
            pageAccessToken
        );


        const response = await axios.post(
            `${FACEBOOK_GRAPH_BASE}/${pageID}/${isVideo ? "videos" : "photos"}`,
            form,
            {
                headers: form.getHeaders()
            }
        );


        return response.data.id ?? response.data.post_id;
    }


    throw new Error("Invalid Facebook media input");
}