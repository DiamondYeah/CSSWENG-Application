import { useEffect, useState, type JSX } from "react";
import SchedulingTabs from "../components/SchedulingTabs"; // NEW: replaces hardcoded tab divs
import "./Accounts.css";

// Import functions from controller
import { fetchQueryInfo, fetchUserInfo } from "../controller/fetchController.ts";

/* ---------- API Logic ---------- */

// Constants for TikTok API
const LOGINREDIRECT = "https://smilingly-breeches-amusable.ngrok-free.dev/logAuth/tiktoklogin";


/* ---------- Types ---------- */

export type PlatformId = "facebook" | "instagram" | "linkedin" | "tiktok";

export interface ConnectedAccount {
  id: string;
  handle: string;
  label: string;
}

export interface PlatformDef {
  id: PlatformId;
  name: string;
  blurb: string;
  iconBg: string;
  accent: string;
  icon: JSX.Element;
}

type AccountsByPlatform = Record<PlatformId, ConnectedAccount[]>;

/* ---------- Platform icons (inline SVG, brand-accurate, no external deps) ---------- */

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.23 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.91h-2.33V22C18.34 21.23 22 17.08 22 12.06Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth={1.8}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.2" cy="6.8" r="1" fill="#fff" stroke="none" />
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
    <path d="M6.94 8.5H3.56V21h3.38V8.5ZM5.25 3a1.96 1.96 0 1 0 0 3.92A1.96 1.96 0 0 0 5.25 3ZM21 13.85c0-3.4-1.82-4.98-4.24-4.98-1.96 0-2.84 1.08-3.33 1.84V8.5h-3.38c.04.96 0 12.5 0 12.5h3.38v-6.98c0-.37.03-.75.14-1.02.3-.75.99-1.53 2.15-1.53 1.52 0 2.13 1.16 2.13 2.86V21H21v-7.15Z" />
  </svg>
);

const TiktokIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
    <path d="M16.6 5.82c-.84-.74-1.4-1.77-1.55-2.93h-3.03v13.3c0 1.46-1.18 2.65-2.65 2.65a2.65 2.65 0 0 1 0-5.3c.26 0 .51.04.75.1V10.6a5.7 5.7 0 0 0-.75-.05A5.65 5.65 0 1 0 14.97 16V9.16a8.1 8.1 0 0 0 4.73 1.51V7.65c-1.18 0-2.27-.39-3.1-1.04Z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#A1A1AA"
    strokeWidth={2.4}
    className={`agp-chevron${open ? " agp-chevron--open" : ""}`}
  >
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- Platform config ---------- */

const PLATFORM_DEFS: PlatformDef[] = [
  {
    id: "facebook",
    name: "Facebook",
    blurb: "Pages and personal profiles.",
    iconBg: "#1877F2",
    accent: "#8B5CF6",
    icon: <FacebookIcon />,
  },
  {
    id: "instagram",
    name: "Instagram",
    blurb: "Feed posts, Reels, Stories, carousels.",
    iconBg: "linear-gradient(135deg, #F58529, #DD2A7B 55%, #8134AF)",
    accent: "#F97316",
    icon: <InstagramIcon />,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    blurb: "Profiles and Company Pages.",
    iconBg: "#0A66C2",
    accent: "#3B82F6",
    icon: <LinkedinIcon />,
  },
  {
    id: "tiktok",
    name: "TikTok",
    blurb: "Video posts and image carousels.",
    iconBg: "#000000",
    accent: "#16A34A",
    icon: <TiktokIcon />,
  },
];

// Seed data — each platform holds an array, so any number of accounts can stack up per platform.
const INITIAL_ACCOUNTS: AccountsByPlatform = {
  facebook: [],
  instagram: [
    { id: "ig-1", handle: "@agilapost.demo", label: "Agila Demo Page" },
  ],
  linkedin: [],
  tiktok: [],
};

let nextAccountId = 100;

/* ---------- Component ---------- */

export default function AgilaPostConnectAccounts() {
  const [accounts, setAccounts] = useState<AccountsByPlatform>(INITIAL_ACCOUNTS);
  const [connectingPlatform, setConnectingPlatform] = useState<PlatformId | null>(null);
  const [addToCategories, setAddToCategories] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const totalConnected = Object.values(accounts).reduce(
    (sum, list) => sum + list.length,
    0
  );
  const platformsWithAtLeastOne = Object.values(accounts).filter(
    (list) => list.length > 0
  ).length;



  // useEffect to handle redirect back (Checks cookie if user just returned from an OAuth Login)
  useEffect(() => {

    // Function to load TikTok Information
    async function loadTikTokAccount(){

      try{

        // Call function to get user info
        const userInfo = await fetchUserInfo();
        console.log("Raw userInfo response:", userInfo);

        // Silently return if open id not found
        if(!userInfo?.data?.open_id)
          return;

        const queryInfo = await fetchQueryInfo();
        console.log("Raw queryInfo response:", queryInfo)

        setAccounts((prev) => {

          const user = userInfo.data;

          // Check if user already exists within accounts variable. If they do, just return.
          const userAlreadyAdded = prev.tiktok.some(a => a.id == user.open_id);

          if(userAlreadyAdded)
            return prev;

          // Create new account while keeping other accounts in the array with ...
          return{

            ...prev,
            tiktok: [
              ...prev.tiktok,
              {

                id: user.open_id,
                handle: `@${user.username ?? "unknown"}`,
                label: user.display_name ?? "unkonwn"

              }

            ]

          }

        });

      }
      catch(e){

        alert("Error: " + e);

      }

    }

    // Call function
    loadTikTokAccount();

  }, [])



  // Changed to function
  function handleConnect(platformId: PlatformId){


    switch(platformId){


      case "tiktok":
        window.location.href = LOGINREDIRECT;
        return

    }



    setConnectingPlatform(platformId);
    // Simulated OAuth round trip — swap for your real redirect/popup flow.
    // Each successful connect appends a new account rather than replacing one,
    // so the platform can hold as many connected accounts as needed.
    setTimeout(() => {
      const id = `acct-${nextAccountId++}`;
      const platform = PLATFORM_DEFS.find((p) => p.id === platformId)!;
      const countSoFar = accounts[platformId].length + 1;
      setAccounts((prev) => ({
        ...prev,
        [platformId]: [
          ...prev[platformId],
          {
            id,
            handle: `@new-${platform.id}-${countSoFar}`,
            label: `${platform.name} account ${countSoFar}`,
          },
        ],
      }));
      setConnectingPlatform(null);
    }, 1000);
  };

  const handleDisconnect = (platformId: PlatformId, accountId: string) => {
    setAccounts((prev) => ({
      ...prev,
      [platformId]: prev[platformId].filter((a) => a.id !== accountId),
    }));
  };

  return (
    <div className="agp-layout">
      <SchedulingTabs/>

      <div className="agp">
        <main className="agp-main">
          <div className="agp-badge">🔗 Connect once. Post everywhere.</div>

          <h1 className="agp-title">Your accounts</h1>
          <p className="agp-subtitle">
            Connect as many accounts as you manage — there&apos;s no limit
            per platform.
          </p>

          {/* Summary strip */}
          <div className="agp-summary">
            <div className="agp-summary__stat agp-summary__stat--bordered">
              <div className="agp-summary__value">{totalConnected}</div>
              <div className="agp-summary__label">Connected accounts</div>
              <div className="agp-summary__bar agp-summary__bar--violet" />
            </div>
            <div className="agp-summary__stat">
              <div className="agp-summary__value">
                {platformsWithAtLeastOne}/{PLATFORM_DEFS.length}
              </div>
              <div className="agp-summary__label">Platforms in use</div>
              <div className="agp-summary__bar agp-summary__bar--orange" />
            </div>
          </div>

          {/* Platform sections — each can hold any number of accounts */}
          <div className="agp-platforms">
            {PLATFORM_DEFS.map((platform) => {
              const list = accounts[platform.id];
              const isConnecting = connectingPlatform === platform.id;

              return (
                <div className="agp-platform" key={platform.id}>
                  <div
                    className={`agp-platform__header${
                      list.length > 0
                        ? " agp-platform__header--with-list"
                        : ""
                    }`}
                  >
                    <div className="agp-platform__identity">
                      <div
                        className="agp-platform__icon"
                        style={{ background: platform.iconBg }}
                      >
                        {platform.icon}
                      </div>
                      <div>
                        <div className="agp-platform__name">
                          {platform.name}
                        </div>
                        <div className="agp-platform__blurb">
                          {platform.blurb}
                        </div>
                      </div>
                    </div>

                    <span
                      className="agp-platform__count"
                      style={
                        {
                          color: platform.accent,
                          background: `${platform.accent}1A`,
                        } as React.CSSProperties
                      }
                    >
                      {list.length} connected
                    </span>
                  </div>

                  {list.length > 0 && (
                    <div className="agp-accounts">
                      {list.map((acct) => (
                        <div className="agp-account" key={acct.id}>
                          <div>
                            <div className="agp-account__label">
                              {acct.label}
                            </div>
                            <div className="agp-account__handle">
                              {acct.handle}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="agp-button agp-button--ghost"
                            onClick={() =>
                              handleDisconnect(platform.id, acct.id)
                            }
                          >
                            Disconnect
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="agp-platform__footer">
                    <button
                      type="button"
                      className="agp-button agp-button--primary"
                      disabled={isConnecting}
                      onClick={() => handleConnect(platform.id)}
                    >
                      {isConnecting ? (
                        "Connecting…"
                      ) : (
                        <>
                          <PlusIcon />
                          {list.length === 0
                            ? `Connect ${platform.name}`
                            : "Connect another account"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category toggle */}
          <div className="agp-toggle-row">
            <span className="agp-toggle-row__label">
              Add newly connected accounts to all categories
            </span>
            <button
              type="button"
              className={`agp-switch${addToCategories ? " agp-switch--on" : ""}`}
              aria-pressed={addToCategories}
              onClick={() => setAddToCategories((v) => !v)}
            >
              <span className="agp-switch__knob" />
            </button>
          </div>

          {/* Advanced settings */}
          <div className="agp-advanced">
            <button
              type="button"
              className="agp-advanced__toggle"
              onClick={() => setAdvancedOpen((v) => !v)}
            >
              Advanced settings
              <ChevronIcon open={advancedOpen} />
            </button>

            {advancedOpen && (
              <div className="agp-advanced__panel">
                Token refresh, account renaming, and per-account posting
                defaults will live here as more platforms are added.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}