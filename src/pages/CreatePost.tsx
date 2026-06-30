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

// Changed to let instead of const to be editable
let ACCOUNTS = [
  { id: "1", name: "AgilaPost Official", handle: "@agilapost" },
  { id: "2", name: "Account 2", handle: "@accountTwo" },
  { id: "3", name: "Account 3", handle: "@accountThree" },
];

// Import button for TikTok Functionality
import Button from "../components/loginButton.tsx"

// Import functions from controller
import {fetchUserInfo, initializeUploadPost, uploadToTikTok, checkUploadStatus} from "../controller/fetchController.ts" 


// Imp

// Constants for TikTok API
const LOGINREDIRECT = "https://smilingly-breeches-amusable.ngrok-free.dev/logAuth/tiktoklogin";

function CreatePost() {


  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(["1"]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule" | "queue">("schedule");


    // Stateful const that store info user and video info fetched from TikTokAPI
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");
    const [userInfo, setUserInfo] = useState<any>();
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [scheduleDate, setScheduleDate] = useState<Date>();
    const [scheduleTime, setScheduleTime] = useState<string>("");


  function toggleAccount(id: string) {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }


  async function loginTikTokAccount(){


    window.location.href = LOGINREDIRECT;

    // Get user info from fetchUserInfo and store info result
    const fetchedUserData = await fetchUserInfo();
    setUserInfo(fetchedUserData);

    if(userInfo)
      // Push new account to element to show user details
      ACCOUNTS.push({id: userInfo.data.user.open_id as string , name: userInfo.data.user.username, handle: "@account4"})


  }


  // Function handles any file uploads in HTML input file and stores it in mediaFile const
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>){

      if(e.target.files && e.target.files != null){

          setMediaFile(e.target.files[0]); // Store file
          console.log("Selected File:", e.target.files[0]); // Debug
          setUploadStatus("");

      }

  }



  // Function handles the uploading of post with the given info
  async function handleMediaUpload(){

    if(!mediaFile)
      return alert("Please upload a media for upload!")

    if(selectedAccounts.length === 0)
      return alert("Please select an account to upload to!")

    // Set values of isUploading to true and change status of upload on each step of the upload process
    setIsUploading(true);
    setUploadStatus("Preparing Upload")

    try{

      // Get initial upload info from initializeUploadPost and store info result
      const initUploadResult = await initializeUploadPost("Test Title", "SELF_ONLY", mediaFile.size);

      if(!initUploadResult?.data?.upload_url)
        return alert("No upload url found from initial upload!");


      // Upload video to the TikTok API given upload url found from initUploadResult
      setUploadStatus("Uploading...")
      await uploadToTikTok(mediaFile, initUploadResult.data.upload_url);

      // Check upload status of video 
      setUploadStatus("Checking upload status...")
      const videoStatus = await checkUploadStatus(initUploadResult.data.publish_id);

      // Store final video status in a const and update both uploadStatus and provide alert to user
      const finalVideoStatus = `Upload Done! | Status: ${videoStatus.data.status || "Unknown"}`
      setUploadStatus(finalVideoStatus)
      alert(finalVideoStatus); // Alert result of upload


    }
    catch(e){

      alert("Error: " + e);
      setUploadStatus("Upload Failed! Please check error for more details!")

    }
    finally{

      setIsUploading(false);
      
    }



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



              {/** Added for logging in to TikTok account */}
              <div className = "cp-card">
                <div className="cp-section-title">Log in To TikTok Account</div>
                <div className="cp-section-sub">

                  <Button onClick = {loginTikTokAccount} buttonLabel = "Log In To TikTok"></Button>

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

              {/** Wired to a file input now */}
              <div className="cp-card">

                <div className="cp-section-title">Media</div>
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

              {/** Added to show result of uploading media */}
              <div className = "cp-card">
                <div className="cp-section-title">Upload Status</div>
                <div className="cp-section-sub">

                  { uploadStatus && (

                    <div className =  {`cp-upload-status ${uploadStatus.includes("Failed")? "cp-status-failed" : "cp-status-success"}`} > 
                      {uploadStatus}
                    </div>


                  )}

                </div>

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
                  <button className="cp-btn-schedule" onClick = {() => handleMediaUpload()} disabled = {isUploading}>
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