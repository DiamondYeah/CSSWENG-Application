import "./CreatePost.css";
import { useState, useEffect, useMemo } from "react";
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



// Import functions from controller, hooks and utilities
import {useConnectAccounts} from "../hooks/connectAccounts.ts";
import {useUserQueryInfo} from "../hooks/userQueryInfo.ts"
import {usePostUpload} from "../hooks/postUpload.ts"


// Import TikTok Settings Component
import { TikTokSettings } from "../components/TikTokSettings.tsx";

// ---------- Constants for media posting ---------- //

// Title and Caption Length
const MAX_TITLE_LENGTH: number = 2200;
const MAX_CAPTION_LENGTH: number = 2200;


function CreatePost() {


  const navigate = useNavigate();
  const {accounts, isLoading: accountsLoading, error: accountsError} = useConnectAccounts();
  const {queryInfo} = useUserQueryInfo();
  const {isUploading, uploadStatus, uploadPost} = usePostUpload();

  const [caption, setCaption] = useState<string>("");
  const [title, setTitle] = useState<string>(""); // Added for post that have title field
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule" | "queue">("schedule");


  // Stateful const that store info user and video info fetched from TikTokAPI
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  // TO BE ADDED FOR CALENDAR SCHEDULING
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
  const statusToView = validationMessage || uploadStatus; // ValidationMessage takes priority



  function toggleAccount(id: string) {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }


  // Function handles any file uploads in HTML input file and stores it in mediaFile const
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>){

      const file = e.target.files?.[0]; // Get file and store it in const

      // Return if no file
      if(!file)
        return;

      if(queryInfo){

        // Create new video document and assign its source to the url of a file
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file)
        video.onloadedmetadata = () => {

        // Check if video duration exceeds the maximum allowed limit for the user's TikTok Account
        if(video.duration > queryInfo.max_video_post_duration_sec){

          // Revoke and show error if there is an error
          setMediaError(true)
          setValidationMessage(`Video exceeds maximum duration of TikTok's allowed post duration of ${queryInfo.max_video_post_duration_sec} seconds.`)
          URL.revokeObjectURL(video.src);
          return

        }

        setMediaFile(file); // Store file
        setValidationMessage("");
        setMediaError(false) // Clear error
        URL.revokeObjectURL(video.src);
            
      }



      }
      else // If query information does not exist
        setMediaFile(file); // Store file

  }


  // Function handles the uploading of post with the given info
  async function handleSubmitUpload(){

    // Store boolean result if title and/or media is empty 
    const missingTitle = !title.trim();
    const missingMedia = !mediaFile;
    const missingPrivacy = !privacyLevel;
    const missingSchedule = (scheduleMode == "schedule" && (!scheduleDate || !scheduleTime))
    const missingCommercialContent = isCommercialContent && !isYourOwnBrand && !isBrandedContent

    setTitleError(missingTitle);
    setMediaError(missingMedia);
    setPrivacyError(missingPrivacy);
    setScheduleError(missingSchedule);
    setCommericialContentError(missingCommercialContent)


    // PLEASE FIX TO MAKE IT MUCH BETTER. I GOT SO LAZY HERE :P
    // Validation checking if media and/or title is empty
    if(missingTitle && missingMedia && privacyError)
      return setValidationMessage("Please enter a title, upload a media and select a privacy level before posting!")

    if(missingTitle && missingMedia)
      return setValidationMessage("Please enter a title before posting and upload a media!")

    if(missingMedia && privacyError)
      return setValidationMessage("Please upload a media and select a privacy level before posting!")

    if(missingTitle && privacyError)
      return setValidationMessage("Please enter a title before posting and select a privacy level before posting!")

    if(missingTitle)
      return setValidationMessage("Please enter a title before posting!")

    if(missingMedia)
      return setValidationMessage("Please upload a media before posting!")

    if(missingPrivacy)
      return setValidationMessage("Please select a privacy level before posting!")

    if(missingSchedule)
      return setValidationMessage("Please select a date and/or time to schedule your post!")

    if(missingCommercialContent)
      return setValidationMessage("You need to indicate if your content promotes yourself, a third party, or both.")


    // Validation checking if selected accounts is 0
    if(selectedAccounts.length === 0)
      return setValidationMessage("Please select an account to upload to!")


    // Clear validation messages and remove errors
    setValidationMessage("")
    setTitleError(false);
    setMediaError(false);
    setPrivacyError(false)
  
  
    // Perform media upload
    await uploadPost({

      title: title, 
      mediaFile: mediaFile!, 
      privacyLevel: privacyLevel, 
      allowComments: allowComments,
      allowDuet: allowDuet,
      allowStitch: allowStitch,
      isYourOwnBrand: isYourOwnBrand,
      isBrandedContent: isBrandedContent,
      // Ternary opertaor to send undefined if scheduleDate has no value and user is not in scheduleMode (User chose Post Now)
      scheduleDate: scheduleMode == "schedule" && scheduleDate
      ? new Date(`${scheduleDate}T${scheduleTime|| "00:00"}`): undefined 

    })

  }

  // Function returns TikTok User Consent depending on which are selected for Commercial Content and Promotion
  function getTikTokUserConsent(){

    if(isCommercialContent && isBrandedContent)
      return <p>By posting, you agree to TikTok's <a href = "https://www.tiktok.com/legal/page/global/bc-policy/en">Branded Content Policy</a> and 
      <a href = "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en"> Music Usage Confirmation.</a></p>


    return <p>By posting, you agree to TikTok's <a href = "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en">Music Usage Confirmation.</a></p>

  }


  // useEffect for adjusting privacy options depending on commerical content
  useEffect(() => {

    // If branded content is activated and privacy level is set, to SELF_ONLY, remove it and show error.
    if(isBrandedContent && privacyLevel == "SELF_ONLY"){

      setPrivacyLevel("");
      setValidationMessage("Branded content visibility cannot be set to private. Please choose a different privacy setting.");

    }

  }, [isBrandedContent, privacyLevel])


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

                {/** Added for when accounts are loading or an error occurs */}
                {accountsLoading && <div className = "cp-section-sub"> Loading accounts... </div>}

                {accountsError && (<div className = "cp-section-sub"> Error in loading accounts. Please refresh! </div>)}
                
                {!accountsLoading && !accountsError && accounts.length == 0 && 
                (<div className = "cp-section-sub"> No accounts connected to. </div>)}


                {/** Changed mapping to use the loaded accounts instead of fake ones */}
                {accounts.map((acc) => {
                  const selected = selectedAccounts.includes(acc.id);

                  // Check if theres info in queryInfo and passed platform is a TikTok account
                  if(queryInfo && acc.platform == "tiktok")
                    return (
                      <div
                        key={acc.id}
                        className={`cp-account-row${selected ? " selected" : ""}`}
                        onClick={() => toggleAccount(acc.id)}
                      >
                        <div className="cp-account-checkbox">
                          {selected && <IoCheckmark size={13} />}
                        </div>
  
                        <img src={queryInfo.creator_avatar_url} alt="" />
                        <div className="cp-account-info">
                          <span className="cp-account-name">{acc.name}</span>
                          <span className="cp-account-handle">{acc.handle}</span>
                          <span className="cp-account-platform">{acc.platform}</span>

                        </div>
                      </div>
                    );


                  // Fallback if the given platform isnt among the conditions
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

              {/** Added title enter field */}
              <div className= {`cp-card ${titleError ? "cp-card-error" : ""}`}>
                <div className="cp-section-title">Title<span className="required">*</span></div>
                <div className="cp-section-sub">Enter the title of your post</div>

                <div className="cp-textarea-wrapper">
                  <textarea
                    className="cp-textarea"
                    placeholder="What do you want to share?"
                    value={title}
                    onChange={(e) => {setTitle(e.target.value); setTitleError(false)}}
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

              {/** Wired to a file input now */}
              <div className= {`cp-card ${mediaError ? "cp-card-error" : ""}`}>

                <div className="cp-section-title">Media<span className="required">*</span></div>
                <div className="cp-section-sub">Attach images or video to your post</div>

                {/** Converted div to label*/}
                <label htmlFor = "media-upload" className = "cp-dropzone">

                  <div className="cp-dropzone-icon">
                    <IoCloudUploadOutline size={26} />
                  </div>

                </label>   

                  {/** Change display depending if mediaFile is null or not*/}
                  {mediaFile ? (                    
                  <>                  
                    <div className="cp-dropzone-title">{mediaFile.name}</div>
                    <div className="cp-dropzone-sub">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</div>      
                    
                  </>) : (
                  <>
                    <div className="cp-dropzone-title">Click or drag files to upload</div>
                    <div className="cp-dropzone-sub">PNG, JPG, MP4 up to 50MB</div>
                  </>)}


                  {/** Input field linked to label field to handle file uploading */}
                  <input id = "media-upload" type = "file" accept = "video/mp4, image/png, image/jpg" 
                    onChange = {(e) => handleFileSelect(e)}></input>
                    
              </div>

              {/** Import TikTok Settings Component */}
              <TikTokSettings
              
                queryInfo = {queryInfo}
                privacyLevel = {privacyLevel}
                isPhotoPost = {!!mediaFile && mediaFile.type.startsWith("image/") }
                // If there is val, then value was selected and no error must occur.
                setPrivacyLevel = {(val) => {setPrivacyLevel(val); setPrivacyError(false)}} 
                privacyError = {privacyError}
                allowComments = {allowComments}
                setAllowComments = {setAllowComments}
                allowDuet = {allowDuet}
                setAllowDuet = {setAllowDuet}
                allowStitch = {allowStitch}
                setAllowStitch = {setAllowStitch}
                isCommercialContent = {isCommercialContent}
                setIsCommercialContent = {setIsCommercialContent}
                isYourOwnBrand = {isYourOwnBrand}
                setIsYourOwnBrand = {setIsYourOwnBrand}
                isBrandedContent = {isBrandedContent}
                setIsBrandedContent = {setIsBrandedContent}
                commercialContentError = {commercialContentError}

              ></TikTokSettings>

              <div className= {`cp-card ${scheduleError ? "cp-card-error" : ""}`}>
                <div className="cp-section-title">When to post</div>
                <div className="cp-section-sub">Choose when this post should go out</div>

                <div className="cp-schedule-options">
                  <div
                    className={`cp-schedule-pill${scheduleMode === "now" ? " active" : ""}`}
                    onClick={() => {setScheduleMode("now"); setScheduleError(false)}}
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
                    onClick={() => {setScheduleMode("queue"); setScheduleError(false)}}
                  >
                    Add to queue
                  </div>
                </div>

                {scheduleMode === "schedule" && (
                  <div className="cp-schedule-row">
                    <div className="cp-field">
                      <label>Date<span className="required">*</span></label>
                      <input type="date" value = {scheduleDate}
                      onChange = {(e) => {setScheduleDate(e.target.value); setScheduleError(false);}}/>
                    </div>
                    <div className="cp-field">
                      <label> Time<span className="required">*</span> - <span className = "cp-section-sub">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span></label>
                      <input type="time" value = {scheduleTime} onChange = {(e) => {setScheduleTime(e.target.value); setScheduleError(false);}}/>
                    </div>
                  </div>
                )}
              </div>

              {/** Added to show result of uploading media */}
              <div className = "cp-card">
                <div className="cp-section-title">Upload Status</div>
                <div className="cp-section-sub">

                  { statusToView && (

                    <div className =  {`cp-upload-status ${statusToView.toLowerCase().includes("failed") 
                    || statusToView.toLowerCase().includes("please")? "cp-status-failed" : "cp-status-success"}`} > 
                      {statusToView}
                    </div>


                  )}

                </div>

              </div>

              {/** Add consent text */}
              <div className="cp-tiktok-consent-notice">
                {getTikTokUserConsent()}
              </div>



              <div className="cp-actions-bar">
                <span className="cp-actions-hint">
                  {selectedAccounts.length === 0
                    ? "Select at least one account to continue"
                    : `Posting to ${selectedAccounts.length} account${selectedAccounts.length !== 1 ? "s" : ""}`}
                </span>
                <div className="cp-actions">
                  <button className="cp-btn-draft">Save as Draft</button>
                  {/** Disabled when uploading video */}
                  <button className="cp-btn-schedule" 
                    onClick = {() => handleSubmitUpload()} 
                    disabled = {isUploading || (isCommercialContent && !isYourOwnBrand && !isBrandedContent)}>
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