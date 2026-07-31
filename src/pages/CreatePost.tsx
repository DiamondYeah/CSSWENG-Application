import "./CreatePost.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoArrowBack,
  IoCloudUploadOutline,
  IoCheckmark,
  IoCalendarOutline,
  IoChevronBack,
  IoChevronForward,
  IoTimeOutline,
} from "react-icons/io5";
import { MdOutlineEmojiEmotions, MdOutlineAlternateEmail } from "react-icons/md";
import { BsHash } from "react-icons/bs";
import SchedulingTabs from "../components/SchedulingTabs";
import emptyPfp from "../assets/emptyPfp.jpg";

// Import functions from controller, hooks and utilities
import {useConnectAccounts} from "../hooks/connectAccounts.ts";
import {useUserQueryInfo} from "../hooks/userQueryInfo.ts"
import {usePostUpload} from "../hooks/postUpload.ts"

// Import TikTok Settings Component
import { TikTokSettings } from "../components/TikTokSettings.tsx";


// Shared frontend-only category store (same data Category.tsx and
// Calendar.tsx read/write). Purely in-memory for now — no backend calls
// here, this is just for quick-selecting accounts by category.
import { useCategories } from "../store/categoryStore";


// ---------- Constants for media posting ---------- //

const MAX_TITLE_LENGTH: number = 2200;
const MAX_CAPTION_LENGTH: number = 2200;
const MAX_MEDIA_FILE_SIZE: number = 750 * 1024 * 1024;


// ---------- Placeholder settings for platforms without real fields yet ---------- //
// TikTok has its own real settings component (TikTokSettings). LinkedIn, Facebook,
// and Instagram don't have defined field requirements yet, so this is an honest
// "not built yet" placeholder rather than fake toggles that don't do anything.

function PlatformSettingsPlaceholder({ platformLabel }: { platformLabel: string }) {
  return (
    <div className="cp-card">
      <div className="cp-section-title">{platformLabel} Settings</div>
      <div className="cp-section-sub">
        {platformLabel}-specific posting options aren't built yet — this post will use
        the title, caption, and media above as-is.
      </div>
    </div>
  );
}


// ---------- Sample demo accounts for testing the platform-settings switching ---------- //
// Not real connected accounts — clearly labeled as demo so there's no confusion with
// accounts actually fetched from useConnectAccounts(). Toggled on/off, never mixed in silently.

interface DemoAccount {
  id: string;
  name: string;
  handle: string;
  platform: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: "demo-tiktok", name: "Demo TikTok", handle: "@demo.tiktok", platform: "tiktok" },
  { id: "demo-linkedin", name: "Demo LinkedIn", handle: "@demo.linkedin", platform: "linkedin" },
  { id: "demo-facebook", name: "Demo Facebook", handle: "@demo.facebook", platform: "facebook" },
  { id: "demo-instagram", name: "Demo Instagram", handle: "@demo.instagram", platform: "instagram" },
];

// ---------- Demo accounts matching the shared categoryStore's demo category IDs ---------- //
// The categoryStore's default categories (Product Launches, Behind the Scenes, Client Work)
// reference account IDs acc-1..acc-4 — same IDs Category.tsx and Calendar.tsx use for their
// own demo fallback accounts. These are ONLY pulled in when "Show demo categories" is on, so
// the category quick-select has something real to filter, and are never mixed into a real
// submission (same demo-id guard pattern as DEMO_ACCOUNTS above).

const DEMO_CATEGORY_ACCOUNTS: DemoAccount[] = [
  { id: "acc-1", name: "AgilaPost Official", handle: "@agilapost", platform: "instagram" },
  { id: "acc-2", name: "AgilaPost Biz", handle: "@agilapostbiz", platform: "linkedin" },
  { id: "acc-3", name: "Creator Hub", handle: "@creatorhub", platform: "tiktok" },
  { id: "acc-4", name: "Community Page", handle: "@communitypage", platform: "facebook" },
];


// ---------- Date picker (visual calendar for scheduling) ---------- //

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Accepts YYYY-MM-DD, MM/DD/YYYY, or M/D/YYYY typed by hand.
// Returns a valid "YYYY-MM-DD" string, or null if the text doesn't
// resolve to a real calendar date (so callers never commit garbage).
function parseTypedDate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let y: number, m: number, d: number;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (isoMatch) {
    y = parseInt(isoMatch[1], 10);
    m = parseInt(isoMatch[2], 10);
    d = parseInt(isoMatch[3], 10);
  } else if (slashMatch) {
    m = parseInt(slashMatch[1], 10);
    d = parseInt(slashMatch[2], 10);
    y = parseInt(slashMatch[3], 10);
  } else {
    return null;
  }

  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  const candidate = new Date(y, m - 1, d);
  // Reject dates that overflowed (e.g. Feb 30 rolling into March)
  if (candidate.getFullYear() !== y || candidate.getMonth() !== m - 1 || candidate.getDate() !== d) {
    return null;
  }

  return toDateInputValue(candidate);
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type DatePickerView = "days" | "months" | "years";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
}

function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<DatePickerView>("days");
  const [draftText, setDraftText] = useState(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const [cursorMonth, setCursorMonth] = useState(() => {
    const base = selectedDate ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  // Anchors the 12-year block shown in the years view, independent of cursorMonth
  // so paging through years doesn't jump the visible day-grid month.
  const [yearBlockStart, setYearBlockStart] = useState(() => Math.floor(cursorMonth.getFullYear() / 12) * 12);

  const year = cursorMonth.getFullYear();
  const month = cursorMonth.getMonth();
  const monthLabel = cursorMonth.toLocaleString("en-US", { month: "long", year: "numeric" });

  const weeks: { date: Date; inMonth: boolean }[][] = (() => {
    const firstOfMonth = new Date(year, month, 1);
    const jsDay = firstOfMonth.getDay(); // 0=Sun..6=Sat
    const mondayOffset = (jsDay + 6) % 7;
    const gridStart = new Date(year, month, 1 - mondayOffset);

    const result: { date: Date; inMonth: boolean }[][] = [];
    const cursor = new Date(gridStart);
    for (let w = 0; w < 6; w++) {
      const week: { date: Date; inMonth: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        week.push({ date: new Date(cursor), inMonth: cursor.getMonth() === month });
        cursor.setDate(cursor.getDate() + 1);
      }
      result.push(week);
    }
    return result;
  })();

  const goPrevMonth = () => setCursorMonth(new Date(year, month - 1, 1));
  const goNextMonth = () => setCursorMonth(new Date(year, month + 1, 1));
  const goPrevYearBlock = () => setYearBlockStart((y) => y - 12);
  const goNextYearBlock = () => setYearBlockStart((y) => y + 12);

  const handlePick = (d: Date) => {
    const formatted = toDateInputValue(d);
    onChange(formatted);
    setDraftText(formatted);
    setIsOpen(false);
    setView("days");
  };

  const commitTypedText = () => {
    const parsed = parseTypedDate(draftText);
    if (parsed) {
      onChange(parsed);
      setDraftText(parsed);
      setCursorMonth(new Date(parseInt(parsed.slice(0, 4), 10), parseInt(parsed.slice(5, 7), 10) - 1, 1));
    } else {
      // Invalid text — revert the field to whatever the last valid value was
      // rather than silently accepting something that can't feed the backend.
      setDraftText(value);
    }
  };

  const handlePickMonth = (m: number) => {
    setCursorMonth(new Date(year, m, 1));
    setView("days");
  };

  const handlePickYear = (y: number) => {
    setCursorMonth(new Date(y, month, 1));
    setYearBlockStart(Math.floor(y / 12) * 12);
    setView("months");
  };

  const displayLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="cp-datepicker">
      <div className="cp-datepicker__trigger">
        <button
          type="button"
          className="cp-datepicker__icon-btn"
          onClick={() => { setIsOpen((v) => !v); setView("days"); }}
          aria-label="Open calendar"
        >
          <IoCalendarOutline size={16} />
        </button>
        <input
          type="text"
          className="cp-datepicker__input"
          placeholder="MM/DD/YYYY"
          value={isOpen ? draftText : (value ? displayLabel : draftText)}
          onFocus={() => { setIsOpen(true); setDraftText(value); }}
          onChange={(e) => setDraftText(e.target.value)}
          onBlur={commitTypedText}
          onKeyDown={(e) => {
            if (e.key === "Enter") { commitTypedText(); (e.target as HTMLInputElement).blur(); }
            if (e.key === "Escape") { setDraftText(value); setIsOpen(false); (e.target as HTMLInputElement).blur(); }
          }}
        />
      </div>

      {isOpen && (
        <>
          <div className="cp-datepicker__backdrop" onClick={() => { setIsOpen(false); setView("days"); }} />
          <div className="cp-datepicker__popover">
            {view === "days" && (
              <>
                <div className="cp-datepicker__nav">
                  <button type="button" onClick={goPrevMonth} aria-label="Previous month">
                    <IoChevronBack size={16} />
                  </button>
                  <button
                    type="button"
                    className="cp-datepicker__nav-label"
                    onClick={() => setView("months")}
                  >
                    {monthLabel}
                  </button>
                  <button type="button" onClick={goNextMonth} aria-label="Next month">
                    <IoChevronForward size={16} />
                  </button>
                </div>

                <div className="cp-datepicker__weekdays">
                  {WEEKDAY_LABELS.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                {weeks.map((week, wi) => (
                  <div key={wi} className="cp-datepicker__week">
                    {week.map(({ date, inMonth }, di) => {
                      const isPast = date < today;
                      const isSelected = selectedDate ? isSameDate(date, selectedDate) : false;
                      const isToday = isSameDate(date, today);
                      return (
                        <button
                          type="button"
                          key={di}
                          disabled={isPast}
                          onClick={() => handlePick(date)}
                          className={[
                            "cp-datepicker__day",
                            !inMonth ? "is-outside" : "",
                            isSelected ? "is-selected" : "",
                            isToday && !isSelected ? "is-today" : "",
                            isPast ? "is-past" : "",
                          ].filter(Boolean).join(" ")}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </>
            )}

            {view === "months" && (
              <>
                <div className="cp-datepicker__nav">
                  <span />
                  <button
                    type="button"
                    className="cp-datepicker__nav-label"
                    onClick={() => setView("years")}
                  >
                    {year}
                  </button>
                  <span />
                </div>
                <div className="cp-datepicker__grid3">
                  {MONTH_LABELS.map((label, m) => (
                    <button
                      type="button"
                      key={label}
                      className={`cp-datepicker__cell${m === month ? " is-selected" : ""}`}
                      onClick={() => handlePickMonth(m)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {view === "years" && (
              <>
                <div className="cp-datepicker__nav">
                  <button type="button" onClick={goPrevYearBlock} aria-label="Previous years">
                    <IoChevronBack size={16} />
                  </button>
                  <span>{yearBlockStart} – {yearBlockStart + 11}</span>
                  <button type="button" onClick={goNextYearBlock} aria-label="Next years">
                    <IoChevronForward size={16} />
                  </button>
                </div>
                <div className="cp-datepicker__grid3">
                  {Array.from({ length: 12 }, (_, i) => yearBlockStart + i).map((y) => (
                    <button
                      type="button"
                      key={y}
                      className={`cp-datepicker__cell${y === year ? " is-selected" : ""}`}
                      onClick={() => handlePickYear(y)}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}


// ---------- Time picker (visual clock/list for scheduling) ---------- //

function formatTimeLabel(time24: string): string {
  const [hStr, m] = time24.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

// Accepts "2:30 PM", "2:30pm", "14:30", or "1430" typed by hand.
// Returns a valid "HH:MM" 24hr string, or null if it doesn't resolve
// to a real time (so callers never commit garbage to the payload).
function parseTypedTime(text: string): string | null {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return null;

  const ampmMatch = trimmed.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)$/);
  const h24Match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  const digitsMatch = trimmed.match(/^(\d{1,2})(\d{2})$/);

  let h: number, m: number;

  if (ampmMatch) {
    h = parseInt(ampmMatch[1], 10);
    m = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const period = ampmMatch[3];
    if (h < 1 || h > 12) return null;
    if (period === "pm" && h !== 12) h += 12;
    if (period === "am" && h === 12) h = 0;
  } else if (h24Match) {
    h = parseInt(h24Match[1], 10);
    m = parseInt(h24Match[2], 10);
  } else if (digitsMatch) {
    h = parseInt(digitsMatch[1], 10);
    m = parseInt(digitsMatch[2], 10);
  } else {
    return null;
  }

  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface TimePickerProps {
  value: string; // "HH:MM" 24hr, or ""
  onChange: (value: string) => void; // always emits "HH:MM" 24hr, same as native <input type="time">
}

function TimePicker({ value, onChange }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftText, setDraftText] = useState(value ? formatTimeLabel(value) : "");

  const handlePick = (slot: string) => {
    onChange(slot);
    setDraftText(formatTimeLabel(slot));
    setIsOpen(false);
  };

  const commitTypedText = () => {
    const parsed = parseTypedTime(draftText);
    if (parsed) {
      onChange(parsed);
      setDraftText(formatTimeLabel(parsed));
    } else {
      // Invalid text — revert to the last valid value rather than
      // silently accepting something that can't feed the backend.
      setDraftText(value ? formatTimeLabel(value) : "");
    }
  };

  return (
    <div className="cp-timepicker">
      <div className="cp-timepicker__trigger">
        <button
          type="button"
          className="cp-timepicker__icon-btn"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Open time list"
        >
          <IoTimeOutline size={16} />
        </button>
        <input
          type="text"
          className="cp-timepicker__input"
          placeholder="e.g. 2:30 PM"
          value={draftText}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setDraftText(e.target.value)}
          onBlur={commitTypedText}
          onKeyDown={(e) => {
            if (e.key === "Enter") { commitTypedText(); (e.target as HTMLInputElement).blur(); }
            if (e.key === "Escape") { setDraftText(value ? formatTimeLabel(value) : ""); setIsOpen(false); (e.target as HTMLInputElement).blur(); }
          }}
        />
      </div>

      {isOpen && (
        <>
          <div className="cp-timepicker__backdrop" onClick={() => setIsOpen(false)} />
          <div className="cp-timepicker__popover">
            {TIME_SLOTS.map((slot) => (
              <button
                type="button"
                key={slot}
                onClick={() => handlePick(slot)}
                className={`cp-timepicker__slot${slot === value ? " is-selected" : ""}`}
              >
                {formatTimeLabel(slot)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


function CreatePost() {

  const navigate = useNavigate();
  const {accounts: realAccounts, isLoading: accountsLoading, error: accountsError} = useConnectAccounts();
  const [showDemoAccounts, setShowDemoAccounts] = useState<boolean>(false);
  // "Show demo categories" pulls in the acc-1..acc-4 demo accounts that match the
  // shared categoryStore's default categories, kept separate from showDemoAccounts
  // since these two demo sets exist for different reasons (settings preview vs.
  // previewing the category quick-select).
  const [showDemoCategories, setShowDemoCategories] = useState<boolean>(false);
  const accounts = [
    ...realAccounts,
    ...(showDemoAccounts ? DEMO_ACCOUNTS : []),
    ...(showDemoCategories ? DEMO_CATEGORY_ACCOUNTS : []),
  ];
  const {queryInfo} = useUserQueryInfo();
  const {isUploading, uploadStatus, uploadPost} = usePostUpload();

  // Categories come from the same shared store Category.tsx and Calendar.tsx use.
  // Purely for quick-selecting a group of accounts here — no backend involved.
  const allCategories = useCategories();

  const [caption, setCaption] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule" | "queue">("schedule");

  // Stateful const that store info user and video info fetched from TikTokAPI
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaFilePreviews, setMediaFilePreviews] = useState<string[]>([]);

  // Scheduling
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("");

  // Stateful const for query info settings
  const [privacyLevel, setPrivacyLevel] = useState<string>("");
  const [allowComments, setAllowComments] = useState<boolean>(false);
  const [allowDuet, setAllowDuet] = useState<boolean>(false);
  const [allowStitch, setAllowStitch] = useState<boolean>(false);

  // Stateful const for storing commercial/promotional content settings
  const [isCommercialContent, setIsCommercialContent] = useState<boolean>(false);
  const [isYourOwnBrand, setIsYourOwnBrand] = useState<boolean>(false);
  const [isBrandedContent, setIsBrandedContent] = useState<boolean>(false);

  // Stateful consts for storing errors in input
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [titleError, setTitleError] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<boolean>(false);
  const [privacyError, setPrivacyError] = useState<boolean>(false);
  const [scheduleError, setScheduleError] = useState<boolean>(false);
  const [commercialContentError, setCommericialContentError] = useState<boolean>(false);

  // Status to show to user when something occurs in the post page.
  const statusToView = validationMessage || uploadStatus;

  // Derived values
  const selectedPlatforms = accounts
    .filter(acc => selectedAccounts.includes(acc.id))
    .map(acc => acc.platform.toLowerCase());

  const allowMultipleFiles =
    selectedPlatforms.includes("facebook") ||
    selectedPlatforms.includes("instagram") &&
    !selectedPlatforms.includes("linkedin") &&
    !selectedPlatforms.includes("tiktok");

  // Every unique platform in the current selection gets its own settings block,
  // shown together — matches Buffer's "Customize for each network" pattern, where
  // multiple Facebook accounts still only produce one Facebook settings box.
  const uniquePlatforms = Array.from(new Set(selectedPlatforms));

  // isPhotoPost is derived from the uploaded file, not stored as separate state
  const isPhotoPost =
    mediaFiles.length > 0 &&
    mediaFiles[0].type.startsWith("image/");

  function toggleAccount(id: string) {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  // Only show categories that have at least one account present in this page's
  // current account list (real + whichever demo sets are toggled on) — same
  // "only show if it has members" rule used in Calendar's sidebar.
  const categoriesWithAccounts = allCategories
    .map((cat) => ({
      ...cat,
      memberAccounts: accounts.filter((a) => cat.accountIds.includes(a.id)),
    }))
    .filter((cat) => cat.memberAccounts.length > 0);


  // A category reads as "checked" only when every one of its member accounts
  // currently present here is selected.
  function isCategoryChecked(memberIds: string[]): boolean {
    return memberIds.length > 0 && memberIds.every((id) => selectedAccounts.includes(id));
  }


  // Toggling a category selects/deselects all of its member accounts together.
  function toggleCategory(memberIds: string[]) {
    const nextValue = !isCategoryChecked(memberIds);
    setSelectedAccounts((prev) => {
      if (nextValue) {
        const toAdd = memberIds.filter((id) => !prev.includes(id));
        return [...prev, ...toAdd];
      }
      return prev.filter((id) => !memberIds.includes(id));
    });
  }


  // Function handles any file uploads in HTML input file and stores it in mediaFile const
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {

    const files = Array.from(e.target.files || []);

    if (files.length === 0)
        return;

    const filteredFiles =
      !selectedPlatforms.includes("facebook") &&
      !selectedPlatforms.includes("instagram")
        ? [files[0]]
        : files;


    if (filteredFiles.length === 0)
      return;


    // Check every file size
    for (const file of filteredFiles) {

      if (file.size > MAX_MEDIA_FILE_SIZE) {

        setMediaError(true);
        setValidationMessage(
          `File size exceeds current file size limit. ${(file.size / 1024 / 1024).toFixed(2)} MB`
        );

        return;
      }
    }


    // Remove old preview URLs
    mediaFilePreviews.forEach(url => URL.revokeObjectURL(url));


    const previews = filteredFiles.map(file =>
      URL.createObjectURL(file)
    );


    setMediaFiles(filteredFiles);
    setMediaFilePreviews(previews);

    setValidationMessage("");
    setMediaError(false);
  }

  // Function handles the uploading of post with the given info
  async function handleSubmitUpload() {

    const missingTitle = !title.trim();
    // Media is only required for platforms that need it
    const missingMedia =
      (selectedPlatforms.includes("tiktok") || selectedPlatforms.includes("instagram")) &&
      mediaFiles.length === 0;    const missingPrivacy = selectedPlatforms.includes("tiktok") && !privacyLevel;
    const missingSchedule = scheduleMode === "schedule" && (!scheduleDate || !scheduleTime);
    const missingCommercialContent = isCommercialContent && !isYourOwnBrand && !isBrandedContent;

    setTitleError(missingTitle);
    setMediaError(missingMedia);
    setPrivacyError(missingPrivacy);
    setScheduleError(missingSchedule);
    setCommericialContentError(missingCommercialContent);

    // PLEASE FIX TO MAKE IT MUCH BETTER. I GOT SO LAZY HERE :P
    // Validation checking if media and/or title is empty
    if (missingTitle && missingMedia && privacyError)
      return setValidationMessage("Error! Please enter a title, upload a media and select a privacy level before posting!");

    if (missingTitle && missingMedia)
      return setValidationMessage("Error! Please enter a title before posting and upload a media!");

    if (missingMedia && privacyError)
      return setValidationMessage("Error! Please upload a media and select a privacy level before posting!");

    if (missingTitle && privacyError)
      return setValidationMessage("Error! Please enter a title before posting and select a privacy level before posting!");

    if (missingTitle)
      return setValidationMessage("Error! Please enter a title before posting!");

    if (missingMedia)
      return setValidationMessage("Error! Please upload a media before posting!");

    if (missingPrivacy)
      return setValidationMessage("Error! Please select a privacy level before posting!");

    if (missingSchedule)
      return setValidationMessage("Error! Please select a date and/or time to schedule your post!");

    if (missingCommercialContent)
      return setValidationMessage("Error! You need to indicate if your content promotes yourself, a third party, or both.");

    // Guard: demo accounts are for previewing the settings/category UI only, never for real
    // submission. Covers both the "demo-*" settings-preview accounts and the acc-1..acc-4
    // category-preview accounts.
    const demoCategoryIds = new Set(DEMO_CATEGORY_ACCOUNTS.map(a => a.id));
    const selectedDemoAccounts = selectedAccounts.filter(id => id.startsWith("demo-") || demoCategoryIds.has(id));
    if (selectedDemoAccounts.length > 0)
      return setValidationMessage("Demo accounts are for previewing settings/categories only — deselect them and choose a real connected account before posting.");

    // Validation checking if selected accounts is 0
    if (selectedAccounts.length === 0)
      return setValidationMessage("Please select an account to upload to!");

    // Clear validation messages and remove errors
    setValidationMessage("");
    setTitleError(false);
    setMediaError(false);
    setPrivacyError(false);

    // Perform media upload
    await uploadPost({
      title: title,
      mediaFiles: mediaFiles,
      mediaFile: mediaFiles[0],

      // TikTok fields
      privacyLevel: privacyLevel,
      allowComments: allowComments,
      allowDuet: allowDuet,
      allowStitch: allowStitch,
      isYourOwnBrand: isYourOwnBrand,
      isBrandedContent: isBrandedContent,

      platforms: selectedPlatforms,

      // LinkedIn selected accounts
      linkedinConnectionIds: selectedAccounts.filter((id) =>
        accounts.some(
          (acc) => acc.id === id && acc.platform === "linkedin"
        )
      ),

      // Facebook selected accounts
      facebookConnectionIds: selectedAccounts.filter((id) =>
        accounts.some(
          (acc) => acc.id === id && acc.platform === "facebook"
        )
      ),

      // Instagram selected accounts
      instagramConnectionIds: selectedAccounts.filter(id =>
        accounts.some(
          (acc) => acc.id === id && acc.platform === "instagram"
        )
      ),

      scheduleMode: scheduleMode,

      scheduledDate:
        scheduleMode === "schedule" && scheduleDate
          ? `${scheduleDate}T${scheduleTime || "00:00"}`
          : undefined,

      scheduleDate:
        scheduleMode === "schedule" && scheduleDate
          ? new Date(`${scheduleDate}T${scheduleTime || "00:00"}`)
          : undefined,
    });

  }

  // Function returns TikTok User Consent depending on which are selected for Commercial Content and Promotion
  function getTikTokUserConsent() {

    if(!isCommercialContent)
      return null;
    else if (isBrandedContent)
      return (
        <p>By posting, you agree to TikTok's{" "}
          <a href="https://www.tiktok.com/legal/page/global/bc-policy/en" target="_blank" rel="noreferrer">Branded Content Policy</a> and{" "}
          <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noreferrer">Music Usage Confirmation.</a>
        </p>
      );
    else if(isYourOwnBrand)
      return (
        <p>By posting, you agree to TikTok's{" "}
          <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noreferrer">Music Usage Confirmation.</a>
        </p>
      );


    return null; // If all fails, return null

  }

  // useEffect for adjusting privacy options depending on commercial content
  useEffect(() => {

    // If branded content is activated and privacy level is set to SELF_ONLY, remove it and show error.
    if (isBrandedContent && privacyLevel === "SELF_ONLY") {
      setPrivacyLevel("");
      setValidationMessage("Branded content visibility cannot be set to private. Please choose a different privacy setting.");
    }

  }, [isBrandedContent, privacyLevel]);

  // fix filtering of file previews across platforms
  useEffect(() => {

    const hasSingleOnlyPlatform = selectedPlatforms.includes("linkedin") || selectedPlatforms.includes("tiktok");

    if (hasSingleOnlyPlatform && mediaFiles.length > 1) {

      mediaFilePreviews.forEach(url =>
        URL.revokeObjectURL(url)
      );

      const firstFile = mediaFiles[0];

      setMediaFiles([firstFile]);

      setMediaFilePreviews([
        URL.createObjectURL(firstFile)
      ]);
    }
  }, [selectedPlatforms]);

  // Removes URL object from mediaFilePreview on unmount/leaving the page to prevent memory leaks
  useEffect(() => {

    return () => {

      mediaFilePreviews.forEach(url =>
        URL.revokeObjectURL(url)
      );

    }


  }, [mediaFilePreviews]);



  return (
    <div>
      <SchedulingTabs/>
      <main className="main-content">
        <div className="create-post-page">
          <div className="cp-header">
            <button className="cp-back-btn" onClick={() => navigate("/dashboard")}>
              <IoArrowBack size={18} />
            </button>
         
          </div>

          <div className="cp-compose-layout">
            {/* Left: account checklist */}
            <div className="cp-card cp-accounts-card">
              <div className="cp-section-title">Post to</div>
              <div className="cp-section-sub">Select one or more accounts</div>

              <label className="cp-demo-toggle">
                <input
                  type="checkbox"
                  checked={showDemoAccounts}
                  onChange={(e) => setShowDemoAccounts(e.target.checked)}
                />
                Show demo accounts (for previewing settings only)
              </label>

              <label className="cp-demo-toggle">
                <input
                  type="checkbox"
                  checked={showDemoCategories}
                  onChange={(e) => setShowDemoCategories(e.target.checked)}
                />
                Show demo categories (for previewing category select only)
              </label>

              {categoriesWithAccounts.length > 0 && (
                <div className="cp-category-quickselect">
                  <span className="cp-section-sub" style={{ marginBottom: 6, display: "block" }}>
                    Select by category
                  </span>
                  <div className="cp-category-chip-row">
                    {categoriesWithAccounts.map((cat) => {
                      const memberIds = cat.memberAccounts.map((a) => a.id);
                      const checked = isCategoryChecked(memberIds);
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          className={`cp-category-chip${checked ? " selected" : ""}`}
                          onClick={() => toggleCategory(memberIds)}
                        >
                          <span
                            className="cp-category-chip__dot"
                            style={{ background: cat.color }}
                          />
                          {cat.name}
                          <span className="cp-category-chip__count">{memberIds.length}</span>
                          {checked && <IoCheckmark size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="cp-account-list">

                {accountsLoading && <div className="cp-section-sub"> Loading accounts... </div>}

                {accountsError && <div className="cp-section-sub"> Error in loading accounts. Please refresh! </div>}

                {!accountsLoading && !accountsError && accounts.length === 0 &&
                  <div className="cp-section-sub"> No accounts connected to. </div>}

                {accounts.map((acc) => {
                  const selected = selectedAccounts.includes(acc.id);
                  const isDemo = acc.id.startsWith("demo-") || DEMO_CATEGORY_ACCOUNTS.some(d => d.id === acc.id);

                  // Show TikTok avatar from queryInfo if available
                  const avatarSrc = (queryInfo && acc.platform === "tiktok")
                    ? queryInfo.creator_avatar_url
                    : emptyPfp;

                  return (
                    <div
                      key={acc.id}
                      className={`cp-account-row${selected ? " selected" : ""}${isDemo ? " is-demo" : ""}`}
                      onClick={() => toggleAccount(acc.id)}
                    >
                      <div className="cp-account-checkbox">
                        {selected && <IoCheckmark size={13} />}
                      </div>
                      <img src={avatarSrc} alt="" />
                      <div className="cp-account-info">
                        <span className="cp-account-name">
                          {acc.name}{isDemo && <span className="cp-demo-badge">DEMO</span>}
                        </span>
                        <span className="cp-account-handle">{acc.handle}</span>
                        <span className="cp-account-platform">{acc.platform}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cp-accounts-divider" />
              <span className="cp-selected-count">
                {selectedAccounts.length} account{selectedAccounts.length !== 1 ? "s" : ""} selected
              </span>
            </div>

            {/* Right: main compose panel */}
            <div className="cp-main-col">

              <div className={`cp-card ${titleError ? "cp-card-error" : ""}`}>
                <div className="cp-section-title">Title<span className="required">*</span></div>
                <div className="cp-section-sub">Enter the title of your post</div>

                <div className="cp-textarea-wrapper">
                  <textarea
                    className="cp-textarea"
                    placeholder="What do you want to share?"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
                    maxLength={MAX_TITLE_LENGTH}
                  />
                </div>

                <div className="cp-textarea-footer">
                  <div className="cp-toolbar">
                    <button className="cp-toolbar-btn" type="button" title="Add emoji">
                      <MdOutlineEmojiEmotions size={16} />
                    </button>
                    <button className="cp-toolbar-btn" type="button" title="Mention">
                      <MdOutlineAlternateEmail size={16} />
                    </button>
                    <button className="cp-toolbar-btn" type="button" title="Hashtag">
                      <BsHash size={16} />
                    </button>
                  </div>
                  <span className="cp-char-count">{title.length}/{MAX_TITLE_LENGTH}</span>
                </div>
              </div>


              <div className="cp-card">
                <div className="cp-section-title">Caption</div>
                <div className="cp-section-sub">This caption will be used across selected accounts</div>

                <div className="cp-textarea-wrapper">
                  <textarea
                    className="cp-textarea"
                    placeholder="What do you want to share?"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={MAX_CAPTION_LENGTH}
                  />
                </div>

                <div className="cp-textarea-footer">
                  <div className="cp-toolbar">
                    <button className="cp-toolbar-btn" type="button" title="Add emoji">
                      <MdOutlineEmojiEmotions size={16} />
                    </button>
                    <button className="cp-toolbar-btn" type="button" title="Mention">
                      <MdOutlineAlternateEmail size={16} />
                    </button>
                    <button className="cp-toolbar-btn" type="button" title="Hashtag">
                      <BsHash size={16} />
                    </button>
                  </div>
                  <span className="cp-char-count">{caption.length}/{MAX_CAPTION_LENGTH}</span>
                </div>
              </div>

              <div className={`cp-card ${mediaError ? "cp-card-error" : ""}`}>

                <div className="cp-section-title">Media<span className="required">*</span></div>
                <div className="cp-section-sub">Attach images, videos, or documents to your post</div>

                <label htmlFor="media-upload" className="cp-dropzone">
                  <div className="cp-dropzone-icon">
                    <IoCloudUploadOutline size={26} />
                  </div>
                </label>

                {mediaFiles.length > 0 ?  (

                  <>
                    {mediaFiles.map((file, index) => (
                      
                      <div key={index}>

                          <div className="cp-dropzone-title">
                            {file.name}
                          </div>

                          <div className="cp-dropzone-sub">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>

                          {file.type.startsWith("video/") && (
                            <>
                              <div className="cp-media-preview-title">
                                Video Preview
                              </div>

                              <video
                                className="cp-media-preview"
                                height="320"
                                width="500"
                                controls
                              >
                                <source 
                                  src={mediaFilePreviews[index]} 
                                  type={file.type}
                                />
                                Browser does not support video format.
                              </video>
                            </>
                          )}

                          {file.type.startsWith("image/") && (
                            <>
                              <div className="cp-media-preview-title">
                                Image Preview
                              </div>

                              <img
                                src={mediaFilePreviews[index]}
                                alt="Image Preview"
                                className="cp-media-preview"
                              />
                            </>
                          )}

                          {file.type === "application/pdf" && (
                            <>
                              <div className="cp-media-preview-title">
                                PDF Preview
                              </div>

                              <iframe
                                src={mediaFilePreviews[index]}
                                className="cp-media-preview"
                                width="500"
                                height="320"
                                title="PDF Preview"
                              />
                            </>
                          )}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="cp-dropzone-title">Click or drag files to upload</div>
                    <div className="cp-dropzone-sub">PNG, JPG, MP4, PDF up to 750MB</div>
                  </>
                )}

                <input id="media-upload" type="file" {...(allowMultipleFiles ? { multiple: true } : {})} accept="video/mp4, image/png, image/jpg, application/pdf"
                  onChange={(e) => handleFileSelect(e)} />

              </div>

              {/** One settings block per unique platform in the current selection — matches how
                   Buffer's "Customize for each network" works: a separate box per network type,
                   shown together, not switched between one at a time. */}
              {uniquePlatforms.length > 0 && (
                <div className="cp-platform-settings-group">
                  {uniquePlatforms.includes("tiktok") && (
                    <TikTokSettings
                      queryInfo={queryInfo}
                      privacyLevel={privacyLevel}
                      isPhotoPost={isPhotoPost}
                      setPrivacyLevel={(val) => { setPrivacyLevel(val); setPrivacyError(false); }}
                      privacyError={privacyError}
                      allowComments={allowComments}
                      setAllowComments={setAllowComments}
                      allowDuet={allowDuet}
                      setAllowDuet={setAllowDuet}
                      allowStitch={allowStitch}
                      setAllowStitch={setAllowStitch}
                      isCommercialContent={isCommercialContent}
                      setIsCommercialContent={setIsCommercialContent}
                      isYourOwnBrand={isYourOwnBrand}
                      setIsYourOwnBrand={setIsYourOwnBrand}
                      isBrandedContent={isBrandedContent}
                      setIsBrandedContent={setIsBrandedContent}
                      commercialContentError={commercialContentError}
                    />
                  )}

                  {uniquePlatforms.includes("linkedin") && (
                    <PlatformSettingsPlaceholder platformLabel="LinkedIn" />
                  )}

                  {uniquePlatforms.includes("facebook") && (
                    <PlatformSettingsPlaceholder platformLabel="Facebook" />
                  )}

                  {uniquePlatforms.includes("instagram") && (
                    <PlatformSettingsPlaceholder platformLabel="Instagram" />
                  )}
                </div>
              )}

              <div className={`cp-card ${scheduleError ? "cp-card-error" : ""}`}>
                <div className="cp-section-title">When to post</div>
                <div className="cp-section-sub">Choose when this post should go out</div>

                <div className="cp-schedule-options">
                  <div
                    className={`cp-schedule-pill${scheduleMode === "now" ? " active" : ""}`}
                    onClick={() => { setScheduleMode("now"); setScheduleError(false); }}
                  >
                    Post now
                  </div>
                  <div
                    className={`cp-schedule-pill${scheduleMode === "schedule" ? " active" : ""}`}
                    onClick={() => setScheduleMode("schedule")}
                  >
                    Schedule for later
                  </div>
                  <div
                    className={`cp-schedule-pill${scheduleMode === "queue" ? " active" : ""}`}
                    onClick={() => { setScheduleMode("queue"); setScheduleError(false); }}
                  >
                    Add to queue
                  </div>
                </div>

                {scheduleMode === "schedule" && (
                  <div className="cp-schedule-row">
                    <div className="cp-field">
                      <label>Date<span className="required">*</span></label>
                      <DatePicker
                        value={scheduleDate}
                        onChange={(d) => { setScheduleDate(d); setScheduleError(false); }}
                      />
                    </div>
                    <div className="cp-field">
                      <label>Time<span className="required">*</span> - <span className="cp-section-sub">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span></label>
                      <TimePicker
                        value={scheduleTime}
                        onChange={(t) => { setScheduleTime(t); setScheduleError(false); }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="cp-card">
                <div className="cp-section-title">Upload Status</div>
                <div className="cp-section-sub">

                  {statusToView && (
                    <div className={`cp-upload-status ${statusToView.toLowerCase().includes("failed")
                      || statusToView.toLowerCase().includes("error!") ? "cp-status-failed" : "cp-status-success"}`}>
                      {statusToView}
                    </div>
                  )}

                </div>
              </div>

              {/** TikTok consent notice — only relevant when TikTok is selected */}
              {uniquePlatforms.includes("tiktok") && (
                <div className="cp-tiktok-consent-notice">
                  {getTikTokUserConsent()}
                </div>
              )}

              <div className="cp-actions-bar">
                <span className="cp-actions-hint">
                  {selectedAccounts.length === 0
                    ? "Select at least one account to continue"
                    : `Posting to ${selectedAccounts.length} account${selectedAccounts.length !== 1 ? "s" : ""}`}
                </span>
                <div className="cp-actions">
                  <button className="cp-btn-draft">Save as Draft</button>
                  <button
                    className="cp-btn-schedule"
                    onClick={() => handleSubmitUpload()}
                    disabled={isUploading || (isCommercialContent && !isYourOwnBrand && !isBrandedContent)}
                  >
                    {scheduleMode === "now" ? "Post Now" : scheduleMode === "queue" ? "Add to Queue" : "Schedule Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreatePost;
