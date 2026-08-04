import axios from "axios";
import FormData from "form-data";

const FB_API_VERSION = "v21.0";
const FACEBOOK_GRAPH_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

type MediaFile = {
    buffer: Buffer;
    contentType: string;
    filename?: string;
};


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

            form.append("source", file.buffer, {
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

        const form = new FormData();


        form.append("source", media.buffer, {
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