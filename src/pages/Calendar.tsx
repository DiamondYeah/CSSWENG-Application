import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  Check,
  Share2,
} from "lucide-react";
import "./Calendar.css";
import SchedulingTabs from "../components/SchedulingTabs"; 

// Import functions from controller, hooks and utilities
import {useConnectAccounts} from "../hooks/connectAccounts.ts";
import {useScheduledPosts} from "../hooks/getScheduledPost";
import {generateShareCalenderToken} from "../controller/fetchController.ts";

// Import utility for platform icons
import { PLATFORM_META} from "../frontend_utilities/platformIcons.tsx"

// Import types
import {type Platform, type Account} from "../types/account.ts"

// Shared frontend-only category store 
import { useCategories } from "../store/categoryStore";

// Import CalendarGrid from components
import { CalendarGrid } from "../components/CalendarGrid.tsx";

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
  approvalStatus?: string;
}

export interface AgilaPostCalendarProps {
  accounts?: Account[];
  posts?: Post[];
  timezone?: string;
  onConnectAccount?: () => void;
  onSelectPost?: (post: Post) => void;
  onShareCalendar?: () => void;
}

// Function handles the generation of a link for sharing schedule of calendar to others
async function generateCalendarShare(){
  try{
    const res = await generateShareCalenderToken();

    if(!res.success)
      throw new Error("Failed to generate link!");

    const calendarShareUrl = `${window.location.origin}/calendar/share/${res.data.cryptoToken}`
    await navigator.clipboard.writeText(calendarShareUrl);

    const expiry = new Date(res.data.expireDate).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric"
    });

    alert(`Share link generated and copied to clipboard! Link expires on ${expiry}`)

  }catch(err){
    throw new Error("Failed to generate share link! Please try again!")
  }
}

export default function AgilaPostCalendar({
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone, 
  onConnectAccount,
}: Omit<AgilaPostCalendarProps, "accounts" | "posts">) {

  const {accounts: unmappedAccounts} = useConnectAccounts();
  const [postsView, setPostsView] = useState<"pending" | "published">("published");
  const {posts: fetchedPosts, isLoading: _postsLoading, error: _postsError} = useScheduledPosts(postsView);

  const posts = useMemo(
    () => [...(fetchedPosts || [])],
    [fetchedPosts]
  );

  const categories = useCategories();

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

  const isCategoryChecked = (accountIds: string[]) =>
    accountIds.length > 0 && accountIds.every((id) => checkedAccounts[id] !== false);

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

  // NEW: Create a mock post that always shows up "today" so you can test the UI
  const todayString = new Date().toISOString().split("T")[0];
  const mockTestPost: Post = {
    id: "mock-ui-test-post",
    accountId: "demo-account", 
    platform: "facebook",
    date: todayString,
    time: "12:00 PM",
    title: "UI Test Post",
    snippet: "Check out the X button in the corner!",
    approvalStatus: "approved"
  };

  // Filter real posts, then append the mock post at the end so it's always visible
  const filteredPosts = posts.filter(p => checkedAccounts[p.accountId] !== false);
  const postsToRender = [...filteredPosts, mockTestPost];

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
          posts={postsToRender as any} 
          readOnly={false} 
          postsView={postsView} 
          setPostsView={setPostsView}
          onCancelPost={handleCancelPost} 
        />

      </div>
    </div>
  );
}