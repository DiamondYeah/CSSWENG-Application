import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MessageCircle, X, Check, XCircle } from "lucide-react";

// Import types
import {type ScheduledPost, type PostComment} from "../types/post.ts"

// Import controller and frontend utilities functionsz
import { fetchSharedCalenderToken, fetchUserInfoViaToken } from "../controller/fetchController.ts";
import { mapPostToSchedulePost } from "../frontend_utilities/calendarUtilities.ts";

// Import CalendarGrid from components
import { CalendarGrid } from "../components/CalendarGrid.tsx";

// ---------------------------------------------------------------
// Sample posts — front-end only, since the real shared-calendar
// backend fetch isn't wired up yet. These populate when the real
// fetch fails or returns nothing, so the review UI is testable
// without a working backend. Spans a mix of approval states and
// two different accounts, so account filtering is testable too.
// ---------------------------------------------------------------

const SAMPLE_POSTS: ScheduledPost[] = [
    {
        id: "sample-1",
        accountId: "acc-demo-1",
        platform: "tiktok",
        date: new Date().toISOString().split("T")[0],
        time: "10:00 AM",
        title: "Behind the scenes at our studio",
        snippet: "Take a look at how we prep every shoot before going live...",
        approvalStatus: "pending",
        comments: [],
    },
    {
        id: "sample-2",
        accountId: "acc-demo-1",
        platform: "tiktok",
        date: new Date().toISOString().split("T")[0],
        time: "02:30 PM",
        title: "New product drop",
        snippet: "Our summer collection just landed.",
        approvalStatus: "approved",
        comments: [
            { id: "c1", text: "Love this one, ship it!", createdAt: new Date().toISOString() },
        ],
    },
    {
        id: "sample-3",
        accountId: "acc-demo-2",
        platform: "linkedin",
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        time: "09:00 AM",
        title: "Hiring: Senior Frontend Engineer",
        snippet: "We're growing the team — check out the full job posting.",
        approvalStatus: "rejected",
        rejectionReason: "Please remove the salary range, HR wants that handled separately.",
        comments: [
            { id: "c2", text: "Also can we push this to next week instead?", createdAt: new Date().toISOString() },
        ],
    },
    {
        id: "sample-4",
        accountId: "acc-demo-2",
        platform: "linkedin",
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        time: "11:15 AM",
        title: "Case study: 3x engagement in 30 days",
        snippet: "Here's exactly how one of our clients grew their reach.",
        approvalStatus: "pending",
        comments: [],
    },
];

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
     const [error] = useState<string>("");

    // Account filtering — derived from whatever accounts are actually present
    // in the loaded posts (real or sample), since the shared view has no
    // separate account-fetching hook of its own.
    const [checkedAccounts, setCheckedAccounts] = useState<Record<string, boolean>>({});

    // Currently open review panel — null when no post is selected.
    const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
    const [draftComment, setDraftComment] = useState<string>("");
    const [draftRejectionReason, setDraftRejectionReason] = useState<string>("");
    const [showRejectInput, setShowRejectInput] = useState<boolean>(false);



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

                // Fall back to sample posts if the real fetch succeeded but returned nothing —
                // the backend for this feature isn't wired up yet, so this keeps the review UI
                // testable on the front end alone.
                setScheduledPosts(mappedPosts.length > 0 ? mappedPosts : SAMPLE_POSTS);

            }catch(err){

                // Real fetch failed (expected right now, since the backend isn't built yet) —
                // fall back to sample posts instead of surfacing an error, so the front end
                // stays testable.
                setScheduledPosts(SAMPLE_POSTS);
                setOwnerName("Demo Account");

            }finally{

                setIsLoading(false);

            }


        }


        loadSharedPosts();

    }, [token, postsView]);

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

    function updatePost(postId: string, updates: Partial<ScheduledPost>) {
        setScheduledPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
        setSelectedPost(prev => prev && prev.id === postId ? { ...prev, ...updates } : prev);
    }

    function handleApprovePost(postId: string) {
        updatePost(postId, { approvalStatus: "approved", rejectionReason: undefined });
    }

    function handleRejectPost(postId: string, reason: string) {
        updatePost(postId, { approvalStatus: "rejected", rejectionReason: reason });
        setShowRejectInput(false);
        setDraftRejectionReason("");
    }

    function handleAddComment(postId: string) {
        if (!draftComment.trim()) return;
        const newComment: PostComment = {
            id: `c-${Date.now()}`,
            text: draftComment.trim(),
            createdAt: new Date().toISOString(),
        };
        setScheduledPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, comments: [...(p.comments ?? []), newComment] } : p
        ));
        setSelectedPost(prev => prev && prev.id === postId
            ? { ...prev, comments: [...(prev.comments ?? []), newComment] }
            : prev
        );
        setDraftComment("");
    }

    function handleApproveEntireCalendar() {
        setScheduledPosts(prev => prev.map(p => ({ ...p, approvalStatus: "approved", rejectionReason: undefined })));
    }

    function handleRejectEntireCalendar() {
        const reason = window.prompt("Reason for rejecting the entire calendar (optional):") ?? "";
        setScheduledPosts(prev => prev.map(p => ({ ...p, approvalStatus: "rejected", rejectionReason: reason || undefined })));
    }



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
