import "./CreatePost.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoCloudUploadOutline, IoCheckmark,} from "react-icons/io5";
import { MdOutlineEmojiEmotions, MdOutlineAlternateEmail } from "react-icons/md";
import { BsHash } from "react-icons/bs";
import SchedulingTabs from "../components/SchedulingTabs";
import emptyPfp from "../assets/emptyPfp.jpg";

// Import functions from controller, hooks and utilities
import {useConnectAccounts} from "../hooks/connectAccounts.ts";
import {useUserQueryInfo} from "../hooks/userQueryInfo.ts"
import {usePostUpload} from "../hooks/postUpload.ts"
import {getMergedTikTokQueryInfo} from "../frontend_utilities/tiktokUtilities.ts";

// Import Components for the CreatePost
import TikTokSettings from "../components/TikTokSettings.tsx";
import DatePicker from "../components/DatePicker.tsx";
import TimePicker from "../components/TimePicker.tsx";
import TikTokConsent from "../components/TikTokConsent.tsx";


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



// Main function for the create post page
function CreatePost() {

  const navigate = useNavigate();
  const {accounts: accounts, isLoading: accountsLoading, error: accountsError} = useConnectAccounts();

  // Find tiktok IDs from social media accounts and get specific query info if needed
  const tiktokIDs = accounts.filter(acc => acc.platform == "tiktok").map(acc => acc.id);
  const {getSpecificQueryInfo} = useUserQueryInfo(tiktokIDs);

  const {isUploading, uploadStatus, uploadPost} = usePostUpload();

  // Categories come from the same shared store Category.tsx and Calendar.tsx use.
  // Purely for quick-selecting a group of accounts here — no backend involved.
  const allCategories = useCategories();

  const [caption, setCaption] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule" | "queue">("schedule");

  // Stateful const that media files and their previews for the uploads
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

  // Every unique platform in the current selection gets its own settings block,
  // shown together — matches Buffer's "Customize for each network" pattern, where
  // multiple Facebook accounts still only produce one Facebook settings box.
  const uniquePlatforms = Array.from(new Set(selectedPlatforms));

  // isPhotoPost is derived from the uploaded files, not stored as separate state
  const isPhotoPost = mediaFiles.length > 0 && mediaFiles[0].type.startsWith("image/");



    
  const allowMultipleFiles = (selectedPlatforms.includes("facebook") || selectedPlatforms.includes("instagram")) &&
  !selectedPlatforms.includes("linkedin") && !selectedPlatforms.includes("tiktok");


  // Determines if the given platform allows PDF upload or not
  const allowPDF = selectedPlatforms.length === 1 && selectedPlatforms.includes("linkedin");


  // Determines what media file uploads are allowed for the given platform. Pased on PDF upload
  const acceptedMediaTypes = allowPDF
    ? "video/mp4, image/png, image/jpg, application/pdf"
    : "video/mp4, image/png, image/jpg";


  // useEffect for adjusting privacy options depending on commercial content
  useEffect(() => {

    // If branded content is activated and privacy level is set to SELF_ONLY, remove it and show error.
    if (isBrandedContent && privacyLevel === "SELF_ONLY") {
      setPrivacyLevel("");
      setValidationMessage("Error! Branded content visibility cannot be set to private. Please choose a different privacy setting.");
    }

  }, [isBrandedContent, privacyLevel]);


  // Performed validation checking on uploading media files to check for allowed file types and if multiple uploads are allowed
  useEffect(() => {

    let updatedFiles = [...mediaFiles];

    // If allowPDF is disabled, filter out any media files that are pdf type
    if(!allowPDF)
      updatedFiles = updatedFiles.filter((file) => file.type != "application/pdf");


    // Get all images from mediaFiles and check if they are allowed or not
    const allImages = updatedFiles.every((f) => f.type.startsWith("image/")); 
    if((!allowMultipleFiles || !allImages) && updatedFiles.length > 1)
      updatedFiles = [updatedFiles[0]]; // Get first image if only multi upload is not allowed


    // If updatedFiles and original mediaFiles are not equal due to validation, update mediaFiles with the content of updatedFiles
    if(updatedFiles.length != mediaFiles.length){

      // Remove url previews and update media files and previews tih the ones from updatedFiles
      mediaFilePreviews.forEach(url => URL.revokeObjectURL(url));
      setMediaFiles(updatedFiles);
      setMediaFilePreviews(updatedFiles.map((file) => URL.createObjectURL(file)));

    }



  }, [selectedPlatforms]);


  // Removes URL object from mediaFilePreviews on unmount/leaving the page to prevent memory leaks
  useEffect(() => {

    return () => {

      mediaFilePreviews.forEach(url => URL.revokeObjectURL(url));

    }

  }, [mediaFilePreviews]);



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

    // Get all files that are images and filter files with social medias that do allow multiple files and multiple images
    const allImages = files.every((f) => f.type.startsWith("image/")); 
    const filteredFiles = (allowMultipleFiles && allImages) ? files : [files[0]];

    if (filteredFiles.length === 0)
      return;


    // Check every file size if it exceeds the given MAX_MEDIA_FILE constant. If so, show error and return
    for (const file of filteredFiles) {

      if (file.size > MAX_MEDIA_FILE_SIZE) {

        setMediaError(true);
        setValidationMessage(`File size exceeds current file size limit. ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        return;

      }
    }


    // Remove old preview URLs to prevent memory leaks
    mediaFilePreviews.forEach(url => URL.revokeObjectURL(url));


    // Create a preview URL object for the uploaded video file and update mediaFilePreview
    const previews = filteredFiles.map(file => URL.createObjectURL(file));

    setMediaFiles(filteredFiles);
    setMediaFilePreviews(previews);
    setValidationMessage("");
    setMediaError(false);

    // Get max duration for TikTok with firstFile
    const firstFile = filteredFiles[0];
    if (selectedPlatforms.includes("tiktok") && firstFile.type.startsWith("video/")){

      // Get max duration of all of the selecegted accounts for TikTok
      const maxVideoLength = getMergedTikTokQueryInfo(selectedAccounts, accounts, getSpecificQueryInfo)?.max_video_post_duration_sec ?? Infinity;


      // Create new video document and assign its source to the url of a file
      const video = document.createElement("video");
      const checkURL = URL.createObjectURL(firstFile);
      video.src = checkURL;

      video.onloadedmetadata = () => {

        URL.revokeObjectURL(checkURL);

        
        // Check if video duration exceeds the maximum allowed limit for the user's TikTok Account
        if (video.duration > maxVideoLength) {

          setMediaError(true);
          setValidationMessage(`Video exceeds maximum duration of TikTok's allowed post duration of ${maxVideoLength} seconds.`);
          URL.revokeObjectURL(video.src);


          previews.forEach(url => URL.revokeObjectURL(url));

          setMediaFiles([]); 
          setMediaFilePreviews([]);
          return;

        }

      };

    }

  }


  // Function handles the uploading of post with the given info
  async function handleSubmitUpload() {

    const missingTitle = !title.trim();
    // Media is only required for platforms that need it
    const missingMedia = (selectedPlatforms.includes("tiktok") || selectedPlatforms.includes("instagram")) && mediaFiles.length <= 0;
    const missingPrivacy = selectedPlatforms.includes("tiktok") && !privacyLevel;
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
      mediaFiles: mediaFiles, // Pass both array and single instance of mediaFile
      mediaFile: mediaFiles[0],

      // TikTok fields
      privacyLevel: privacyLevel,
      allowComments: allowComments,
      allowDuet: allowDuet,
      allowStitch: allowStitch,
      isYourOwnBrand: isYourOwnBrand,
      isBrandedContent: isBrandedContent,

      platforms: selectedPlatforms,

      // TikTok selected accounts (multi-account)
      socialMediaAccountsIDs: selectedAccounts.filter((id) =>
          accounts.some((acc) => acc.id === id && acc.platform === "tiktok")
      ),

      linkedinConnectionIds: selectedAccounts.filter((id) =>
          accounts.some((acc) => acc.id === id && acc.platform === "linkedin")
      ),

      facebookConnectionIds: selectedAccounts.filter((id) =>
          accounts.some((acc) => acc.id === id && acc.platform === "facebook")
      ),

      instagramConnectionIds: selectedAccounts.filter((id) =>
          accounts.some((acc) => acc.id === id && acc.platform === "instagram")
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


                  let accQueryInfo = null;

                  if(acc.platform == "tiktok")
                    accQueryInfo = getSpecificQueryInfo(acc.id);


                  // Show TikTok avatar from queryInfo if available
                  const avatarSrc = accQueryInfo?.creator_avatar_url ?? emptyPfp;

                  return (
                    <div
                      key={acc.id}
                      className={`cp-account-row${selected ? " selected" : ""}`}
                      onClick={() => toggleAccount(acc.id)}
                    >
                      <div className="cp-account-checkbox">
                        {selected && <IoCheckmark size={13} />}
                      </div>
                      <img src={avatarSrc} alt="" />
                      <div className="cp-account-info">
                        <span className="cp-account-name">
                          {acc.name}
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

                {mediaFiles.length > 0 ? (

                  <>

                    {mediaFiles.map((file, index) => (
                      <div key={index}>
                        <div className="cp-dropzone-title">{file.name}</div>
                        <div className="cp-dropzone-sub">{(file.size / 1024 / 1024).toFixed(2)} MB</div>


                        {/** Show video preview if mediaFile is an video */}
                        {file.type.startsWith("video/") && (
                          <>

                            <div className="cp-media-preview-title">Video Preview</div>

                            <video className = "cp-media-preview" height = "320" width = "500" controls>

                              <source src = {mediaFilePreviews[index]} type = {file.type} ></source>
                              Browser does not support video format for preview.

                            </video>

                          </>

                        )}

                        {/** Show video preview if mediaFile is an image */}
                        {file.type.startsWith("image/") && (
                          <>

                            <div className="cp-media-preview-title">Image Preview</div>

                            <img src = {mediaFilePreviews[index]} alt = "Image Preview" className = "cp-media-preview"></img>

                          </>

                        )}

                        {/** Show video preview if mediaFile is a PDF */}
                        {file.type === "application/pdf" && (
                          <>

                            <div className="cp-media-preview-title">PDF Preview</div>

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
                    <div className="cp-dropzone-sub">PNG, JPG, MP4, and PDF up to 750MB</div>
                  </>
                )}

                <input id="media-upload" type="file" {...(allowMultipleFiles ? { multiple: true } : {})} accept={acceptedMediaTypes}
                  onChange={(e) => handleFileSelect(e)} />

              </div>

              {/** One settings block per unique platform in the current selection — matches how
                   Buffer's "Customize for each network" works: a separate box per network type,
                   shown together, not switched between one at a time. */}
              {uniquePlatforms.length > 0 && (
                <div className="cp-platform-settings-group">
                  {uniquePlatforms.includes("tiktok") && (
                    <TikTokSettings
                      queryInfo={getMergedTikTokQueryInfo(selectedAccounts, accounts, getSpecificQueryInfo)}
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
                  {TikTokConsent({isCommercialContent, isYourOwnBrand, isBrandedContent})}
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
