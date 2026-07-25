import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { MessageCircle, X, Check, XCircle } from "lucide-react";

// Import types
import {type ScheduledPost} from "../types/post.ts"

// Import controller and frontend utilities functions
import { fetchSharedCalenderToken, fetchUserInfoViaToken } from "../controller/fetchController.ts";
import { mapPostToSchedulePost } from "../frontend_utilities/calendarUtilities.ts";

// Import calendar share actions from fetch controller
import {fetchPostToApprove, fetchPostToReject, fetchAllPostsToApprove, fetchAllPostsToReject, fetchPostToComment} from "../controller/fetchController.ts";

// Import CalendarGrid from components
import { CalendarGrid } from "../components/CalendarGrid.tsx";


// A minimal display label derived from an accountId, since the shared view
// only receives accountId + platform on each post — no account display name.
function accountLabel(accountId: string): string {

    return accountId.replace(/^acc-/, "").replace(/-/g, " ");
    
}


function SharedCalendar(): React.JSX.Element{



    // Stateful const to store information on tokens and sharedPosts
    const [ownerName, setOwnerName] = useState<string>("");
    const {token} = useParams<{token: string}>();
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
    const [postsView, setPostsView] = useState<"pending" | "published">("published");
    const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    // Account filtering — derived from whatever accounts are actually present
    const [checkedAccounts, setCheckedAccounts] = useState<Record<string, boolean>>({});

    // Currently open review panel — null when no post is selected.
    const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
    const [draftComment, setDraftComment] = useState<string>("");
    const [draftRejectionReason, setDraftRejectionReason] = useState<string>("");
    const [showRejectInput, setShowRejectInput] = useState<boolean>(false);


    // Shared calendar action error if an action fails
    const [actionError, setActionError] = useState<string>("");




    // use callback for loadSharedPosts to help optimization by preventing unnedded re-renders
    const loadSharedPosts = useCallback(async() => {

            try{

                setIsLoading(true);
                setError("");

                // Fetch the sharedCalendarToken to be used from the params
                const [postRes, userRes] = await Promise.all([fetchSharedCalenderToken(String(token), postsView), fetchUserInfoViaToken(String(token))])
                if(!postRes.success) // Check if response was successful
                    throw new Error(postRes.message ?? "Failed to load shared calendar information");

                if(userRes.success)
                    setOwnerName(userRes.data.name)

                // Create a const that mapps the posts from fetch as ScheduledPost array via utility function and store it to scheduledPosts
                const mappedPosts: ScheduledPost[] = postRes.data.map(mapPostToSchedulePost);
                setScheduledPosts(mappedPosts);

            }catch(err){

                setError(err instanceof Error ? err.message : "This calendar link is either invalid or expired!")

            }finally{

                setIsLoading(false);
                setHasLoadedOnce(true);

            }


        }, [token, postsView]);


    // Call function whenever theres an update to the function itself
    useEffect(() => {

        loadSharedPosts();

    }, [loadSharedPosts])


    // Seed checkedAccounts once posts load, defaulting every account present to checked.
    useEffect(() => {
        const ids = Array.from(new Set(scheduledPosts.map(p => p.accountId)));
        setCheckedAccounts(prev => {
            const next = { ...prev };
            for (const id of ids) {
                if (!(id in next)) next[id] = true;
            }
            return next;
        });
    }, [scheduledPosts]);

    
    const accountIds = Array.from(new Set(scheduledPosts.map(p => p.accountId)));
    const allChecked = accountIds.length > 0 && accountIds.every(id => checkedAccounts[id] !== false);

    const toggleAccount = (id: string) =>
        setCheckedAccounts(prev => ({ ...prev, [id]: !(prev[id] !== false) }));

    const toggleSelectAll = () =>
        setCheckedAccounts(
            accountIds.reduce((acc, id) => ({ ...acc, [id]: !allChecked }), {} as Record<string, boolean>)
        );

    const visiblePosts = scheduledPosts.filter(p => checkedAccounts[p.accountId] !== false);

    // ---------------------------------------------------------------
    // Approval handlers — front-end only for now, updates local state.
    // ---------------------------------------------------------------

    
    function handlePostUpdate(updatedPost: ScheduledPost) {

        setScheduledPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
        setSelectedPost(prev => prev && prev.id === updatedPost.id ? updatedPost : prev);

    }

    async function handleApprovePost(postID: string) {

        setActionError("");

        try{

            // Call associated function to approve post
            const fetchResult = await fetchPostToApprove(String(token), postID);

            // Throw error if fetch result is not successful
            if(!fetchResult.success)
                throw new Error(fetchResult.message ?? "Faied to approve post!")

            // Perform post update and reset fields
            handlePostUpdate(mapPostToSchedulePost(fetchResult.data));

        }catch(err){

            setActionError(err instanceof Error ? err.message : "Faied to approve post!");

        }

    }

    async function handleRejectPost(postID: string, reason: string) {

        setActionError("");

        try{

            // Call associated function to reject post
            const fetchResult = await fetchPostToReject(String(token), postID, reason);

            // Throw error if fetch result is not successful
            if(!fetchResult.success)
                throw new Error(fetchResult.message ?? "Failed to reject post!")

            // Perform post update and reset fields
            handlePostUpdate(mapPostToSchedulePost(fetchResult.data));
            setShowRejectInput(false);
            setDraftRejectionReason("");

        }catch(err){

            setActionError(err instanceof Error ? err.message : "Failed to reject post!");

        }

    }

    async function handleAddComment(postID: string) {

        // Return if draftComment is empty
        if (!draftComment.trim()){

            setActionError("No comment added. Please enter a comment before posting!");
            return;

        }


        setActionError("");

        try{

            // Call associated function to add comment to post
            const fetchResult = await fetchPostToComment(String(token), postID, draftComment.trim());

            // Throw error if fetch result is not successful
            if(!fetchResult.success)
                throw new Error(fetchResult.message ?? "Failed to create comment on post!")

            // Perform post update and reset fields
            handlePostUpdate(mapPostToSchedulePost(fetchResult.data));
            setDraftComment("");

        }catch(err){

            setActionError(err instanceof Error ? err.message : "Failed to create comment on post!");

        }

    }

    async function handleApproveEntireCalendar() {
        
        setActionError("");

        try{

            // Call associated function to approve all posts
            const fetchResult = await fetchAllPostsToApprove(String(token));

            // Throw error if fetch result is not successful
            if(!fetchResult.success)
                throw new Error(fetchResult.message ?? "Failed to approve all posts!")

            // Call loadSharedPosts to update posts
            await loadSharedPosts();

        }catch(err){

            setActionError(err instanceof Error ? err.message : "Faied to approve all posts!");

        }

    }

    async function handleRejectEntireCalendar() {

        // Ask user for their reason for rejecting entire calendar via prompt
        const reason = window.prompt("Reason for rejecting the entire calendar (optional):") ?? "";

        setActionError("");

        try{

            // Call associated function to reject all posts
            const fetchResult = await fetchAllPostsToReject(String(token), reason);

            // Throw error if fetch result is not successful
            if(!fetchResult.success)
                throw new Error(fetchResult.message ?? "Failed to reject all posts!")

            // Call loadSharedPosts to update posts
            await loadSharedPosts();

        }catch(err){

            setActionError(err instanceof Error ? err.message : "Failed to reject all posts!");

        }

    }



    // Return these based on if isLoading or error is true
    if(isLoading && !hasLoadedOnce) 
        return <div className="shared-calendar-loading">Loading calendar...</div>;


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

            {actionError && (
                <div className = "shared-calendar-action-error">{actionError}</div>
            )}

            {/* top bar */}
            <div className="ap-topbar shared-calendar-topbar">

                <div>
                    <div className="ap-topbar__brand">
                    Agila<span>Post</span>
                    </div>
                    <div className="ap-topbar__subtitle">Shared Calendar</div>
                </div>

                <div>
                    <div className="ap-topbar__middle">
                    {ownerName && <p>Shared by <span>{ownerName}</span></p>}
                    
                    </div>
                    <div className="ap-topbar__subtitle">Limited view. Posts scheules are subject to change.</div>
                </div>

                <div className="ap-topbar__right">
                    <div className="ap-topbar__meta">Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
                    <button className="shared-calendar-approve-all" onClick={handleApproveEntireCalendar}>
                        <Check size={14} />
                        Approve all
                    </button>
                    <button className="shared-calendar-reject-all" onClick={handleRejectEntireCalendar}>
                        <XCircle size={14} />
                        Reject all
                    </button>
                </div>

            </div>

            <div className="ap-body">

                {/* Account filter sidebar — derived from accounts present in the shared posts,
                    since the shared view has no live account-fetching hook of its own. */}
                <aside className="ap-sidebar">
                    <h2 className="ap-sidebar__title">Accounts</h2>

                    <div className="ap-accounts-header">
                        <span className="ap-accounts-header__label">Show</span>
                        {accountIds.length > 0 && (
                            <button className="ap-select-all" onClick={toggleSelectAll}>
                                <span className={`ap-checkbox ${allChecked ? "is-checked" : ""}`}>
                                    {allChecked && <Check size={11} color="#fff" />}
                                </span>
                                Select All
                            </button>
                        )}
                    </div>

                    <div className="ap-accounts-list">
                        {accountIds.length === 0 ? (
                            <div className="ap-accounts-empty">
                                <p className="ap-accounts-empty__text">No accounts in this calendar yet.</p>
                            </div>
                        ) : (
                            accountIds.map((id) => {
                                const checked = checkedAccounts[id] !== false;
                                return (
                                    <label key={id} className="ap-account-row">
                                        <span
                                            className={`ap-account-toggle ${checked ? "is-checked" : ""}`}
                                            onClick={(e) => { e.preventDefault(); toggleAccount(id); }}
                                        >
                                            {checked && <Check size={10} color="#fff" />}
                                        </span>
                                        <span className="ap-account-name">{accountLabel(id)}</span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </aside>

                <CalendarGrid
                    posts={visiblePosts}
                    readOnly = {false}
                    postsView = {postsView}
                    setPostsView = {setPostsView}
                    onSelectPost={(post) => { setSelectedPost(post); setShowRejectInput(false); setDraftRejectionReason(""); }}
                ></CalendarGrid>

            </div>

        </div>

        {/* Review panel — opens when a post card is clicked */}
        {selectedPost && (
            <div className="shared-review-overlay" onClick={() => setSelectedPost(null)}>
                <div className="shared-review-panel" onClick={(e) => e.stopPropagation()}>
                    <div className="shared-review-panel__header">
                        <span>{selectedPost.title ?? "Untitled post"}</span>
                        <button className="shared-review-panel__close" onClick={() => setSelectedPost(null)} aria-label="Close">
                            <X size={16} />
                        </button>
                    </div>

                    {selectedPost.snippet && (
                        <p className="shared-review-panel__snippet">{selectedPost.snippet}</p>
                    )}

                    <div className="shared-review-panel__status">
                        Status: <span className={`shared-review-status is-${selectedPost.approvalStatus ?? "pending"}`}>
                            {selectedPost.approvalStatus ?? "pending"}
                        </span>
                    </div>

                    {selectedPost.approvalStatus === "rejected" && selectedPost.rejectionReason && (
                        <div className="shared-review-panel__rejection-reason">
                            Reason: {selectedPost.rejectionReason}
                        </div>
                    )}

                    <div className="shared-review-panel__actions">
                        <button
                            className="shared-review-panel__approve"
                            onClick={() => handleApprovePost(selectedPost.id)}
                        >
                            <Check size={14} />
                            Approve
                        </button>
                        <button
                            className="shared-review-panel__reject"
                            onClick={() => setShowRejectInput(true)}
                        >
                            <XCircle size={14} />
                            Reject
                        </button>
                    </div>

                    {showRejectInput && (
                        <div className="shared-review-panel__reject-input">
                            <textarea
                                placeholder="Reason for rejecting (optional)"
                                value={draftRejectionReason}
                                onChange={(e) => setDraftRejectionReason(e.target.value)}
                            />
                            <div className="shared-review-panel__reject-input-actions">
                                <button onClick={() => handleRejectPost(selectedPost.id, draftRejectionReason)}>
                                    Confirm reject
                                </button>
                                <button onClick={() => { setShowRejectInput(false); setDraftRejectionReason(""); }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="shared-review-panel__comments">
                        <div className="shared-review-panel__comments-title">
                            <MessageCircle size={14} />
                            Comments
                        </div>
                        {(selectedPost.comments ?? []).length === 0 ? (
                            <p className="shared-review-panel__no-comments">No comments yet.</p>
                        ) : (
                            (selectedPost.comments ?? []).map((c) => (
                                <div key={c.id} className="shared-review-comment">
                                    <span className="shared-review-comment__text">{c.text}</span>
                                </div>
                            ))
                        )}

                        <div className="shared-review-panel__add-comment">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={draftComment}
                                onChange={(e) => setDraftComment(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(selectedPost.id); }}
                            />
                            <button onClick={() => handleAddComment(selectedPost.id)}>Post</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    
    </>);


}

export default SharedCalendar;
