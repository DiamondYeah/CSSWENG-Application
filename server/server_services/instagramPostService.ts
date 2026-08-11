import axios from "axios";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const IG_GRAPH_BASE = "https://graph.instagram.com";
const FB_GRAPH_BASE = "https://graph.facebook.com/v21.0";

export interface ContainerResult {
    id: string; // container id
}

// Creates a media container. Instagram needs a publicly reachable URL, not raw binary.
export async function createMediaContainer(
    igUserId: string,
    accessToken: string,
    mediaUrl: string,
    caption: string,
    isVideo: boolean,
    instagramCollaborator?: string,
    useFacebookGraph: boolean = false
): Promise<ContainerResult> {
    const params: Record<string, string> = {
        caption,
        access_token: accessToken,
    };

    if (instagramCollaborator) {
        params.collaborators = JSON.stringify([instagramCollaborator]);
    }


    if (isVideo) {
        params.media_type = "REELS"; // VIDEO type is deprecated; use REELS for all video
        params.video_url = mediaUrl;
    } else {
        params.image_url = mediaUrl;
    }

    console.log("Instagram container params:", params);

    const graphBase = useFacebookGraph ? FB_GRAPH_BASE : IG_GRAPH_BASE;
    
    const response = await axios.post(
        `${graphBase}/${igUserId}/media`,
        null,
        { params }
    );

    console.log("Instagram container response:", response.data);
    
    return response.data; // { id: containerId }
}

export interface ContainerStatus {
    status_code: "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED";
}


export async function checkContainerStatus(
    containerId: string,
    accessToken: string,
    useFacebookGraph: boolean = false
): Promise<ContainerStatus> {

    const graphBase = useFacebookGraph
        ? FB_GRAPH_BASE
        : IG_GRAPH_BASE;

    const response = await axios.get(
        `${graphBase}/${containerId}`,
        {
            params: {
                fields: "status_code",
                access_token: accessToken
            }
        }
    );

    return response.data;
}


export async function publishContainer(
    igUserId: string,
    accessToken: string,
    containerId: string,
    useFacebookGraph: boolean = false
): Promise<string> {

    const graphBase = useFacebookGraph
        ? FB_GRAPH_BASE
        : IG_GRAPH_BASE;

    const response = await axios.post(
        `${graphBase}/${igUserId}/media_publish`,
        null,
        {
            params: {
                creation_id: containerId,
                access_token: accessToken
            }
        }
    );

    return response.data.id;
}

export async function publishInstagramMedia(
    igUserId: string,
    accessToken: string,
    caption: string,
    media: { buffer: Buffer; contentType: string; filename?: string },
    instagramCollaborator?: string,
    useFacebookGraph: boolean = false
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
        const container = await createMediaContainer(igUserId, accessToken, mediaUrl, caption, isVideo, instagramCollaborator, useFacebookGraph);

        let status = await checkContainerStatus(container.id, accessToken, useFacebookGraph);
        console.log("Instagram container status:", status);
        let attempts = 0;
        const maxAttempts = isVideo ? 60 : 20;

        while (status.status_code === "IN_PROGRESS" && attempts < maxAttempts) {

            await new Promise((resolve) => setTimeout(resolve, 3000));

            try {
                status = await checkContainerStatus(
                    container.id,
                    accessToken,
                    false
                );

                console.log("Instagram container status:", status);

            } catch (err: any) {

                console.log(
                    "Instagram status check temporarily failed. Retrying...",
                    err?.response?.data ?? err?.message
                );

                attempts++;
                continue;
            }

            attempts++;
        }

        if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
            throw new Error(`Instagram failed to process the media (${status.status_code}).`);
        }
        if (status.status_code === "IN_PROGRESS") {
            throw new Error("Instagram is still processing the media after the allowed wait time.");
        }


        return await publishContainer(igUserId, accessToken, container.id, useFacebookGraph);
    } finally {
        await fs.unlink(savedFilePath).catch(() => undefined);
    }
}


// carousel publisher function
export async function publishInstagramCarousel(igUserId: string, accessToken: string, caption: string,
    mediaFiles: {
        buffer: Buffer;
        contentType: string;
        filename?: 
        string; 
    }[],
    instagramCollaborator?: string,
    useFacebookGraph: boolean = false

): Promise<string> {


    const publicMediaDir = path.join(
        process.cwd(),
        "publicfiles",
        "instagram"
    );


    await fs.mkdir(publicMediaDir, {recursive:true});


    const children:string[] = [];


    for(const media of mediaFiles){

        const filename = `${crypto.randomUUID()}.jpg`;

        const savedFilePath = path.join(
            publicMediaDir,
            filename
        );


        await fs.writeFile(
            savedFilePath,
            media.buffer
        );


        const publicUrl = process.env.PUBLIC_URL;

        if(!publicUrl)
            throw new Error("PUBLIC_URL missing");


        const mediaUrl =
            `${publicUrl.replace(/\/$/,"")}/publicfiles/instagram/${filename}`;


        console.log("Creating carousel child:", mediaUrl);

        const containerID =
            await uploadInstagramImageContainer(
                igUserId,
                accessToken,
                mediaUrl,
                false
            );
        
        console.log("Carousel child created:", containerID);

        children.push(containerID);
    }

    const graphBase = IG_GRAPH_BASE;

    const carouselResponse = await axios.post(
        `${graphBase}/${igUserId}/media`,
        null,
        {
            params: {
                media_type:"CAROUSEL",
                caption,
                children: children.join(","),
                access_token: accessToken,
                ...(instagramCollaborator
                    ? { collaborators: JSON.stringify([instagramCollaborator]) }
                    : {})
            }
        }
    );

    const carouselContainerId = carouselResponse.data.id;

    let status = await checkContainerStatus(
        carouselContainerId,
        accessToken,
        false
    );

    let attempts = 0;
    const maxAttempts = 20;

    while (status.status_code === "IN_PROGRESS" && attempts < maxAttempts) {

        await new Promise(resolve => setTimeout(resolve, 3000));

        status = await checkContainerStatus(
            carouselContainerId,
            accessToken,
            false
        );        
        
        attempts++;
    }

    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
        throw new Error(`Instagram carousel failed: ${status.status_code}`);
    }

    if (status.status_code === "IN_PROGRESS") {
         throw new Error("Instagram carousel is still processing.");
    }

    return await publishContainer(
         igUserId,
        accessToken,
        carouselContainerId,
        false
    );
}

// image carousel children function
async function uploadInstagramImageContainer( igUserId: string, accessToken: string, mediaUrl: string, useFacebookGraph: boolean = false): Promise<string> {

    const graphBase = useFacebookGraph ? FB_GRAPH_BASE : IG_GRAPH_BASE;

    const response = await axios.post(
        `${graphBase}/${igUserId}/media`,
        null,
        {
            params: {
                image_url: mediaUrl,
                is_carousel_item: "true",
                access_token: accessToken
            }
        }
    );

    return response.data.id;
}

export async function addInstagramFirstComment(
    mediaID: string,
    accessToken: string,
    comment: string
): Promise<string> {

    const response = await axios.post(
        `${IG_GRAPH_BASE}/${mediaID}/comments`,
        null,
        {
            params: {
                message: comment,
                access_token: accessToken
            }
        }
    );

    return response.data.id;
}