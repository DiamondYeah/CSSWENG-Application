import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import "./UserStatus.css";

// ---------------------------------------------------------------
// UserStatus
// Shows the logged-in user's name in the top bar. Click it to open
// a small dropdown with a "Log out" option.
//
// NOTE: `onLogout` is left as a prop so you can wire it up to
// whatever your real logout flow is (e.g. calling fetchController's
// logout endpoint, clearing an auth cookie/token, then redirecting
// to /login). `username` is likewise a prop since I don't have your
// auth hook here — pass in whatever your auth context/hook exposes.
// ---------------------------------------------------------------

export interface UserStatusProps {
  username?: string;
  onLogout?: () => void | Promise<void>;
}

export default function UserStatus({
  username = "Account",
  onLogout,
}: UserStatusProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      if (onLogout) {
        await onLogout();
      } else {
        // Default fallback until real logout logic is wired in.
        console.warn("UserStatus: no onLogout handler provided");
      }
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  const initials = username.trim().slice(0, 2).toUpperCase();

  return (
    <div className="ap-user-status" ref={rootRef}>
      <button
        className="ap-user-status__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="ap-user-status__avatar">{initials}</span>
        <span className="ap-user-status__label">{username}</span>
        <ChevronDown
          size={14}
          className={`ap-user-status__chevron ${open ? "is-open" : ""}`}
        />
      </button>

      {open && (
        <div className="ap-user-status__menu">
          <button
            className="ap-user-status__menu-item"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={14} />
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}