import axios from "axios";

const IG_GRAPH_BASE = "https://graph.instagram.com";

export interface ContainerResult {
    id: string; // container id
}

// Creates a media container. Instagram needs a publicly reachable URL, not raw binary.
export async function createMediaContainer(
    igUserId: string,
    accessToken: string,
    mediaUrl: string,
    caption: string,
    isVideo: boolean
): Promise<ContainerResult> {
    const params: Record<string, string> = {
        caption,
        access_token: accessToken,
    };

    if (isVideo) {
        params.media_type = "REELS"; // VIDEO type is deprecated; use REELS for all video
        params.video_url = mediaUrl;
    } else {
        params.image_url = mediaUrl;
    }

    const response = await axios.post(`${IG_GRAPH_BASE}/${igUserId}/media`, null, { params });
    return response.data; // { id: containerId }
}

export interface ContainerStatus {
    status_code: "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED";
}

export async function checkContainerStatus(containerId: string, accessToken: string): Promise<ContainerStatus> {
    const response = await axios.get(`${IG_GRAPH_BASE}/${containerId}`, {
        params: { fields: "status_code", access_token: accessToken },
    });
    return response.data;
}

export async function publishContainer(igUserId: string, accessToken: string, containerId: string): Promise<string> {
    const response = await axios.post(`${IG_GRAPH_BASE}/${igUserId}/media_publish`, null, {
        params: { creation_id: containerId, access_token: accessToken },
    });
    return response.data.id; // published media id
}