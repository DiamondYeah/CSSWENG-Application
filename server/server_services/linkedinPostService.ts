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

    // The created post's URN comes back in the x-restli-id header
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

