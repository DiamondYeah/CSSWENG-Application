import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import "./UserStatus.css";
import { useNavigate } from "react-router-dom";
import { logoutAccount } from "../controller/fetchController";
import { useAccountInfo } from "../hooks/accountInfo";



// UserStatus
// Shows the logged-in user's name in the top bar. Click it to open
// a small dropdown with a "Log out" option.

export interface UserStatusProps {
  username?: string;
  onLogout?: () => void | Promise<void>;
}

export default function UserStatus({
  username: usernameProp,
}: UserStatusProps) {

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  // Fetch account info from useAccountInfo hook with usernameProp as boolean
  const {account, isLoading} = useAccountInfo(!!usernameProp)
  const username = usernameProp ?? account?.username ?? "Account"; // Check props, if not check account, if not default to "Account"

  // Checks if username is still loading or not
  const isLoadingUsername = !usernameProp && isLoading;


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

      // Call function to perform logout
      const logoutRes = await logoutAccount();

      if (!logoutRes.success) 
        console.error("Logout failed:", logoutRes.message);

    } catch (err) {

      console.error("Error logging out: ", err);

    } 
    finally {

        navigate("/signin", { replace: true });

    }
  };

  const initials = username.trim().slice(0, 2).toUpperCase();

  return (
    <div className="ap-user-status" ref={rootRef}>
      <button
        className="ap-user-status__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        disabled={isLoadingUsername} // Disasble if isLoadingUsername is true
      >
        <span className="ap-user-status__avatar">{isLoadingUsername ? "Loading..." : initials}</span>
        <span className="ap-user-status__label">{isLoadingUsername ? "Loading..." : username}</span>
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