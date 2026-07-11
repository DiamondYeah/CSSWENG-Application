import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MessageCircle, Check } from "lucide-react";

// Import utility for platform icons
import {PLATFORM_META} from "../frontend_utilities/platformIcons.tsx"

// Import types
import {type Platform} from "../types/account.ts"
import {type ScheduledPost} from "../types/post.ts"


const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Interface for Calendar Grid Information
interface CalendarGridDetails{

    posts: ScheduledPost[];
    readOnly?: boolean;
    postsView: "pending" | "published";
    setPostsView: (postView: "pending" | "published") => void;

}

// Interface for Grid Day
interface GridDay {
    date: Date;
    inMonth: boolean;
}


// ---------------------------------------------------------------
// Icon helpers
// ---------------------------------------------------------------




// ---------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------


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






// readOnly to be used at later date
export function CalendarGrid({posts, readOnly = false, postsView, setPostsView}: CalendarGridDetails){ 

    const today = useMemo(() => new Date(), []);
    const [cursorDate, setCursorDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [view, setView] = useState<"month" | "week">("month");

    const year = cursorDate.getFullYear();
    const month = cursorDate.getMonth();
    const monthLabel = cursorDate.toLocaleString("en-US", { month: "long", year: "numeric" });
    const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);


    const postsByDate = useMemo(() => {
        const map: Record<string, ScheduledPost[]> = {};
        for (const p of posts) {
            if (!map[p.date!]) map[p.date!] = [];
            map[p.date!].push(p);
        }
        return map;
    }, [posts]);



    return(
        <>
        
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

                <div className="ap-toggle-group">
                <button
                    className={`ap-toggle-group__btn ${postsView === "pending" ? "is-active" : ""}`}
                    onClick={() => setPostsView("pending")}
                >
                    Scheduled Posts {postsView == "pending" && <Check size={13} />} {/** Show checkmark when enabled */}
                </button>
                <button
                    className={`ap-toggle-group__btn ${postsView === "published" ? "is-active" : ""}`}
                    onClick={() => setPostsView("published")}
                >
                    Published Posts {postsView == "published" && <Check size={13} />} {/** Show checkmark when enabled */}
                </button>
                </div>

                <div className="ap-month-nav">
                <button className="ap-month-nav__btn" onClick={() => setCursorDate(new Date(year, month - 1, 1))} aria-label="Previous month">
                    <ChevronLeft size={20} />
                </button>
                <span className="ap-month-nav__label">{monthLabel}</span>
                <button className="ap-month-nav__btn" onClick={() => setCursorDate(new Date(year, month + 1, 1))} aria-label="Next month">
                    <ChevronRight size={20} />
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
                        {dayPosts.map((post) => {

                            const meta = PLATFORM_META[post.platform as Platform]
                            if(!meta)
                                return null;

                            return (
                                <div key = {post.id} className="ap-post-card">
                                    <div className="ap-post-card__header">
                                        <span className="ap-post-card__account">
                                            {post.title ?? "No Title"}
                                        </span>
                                        {meta && // Display Platform Icon
                                        (<span className="ap-post-card__platform" style = {{color: meta.color}}>
                                            <meta.Icon  size = {10} color="#ffffff"></meta.Icon>
                                            {post.platform}
                                        </span>)}
                                    </div>

                                    <div className="ap-post-card__body">
                                    
                                        <div className="ap-post-card__text">
                                        {post.title && <p className="ap-post-card__title">{post.title}</p>}
                                        {post.snippet && <p className="ap-post-card__snippet">{post.snippet}</p>}
                                        </div>

                                    </div>

                                    <div className="ap-post-card__footer">
                                    <Clock size={10} />
                                    <span>{post.time}</span>
                                    {post.hasComment && <MessageCircle size={10} style={{ marginLeft: 6 }} />}
                                    </div>
                                </div>

                            )
                        })}
                        </div>
                    );
                    })}
                </div>
                ))}
            </div>
            </main>

        </>
    );


}