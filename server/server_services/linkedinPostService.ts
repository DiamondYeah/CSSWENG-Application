import axios from "axios";

const LINKEDIN_API_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_VERSION = "202601"; // YYYYMM format — check LinkedIn's docs periodically, versions sunset after -> this is the latest
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

export async function registerVideoUpload(
    accessToken: string,
    personURN: string
) {

    const body = {
        registerUploadRequest: {
            recipes: [
                "urn:li:digitalmediaRecipe:feedshare-video"
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
            headers: commonHeaders(accessToken)
        }
    );

    return response.data.value;
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
    asset: string
) {

    const assetId = asset.replace("urn:li:digitalmediaAsset:", "");

    const response = await axios.get(
        `https://api.linkedin.com/v2/assets/${assetId}`,
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

                shareMediaCategory: "VIDEO",

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
        "https://api.linkedin.com/v2/ugcPosts",
        body,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Restli-Protocol-Version": "2.0.0",
                "Content-Type": "application/json"
            }
        }
    );

    return response.headers["x-restli-id"];

}

export async function publishLinkedInMedia(
    accessToken: string,
    personURN: string,
    title: string,
    mediaBuffer: Buffer,
    mimeType: string
): Promise<string> {

    const isPdf = mimeType === "application/pdf"; // added for PDFs
    const isVideo = mimeType.startsWith("video/");

    let uploadInfo;

    if (isPdf) {
        uploadInfo = await initializeDocumentUpload(accessToken, personURN);
    } else if (isVideo) {
        uploadInfo = await registerVideoUpload(accessToken, personURN);
    } else {
        uploadInfo = await registerImageUpload(accessToken, personURN);
    }
    
    let uploadUrl: string;

    if (isPdf) {
        uploadUrl = uploadInfo.uploadUrl;
    } else {
        uploadUrl =
            uploadInfo.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    }

    if (isPdf) {

        await uploadDocumentBinary(
            uploadUrl,
            mediaBuffer,
            mimeType
        );
    } else {

        await uploadImageBinary(
            uploadUrl,
            mediaBuffer,
            mimeType
        );
    }

    let postURN: string;

    if (isPdf) {

        console.log("Waiting for LinkedIn to process document...");

        let documentStatus = "";

        while (documentStatus !== "AVAILABLE") {

            await new Promise(resolve => setTimeout(resolve, 3000));

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

    } else if (isVideo) {

        console.log("Waiting for LinkedIn to process video...");

        let videoStatus = "";

        while (videoStatus !== "AVAILABLE") {

            await new Promise(resolve => setTimeout(resolve, 3000));

            const status = await checkVideoStatus(
                accessToken,
                uploadInfo.asset
            );

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

    return postURN;
}


