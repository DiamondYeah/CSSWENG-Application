// Import types
import {type Platform} from "../types/account.ts"
import {type ScheduledPost} from "../types/post.ts"


// If called, maps any post passed into and converts it into a scheduled post and returns it
// Assumes post has a schedule date
export function mapPostToSchedulePost(post: any): ScheduledPost{

    // Check if post has scheduled date and throw error if it has nones
    if(!post.scheduledDate)
        throw new Error("Passed post has no schedule date!");

    const date = new Date(post.scheduledDate);
    
    // Return a mapped version of post instance to ScheduledPost
    return{

        id: post._id,
        accountId: post.platformAccountID,
        platform: post.platform as Platform,
        date: date.toLocaleDateString("en-CA"),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', }),
        title: post.title ?? "No Title",
        snippet: post.description || undefined,


    }


}
