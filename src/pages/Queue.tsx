import "./Queue.css";
import { useMemo, useState } from "react";
import { LuClock } from "react-icons/lu";
import { LuCircleCheckBig } from "react-icons/lu";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { IoPersonOutline, IoTrashOutline, IoCheckmark } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoChatbubbleOutline, IoEyeOutline } from "react-icons/io5";
import { FiExternalLink } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok } from "react-icons/fa";
import emptyPfp from "../assets/emptyPfp.jpg";
import SchedulingTabs from "../components/SchedulingTabs"; // NEW: replaces hardcoded tab divs

// ---------- Types ---------- //

type Platform = "facebook" | "instagram" | "linkedin" | "tiktok";
type QueueTab = "scheduled" | "published";

interface QueuePost {
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
}

interface QueueAccount {
  id: string;
  name: string;
  platform: Platform;
  count: number;
}

// ---------- Mock data (swap for real hook data later) ---------- //

const MOCK_ACCOUNTS: QueueAccount[] = [
  { id: "acc-1", name: "Bella Aesthetics", platform: "facebook", count: 0 },
  { id: "acc-2", name: "Bella Aesthetics", platform: "tiktok", count: 0 },
  { id: "acc-3", name: "Bella Aesthetics", platform: "instagram", count: 0 },
  { id: "acc-4", name: "PremiumHealth Diagnostics", platform: "facebook", count: 0 },
  { id: "acc-5", name: "PremiumHealth Diagnostics", platform: "tiktok", count: 0 },
];

const MOCK_POSTS: QueuePost[] = [
  {
    id: "post-1",
    platform: "linkedin",
    accountName: "Snap Fitness Philippines",
    time: "7:30 am, Wednesday",
    date: "May 27th, 2026",
    content:
      "One of the most overlooked parts of franchise evaluation is the post-signing experience. This becomes especially important in businesses designed for long-term operations and scalability.\n\nFor many franchisees, the real value of a franchise system is measured not at signing, but throughout the process of building and operating the business.\n\nExplore how the Snap Fitness system works \u2192 https://tinyurl.com/snapfitnessph-info",
    document: { title: "How We Support Our Franchisees" },
    media: { blocked: true, caption: "Forbidden by robots.txt" },
    tag: { label: "Snap Fitness", email: "projects@dwstudio.ph" },
    isRepeating: true,
    status: "scheduled",
  },
  {
    id: "post-2",
    platform: "instagram",
    accountName: "Snap Fitness Philippines",
    time: "9:00 am, Wednesday",
    date: "May 27th, 2026",
    content:
      "Consistency beats intensity. Three short sessions a week will take you further than one brutal workout you dread all month.\n\nSwipe through for a beginner-friendly split you can start this week.",
    tag: { label: "Snap Fitness", email: "projects@dwstudio.ph" },
    status: "scheduled",
  },
  {
    id: "post-3",
    platform: "facebook",
    accountName: "Bella Aesthetics",
    time: "10:15 am, Thursday",
    date: "May 28th, 2026",
    content:
      "Your skin tells a story every season. Here's how to adjust your routine as the weather shifts, from cleanser to SPF.",
    tag: { label: "Bella Aesthetics", email: "team@dwstudio.ph" },
    status: "scheduled",
  },
  {
    id: "post-4",
    platform: "tiktok",
    accountName: "PremiumHealth Diagnostics",
    time: "8:00 am, Monday",
    date: "May 18th, 2026",
    content:
      "Quick myth-check: fasting before every blood test isn't always required. Here's when it actually matters and when it doesn't.",
    tag: { label: "PremiumHealth", email: "care@dwstudio.ph" },
    status: "published",
  },
  {
    id: "post-5",
    platform: "linkedin",
    accountName: "Snap Fitness Philippines",
    time: "7:45 am, Friday",
    date: "May 15th, 2026",
    content:
      "Franchise growth isn't just about opening new doors. It's about giving every location the same support system that made the first one work.",
    document: { title: "2026 Franchise Growth Report" },
    tag: { label: "Snap Fitness", email: "projects@dwstudio.ph" },
    status: "published",
  },
  {
    id: "post-6",
    platform: "instagram",
    accountName: "Bella Aesthetics",
    time: "1:00 pm, Tuesday",
    date: "May 12th, 2026",
    content:
      "Before and after results speak for themselves, but the care in between is what makes them last. Book a consult to see what's right for you.",
    media: { caption: "carousel-preview.jpg" },
    tag: { label: "Bella Aesthetics", email: "team@dwstudio.ph" },
    status: "published",
  },
];

const PLATFORM_META: Record<
  Platform,
  { icon: React.ReactNode; bg: string }
> = {
  facebook: { icon: <FaFacebookF size={11} />, bg: "#1877f2" },
  instagram: { icon: <FaInstagram size={12} />, bg: "#d6249f" },
  linkedin: { icon: <FaLinkedinIn size={11} />, bg: "#0a66c2" },
  tiktok: { icon: <FaTiktok size={11} />, bg: "#0f0f0f" },
};

function PlatformBadge({ platform }: { platform: Platform }) {
  const meta = PLATFORM_META[platform];
  return (
    <div className="q-platform-badge" style={{ background: meta.bg }}>
      {meta.icon}
    </div>
  );
}

// ---------- Component ---------- //

function Queue() {
  const [activeTab, setActiveTab] = useState<QueueTab>("scheduled");
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [largeSize, setLargeSize] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const scheduledCount = MOCK_POSTS.filter((p) => p.status === "scheduled").length;
  const publishedCount = MOCK_POSTS.filter((p) => p.status === "published").length;

  const visiblePosts = useMemo(() => {
    return MOCK_POSTS.filter((p) => {
      if (p.status !== activeTab) return false;
      if (accountFilter && p.accountName !== accountFilter) return false;
      if (search && !p.content.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [activeTab, accountFilter, search]);

  function toggleSelectAll() {
    const next = !selectAll;
    setSelectAll(next);
    setSelectedIds(next ? visiblePosts.map((p) => p.id) : []);
  }

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
                  className={`q-nav-item${activeTab === "scheduled" ? " active" : ""}`}
                  onClick={() => setActiveTab("scheduled")}
                >
                  <LuClock size={16} className="q-nav-icon q-icon-scheduled" />
                  <span>Scheduled Posts</span>
                  <span className="q-nav-count">{scheduledCount}</span>
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

              <div className="q-filter-label">Filter By</div>
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
              </div>
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

                <button className="q-icon-btn" title="Delete selected">
                  <IoTrashOutline size={16} />
                </button>
              </div>

              <div className={`q-feed${largeSize ? " large" : ""}`}>
                {visiblePosts.length === 0 && (
                  <div className="q-empty">
                    <div className="q-empty-title">No {activeTab} posts</div>
                    <div className="q-empty-sub">
                      Try a different account filter or search term.
                    </div>
                  </div>
                )}

                {visiblePosts.map((post) => {
                  const selected = selectedIds.includes(post.id);
                  return (
                    <div className="q-post-card" key={post.id}>
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
                            {post.accountName}
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
                        {post.content.split("\n\n").map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                        {!largeSize && (
                          <span className="q-see-more">See More</span>
                        )}
                      </div>

                      {post.document && (
                        <div className="q-document-card">
                          <span className="q-document-title">
                            Document Title: {post.document.title}
                          </span>
                          <a href="#" className="q-document-link">
                            View Document <FiExternalLink size={12} />
                          </a>
                        </div>
                      )}

                      {post.media && (
                        <div className="q-media-card">
                          <div className="q-media-thumb">Preview</div>
                          <div className="q-media-caption">
                            {post.media.blocked
                              ? "Forbidden by robots.txt"
                              : post.media.caption}
                          </div>
                        </div>
                      )}

                      <div className="q-post-footer">
                        {post.tag?.email && (
                          <span className="q-tag q-tag-email">
                            {post.tag.email}
                          </span>
                        )}
                        {post.tag?.label && (
                          <span className="q-tag q-tag-category">
                            {post.tag.label}
                          </span>
                        )}
                        <div className="q-footer-spacer" />
                        <button className="q-footer-icon-btn" title="Comments">
                          <IoChatbubbleOutline size={15} />
                        </button>
                        <button className="q-footer-icon-btn" title="Preview">
                          <IoEyeOutline size={16} />
                        </button>
                      </div>

                      {post.isRepeating && (
                        <div className="q-repeat-bar">Repeat this post</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Queue;