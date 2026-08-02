import {useState} from "react";
import {IoCalendarOutline, IoChevronBack, IoChevronForward} from "react-icons/io5";

import {WEEKDAY_LABELS, MONTH_LABELS, toDateInputValue, parseTypedDate, isSameDate} from "../frontend_utilities/calendarUtilities";


type DatePickerView = "days" | "months" | "years";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
}

function DatePicker({ value, onChange }: DatePickerProps): React.JSX.Element {
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

export default DatePicker;