import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  MessageCircle,
  Check,
} from "lucide-react";
import "./Calendar.css";
import SchedulingTabs from "../components/SchedulingTabs"; // NEW: replaces hardcoded tab divs
// ---------------------------------------------------------------
// platform icons
// lucide-react dropped brand/social icons a while back, so these
// are small self-contained SVGs instead of an extra dependency.
// Swap in your own brand assets if you need pixel-perfect logos.
// ---------------------------------------------------------------

interface IconProps {
  size?: number;
  color?: string;
}

function FacebookIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M14 8.5h-1.6c-.6 0-1.1.4-1.1 1.2V11H14l-.3 2.2h-2.4V19H9V13.2H7.2V11H9V9.4C9 7 10.4 5 12.8 5H14v3.5z"
        fill={color}
      />
    </svg>
  );
}

function InstagramIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="5" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.4" stroke={color} strokeWidth="1.8" />
      <circle cx="16.5" cy="7.5" r="1" fill={color} />
    </svg>
  );
}

function LinkedinIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
        fill={color}
      >
        in
      </text>
    </svg>
  );
}

function TiktokIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="17" r="3" fill={color} />
      <path d="M12 4v13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M12 4c0 3 2.5 5 5 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ---------------------------------------------------------------
// types
// ---------------------------------------------------------------

export type Platform = "facebook" | "linkedin" | "instagram" | "tiktok";

export interface Account {
  id: string;
  name: string;
  platform: Platform;
}

export interface Post {
  id: string;
  accountId: string;
  platform: Platform;
  date: string; // "YYYY-MM-DD"
  time: string; // display string, e.g. "07:30 AM"
  title?: string;
  snippet?: string;
  hasDocument?: boolean;
  hasImage?: boolean;
  hasComment?: boolean;
}

export interface AgilaPostCalendarProps {
  accounts?: Account[];
  posts?: Post[];
  timezone?: string;
  onConnectAccount?: () => void;
  onSelectPost?: (post: Post) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PLATFORM_META: Record<Platform, { Icon: React.ComponentType<IconProps>; color: string }> = {
  facebook: { Icon: FacebookIcon, color: "#1877F2" },
  linkedin: { Icon: LinkedinIcon, color: "#0A66C2" },
  instagram: { Icon: InstagramIcon, color: "#E1306C" },
  tiktok: { Icon: TiktokIcon, color: "#000000" },
};

// ---------------------------------------------------------------
// date helpers
// ---------------------------------------------------------------

interface GridDay {
  date: Date;
  inMonth: boolean;
}

function buildMonthGrid(year: number, month: number): GridDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const jsDay = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const mondayOffset = (jsDay + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);

  const weeks: GridDay[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: GridDay[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({ date: new Date(cursor), inMonth: cursor.getMonth() === month });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------
// post card
// ---------------------------------------------------------------

function PostCard({
  post,
  accountName,
  onSelect,
}: {
  post: Post;
  accountName: string;
  onSelect?: (post: Post) => void;
}) {
  const { Icon, color } = PLATFORM_META[post.platform];
  return (
    <div className="ap-post-card" onClick={() => onSelect?.(post)}>
      <div className="ap-post-card__header">
        <span className="ap-post-card__platform">
          <Icon size={10} color={color} />
        </span>
        <span className="ap-post-card__account">{accountName}</span>
      </div>

      <div className="ap-post-card__body">
        <div className="ap-post-card__text">
          {post.title && <p className="ap-post-card__title">{post.title}</p>}
          {post.snippet && <p className="ap-post-card__snippet">{post.snippet}</p>}
          {post.hasDocument && (
            <div className="ap-post-card__doc">
              <FileText size={11} />
              <span>View Document</span>
            </div>
          )}
        </div>

        {post.hasImage && (
          <div className="ap-post-card__thumb">
            <div className="ap-post-card__thumb-inner" />
          </div>
        )}
      </div>

      <div className="ap-post-card__footer">
        <Clock size={10} />
        <span>{post.time}</span>
        {post.hasComment && <MessageCircle size={10} style={{ marginLeft: 6 }} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// main component
// ---------------------------------------------------------------

export default function AgilaPostCalendar({
  accounts = [],
  posts = [],
  timezone = "Asia/Manila",
  onConnectAccount,
  onSelectPost,
}: AgilaPostCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [cursorDate, setCursorDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<"month" | "week">("month");
  const [postsView, setPostsView] = useState<"scheduled" | "published">("scheduled");
  const [checkedAccounts, setCheckedAccounts] = useState<Record<string, boolean>>(
    () => accounts.reduce((acc, a) => ({ ...acc, [a.id]: true }), {} as Record<string, boolean>)
  );
  const [expandAll, setExpandAll] = useState(true);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showFutureRepeats, setShowFutureRepeats] = useState(false);

  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const monthLabel = cursorDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const accountsById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts]
  );

  const postsByDate = useMemo(() => {
    const map: Record<string, Post[]> = {};
    for (const p of posts) {
      if (checkedAccounts[p.accountId] === false) continue;
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    }
    return map;
  }, [posts, checkedAccounts]);

  const allChecked = accounts.length > 0 && accounts.every((a) => checkedAccounts[a.id] !== false);

  const goPrevMonth = () => setCursorDate(new Date(year, month - 1, 1));
  const goNextMonth = () => setCursorDate(new Date(year, month + 1, 1));

  const toggleAccount = (id: string) =>
    setCheckedAccounts((prev) => ({ ...prev, [id]: !(prev[id] !== false) }));

  const toggleSelectAll = () =>
    setCheckedAccounts(
      accounts.reduce((acc, a) => ({ ...acc, [a.id]: !allChecked }), {} as Record<string, boolean>)
    );

  return (
    
    <div className="ap-calendar">
      <SchedulingTabs/>
      {/* top bar */}
      <div className="ap-topbar">
        <div>
          <div className="ap-topbar__subtitle">Content Calendar</div>
        </div>
        <div className="ap-topbar__meta">Timezone: {timezone}</div>
      </div>

      <div className="ap-body">
        {/* sidebar */}
        <aside className="ap-sidebar">
          <button className="ap-sidebar__collapse" aria-label="Collapse sidebar">
            <ChevronLeft size={16} />
          </button>

          <h2 className="ap-sidebar__title">Social Accounts</h2>

          <div className="ap-accounts-header">
            <span className="ap-accounts-header__label">Accounts</span>
            {accounts.length > 0 && (
              <button className="ap-select-all" onClick={toggleSelectAll}>
                <span className={`ap-checkbox ${allChecked ? "is-checked" : ""}`}>
                  {allChecked && <Check size={11} color="#fff" />}
                </span>
                Select All
              </button>
            )}
          </div>

          <div className="ap-accounts-list">
            {accounts.length === 0 ? (
              <div className="ap-accounts-empty">
                <p className="ap-accounts-empty__text">
                  No accounts connected yet.
                  <br />
                  Connect a Facebook, Instagram, LinkedIn, or TikTok account to start scheduling.
                </p>
                <button className="ap-connect-btn" onClick={onConnectAccount}>
                  + Connect Account
                </button>
              </div>
            ) : (
              accounts.map((acc) => {
                const { Icon, color } = PLATFORM_META[acc.platform];
                const checked = checkedAccounts[acc.id] !== false;
                return (
                  <label key={acc.id} className="ap-account-row">
                    <span
                      className={`ap-account-toggle ${checked ? "is-checked" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleAccount(acc.id);
                      }}
                    >
                      {checked && <Check size={10} color="#fff" />}
                    </span>
                    <span className="ap-account-avatar">
                      <span className="ap-account-avatar__circle">
                        {acc.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span
                        className="ap-account-avatar__badge"
                        style={{ backgroundColor: color }}
                      >
                        <Icon size={8} color="#fff" />
                      </span>
                    </span>
                    <span className="ap-account-name">{acc.name}</span>
                  </label>
                );
              })
            )}
          </div>

          <div className="ap-sidebar__options">
            <label className="ap-option">
              <input
                type="checkbox"
                checked={showFutureRepeats}
                onChange={() => setShowFutureRepeats((v) => !v)}
              />
              Show future instances of repeating posts
            </label>
            <label className="ap-option">
              <input
                type="checkbox"
                checked={expandAll}
                onChange={() => setExpandAll((v) => !v)}
              />
              Expand all posts
            </label>
            <label className="ap-option">
              <input
                type="checkbox"
                checked={showDrafts}
                onChange={() => setShowDrafts((v) => !v)}
              />
              Show drafts in Calendar
            </label>
          </div>
        </aside>

        {/* main calendar */}
        <main className="ap-main">
          <div className="ap-toolbar">
            <div className="ap-toggle-group">
              <button
                className={`ap-toggle-group__btn ${view === "month" ? "is-active" : ""}`}
                onClick={() => setView("month")}
              >
                month
              </button>
              <button
                className={`ap-toggle-group__btn ${view === "week" ? "is-active" : ""}`}
                onClick={() => setView("week")}
              >
                week
              </button>
            </div>

            <div className="ap-month-nav">
              <button className="ap-month-nav__btn" onClick={goPrevMonth} aria-label="Previous month">
                <ChevronLeft size={20} />
              </button>
              <span className="ap-month-nav__label">{monthLabel}</span>
              <button className="ap-month-nav__btn" onClick={goNextMonth} aria-label="Next month">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="ap-toggle-group">
              <button
                className={`ap-toggle-group__btn ${postsView === "scheduled" ? "is-active" : ""}`}
                onClick={() => setPostsView("scheduled")}
              >
                Scheduled Posts {postsView === "scheduled" && <Check size={13} />}
              </button>
              <button
                className={`ap-toggle-group__btn ${postsView === "published" ? "is-active" : ""}`}
                onClick={() => setPostsView("published")}
              >
                Published Posts
              </button>
            </div>
          </div>

          <div className="ap-grid">
            <div className="ap-grid__weekdays">
              {WEEKDAYS.map((d) => (
                <div key={d} className="ap-grid__weekday">
                  {d}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="ap-grid__week">
                {week.map(({ date, inMonth }, di) => {
                  const isToday = isSameDay(date, today);
                  const dayPosts = postsByDate[toDateKey(date)] || [];
                  return (
                    <div key={di} className={`ap-day-cell ${isToday ? "is-today" : ""}`}>
                      <div className="ap-day-cell__date-row">
                        <span
                          className={`ap-day-cell__date ${isToday ? "is-today" : ""} ${
                            !inMonth ? "is-outside" : ""
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      </div>
                      {dayPosts.map((p) => (
                        <PostCard
                          key={p.id}
                          post={p}
                          accountName={accountsById[p.accountId]?.name ?? "Unknown account"}
                          onSelect={onSelectPost}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}