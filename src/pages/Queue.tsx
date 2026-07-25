import "./Queue.css";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuClock } from "react-icons/lu";
import { LuCircleCheckBig } from "react-icons/lu";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { IoTrashOutline, IoCheckmark, IoAddOutline } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoChatbubbleOutline, IoEyeOutline } from "react-icons/io5";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok } from "react-icons/fa";
import emptyPfp from "../assets/emptyPfp.jpg";
import SchedulingTabs from "../components/SchedulingTabs"; // NEW: replaces hardcoded tab divs


// Import hooks for fetching scheduled posts and the needed types
import {useScheduledPosts} from "../hooks/getScheduledPost";
import {type Platform} from "../types/account.ts";
import { type ScheduledPost } from "../types/post";

// ---------- Types ---------- //

type QueueTab = "pending" | "published";


// All of these are not needed?

/* interface QueueComment {
  id: string;
  text: string;
  createdAt: string; // ISO timestamp
} */

/* interface QueuePost {
  id: string;
  platform: Platform;
  accountName: string;
  accountAvatar?: string;
  time: string;
  date: string;
  content: string;
  document?: { title: string };
  media?: { blocked?: boolean; caption?: string };
  tag?: { label: string; email?: string };
  isRepeating?: boolean;
  status: QueueTab;
  comments?: QueueComment[];
}

interface QueueAccount {
  id: string;
  name: string;
  platform: Platform;
  count: number;
} */





const PLATFORM_META: Record<
  Platform,
  { icon: React.ReactNode; bg: string }
> = {
  facebook: { icon: <FaFacebookF size={11} />, bg: "#1877f2" },
  instagram: { icon: <FaInstagram size={12} />, bg: "#d6249f" },
  linkedin: { icon: <FaLinkedinIn size={11} />, bg: "#0a66c2" },
  tiktok: { icon: <FaTiktok size={11} />, bg: "#0f0f0f" },
};

// Updated to include a safety check
function PlatformBadge({ platform }: { platform: Platform }) {

  const meta = PLATFORM_META[platform];

  if(!meta)
    return null;

  return (
    <div className="q-platform-badge" style={{ background: meta.bg }}>
      {meta.icon}
    </div>
  );

}

// ---------- Component ---------- //

function Queue() {

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<QueueTab>("pending");
  const [search, setSearch] = useState<string>("");


  // Fetch list of pending and published posts
  const {posts: pendingPosts, isLoading: pendingIsLoading, error: pendingError} = useScheduledPosts("pending");
  const {posts: publishedPosts, isLoading: publishedIsLoading, error: publishedError} = useScheduledPosts("published");


  //const [accountFilter, setAccountFilter] = useState<string>("");
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [largeSize, setLargeSize] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  //const [draftComment, setDraftComment] = useState<string>("");


  // Get length of posts for pending and published
  const pendingCount = pendingPosts.length;
  const publishedCount = publishedPosts.length;

  // Change posts, isLoading, error depending on active tab
  const posts = activeTab == "pending" ? pendingPosts : publishedPosts;
  const isLoading = activeTab == "pending" ? pendingIsLoading : publishedIsLoading
  const error = activeTab == "pending" ? pendingError : publishedError;


  const visiblePosts = useMemo(() => {
    return posts.filter((p: ScheduledPost) => {
    
      if(search){

        // Format for searching scheduled posts
        const searchQuery = `${p.title ?? ""} ${p.snippet ?? ""}`.toLowerCase();

        // If it doesnt fit within the format, then return false
        if (!searchQuery.includes(search.toLowerCase()))
          return false;

      }

      return true;

    });
  }, [posts, search]);


  function toggleSelectAll() {
    const next = !selectAll;
    setSelectAll(next);
    setSelectedIds(next ? visiblePosts.map((p) => p.id) : []);
  }


  function toggleComments(postId: string) {

    setExpandedPostId((prev) => (prev === postId ? null : postId));
    
  }

/*   function handleAddComment(postId: string) {
    if (!draftComment.trim()) return;
    const newComment: QueueComment = {
      id: `qc-${Date.now()}`,
      text: draftComment.trim(),
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...(p.comments ?? []), newComment] } : p
      )
    );
    setDraftComment("");
  } */

  function toggleSelectPost(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }





  return (
    <div>
      <SchedulingTabs/>
      <main className="main-content">
        <div className="queue-page">
          <div className="queue-layout">
            {/* ---------- Left rail ---------- */}
            <aside className="q-sidebar">
              <div className="q-sidebar-header">Queue</div>

              <nav className="q-nav-list">
                <button
                  className={`q-nav-item${activeTab === "pending" ? " active" : ""}`}
                  onClick={() => setActiveTab("pending")}
                >
                  <LuClock size={16} className="q-nav-icon q-icon-scheduled" />
                  <span>Scheduled Posts</span>
                  <span className="q-nav-count">{pendingCount}</span>
                </button>

                <button
                  className={`q-nav-item${activeTab === "published" ? " active" : ""}`}
                  onClick={() => setActiveTab("published")}
                >
                  <LuCircleCheckBig size={16} className="q-nav-icon q-icon-published" />
                  <span>Published Posts</span>
                  <span className="q-nav-count">{publishedCount}</span>
                </button>
              </nav>

              <div className="q-sidebar-divider" />

{/*               <div className="q-filter-label">Filter By</div>
              <div className="q-filter-wrapper">
                <IoPersonOutline className="q-filter-icon" />
                <select
                  className="q-filter-select"
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                >
                  <option value="">Account</option>
                  {[...new Set(MOCK_ACCOUNTS.map((a) => a.name))].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="q-account-list">
                {MOCK_ACCOUNTS.map((acc) => (
                  <div
                    key={acc.id}
                    className={`q-account-row${
                      accountFilter === acc.name ? " selected" : ""
                    }`}
                    onClick={() =>
                      setAccountFilter(accountFilter === acc.name ? "" : acc.name)
                    }
                  >
                    <div className="q-account-avatar-wrap">
                      <img src={emptyPfp} className="q-account-avatar" alt="" />
                      <div
                        className="q-account-platform-dot"
                        style={{ background: PLATFORM_META[acc.platform].bg }}
                      >
                        {PLATFORM_META[acc.platform].icon}
                      </div>
                    </div>
                    <span className="q-account-name">{acc.name}</span>
                    <span className="q-account-count">{acc.count}</span>
                  </div>
                ))}
              </div> */}

            </aside>

            {/* ---------- Main feed ---------- */}
            <section className="q-main">
              <div className="q-toolbar">
                <label className="q-select-all">
                  <div
                    className={`q-checkbox${selectAll ? " checked" : ""}`}
                    onClick={toggleSelectAll}
                  >
                    {selectAll && <IoCheckmark size={12} />}
                  </div>
                  <span>Select All</span>
                </label>

                <label className="q-toggle-wrap">
                  <div
                    className={`q-toggle${largeSize ? " on" : ""}`}
                    onClick={() => setLargeSize((v) => !v)}
                  >
                    <div className="q-toggle-knob" />
                  </div>
                  <span>Large Post Size</span>
                </label>

                <div className="q-search-wrapper">
                  <HiMagnifyingGlass className="q-search-icon" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    className="q-search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <button
                  className="q-create-post-btn"
                  onClick={() => navigate("/create-post")}
                >
                  <IoAddOutline size={16} />
                  Create Post
                </button>

              </div>

               <button className="q-icon-btn" title="Delete selected">
                  <IoTrashOutline size={16} />
                </button>



                {/** Status displays when loading or error occurs */}
                {isLoading && (

                  <div className="q-empty">
                    <div className="q-empty-title">Loading posts...</div>
                  </div>

                )}


                {error && (

                  <div className="q-empty">
                    <div className="q-empty-title">Error occured when fetching posts</div>
                    <div className="q-empty-sub">{error}</div>
                  </div>
                  
                )}

                {!isLoading && !error && (

                  <div className={`q-feed${largeSize ? " large" : ""}`}>

                    {visiblePosts.length === 0 && (
                      <div className="q-empty">
                        <div className="q-empty-title">No {activeTab === "pending" ? "scheduled" : "published"} posts</div>
                        <div className="q-empty-sub">
                          Try a different account filter or search term.
                        </div>
                      </div>


                )}
                
                          
                {visiblePosts.map((post) => {

                  const selected = selectedIds.includes(post.id);

                  return (
                    <div className = {`q-post-card status-${post.approvalStatus?.toLowerCase() ?? "pending"}`} key={post.id}>
                      <div className="q-post-header">
                        <div className="q-post-header-left">
                          <div
                            className={`q-checkbox${selected ? " checked" : ""}`}
                            onClick={() => toggleSelectPost(post.id)}
                          >
                            {selected && <IoCheckmark size={12} />}
                          </div>
                          <PlatformBadge platform={post.platform} />
                          <img src={emptyPfp} className="q-post-avatar" alt="" />
                          <span className="q-post-account-name">
                            {post.title ?? "Untitled post"}
                          </span>
                        </div>

                        <div className="q-post-header-right">
                          <div className="q-post-time">{post.time}</div>
                          <div className="q-post-date">{post.date}</div>
                        </div>

                        <button className="q-post-menu">
                          <BsThreeDotsVertical size={15} />
                        </button>
                      </div>

                      <div className="q-post-body">
                        {post.snippet && <p>{post.snippet}</p>}
                      </div>

                      {/*
                       {post.document && (
                        <div className="q-document-card">
                          <span className="q-document-title">
                            Document Title: {post.document.title}
                          </span>
                          <a href="#" className="q-document-link">
                            View Document <FiExternalLink size={12} />
                          </a>
                        </div>
                      )} */}
                      {/*       
                        {post.media && (
                        <div className="q-media-card">
                          <div className="q-media-thumb">Preview</div>
                          <div className="q-media-caption">
                            {post.media.blocked
                              ? "Forbidden by robots.txt"
                              : post.media.caption}
                          </div>
                        </div>
                      )} */}

                      <div className="q-post-footer">
                      {/*     
                        {post.tag?.email && (
                          <span className="q-tag q-tag-email">
                            {post.tag.email}
                          </span>
                        )}
                        {post.tag?.label && (
                          <span className="q-tag q-tag-category">
                            {post.tag.label}
                          </span>
                        )} */}

                        {/** New display to show status of post including reason if rejected*/}

                        {post.approvalStatus && (

                          <span className = {`q-approval-badge is-${post.approvalStatus}`}>{post.approvalStatus}</span>
                        )}


                        {post.approvalStatus == "rejected" && post.rejectionReason && (

                          <span className = "q-rejection-reason">{post.rejectionReason}</span>
                        )}


                        <div className="q-footer-spacer" />
                        <button
                          className="q-footer-icon-btn"
                          title="Comments"
                          onClick={() => toggleComments(post.id)}
                        >
                          <IoChatbubbleOutline size={15} />
                          {post.comments && post.comments.length > 0 && (
                            <span className="q-comment-count">{post.comments.length}</span>
                          )}
                        </button>
                        <button className="q-footer-icon-btn" title="Preview">
                          <IoEyeOutline size={16} />
                        </button>
                      </div>

                      {/** Updated comments display */}
                      {expandedPostId  === post.id && post.comments && post.comments.length > 0 && (

                        <div className = "q-comments-thread">
                          {post.comments.map((c) => (

                            <div className = "q-comment-container">

                              <span key = {c.id} className = "q-comment">{c.text}</span>

                              <div className = "q-comment-date-time-container">

                                <span className="q-comment-time">
                                  {new Date(c.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit"})}
                                </span>
                                <span className="q-comment-date">
                                  {new Date(c.createdAt).toLocaleDateString("en-CA")}
                                </span>

                              </div>


                            </div>
                          ))}
                        </div>

                      )}


                      {/* 
                          <div className="q-add-comment">
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              value={draftComment}
                              onChange={(e) => setDraftComment(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddComment(post.id);
                              }}
                            />
                            <button onClick={() => handleAddComment(post.id)}>Post</button>
                          </div>
                           
                        </div>
                      )}
                      */}
                    </div>
                  );
                })}
              </div>

              )}

            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Queue;