import "./CreatePost.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoArrowBack,
  IoCloudUploadOutline,
  IoCheckmark,
} from "react-icons/io5";
import { MdOutlineEmojiEmotions, MdOutlineAlternateEmail } from "react-icons/md";
import { BsHash } from "react-icons/bs";
import Navbar from "../components/Navbar";
import emptyPfp from "../assets/emptyPfp.jpg";

const ACCOUNTS = [
  { id: "1", name: "AgilaPost Official", handle: "@agilapost" },
  { id: "2", name: "Account 2", handle: "@accountTwo" },
  { id: "3", name: "Account 3", handle: "@accountThree" },
];

function CreatePost() {
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(["1"]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule" | "queue">("schedule");

  function toggleAccount(id: string) {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  return (
    <div>
      <Navbar />
      <main className="main-content">
        <div className="create-post-page">
          <div className="cp-header">
            <button className="cp-back-btn" onClick={() => navigate("/dashboard")}>
              <IoArrowBack size={18} />
            </button>
            <div>
              <h1><a href="/create-post">Create a post</a></h1>
              <p>Design and schedule your content</p>
            </div>
          </div>

          <div className="cp-compose-layout">
            {/* Left: account checklist */}
            <div className="cp-card cp-accounts-card">
              <div className="cp-section-title">Post to</div>
              <div className="cp-section-sub">Select one or more accounts</div>

              <div className="cp-account-list">
                {ACCOUNTS.map((acc) => {
                  const selected = selectedAccounts.includes(acc.id);
                  return (
                    <div
                      key={acc.id}
                      className={`cp-account-row${selected ? " selected" : ""}`}
                      onClick={() => toggleAccount(acc.id)}
                    >
                      <div className="cp-account-checkbox">
                        {selected && <IoCheckmark size={13} />}
                      </div>
                      <img src={emptyPfp} alt="" />
                      <div className="cp-account-info">
                        <span className="cp-account-name">{acc.name}</span>
                        <span className="cp-account-handle">{acc.handle}</span>
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
              <div className="cp-card">
                <div className="cp-section-title">Caption</div>
                <div className="cp-section-sub">This caption will be used across selected accounts</div>

                <div className="cp-textarea-wrapper">
                  <textarea
                    className="cp-textarea"
                    placeholder="What do you want to share?"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={2200}
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
                  <span className="cp-char-count">{caption.length}/2200</span>
                </div>
              </div>

              <div className="cp-card">
                <div className="cp-section-title">Media</div>
                <div className="cp-section-sub">Attach images or video to your post</div>
                <div className="cp-dropzone">
                  <div className="cp-dropzone-icon">
                    <IoCloudUploadOutline size={26} />
                  </div>
                  <div className="cp-dropzone-title">Click or drag files to upload</div>
                  <div className="cp-dropzone-sub">PNG, JPG, MP4 up to 50MB</div>
                </div>
              </div>

              <div className="cp-card">
                <div className="cp-section-title">When to post</div>
                <div className="cp-section-sub">Choose when this post should go out</div>

                <div className="cp-schedule-options">
                  <div
                    className={`cp-schedule-pill${scheduleMode === "now" ? " active" : ""}`}
                    onClick={() => setScheduleMode("now")}
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
                    onClick={() => setScheduleMode("queue")}
                  >
                    Add to queue
                  </div>
                </div>

                {scheduleMode === "schedule" && (
                  <div className="cp-schedule-row">
                    <div className="cp-field">
                      <label>Date</label>
                      <input type="date" />
                    </div>
                    <div className="cp-field">
                      <label>Time</label>
                      <input type="time" />
                    </div>
                  </div>
                )}
              </div>

              <div className="cp-actions-bar">
                <span className="cp-actions-hint">
                  {selectedAccounts.length === 0
                    ? "Select at least one account to continue"
                    : `Posting to ${selectedAccounts.length} account${selectedAccounts.length !== 1 ? "s" : ""}`}
                </span>
                <div className="cp-actions">
                  <button className="cp-btn-draft">Save as Draft</button>
                  <button className="cp-btn-schedule">
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