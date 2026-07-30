import axios from "axios";
import FormData from "form-data";

const FB_API_VERSION = "v21.0";
const FACEBOOK_GRAPH_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

export async function publishFacebookPost(
    pageID: string,
    pageAccessToken: string,
    title: string,
    media?: { buffer: Buffer; contentType: string; filename?: string }
): Promise<string> {
    if (!media) {
        const response = await axios.post(`${FACEBOOK_GRAPH_BASE}/${pageID}/feed`, null, {
            params: { message: title, access_token: pageAccessToken },
        });
        return response.data.id;
    }

    const isVideo = media.contentType.startsWith("video/");
    const form = new FormData();
    form.append("source", media.buffer, {
        filename: media.filename ?? (isVideo ? "scheduled-video.mp4" : "scheduled-image.jpg"),
        contentType: media.contentType,
    });
    form.append(isVideo ? "description" : "caption", title);
    form.append("access_token", pageAccessToken);

    const response = await axios.post(
        `${FACEBOOK_GRAPH_BASE}/${pageID}/${isVideo ? "videos" : "photos"}`,
        form,
        { headers: form.getHeaders() }
    );

    return response.data.id ?? response.data.post_id;
}