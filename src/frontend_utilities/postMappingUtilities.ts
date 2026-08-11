// Import types
import {type Platform} from "../types/account.ts"
import {type ScheduledPost, type PostComment, type PostApprovalStatus} from "../types/post.ts"


// If called, maps any post passed into and converts it into a scheduled post and returns it
// Assumes post has a schedule date
export function mapPostToSchedulePost(post: any): ScheduledPost{

    // Check if post has scheduled date and throw error if it has nones
    if(!post.scheduledDate)
        throw new Error("Passed post has no schedule date!");

    const date = new Date(post.scheduledDate);

    // Map passed comments into scheduled comment format
    const mappedComments: PostComment[] = (post.comments ?? []).map((c: any) => ({

        id: c._id,
        text: c.text,
        createdAt: c.createdAt,

    }));


    // Checks if files is still awaiting schedule and as such the file is in the disk
    const filesOnAwaitingSchedule = post.publishMediaStatus === "awaiting_schedule";

    // Check plural array paths, if empty switch back to the singular localFIlePath
    const rawMediaPath: string[] = filesOnAwaitingSchedule 
        ? (post.localFilePaths?.length ? post.localFilePaths : (post.localFilePath ? [post.localFilePath] : [])) 
        : [];
    
    // Return a mapped version of post instance to ScheduledPost
    return{

        id: post._id,
        accountId: post.platformAccountID,
        platform: post.platform as Platform,
        date: date.toLocaleDateString("en-CA"),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', }),
        title: post.title ?? "No Title",
        snippet: post.description || (post.platform == "tiktok" ? post.title : undefined),

        media: rawMediaPath.map((filePath: string) => {


            const cleanPath = filePath.replace(/\\/g, "/");
            const fileName = cleanPath.split("/").pop();

            let url = "";

            if (post.platform === "tiktok" && post.postType === "photo") {
                url = `${import.meta.env.VITE_API_BASE_URL}/publicfiles/${fileName}`;
            }
            else if (cleanPath.includes("/publicfiles/")) {
                const relativePath = cleanPath.split("/publicfiles/")[1];
                url = `${import.meta.env.VITE_API_BASE_URL}/publicfiles/${relativePath}`;
            } 
            else if (cleanPath.includes("/mediauploads/")) {
                const relativePath = cleanPath.split("/mediauploads/")[1];
                url = `${import.meta.env.VITE_API_BASE_URL}/mediauploads/${relativePath}`;
            } 
            else {
                const fileName = cleanPath.split("/").pop();
                url = `${import.meta.env.VITE_API_BASE_URL}/mediauploads/${fileName}`;
            }

            const type = /\.(mp4|mov|webm)$/i.test(cleanPath)
                ? "video"
                : "image";


            return {
                url,
                type,
            };
        }),

        approvalStatus: (post.postApprovalStatus as PostApprovalStatus) ?? "pending",
        rejectionReason: post.rejectionReason  ?? undefined,
        comments: mappedComments,

    }


}
