import {useState, useEffect, useCallback} from "react";

// Import controller and utilities functions needed 
import {fetchScheduledPosts} from "../controller/fetchController";
import { mapPostToSchedulePost } from "../frontend_utilities/postMappingUtilities.ts";

// Import types
import {type ScheduledPost} from "../types/post.ts"
import {type PostMediaStatus} from "../types/tiktok.ts"



export function useScheduledPosts(passedStatus: PostMediaStatus){

    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadScheduledPosts = useCallback(async (ignoreRef?: {ignore: boolean}) => {

        try{

            setIsLoading(true);


            const postsFetch = await fetchScheduledPosts(passedStatus)

            // Check if fetch was success
            if(!postsFetch.success)
                throw new Error("Failed to fetch scheduled posts!");

            // Get data of fetch return
            const scheduledPostsInfo = postsFetch.data ?? [];

            // Create a const that maps the posts from fetch as ScheduledPost array
            const mappedPosts: ScheduledPost[] = scheduledPostsInfo.map(mapPostToSchedulePost);

            // Add to scheduledPots
            if(!ignoreRef || !ignoreRef.ignore) 
                setPosts(mappedPosts);


        }
        catch(e){

            if(!ignoreRef || !ignoreRef.ignore) 
                setError(String(e));

        }
        finally{

            if(!ignoreRef || !ignoreRef.ignore) 
                setIsLoading(false);

        }

        

    }, [passedStatus]);


    useEffect(() => {

        // Set ignoreRef to false and call loadScheduledPosts
        const ignoreRef = {ignore: false}
        loadScheduledPosts(ignoreRef);
        return() => {ignoreRef.ignore = true;} // Return if ignore is true

    }, [loadScheduledPosts]);

    // Return result with refetch to manually trigger function
    return {posts, isLoading, error, refetchPosts: loadScheduledPosts};


}