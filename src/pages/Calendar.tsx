import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  Check,
  Share2,
} from "lucide-react";
import "./Calendar.css";
import SchedulingTabs from "../components/SchedulingTabs"; // NEW: replaces hardcoded tab divs

// Import functions from controller, hooks and utilities
import {useConnectAccounts} from "../hooks/connectAccounts.ts";
import {useScheduledPosts} from "../hooks/getScheduledPost";
import {generateShareCalenderToken} from "../controller/fetchController.ts";

// Import utility for platform icons
import { PLATFORM_META} from "../frontend_utilities/platformIcons.tsx"

// Import types
import {type Platform, type Account} from "../types/account.ts"

// Shared frontend-only category store (same data Category.tsx edits).
// Purely local/in-memory for now — no backend calls here, devs will wire
// real persistence up later behind the same useCategories() hook.
import { useCategories } from "../store/categoryStore";


// Import CalendarGrid from components
import { CalendarGrid } from "../components/CalendarGrid.tsx";


// ---------------------------------------------------------------
// platform icons
// lucide-react dropped brand/social icons a while back, so these
// are small self-contained SVGs instead of an extra dependency.
// Swap in your own brand assets if you need pixel-perfect logos.
// ---------------------------------------------------------------



// ---------------------------------------------------------------
// types
// ---------------------------------------------------------------



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
  onShareCalendar?: () => void;
}



// ---------------------------------------------------------------
// Demo fallback accounts — only used when useConnectAccounts() returns
// nothing (e.g. no backend running yet / no accounts connected). IDs match
// the demo category accountIds in store/categoryStore.ts so the Categories
// section in the sidebar actually has something to show out of the box.
// Safe to delete once real accounts are always coming back from the hook.
// ---------------------------------------------------------------

const DEMO_ACCOUNTS: Account[] = [
  { id: "acc-1", name: "AgilaPost Official", platform: "instagram" },
  { id: "acc-2", name: "AgilaPost Biz", platform: "linkedin" },
  { id: "acc-3", name: "Creator Hub", platform: "tiktok" },
  { id: "acc-4", name: "Community Page", platform: "facebook" },
];

// Demo posts to go with DEMO_ACCOUNTS above, so the grid itself isn't blank
// while there's no backend to pull real posts from. Dates are generated
// relative to "today" so they always land inside the currently visible
// month instead of going stale. Delete alongside DEMO_ACCOUNTS later.
function buildDemoPosts(): Post[] {
  const today = new Date();
  const dateStr = (offsetDays: number) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return [
    {
      id: "demo-post-1",
      accountId: "acc-1",
      platform: "instagram",
      date: dateStr(1),
      time: "09:00 AM",
      title: "Launch teaser",
      snippet: "Sneak peek of the new feature drop.",
    },
    {
      id: "demo-post-2",
      accountId: "acc-2",
      platform: "linkedin",
      date: dateStr(3),
      time: "11:30 AM",
      title: "Case study",
      snippet: "How a client doubled engagement in a month.",
    },
    {
      id: "demo-post-3",
      accountId: "acc-3",
      platform: "tiktok",
      date: dateStr(5),
      time: "02:00 PM",
      title: "Behind the scenes",
      snippet: "Quick clip from the studio shoot.",
    },
    {
      id: "demo-post-4",
      accountId: "acc-4",
      platform: "facebook",
      date: dateStr(5),
      time: "04:15 PM",
      title: "Community shoutout",
      snippet: "Celebrating a great week with our members.",
    },
  ];
}


// ---------------------------------------------------------------
// Shared Calendar Posting Functions
// ---------------------------------------------------------------

// Function handles the generation of a link for sharing schedule of calendar to others
async function generateCalendarShare(){

  try{

    const res = await generateShareCalenderToken();

    if(!res.success)
      throw new Error("Failed to generate link!");

    // Create the link for the calendar view and add it to clipboard copy
    const calendarShareUrl = `${window.location.origin}/calendar/share/${res.data.cryptoToken}`
    await navigator.clipboard.writeText(calendarShareUrl);

    // Create expiry
    const expiry = new Date(res.data.expireDate).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric"
    });

    alert(`Share link generated and copied to clipboard! Link expires on ${expiry}`)

  }catch(err){

    throw new Error("Failed to generate share link! Please try again!")

  }



}


// ---------------------------------------------------------------
// main component
// ---------------------------------------------------------------

export default function AgilaPostCalendar({
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone, // Changed to this so it always show local timezone
  onConnectAccount,
}: Omit<AgilaPostCalendarProps, "accounts" | "posts">) {

  const {accounts: unmappedAccounts} = useConnectAccounts();
  const [postsView, setPostsView] = useState<"pending" | "published">("published");
  const {posts: fetchedPosts, isLoading: _postsLoading, error: _postsError} = useScheduledPosts(postsView);

  // Fall back to demo posts when nothing comes back from the backend, so the
  // grid has something to render alongside DEMO_ACCOUNTS. Remove once
  // useScheduledPosts is reliably backed by a live API.
  const posts = useMemo(
    () => (fetchedPosts && fetchedPosts.length > 0 ? fetchedPosts : buildDemoPosts()),
    [fetchedPosts]
  );

  // Categories come from the same shared store Category.tsx writes to.
  // Adding an account to a category there makes it show up grouped here
  // automatically — no backend round-trip, it's the same in-memory store.
  const categories = useCategories();


  // Use useMemo to avoid heavy recalculations so refernce only changes when accounts actually change data
  // No useEffect as that causes an infinite loop with setCheckedAccounts
  const accounts: Account[] = useMemo(() => {
    if (!unmappedAccounts || unmappedAccounts.length === 0) {
      // Nothing connected yet / hook returned empty — show demo data so the
      // Calendar (and its Categories filter) isn't blank. Remove DEMO_ACCOUNTS
      // and this branch once accounts always come from a live backend.
      return DEMO_ACCOUNTS;
    }
    return unmappedAccounts.map(account => ({
      id: account.id,
      name: account.name,
      platform: account.platform.toLowerCase().trim() as Platform
    }));
  }, [unmappedAccounts]);

  const [checkedAccounts, setCheckedAccounts] = useState<Record<string, boolean>>(
    () => accounts.reduce((acc, a) => ({ ...acc, [a.id]: true }), {} as Record<string, boolean>)
  );
  const [expandAll, setExpandAll] = useState(true);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showFutureRepeats, setShowFutureRepeats] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);


  const allChecked = accounts.length > 0 && accounts.every((a) => checkedAccounts[a.id] !== false);

  const toggleAccount = (id: string) =>
    setCheckedAccounts((prev) => ({ ...prev, [id]: !(prev[id] !== false) }));

  const toggleSelectAll = () =>
    setCheckedAccounts(
      accounts.reduce((acc, a) => ({ ...acc, [a.id]: !allChecked }), {} as Record<string, boolean>)
    );

  // Only show categories that actually have at least one connected account,
  // so the sidebar doesn't show empty categories with nothing to filter.
  const categoriesWithAccounts = useMemo(
    () =>
      categories
        .map((cat) => ({
          ...cat,
          memberAccounts: accounts.filter((a) => cat.accountIds.includes(a.id)),
        }))
        .filter((cat) => cat.memberAccounts.length > 0),
    [categories, accounts]
  );

  // A category reads as "checked" only when every one of its member
  // accounts is currently checked.
  const isCategoryChecked = (accountIds: string[]) =>
    accountIds.length > 0 && accountIds.every((id) => checkedAccounts[id] !== false);

  // Toggling a category toggles all of its member accounts together.
  const toggleCategory = (accountIds: string[]) => {
    const nextValue = !isCategoryChecked(accountIds);
    setCheckedAccounts((prev) => {
      const next = { ...prev };
      accountIds.forEach((id) => {
        next[id] = nextValue;
      });
      return next;
    });
  };

  return (
    <div className="ap-calendar">

      <SchedulingTabs/>

      {/* top bar */}
      <div className="ap-topbar">
        <div>
          <div className="ap-topbar__subtitle">Content Calendar</div>
        </div>
        <div className="ap-topbar__right">
          <div className="ap-topbar__meta">Timezone: {timezone}</div>
          <button className="ap-share-btn" onClick = {() => generateCalendarShare()}>
            <Share2 size={14} />
            Share Calendar
          </button>
        </div>
      </div>

      <div className="ap-body">
        {/* sidebar */}
        <aside className="ap-sidebar">
          <button className="ap-sidebar__collapse" aria-label="Collapse sidebar">
            <ChevronLeft size={16} />
          </button>

          <h2 className="ap-sidebar__title">Social Accounts</h2>

          {/* Categories — filter by group instead of picking accounts one by one */}
          {categoriesWithAccounts.length > 0 && (
            <>
              <div className="ap-accounts-header">
                <button
                  type="button"
                  className="ap-select-all"
                  onClick={() => setCategoriesExpanded((v) => !v)}
                  style={{ marginLeft: 0 }}
                >
                  <ChevronDown
                    size={13}
                    style={{
                      transform: categoriesExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                      transition: "transform 0.15s ease",
                    }}
                  />
                  Categories
                </button>
              </div>

              {categoriesExpanded && (
                <div className="ap-accounts-list">
                  {categoriesWithAccounts.map((cat) => {
                    const checked = isCategoryChecked(cat.accountIds);
                    return (
                      <label key={cat.id} className="ap-account-row">
                        <span
                          className={`ap-account-toggle ${checked ? "is-checked" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleCategory(cat.accountIds);
                          }}
                        >
                          {checked && <Check size={10} color="#fff" />}
                        </span>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: cat.color,
                            flexShrink: 0,
                          }}
                        />
                        <span className="ap-account-name">{cat.name}</span>
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: 11.5,
                            color: "var(--ap-text-muted, #9ca3af)",
                          }}
                        >
                          {cat.memberAccounts.length}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </>
          )}

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

                const meta = PLATFORM_META[acc.platform]
                if(!meta)
                  return null;

                const { Icon, color } = meta;
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
        <CalendarGrid 
          posts={posts.filter(p => checkedAccounts[p.accountId] !== false)} 
          readOnly = {false} postsView = {postsView} setPostsView = {setPostsView}></CalendarGrid>

      </div>
    </div>
  );
}
