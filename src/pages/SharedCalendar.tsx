import React, { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// Import types
import {type ScheduledPost} from "../types/post.ts"

// Import controller and frontend utilities functionsz
import { fetchSharedCalenderToken, fetchUserInfoViaToken } from "../controller/fetchController.ts";
import { mapPostToSchedulePost } from "../frontend_utilities/calendarUtilities.ts";

// Import CalendarGrid from components
import { CalendarGrid } from "../components/CalendarGrid.tsx";

function SharedCalendar(): React.JSX.Element{



    // Stateful const to store information on tokens and sharedPosts
    const [ownerName, setOwnerName] = useState<string>("");
    const {token} = useParams<{token: string}>();
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
    const [postsView, setPostsView] = useState<"pending" | "published">("published");
    const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");



    useEffect(() => {

        // Function to load Shared Posts from Token
        async function loadSharedPosts(){

            try{

                setIsLoading(true);

                // Fetch the sharedCalendarToken to be used from the params
                const [postRes, userRes] = await Promise.all([fetchSharedCalenderToken(String(token), postsView), fetchUserInfoViaToken(String(token))])
                if(!postRes.success) // Check if response was successful
                    throw new Error(postRes.message ?? "Failed to load shared calendar information");

                if(userRes.success)
                    setOwnerName(userRes.data.name)

                // Create a const that mapps the posts from fetch as ScheduledPost array via utility function
                const mappedPosts: ScheduledPost[] = postRes.data.map(mapPostToSchedulePost);

                setScheduledPosts(mappedPosts); // Map to scheduledPosts

            }catch(err){

                setError("Error: " + err);

            }finally{

                setIsLoading(false);

            }


        }


        loadSharedPosts();

    }, [token, postsView]);



    // Return these based on if isLoading or error is true
    if(isLoading && !hasLoadedOnce) {

        setHasLoadedOnce(true);
        return <div className="shared-calendar-loading">Loading calendar...</div>;

    }


    if(error)
        return<>
        
            <div className="shared-calendar-error">

                <h2>This calendar link is invalid or expired!</h2>
                <h4>Please ask owner for a new link for sharing.</h4>

            </div>

        </>


    return(
    <>
    
        <div className = "ap-calendar">

            {/* top bar */}
            <div className="ap-topbar">

                <div>
                    <div className="ap-topbar__brand">
                    Agila<span>Post</span>
                    </div>
                    <div className="ap-topbar__subtitle">Shared Calendar</div>
                </div>

                <div>
                    <div className="ap-topbar__middle">
                    {ownerName && <p>Shared by <span>SampleAccount</span></p>}
                    
                    </div>
                    <div className="ap-topbar__subtitle">Limited view. Posts scheules are subject to change.</div>
                </div>

                <div className="ap-topbar__right">
                    <div className="ap-topbar__meta">Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
                </div>

            </div>

            <div className = "shared-calendar-header">



            </div>

            <CalendarGrid 
            posts={scheduledPosts} 
            readOnly = {false} postsView = {postsView} setPostsView = {setPostsView}></CalendarGrid>

        </div>
    
    </>);


}

export default SharedCalendar;