import {useState} from "react";
import {IoTimeOutline} from "react-icons/io5";

import {TIME_SLOTS, formatTimeLabel, parseTypedTime} from "../frontend_utilities/calendarUtilities";



export interface TimePickerProps {
  value: string; // "HH:MM" 24hr, or ""
  onChange: (value: string) => void; // always emits "HH:MM" 24hr, same as native <input type="time">
}


function TimePicker({ value, onChange }: TimePickerProps): React.JSX.Element {
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

export default TimePicker;