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
// Demo accounts — always merged in alongside real connected accounts (not
// just an empty-state fallback), so the Categories section in the sidebar
// always has demo data to show regardless of how many real accounts exist.
// IDs match the demo category accountIds in store/categoryStore.ts.
// Safe to remove once category filtering is tested against real data only.
// ---------------------------------------------------------------


// Demo posts to go with DEMO_ACCOUNTS above — always merged in alongside
// real posts so there's sample content on the demo accounts. Dates are
// generated relative to "today" so they always land inside the currently
// visible month instead of going stale.



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

  // Demo posts are always merged in alongside real ones (not just an
  // empty-state fallback) so the demo accounts/categories always have
  // sample content to show in the grid.
  const posts = useMemo(
    () => [...(fetchedPosts || [])],
    [fetchedPosts]
  );

  // Categories come from the same shared store Category.tsx writes to.
  // Adding an account to a category there makes it show up grouped here
  // automatically — no backend round-trip, it's the same in-memory store.
  const categories = useCategories();


  // Use useMemo to avoid heavy recalculations so refernce only changes when accounts actually change data
  // No useEffect as that causes an infinite loop with setCheckedAccounts
  // Demo accounts are always merged in alongside real ones (not just as an
  // empty-state fallback) so the Categories section always has something to
  // show, regardless of how many real accounts are connected.
  const accounts: Account[] = useMemo(() => {
    const mappedReal: Account[] = (unmappedAccounts || []).map(account => ({
      id: account.id,
      name: account.name,
      platform: account.platform.toLowerCase().trim() as Platform
    }));
    return [...mappedReal];
  }, [unmappedAccounts]);

  const [checkedAccounts, setCheckedAccounts] = useState<Record<string, boolean>>(
    () => accounts.reduce((acc, a) => ({ ...acc, [a.id]: true }), {} as Record<string, boolean>)
  );
  const [expandAll, setExpandAll] = useState(true);
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

  // NEW: Handle canceling a post
  const handleCancelPost = async (postId: string) => {
    if (postId === "mock-ui-test-post") {
      alert("This is just a mock post! It looks great though.");
      return;
    }

    const confirmCancel = window.confirm("Are you sure you want to cancel this scheduled post?");
    if (!confirmCancel) return;

    try {
      // Add your actual backend deletion logic here
      console.log(`Cancelled post: ${postId}`);
      alert("Post cancelled! (Add your refetch logic to make it disappear)");
    } catch (err) {
      console.error(err);
      alert("Failed to cancel post! Please try again.");
    }
  };

  

  // Filter real posts, then append the mock post at the end so it's always visible
  const filteredPosts = posts.filter(p => checkedAccounts[p.accountId] !== false);
  const postsToRender = [...filteredPosts];

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
                checked={expandAll}
                onChange={() => setExpandAll((v) => !v)}
              />
              Expand all posts
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