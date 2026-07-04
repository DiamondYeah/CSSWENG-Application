import {useState, useEffect} from "react";
import {fetchScheduledPosts} from "../controller/fetchController";

export type Platform = "facebook" | "linkedin" | "instagram" | "tiktok";

export interface ScheduledPost {

  id: string;
  accountId: string;
  platform: Platform;
  date: string;
  time: string;
  title?: string;
  snippet?: string;

}


export function useScheduledPosts(){

    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        let ignore = false; // Ignore prevents double checking

        async function loadScheduledPosts(){

            try{

                const postsFetch = await fetchScheduledPosts()

                // Check if fetch was success
                if(!postsFetch.success)
                    throw new Error("Failed to fetch scheduled posts!");

                // Get data of fetch return
                const scheduledPostsInfo = await postsFetch.data;


                // Create a const that mapps the posts from fetch as ScheduledPost array
                const mappedPosts: ScheduledPost[] = scheduledPostsInfo.map((post: any) => {

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

                });

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

    }, []);

    // Return result
    return {posts, isLoading, error};


}