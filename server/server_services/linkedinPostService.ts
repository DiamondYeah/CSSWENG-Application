import axios from "axios";
import fs from "fs";

const LINKEDIN_API_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_VERSION = "202607"; // YYYYMM format — check LinkedIn's docs periodically, versions sunset after -> this is the latest
const LINKEDIN_UGC_POSTS_URL = "https://api.linkedin.com/v2/ugcPosts";

const commonHeaders = (accessToken: string) => ({
    "Authorization": `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json"
});

// Creates a text-only LinkedIn post on behalf of the given person
export async function createLinkedInPost(accessToken: string, personURN: string, commentary: string) {

    const body = {
        author: personURN,
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                    text: commentary
                },
                shareMediaCategory: "NONE"
            }
        },
        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    const response = await axios.post(
        LINKEDIN_UGC_POSTS_URL,
        body,
        {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
        }
    );

    return response.headers["x-restli-id"];
}


export async function registerImageUpload(
    accessToken: string,
    personURN: string
) {

    const body = {
        registerUploadRequest: {
            recipes: [
                "urn:li:digitalmediaRecipe:feedshare-image"
            ],
            owner: personURN,
            serviceRelationships: [
                {
                    relationshipType: "OWNER",
                    identifier: "urn:li:userGeneratedContent"
                }
            ]
        }
    };

    const response = await axios.post(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        body,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Restli-Protocol-Version": "2.0.0",
                "Content-Type": "application/json"
            }
        }
    );

    return response.data.value;

}

export async function uploadImageBinary(
    uploadUrl: string,
    buffer: Buffer,
    contentType: string
) {

    await axios.put(
        uploadUrl,
        buffer,
        {
            headers: {
                "Content-Type": contentType
            }
        }
    );

}

// to upload PDF bytes
export async function uploadDocumentBinary(uploadUrl: string, buffer: Buffer, contentType: string) {

    await axios.put(
        uploadUrl,
        buffer,
        {
            headers: {
                "Content-Type": contentType
            }
        }
    );

}


// check document status if ready to upload
export async function checkDocumentStatus(accessToken: string, documentURN: string) {

    const response = await axios.get(
        `${LINKEDIN_API_BASE}/documents/${encodeURIComponent(documentURN)}`,
        {
            headers: commonHeaders(accessToken)
        }
    );

    return response.data;

}


// creating the actual document post
// based on Documents API request format
export async function createLinkedInDocumentPost(accessToken: string, personURN: string, commentary: string, title: string, documentURN: string) {

    const body = {
        author: personURN,
        commentary,
        visibility: "PUBLIC",

        distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: []
        },

        content: {
            media: {
                title,
                id: documentURN
            }
        },

        lifecycleState: "PUBLISHED",
    };

    const response = await axios.post(
        `${LINKEDIN_API_BASE}/posts`,
        body,
        {
            headers: commonHeaders(accessToken)
        }
    );

    return response.headers["x-restli-id"];
}


export async function createLinkedInImagePost(
    accessToken: string,
    personURN: string,
    commentary: string,
    asset: string
) {

    const body = {
        author: personURN,
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                    text: commentary
                },
                shareMediaCategory: "IMAGE",
                media: [
                    {
                        status: "READY",
                        media: asset
                    }
                ]
            }
        },
        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    const response = await axios.post(
        LINKEDIN_UGC_POSTS_URL,
        body,
        {
            headers: commonHeaders(accessToken)
        }
    );

    return response.headers["x-restli-id"];

}

export async function initializeVideoUpload(
    accessToken: string,
    personURN: string,
    fileSizeBytes: number
) {
    const body = {
        initializeUploadRequest: {
            owner: personURN,
            fileSizeBytes,
            uploadCaptions: false,
            uploadThumbnail: false
        }
    };

    const response = await axios.post(
        `${LINKEDIN_API_BASE}/videos?action=initializeUpload`,
        body,
        {
            headers: commonHeaders(accessToken)
        }
    );

    return response.data.value;
}


export async function uploadVideoInChunks(
    filePath: string,
    uploadInfo: {
        video: string;
        uploadToken: string;
        uploadInstructions: {
            uploadUrl: string;
            firstByte: number;
            lastByte: number;
        }[];
    }
) {
    const fileHandle = await fs.promises.open(filePath, "r");
    const uploadedPartIds: string[] = [];

    try {
        for (const instruction of uploadInfo.uploadInstructions) {
            const { uploadUrl, firstByte, lastByte } = instruction;

            const bytesToRead = lastByte - firstByte + 1;

            // Allocate memory for ONLY this part
            const chunkBuffer = Buffer.alloc(bytesToRead);

            // Read ONLY this byte range from the video
            await fileHandle.read(
                chunkBuffer,
                0,
                bytesToRead,
                firstByte
            );

            // Upload this part to LinkedIn
            const response = await axios.put(
                uploadUrl,
                chunkBuffer,
                {
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": `${bytesToRead}`
                    },
                    validateStatus: status => status >= 200 && status < 300
                }
            );

            const etag = response.headers["etag"];

            if (!etag) {
                throw new Error(
                    `LinkedIn did not return an ETag for bytes ${firstByte}-${lastByte}`
                );
            }

            // LinkedIn expects the ETag without quotation marks
            uploadedPartIds.push(etag.replace(/"/g, ""));
        }
    } finally {
        await fileHandle.close();
    }

    return uploadedPartIds;
}


export async function finalizeVideoUpload(
    accessToken: string,
    video: string,
    uploadToken: string,
    uploadedPartIds: string[]
) {
    const body = {
        finalizeUploadRequest: {
            video,
            uploadToken,
            uploadedPartIds
        }
    };

    const response = await axios.post(
        `${LINKEDIN_API_BASE}/videos?action=finalizeUpload`,
        body,
        {
            headers: commonHeaders(accessToken)
        }
    );

    return response.data;
}



// to handle document uploads
export async function initializeDocumentUpload(accessToken: string, personURN: string) {

    const body = {
        initializeUploadRequest: {
            owner: personURN
        }
    };

    const response = await axios.post(
        `${LINKEDIN_API_BASE}/documents?action=initializeUpload`,
        body,
        {
            headers: commonHeaders(accessToken)
        }
    );

    console.log("Document upload response:");
    console.dir(response.data, { depth: null });

    return response.data.value;
}


export async function checkVideoStatus(
    accessToken: string,
    videoURN: string
) {

    const response = await axios.get(
        `${LINKEDIN_API_BASE}/videos/${encodeURIComponent(videoURN)}`,
        {
            headers: commonHeaders(accessToken)
        }
    );

    return response.data;
}


export async function createLinkedInVideoPost(
    accessToken: string,
    personURN: string,
    commentary: string,
    videoURN: string
) {
    const body = {
        author: personURN,
        commentary,
        visibility: "PUBLIC",

        distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: []
        },

        content: {
            media: {
                title: commentary,
                id: videoURN
            }
        },

        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false
    };

    const response = await axios.post(
        `${LINKEDIN_API_BASE}/posts`,
        body,
        {
            headers: commonHeaders(accessToken)
        }
    );

    return response.headers["x-restli-id"];
}


export async function publishLinkedInMedia(
    accessToken: string,
    personURN: string,
    title: string,
    mediaFiles: {
        buffer?: Buffer;
        mimetype: string;
        path?: string;
    }[]
): Promise<string> {

    const isMultipleImages =
        mediaFiles.length > 1 &&
        mediaFiles.every(file => file.mimetype.startsWith("image/"));

    const isPdf = mediaFiles[0].mimetype === "application/pdf";
    const isVideo = mediaFiles[0].mimetype.startsWith("video/");

    let uploadInfo;

    if (isPdf) {

        uploadInfo = await initializeDocumentUpload(
            accessToken,
            personURN
        );

    } else if (isVideo) {

        const videoFile = mediaFiles[0];

        if (!videoFile.path) {
            throw new Error("Video file path is missing");
        }

        const fileStats = await fs.promises.stat(videoFile.path);

        uploadInfo = await initializeVideoUpload(
            accessToken,
            personURN,
            fileStats.size
        );

    } else {

        uploadInfo = await registerImageUpload(
            accessToken,
            personURN
        );
    }
    if (isPdf) {

        const pdfFile = mediaFiles[0];

        if (!pdfFile.path) {
            throw new Error("PDF file path is missing");
        }

        const pdfBuffer = await fs.promises.readFile(
            pdfFile.path
        );

        await uploadDocumentBinary(
            uploadInfo.uploadUrl,
            pdfBuffer,
            pdfFile.mimetype
        );
    }
    else if (isVideo) {

        const videoFile = mediaFiles[0];

        if (!videoFile.path) {
            throw new Error("Video file path is missing");
        }

        console.log("Uploading LinkedIn video in chunks...");

        const uploadedPartIds = await uploadVideoInChunks(
            videoFile.path,
            uploadInfo
        );

        console.log("All video chunks uploaded.");

        await finalizeVideoUpload(
            accessToken,
            uploadInfo.video,
            uploadInfo.uploadToken,
            uploadedPartIds
        );

        console.log("LinkedIn video upload finalized.");
    }
    else {

        const imageFile = mediaFiles[0];

        if (!imageFile.path) {
            throw new Error("Image file path is missing");
        }

        const imageBuffer = await fs.promises.readFile(
            imageFile.path
        );

        const uploadUrl =
            uploadInfo.uploadMechanism[
                "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
            ].uploadUrl;

        await uploadImageBinary(
            uploadUrl,
            imageBuffer,
            imageFile.mimetype
        );
    }

    if (isMultipleImages) {

        const assets: string[] = [];

        for (const file of mediaFiles) {

            if (!file.path) {
                throw new Error("Image file path is missing");
            }

            const uploadInfo = await registerImageUpload(
                accessToken,
                personURN
            );

            const uploadUrl =
                uploadInfo.uploadMechanism[
                    "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
                ].uploadUrl;

            const imageBuffer = await fs.promises.readFile(
                file.path
            );

            await uploadImageBinary(
                uploadUrl,
                imageBuffer,
                file.mimetype
            );

            assets.push(uploadInfo.asset);
        }

        return await createLinkedInMultiImagePost(
            accessToken,
            personURN,
            title,
            assets
        );
    }

    let postURN: string;


    if (isPdf) {

        console.log("Waiting for LinkedIn to process document...");

        let documentStatus = "";

        while (documentStatus !== "AVAILABLE") {

            await new Promise(resolve =>
                setTimeout(resolve, 3000)
            );

            const status = await checkDocumentStatus(
                accessToken,
                uploadInfo.document
            );

            documentStatus = status.status;
        }

        console.log("Document is ready!");

        postURN = await createLinkedInDocumentPost(
            accessToken,
            personURN,
            title,
            title,
            uploadInfo.document
        );
    }
    else if (isVideo) {

        console.log("Waiting for LinkedIn to process video...");

        let videoStatus = "";

        while (videoStatus !== "AVAILABLE") {

            await new Promise(resolve =>
                setTimeout(resolve, 3000)
            );

            const status = await checkVideoStatus(
                accessToken,
                uploadInfo.video
            );

            videoStatus = status.status;

            if (videoStatus === "PROCESSING_FAILED") {
                throw new Error(
                    "LinkedIn video processing failed."
                );
            }
        }

        console.log("Video is ready!");

        postURN = await createLinkedInVideoPost(
            accessToken,
            personURN,
            title,
            uploadInfo.video
        );
    }

    else {

        postURN = await createLinkedInImagePost(
            accessToken,
            personURN,
            title,
            uploadInfo.asset
        );
    }

    return postURN;
}


export async function createLinkedInMultiImagePost(
    accessToken: string,
    personURN: string,
    commentary: string,
    assets: string[]
) {

    const body = {
        author: personURN,
        lifecycleState: "PUBLISHED",

        specificContent: {
            "com.linkedin.ugc.ShareContent": {

                shareCommentary: {
                    text: commentary
                },

                shareMediaCategory: "IMAGE",

                media: assets.map(asset => ({
                    status: "READY",
                    media: asset
                }))
            }
        },

        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    const response = await axios.post(
        LINKEDIN_UGC_POSTS_URL,
        body,
        {
            headers: commonHeaders(accessToken)
        }
    );

    return response.headers["x-restli-id"];
}