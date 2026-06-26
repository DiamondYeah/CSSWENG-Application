import {useState, useEffect, useRef} from "react";

import Button from "../components/loginButton.tsx"

import { fetchUserInfo, fetchQueryInfo, initializeUploadPost, uploadToTikTok, checkUploadStatus, uploadPhotos} from "../controller/fetchController";

const LOGINREDIRECT = "https://smilingly-breeches-amusable.ngrok-free.dev/logAuth/tiktoklogin";

function TestAPI(): React.JSX.Element{

    // Stateful const that store info user and video info fetched from TikTokAPI
    const [userInfo, setUserInfo] = useState();
    const [queryInfo, setQueryInfo] = useState();
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [initialUploadInfo, setInitialUploadInfo] = useState<any>();
    const [videoUploadInfo, setVideoUploadInfo] = useState<any>();
    const [videoStatusInfo, setVideoStatusInfo] = useState<any>();

    // Reference textarea for editing
    const displayUserInfo = useRef<HTMLTextAreaElement>(null);
    const displayQueryInfo = useRef<HTMLTextAreaElement>(null);
    const displayInitUploadInfo = useRef<HTMLTextAreaElement>(null);
    const displayVideoUploadInfo = useRef<HTMLTextAreaElement>(null);
    const displayStatusUploadInfo = useRef<HTMLTextAreaElement>(null);
    const displayPhotoUploadInfo = useRef<HTMLTextAreaElement>(null);

    // Arrow function calls fetchUserInfo in fetchController to get user data from API
    const handleUserData = async () => {

        // Get user info from fetchUserInfo and store info result
        const fetchedUserData = await fetchUserInfo();
        setUserInfo(fetchedUserData);

        // Show info result in text area
        if(displayUserInfo.current)
            displayUserInfo.current.value = JSON.stringify(fetchedUserData, null, 2);


    }


    // Arrow function calls fethcQueryInfo in fetchController to get query data from API
    const handleQueryData = async () => {
 
        // Get query info from fetchQueryInfo and store info result
        const fetchedQueryData = await fetchQueryInfo();
        setQueryInfo(fetchedQueryData);

        // Show info result in text area
        if(displayQueryInfo.current)
            displayQueryInfo.current.value = JSON.stringify(fetchedQueryData, null, 2);

    }



    // Arrow function handles any file uploads in HTML input file and stores it in videoFile const
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 
        if(e.target.files && e.target.files != null){

            setVideoFile(e.target.files[0]); // Store file
            console.log("Selected File:", e.target.files[0]); // Debug

        }

    }


    // Arrow function calls initializeUploadPost in fetchController to prepare upload post and return upload_URL
    const handleInitUploadData = async () => {
 
        if(!videoFile){

            alert("No File Selected!");
            return;

        }

        // Get initial upload info from initializeUploadPost and store info result
        const initUploadData = await initializeUploadPost("Test Title", "SELF_ONLY", videoFile.size);
        setInitialUploadInfo(initUploadData);

        // Show info result in text area
        if(displayInitUploadInfo.current)
            displayInitUploadInfo.current.value = JSON.stringify(initUploadData, null, 2);

    }


    // Arrow function calls uploadToTikTok in fetchController to actually upload video to TikTok site
    const handleVideoUpload = async () => {
 
        if(!videoFile || !initialUploadInfo?.data?.upload_url){

            alert("No Video File Selected or No Upload URL!");
            return;

        }


         // Get initial upload info from initializeUploadPost and store info result
        const videoUploadData = await uploadToTikTok(videoFile, initialUploadInfo.data.upload_url);
        setVideoUploadInfo(videoUploadData);

        // Show info result in text area
        if(displayVideoUploadInfo.current)
            displayVideoUploadInfo.current.value = JSON.stringify(videoUploadData, null, 2);

        // Call handleUploadStatus to check the result and status of the video upload to TikTok
        handleUploadStatus();


    }


    // Arrow function calls checkUploadStatus in fetchController to check if upload of video was successful
    const handleUploadStatus = async () => {

        if(!videoFile || !initialUploadInfo?.data?.publish_id){

            alert("No Video File Selected or No Publish ID!");
            return;

        }

        // Upload video via checkUploadStatus and store info result
        const videoStatusData = await checkUploadStatus(initialUploadInfo.data.publish_id);
        setVideoStatusInfo(videoStatusData);

        // Show info result in text area
        if(displayStatusUploadInfo.current)
            displayStatusUploadInfo.current.value = JSON.stringify(videoStatusData, null, 2);


    }


    // Arrow function handles any photo uploads in HTML input file and stores it in photoFiles const
    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
 
        if(e.target.files && e.target.files != null)
            setPhotoFiles(Array.from(e.target.files)); // Store photos

        

    }


    // Arrow function calls uploadPhotos in fetchController to actually upload photos to TikTok site
    const handlePhotoFileUpload = async () => {
 
        if(photoFiles.length == 0){

            alert("No Photos Selected!");
            return;

        }

        // Upload photos via uploadPhotos and store info result
        const photoFilesData = await uploadPhotos(photoFiles, "Test Photo Title", "Test Description");
        setPhotoFiles([]);

        // Show info result in text area
        if(displayPhotoUploadInfo.current)
            displayPhotoUploadInfo.current.value = JSON.stringify(photoFilesData, null, 2);

    }


    // Render for testing
    return(
        <>
            <h1>Tiktok API Testing</h1>
            <h3 style = {{fontStyle: "italic"}}>Follow the Numbers for Proper Testing</h3>

            <div className = "container">
                <h2>User Info</h2>

                <div className = "buttonContainer">
                    <Button url = {LOGINREDIRECT} buttonLabel = "1. Log In"></Button>
                    <Button buttonLabel = "2. Fetch User Info" onClick = {handleUserData}></Button>
                </div>

                <h3>User Info Display</h3>
                <textarea ref = {displayUserInfo} readOnly ></textarea>
                <Button buttonLabel = "3. Fetch Query Info" onClick = {handleQueryData}></Button>

                <h3>User Query Display</h3>
                <textarea ref = {displayQueryInfo} readOnly></textarea>
            </div>


            <div className = "container">
                <h2>Video info</h2>


                <h4>Upload Video</h4>
                <input type="file" accept = "video/mp4, video/*" onChange = {(e) => handleFileUpload(e)}></input>

                <div className = "buttonContainer">
                    <Button buttonLabel = "4. Fetch Initial Upload Info" onClick = {handleInitUploadData}></Button>
                    <Button buttonLabel = "5. Upload Video to TikTok" onClick = {handleVideoUpload}></Button>
                </div>

                <h3>Video Initial Upload Display</h3>
                <textarea ref = {displayInitUploadInfo} readOnly></textarea>
                <h3>Video Upload Display</h3>
                <textarea ref = {displayVideoUploadInfo} readOnly></textarea>
                <h3>Video Upload Status Display</h3>
                <textarea ref = {displayStatusUploadInfo} readOnly></textarea>

            </div>


            <div className = "container">
                <h2>Photo info</h2>

                <h3 style = {{color: "darkred"}}>Unavailable due to TikTok Requiring Live and Real Domain</h3>

                <h4>Upload Photos</h4>
                <input type="file" accept = "image/*" onChange = {(e) => handlePhotoSelect(e)}></input>

                <Button buttonLabel = "6. Upload Photo to Tiktok" onClick = {handlePhotoFileUpload}></Button>


                <h3>User Photos Upload Display</h3>
                <textarea ref = {displayPhotoUploadInfo} readOnly></textarea>

            </div>
        </>
    );

}

export default TestAPI;