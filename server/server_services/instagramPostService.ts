import axios from "axios";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

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

export async function publishInstagramMedia(
    igUserId: string,
    accessToken: string,
    caption: string,
    media: { buffer: Buffer; contentType: string; filename?: string }
): Promise<string> {
    const publicMediaDir = path.join(process.cwd(), "publicfiles", "instagram");
    const isVideo = media.contentType.startsWith("video/");
    const suppliedExtension = media.filename?.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "");
    const extension = suppliedExtension || (isVideo ? "mp4" : "jpg");
    const filename = `${crypto.randomUUID()}.${extension}`;
    const savedFilePath = path.join(publicMediaDir, filename);

    try {
        await fs.mkdir(publicMediaDir, { recursive: true });
        await fs.writeFile(savedFilePath, media.buffer);

        const publicUrl = process.env.PUBLIC_URL;
        if (!publicUrl) throw new Error("PUBLIC_URL is required to publish Instagram media.");

        const mediaUrl = `${publicUrl.replace(/\/$/, "")}/publicfiles/instagram/${filename}`;
        const container = await createMediaContainer(igUserId, accessToken, mediaUrl, caption, isVideo);

        let status = await checkContainerStatus(container.id, accessToken);
        let attempts = 0;
        const maxAttempts = 20;

        while (status.status_code === "IN_PROGRESS" && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            status = await checkContainerStatus(container.id, accessToken);
            attempts++;
        }

        if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
            throw new Error(`Instagram failed to process the media (${status.status_code}).`);
        }
        if (status.status_code === "IN_PROGRESS") {
            throw new Error("Instagram is still processing the media after the allowed wait time.");
        }

        return await publishContainer(igUserId, accessToken, container.id);
    } finally {
        await fs.unlink(savedFilePath).catch(() => undefined);
    }
}