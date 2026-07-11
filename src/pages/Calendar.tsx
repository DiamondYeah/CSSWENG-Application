import React, { useMemo, useState, useEffect } from "react";
import {
  ChevronLeft,
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
  onSelectPost,
}: Omit<AgilaPostCalendarProps, "accounts" | "posts">) {

  const {accounts: unmappedAccounts} = useConnectAccounts();
  const [postsView, setPostsView] = useState<"pending" | "published">("published");
  const {posts, isLoading: postsLoading, error: postsError} = useScheduledPosts(postsView);


  // Use useMemo to avoid heavy recalculations so refernce only changes when accounts actually change data
  // No useEffect as that causes an infinite loop with setCheckedAccounts
  const accounts: Account[] = useMemo(() => unmappedAccounts.map(account => ({

    id: account.id,
    name: account.name,
    platform: account.platform.toLowerCase().trim() as Platform

  })), [unmappedAccounts]);

  const [checkedAccounts, setCheckedAccounts] = useState<Record<string, boolean>>(
    () => accounts.reduce((acc, a) => ({ ...acc, [a.id]: true }), {} as Record<string, boolean>)
  );
  const [expandAll, setExpandAll] = useState(true);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showFutureRepeats, setShowFutureRepeats] = useState(false);


  const allChecked = accounts.length > 0 && accounts.every((a) => checkedAccounts[a.id] !== false);

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