import { useEffect, useState, type JSX } from "react";
import Navbar from "../components/Navbar";
import "./Accounts.css";
import { fetchQueryInfo, fetchUserInfo, fetchLinkedInUserInfo, fetchLinkedInConnectLink, fetchFacebookUserInfo, fetchInstagramUserInfo, deleteSocialConnection } from "../controller/fetchController.ts";

const LOGINREDIRECT           = "https://spyglass-employee-probable.ngrok-free.dev/auth/linkedinlogin/logAuth/tiktoklogin";
const LINKEDIN_LOGINREDIRECT = "https://spyglass-employee-probable.ngrok-free.dev/auth/linkedinlogin";
const FACEBOOK_LOGINREDIRECT  = "https://spyglass-employee-probable.ngrok-free.dev/facebookAuth/facebooklogin";
const INSTAGRAM_LOGINREDIRECT = "https://spyglass-employee-probable.ngrok-free.dev/instagramAuth/instagramlogin";


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

const INITIAL_ACCOUNTS: AccountsByPlatform = {
  facebook: [],
  instagram: [],
  linkedin: [],
  tiktok: [],
};

let nextAccountId = 100;

export default function AgilaPostConnectAccounts() {
  const [accounts, setAccounts] = useState<AccountsByPlatform>(INITIAL_ACCOUNTS);
  const [connectingPlatform, setConnectingPlatform] = useState<PlatformId | null>(null);
  const [addToCategories, setAddToCategories] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showLinkedInSwitchPrompt, setShowLinkedInSwitchPrompt] = useState(false);

  const totalConnected = Object.values(accounts).reduce(
    (sum, list) => sum + list.length,
    0
  );
  const platformsWithAtLeastOne = Object.values(accounts).filter(
    (list) => list.length > 0
  ).length;


  useEffect(() => {
    async function loadTikTokAccount(){
      try{
        const userInfo = await fetchUserInfo();
        console.log("Raw userInfo response:", userInfo);

        if(!userInfo?.data?.open_id)
          return;

        const queryInfo = await fetchQueryInfo();
        console.log("Raw queryInfo response:", queryInfo)

        setAccounts((prev) => {

          const user = userInfo.data;
          return{
            ...prev,
            tiktok: [
              ...prev.tiktok,
              {
                id: user.open_id,
                handle: `@${user.username ?? "unknown"}`,
                label: user.display_name ?? "unknown"
              }
            ]
          }
        });
      }
      catch(e){
        alert("Error: " + e);
      }
    }

    async function loadLinkedInAccount() {
        try {
            const userInfo = await fetchLinkedInUserInfo();
            console.log("Raw LinkedIn userInfo response:", userInfo);

            if (!userInfo?.success || !Array.isArray(userInfo.data))
                return;

            setAccounts((prev) => ({
                ...prev,
                linkedin: userInfo.data.map((conn: any) => ({
                    id: conn.id,
                    handle: conn.email ?? "unknown",
                    label: conn.name ?? "unknown",
                })),
            }));

        } catch (e) {
            alert("Error: " + e);
        }
    }

    async function loadFacebookAccount() {
        try {
            const userInfo = await fetchFacebookUserInfo();
            console.log("Raw Facebook userInfo response:", userInfo);

            if (!userInfo?.success || !Array.isArray(userInfo.data))
                return;

            setAccounts((prev) => ({
                ...prev,
                facebook: userInfo.data.map((conn: any) => ({
                    id: conn.id,
                    handle: conn.handle ?? "Page",
                    label: conn.name ?? "unknown",
                })),
            }));

        } catch (e) {
            alert("Error: " + e);
        }
    }

    async function loadInstagramAccount() {
        try {
            const userInfo = await fetchInstagramUserInfo();
            console.log("Raw Instagram userInfo response:", userInfo);

            if (!userInfo?.success || !Array.isArray(userInfo.data))
                return;

            setAccounts((prev) => ({
                ...prev,
                instagram: userInfo.data.map((conn: any) => ({
                    id: conn.id,
                    handle: conn.handle ?? "Instagram",
                    label: conn.name ?? "unknown",
                })),
            }));

        } catch (e) {
            alert("Error: " + e);
        }
    }

    loadTikTokAccount();
    loadLinkedInAccount();
    loadFacebookAccount();
    loadInstagramAccount();
  }, [])

  const [connectLink, setConnectLink] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkError, setLinkError] = useState(false);

  async function openLinkedInSwitchPrompt() {
      setShowLinkedInSwitchPrompt(true);
      setLinkLoading(true);
      setLinkCopied(false);
      setLinkError(false);
      try {
          const result = await fetchLinkedInConnectLink();
          console.log("CONNECT LINK RESPONSE:", result);
          if (result?.success && result.url) {
              setConnectLink(result.url);
          } else {
              setLinkError(true);
          }
      } catch {
          setLinkError(true);
      } finally {
          setLinkLoading(false);
      }
  }

  function handleConnect(platformId: PlatformId){
    switch (platformId) {
        case "tiktok":
            window.location.href = LOGINREDIRECT;
            return;
        case "linkedin":
            if (accounts.linkedin.length > 0) {
                openLinkedInSwitchPrompt();
                return;
            }
            window.location.href = LINKEDIN_LOGINREDIRECT;
            return;
        case "facebook":
            window.location.href = FACEBOOK_LOGINREDIRECT;
            return;
        case "instagram":
            // Instagram's native login supports force_reauth, so no special
            // handling is needed for "connect another account" — same button works every time.
            window.location.href = INSTAGRAM_LOGINREDIRECT;
            return;
    }
  }

  const handleDisconnect = async (platformId: PlatformId, accountId: string) => {
    try {
        const result = await deleteSocialConnection(accountId);
        if (!result?.success) {
            alert("Failed to disconnect: " + (result?.message ?? "unknown error"));
            return;
        }

        setAccounts((prev) => ({
            ...prev,
            [platformId]: prev[platformId].filter((a) => a.id !== accountId),
        }));
    } catch (e) {
        alert("Error disconnecting account: " + e);
    }
};

  return (
    <div className="agp-layout">
      <Navbar />
      <div className="agp">
        <main className="agp-main">
          <div className="agp-badge">🔗 Connect once. Post everywhere.</div>

          <h1 className="agp-title">Your accounts</h1>
          <p className="agp-subtitle">
            Connect as many accounts as you manage — there&apos;s no limit
            per platform.
          </p>
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
            {/* model for switching linkedin accounts */}
            {showLinkedInSwitchPrompt && (
              <div className="agp-modal-overlay" onClick={() => setShowLinkedInSwitchPrompt(false)}>
                <div className="agp-modal" onClick={(e) => e.stopPropagation()}>
                  <h3 className="agp-modal__title">Connecting a different LinkedIn account?</h3>
                  <p className="agp-modal__body">
                    LinkedIn will keep signing you in as your last connected account in this browser.
                    Copy the link below and paste it into a new <strong>incognito / private window</strong> to sign in as a different account.
                  </p>

                  {linkLoading && <p className="agp-modal__body">Generating your link…</p>}

                  {linkError && (
                    <p className="agp-modal__body">Couldn't generate a link. Please try again.</p>
                  )}

                  {connectLink && !linkLoading && (
                    <div className="agp-modal__link-row">
                      <input type="text" readOnly value={connectLink} className="agp-modal__link-input" onFocus={(e) => e.target.select()} />
                      <button
                        type="button"
                        className="agp-button agp-button--ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(connectLink);
                          setLinkCopied(true);
                        }}
                      >
                        {linkCopied ? "Copied!" : "Copy link"}
                      </button>
                    </div>
                  )}

                  <div className="agp-modal__actions">
                    <button type="button" className="agp-modal__cancel" onClick={() => setShowLinkedInSwitchPrompt(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}