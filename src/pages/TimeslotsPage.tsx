import React, { useMemo, useState } from "react";
import { Plus, X, Clock } from "lucide-react";
import "./Timeslots.css";

import SchedulingTabs from "../components/SchedulingTabs";

// ---------------------------------------------------------------
// types — reuses the same Account/Platform shape as Calendar/Category
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
  title?: string;
  snippet?: string;
}

export interface TimeSlot {
  id: string;
  time: string; // "HH:MM", 24hr
  postId?: string; // assigned post, if any — empty slot when omitted
}

// day-of-week keys, Monday-first to match the Calendar grid convention
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

export type SlotsByDay = Record<DayKey, TimeSlot[]>;

export interface TimeslotsPageProps {
  accounts?: Account[];
  initialSlots?: Record<string, SlotsByDay>; // keyed by account id
  unscheduledPosts?: Post[];
}

// ---------------------------------------------------------------
// platform icons — same inline SVGs used in Calendar/Category,
// since lucide-react doesn't ship brand icons
// ---------------------------------------------------------------

function FacebookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M14 8.5h-1.6c-.6 0-1.1.4-1.1 1.2V11H14l-.3 2.2h-2.4V19H9V13.2H7.2V11H9V9.4C9 7 10.4 5 12.8 5H14v3.5z"
        fill="#fff"
      />
    </svg>
  );
}
function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="5" stroke="#fff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.4" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16.5" cy="7.5" r="1" fill="#fff" />
    </svg>
  );
}
function LinkedinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
        in
      </text>
    </svg>
  );
}
function TiktokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="17" r="3" fill="#fff" />
      <path d="M12 4v13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 4c0 3 2.5 5 5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const PLATFORM_META: Record<Platform, { Icon: React.ComponentType<{ size?: number }>; color: string }> = {
  facebook: { Icon: FacebookIcon, color: "#1877F2" },
  linkedin: { Icon: LinkedinIcon, color: "#0A66C2" },
  instagram: { Icon: InstagramIcon, color: "#E1306C" },
  tiktok: { Icon: TiktokIcon, color: "#000000" },
};

// ---------------------------------------------------------------
// defaults — used only if no props supplied
// ---------------------------------------------------------------

const DEFAULT_ACCOUNTS: Account[] = [
  { id: "acc-1", name: "AgilaPost Official", platform: "instagram" },
  { id: "acc-2", name: "agilapost.demo", platform: "instagram" },
  { id: "acc-3", name: "AgilaPost Inc.", platform: "linkedin" },
  { id: "acc-4", name: "@agilapost", platform: "facebook" },
];

function emptySlotsByDay(): SlotsByDay {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}

const DEFAULT_SLOTS: Record<string, SlotsByDay> = {
  "acc-1": {
    ...emptySlotsByDay(),
    mon: [{ id: "s1", time: "09:00" }],
    wed: [{ id: "s2", time: "09:00" }],
    fri: [{ id: "s3", time: "09:00" }, { id: "s4", time: "18:00" }],
  },
  "acc-2": {
    ...emptySlotsByDay(),
    tue: [{ id: "s5", time: "12:30" }],
    thu: [{ id: "s6", time: "12:30" }],
  },
};

const DEFAULT_UNSCHEDULED_POSTS: Post[] = [
  { id: "p1", accountId: "acc-1", platform: "instagram", title: "Behind the scenes at our studio", snippet: "Take a look at how we prep every shoot before going live..." },
  { id: "p2", accountId: "acc-1", platform: "instagram", title: "New feature announcement", snippet: "We're rolling out bulk upload this week!" },
  { id: "p3", accountId: "acc-2", platform: "instagram", title: "Client spotlight", snippet: "Shoutout to one of our favorite partners this month..." },
  { id: "p4", accountId: "acc-3", platform: "linkedin", title: "Hiring: Senior Frontend Engineer", snippet: "We're growing the team — check out the full job posting." },
];

// ---------------------------------------------------------------
// helpers
// ---------------------------------------------------------------

function formatTime(time24: string): string {
  const [hStr, m] = time24.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

function sortSlots(slots: TimeSlot[]): TimeSlot[] {
  return [...slots].sort((a, b) => a.time.localeCompare(b.time));
}

// ---------------------------------------------------------------
// post picker
// ---------------------------------------------------------------

function PostPicker({
  posts,
  accountId,
  onSelect,
  onClear,
  onClose,
  hasAssignedPost,
}: {
  posts: Post[];
  accountId: string;
  onSelect: (postId: string) => void;
  onClear: () => void;
  onClose: () => void;
  hasAssignedPost: boolean;
}) {
  const eligible = posts.filter((p) => p.accountId === accountId);

  return (
    <div className="ts-picker-overlay" onClick={onClose}>
      <div className="ts-picker" onClick={(e) => e.stopPropagation()}>
        <div className="ts-picker__header">
          <span>Select a post</span>
          <button type="button" className="ts-picker__close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        {hasAssignedPost && (
          <button type="button" className="ts-picker__clear" onClick={onClear}>
            Remove assigned post
          </button>
        )}

        <div className="ts-picker__list">
          {eligible.length === 0 ? (
            <p className="ts-picker__empty">No unscheduled posts for this account yet.</p>
          ) : (
            eligible.map((post) => (
              <button
                key={post.id}
                type="button"
                className="ts-picker__item"
                onClick={() => onSelect(post.id)}
              >
                <span className="ts-picker__item-title">{post.title ?? "Untitled post"}</span>
                {post.snippet && <span className="ts-picker__item-snippet">{post.snippet}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// day column
// ---------------------------------------------------------------

function DayColumn({
  label,
  slots,
  posts,
  accentColor,
  onAdd,
  onRemove,
  onOpenPicker,
}: {
  label: string;
  slots: TimeSlot[];
  posts: Post[];
  accentColor: string;
  onAdd: (time: string) => void;
  onRemove: (id: string) => void;
  onOpenPicker: (slotId: string) => void;
}) {
  const [draftTime, setDraftTime] = useState("09:00");
  const [adding, setAdding] = useState(false);

  const handleConfirm = () => {
    onAdd(draftTime);
    setAdding(false);
    setDraftTime("09:00");
  };

  return (
    <div className="ts-day-col">
      <div className="ts-day-col__label">{label}</div>

      <div className="ts-day-col__slots">
        {sortSlots(slots).map((slot) => {
          const assignedPost = slot.postId ? posts.find((p) => p.id === slot.postId) : undefined;
          return (
            <div
              key={slot.id}
              className={`ts-slot-chip ${assignedPost ? "is-filled" : "is-empty"}`}
              style={{ borderColor: accentColor }}
            >
              <button
                type="button"
                className="ts-slot-chip__main"
                onClick={() => onOpenPicker(slot.id)}
              >
                <Clock size={11} style={{ color: accentColor }} />
                <span className="ts-slot-chip__time">{formatTime(slot.time)}</span>
                <span className="ts-slot-chip__post">
                  {assignedPost ? assignedPost.title ?? "Untitled post" : "Select a post"}
                </span>
              </button>
              <button
                type="button"
                className="ts-slot-chip__remove"
                onClick={() => onRemove(slot.id)}
                aria-label={`Remove ${formatTime(slot.time)} slot`}
              >
                <X size={11} />
              </button>
            </div>
          );
        })}

        {adding ? (
          <div className="ts-add-inline">
            <input
              type="time"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
              className="ts-add-inline__input"
            />
            <button type="button" className="ts-add-inline__confirm" onClick={handleConfirm}>
              Add
            </button>
            <button
              type="button"
              className="ts-add-inline__cancel"
              onClick={() => setAdding(false)}
              aria-label="Cancel"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button type="button" className="ts-add-btn" onClick={() => setAdding(true)}>
            <Plus size={12} />
            Add time
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// main page
// ---------------------------------------------------------------

export default function TimeslotsPage({
  accounts = DEFAULT_ACCOUNTS,
  initialSlots = DEFAULT_SLOTS,
  unscheduledPosts = DEFAULT_UNSCHEDULED_POSTS,
}: TimeslotsPageProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [slotsByAccount, setSlotsByAccount] = useState<Record<string, SlotsByDay>>(() => {
    const seeded: Record<string, SlotsByDay> = {};
    for (const acc of accounts) {
      seeded[acc.id] = initialSlots[acc.id] ?? emptySlotsByDay();
    }
    return seeded;
  });
  const [pickerTarget, setPickerTarget] = useState<{ day: DayKey; slotId: string } | null>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const selectedSlots = slotsByAccount[selectedAccountId] ?? emptySlotsByDay();

  const totalSlotsByAccount = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const acc of accounts) {
      const days = slotsByAccount[acc.id] ?? emptySlotsByDay();
      totals[acc.id] = DAYS.reduce((sum, d) => sum + days[d.key].length, 0);
    }
    return totals;
  }, [accounts, slotsByAccount]);

  const addSlot = (day: DayKey, time: string) => {
    setSlotsByAccount((prev) => {
      const current = prev[selectedAccountId] ?? emptySlotsByDay();
      const newSlot: TimeSlot = { id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time };
      return {
        ...prev,
        [selectedAccountId]: {
          ...current,
          [day]: [...current[day], newSlot],
        },
      };
    });
  };

  const removeSlot = (day: DayKey, slotId: string) => {
    setSlotsByAccount((prev) => {
      const current = prev[selectedAccountId] ?? emptySlotsByDay();
      return {
        ...prev,
        [selectedAccountId]: {
          ...current,
          [day]: current[day].filter((s) => s.id !== slotId),
        },
      };
    });
  };

  const assignPost = (day: DayKey, slotId: string, postId: string) => {
    setSlotsByAccount((prev) => {
      const current = prev[selectedAccountId] ?? emptySlotsByDay();
      return {
        ...prev,
        [selectedAccountId]: {
          ...current,
          [day]: current[day].map((s) => (s.id === slotId ? { ...s, postId } : s)),
        },
      };
    });
  };

  const clearPost = (day: DayKey, slotId: string) => {
    setSlotsByAccount((prev) => {
      const current = prev[selectedAccountId] ?? emptySlotsByDay();
      return {
        ...prev,
        [selectedAccountId]: {
          ...current,
          [day]: current[day].map((s) => (s.id === slotId ? { ...s, postId: undefined } : s)),
        },
      };
    });
  };

  const applyToWeekdays = (time: string) => {
    setSlotsByAccount((prev) => {
      const current = prev[selectedAccountId] ?? emptySlotsByDay();
      const updated = { ...current };
      (["mon", "tue", "wed", "thu", "fri"] as DayKey[]).forEach((day) => {
        const newSlot: TimeSlot = {
          id: `slot-${Date.now()}-${day}-${Math.random().toString(36).slice(2, 5)}`,
          time,
        };
        updated[day] = [...updated[day], newSlot];
      });
      return { ...prev, [selectedAccountId]: updated };
    });
  };

  return (
    <div className="ts-page">
      <SchedulingTabs />

      <div className="ts-header">
          <h1 className="ts-title">Timeslots</h1>
          <p className="ts-subtitle">
            Set recurring posting times per account. When you add a post to a Timeslot instead of
            picking an exact date, it fills the next open slot automatically.
          </p>
        </div>

        <div className="ts-body">
          {/* account list */}
          <aside className="ts-account-list">
            {accounts.length === 0 ? (
              <div className="ts-account-list__empty">
                <p>No accounts connected yet.</p>
              </div>
            ) : (
              accounts.map((acc) => {
                const meta = PLATFORM_META[acc.platform];
                const count = totalSlotsByAccount[acc.id] ?? 0;
                const isSelected = acc.id === selectedAccountId;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    className={`ts-account-row ${isSelected ? "is-selected" : ""}`}
                    onClick={() => setSelectedAccountId(acc.id)}
                  >
                    <span className="ts-account-row__avatar" style={{ background: meta.color }}>
                      <meta.Icon size={13} />
                    </span>
                    <span className="ts-account-row__info">
                      <span className="ts-account-row__name">{acc.name}</span>
                      <span className="ts-account-row__count">
                        {count} {count === 1 ? "slot" : "slots"} / week
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </aside>

          {/* week grid for selected account */}
          <main className="ts-week">
            {selectedAccount ? (
              <>
                <div className="ts-week__header">
                  <div className="ts-week__account">
                    <span
                      className="ts-week__account-avatar"
                      style={{ background: PLATFORM_META[selectedAccount.platform].color }}
                    >
                      {React.createElement(PLATFORM_META[selectedAccount.platform].Icon, { size: 14 })}
                    </span>
                    <span className="ts-week__account-name">{selectedAccount.name}</span>
                  </div>
                  <button
                    type="button"
                    className="ts-quick-fill"
                    onClick={() => applyToWeekdays("09:00")}
                  >
                    <Plus size={13} />
                    Add 9:00 AM to every weekday
                  </button>
                </div>

                <div className="ts-week__grid">
                  {DAYS.map((d) => (
                    <DayColumn
                      key={d.key}
                      label={d.label}
                      slots={selectedSlots[d.key]}
                      posts={unscheduledPosts}
                      accentColor={PLATFORM_META[selectedAccount.platform].color}
                      onAdd={(time) => addSlot(d.key, time)}
                      onRemove={(slotId) => removeSlot(d.key, slotId)}
                      onOpenPicker={(slotId) => setPickerTarget({ day: d.key, slotId })}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="ts-week__empty">
                <p>Select an account to configure its Timeslots.</p>
              </div>
            )}
          </main>
        </div>

        {pickerTarget && selectedAccount && (
          <PostPicker
            posts={unscheduledPosts}
            accountId={selectedAccount.id}
            hasAssignedPost={Boolean(
              selectedSlots[pickerTarget.day].find((s) => s.id === pickerTarget.slotId)?.postId
            )}
            onSelect={(postId) => {
              assignPost(pickerTarget.day, pickerTarget.slotId, postId);
              setPickerTarget(null);
            }}
            onClear={() => {
              clearPost(pickerTarget.day, pickerTarget.slotId);
              setPickerTarget(null);
            }}
            onClose={() => setPickerTarget(null)}
          />
        )}
      </div>
  );
}