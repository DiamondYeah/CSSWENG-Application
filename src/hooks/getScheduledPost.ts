import {useState, useEffect} from "react";

// Import controller and utilities functions needed 
import {fetchScheduledPosts} from "../controller/fetchController";
import { mapPostToSchedulePost } from "../frontend_utilities/calendarUtilities";

// Import types
import {type ScheduledPost} from "../types/post.ts"
import {type PostMediaStatus} from "../types/tiktok.ts"



export function useScheduledPosts(passedStatus: PostMediaStatus){

    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        let ignore = false; // Ignore prevents double checking

        async function loadScheduledPosts(){

            try{

                const postsFetch = await fetchScheduledPosts(passedStatus)

                // Check if fetch was success
                if(!postsFetch.success)
                    throw new Error("Failed to fetch scheduled posts!");

                // Get data of fetch return
                const scheduledPostsInfo = postsFetch.data ?? [];

                // Create a const that mapps the posts from fetch as ScheduledPost array
                const mappedPosts: ScheduledPost[] = scheduledPostsInfo.map(mapPostToSchedulePost);

                // Add to scheduledPots
                if(!ignore) 
                    setPosts(mappedPosts);


            }
            catch(e){

                if(!ignore)
                    setError(String(e));

            }
            finally{

                if(!ignore)
                    setIsLoading(false);

            }

        }

        // Call function
        loadScheduledPosts();
        return() => {ignore = true;} // Return if ignore is true

    }, [passedStatus]);

    // Return result
    return {posts, isLoading, error};


}