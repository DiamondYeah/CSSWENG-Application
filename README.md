# CSSWENG-Application - AgilaPost
Repo for version control for the development of the application. Description will change for any additions and updates to the app.

## Update - 1.1 (TikTok Integration)
<details>
<summary><b>Update Details</b></summary>
    
### Additions

<ol>
<li>TikTok Integration with Post Page</li>
    <ul>
        <li>Post Page is now working for TikTok Integration</li>
        <li>Clicking the TikTok Button will now move you to the TikTok Page and ask for OAuth Authentication</li>   
        <li>Successful Log In returns User and Updates TikTok Field to include User Information</li>   
        <li>Log In is required to further go to TikTok Posting</li>   
    </ul>

<li>Semi-Working Post Page with TikTok Integration</li>
    <ul>
        <li>Post Page is now semi-working with almost all fields necessary for Proper TikTok Posting</li>
        <li>Account area now shows actual accounts rather than fake ones, such as which TikTok Accounts you are now connected to</li>   
        <li>New Fields such as Title, TikTok Section for Posting, and Upload Status</li>
        <li>Added validation checking for fields actually to show in UI rather than alerts for posting. Will also highlight in border which fields are required to be completed</li>   
        <li>TikTok Settings Field is added for the requirements of TikTok based on (https://developers.tiktok.com/doc/content-sharing-guidelines#required_ux_implementation_in_your_app) to allow it to be approved by TikTok. Fields such as Privacy Settings and User Allowed to are based on the query info of the TikTok account</li>
        <li>Show a real-time (kinda) upload status of your video when you click post now</li>   
        <li>Video duration is now validated against the user's TikTok account maximum allowed duration from query info before upload is attempted</li>   
    </ul>
<li>New Folders</li>
    <ul>
        <li>frontend_utilies = For utility functions in the frontend, such as a timer function</li>
        <li>hooks = Formatted under React custom hooks. Called on mount and uses controller function, onEffect and update UI accordingly</li>   
    </ul>
<li>New TikTok Settings Component</li>
    <ul>
        <li>Isolated component for TikTok-specific settings for posting, including privacy level dropdown and interaction checkboxes (Allow Comments, Duet, Stitch).</li>
        <li>Includes error checking and validation for fields like privacy level</li>   
        <li>It will be a requirement for other API to add this field to their own posts.</li>   
    </ul>
</ol>


### Changes
<ul>
  <li>Changed README to include update section, current feature section, and project structure</li>
  <li>Post Page now shows actual accounts rather than fake ones</li>
  <li>Changed Post Page validation to show error in the new Upload Status Field</li>
  <li>Fields will now be highlighted in red in the border for those required to be filled out before posting</li>
  <li>Removed all upload logic and TikTok settings JSX, now delegates to separate files of usePostUpload (hooks) and TikTokSettings (components)</li>
  <li>Changed the name of utilities in the server folder to server_utilities to better distinguish from frontend_utilities</li>
  <li>Updated initializeUploadPost in fetchController to include working prvacySettings and allowComment, allowDuet, and allowStitch</li>
  <li>Updated initupload route to accept the new fields from initializeUploadPost to be included in the initialized upload of post</li>
  <li>All fetch calls in fetchController.ts now include ngrok-skip-browser-warning header shared by CORS_HEADER constant to fix first-request CORS failure.</li>
  <li>poststatus route now returns a user-friendly view of the status strings of posts via mapPostStatusToView in server_utilities before being sent to the frontend</li>
  <li>Updated uploadStatus to be apart of a new constant, statusToView, to be shared with validationMessage, where validationMessage takes priority over uploadStatus </li>
</ul>

### Fixes
<ul>
  <li>Replaced remaining alerts() with throw new Error() so errors are caught by the catch block and shown in the status card instead of browser to be less jarring</li>
  <li>firsst-requrest CORS-issue by adding new CORS_HEADER</li>
  <li>Fixed duplicate entries via idempotent account checking due to React strict mode</li>
</ul>

### Next Goals
<ul>
  <li> What I'll do Next </li>
  <ul>
    <li>Fix the stupid CORS issue </li>
    <li>Add Music Usage Confirmation declaration above post button (required for TikTok approval)</li>
    <li>Add Commercial Content Disclosure component when you toggle "Your Brand" and "Branded Content" checkboxes (required for TikTok approval)</li>
    <li>Post prevental check when user has reached their daily posting limit (required for TikTok approval)</li>
    <li>Video preview in media field instead of name and size (still includes name and size for details)</li>
    <li>Restructure the User model to make it more standardized to fit the other API models</li>
  </ul>
  <li> Future Additions </li>
  <ul>
    <li>Calendar Scheduling with proper hooking to scheduleDate and scheduleTime</li>
    <li>Add Instagram and YouTube platform support following the same pattern as TikTok (useInstagramUpload, InstagramSettings.tsx)</li>
    <li>Fix UserPost.tsx to make it cleaner and less cluttered (Tbh it's still cluttered even with my changes :/)</li>
    <li>Live Domain</li>
    <li>Calendar Approval/Denial with Comments</li>
    <li>Music Picker</li>
  </ul>
  
</ul>
</details>

## Features
- UI Pages (Landing Page, Dashboard, Accounts, Post Page, etc.)
- Calendar Page with date Navigation
- Account Page to connect to various social media accounts (TikTok works only so far)
- Obtaining OAuth token and refreshing token if expired (TikTok)
- CSRF Safety
- Models for Database storing of said User and Post Information (Made to be generalized to be used by various APIS)
- Fetch functions for API calls, such as obtaining User Info and Queries
- Semi-working post page with fields (Title, Caption, Video Upload, TikTok API Settings)
- Field Validation for Post Page
- Publishing and Uploading Videos to TikTok

## Project Structure

```
tiktok_api/
├── frontend/
│   └── src/
│       ├── assets/                  # Static assets (images, icons)
│       ├── components/              # Reusable UI
│       ├── controller/              # Backend API call functions
│       ├── frontend_utilities/      # Helper functions for the frontend, such as a timer
│       ├── hooks/                   # Custom React hooks (Run on mount and update UI)
│       └── pages/                   # Page components
│
└── server/
    ├── database/                    # MongoDB connection setup
    ├── dbcontrollers/               # Database CRUD logic
    ├── middleware/                  # Auth/request middleware for routes
    ├── models/                      # Mongoose schemas
    ├── publicfiles/                 # Static folder for uploaded photos
    ├── routes/                      # HTTP route handlers
    ├── server_services/             # External API call logic
    ├── server_utilities/            # Helper functions
    └── index.ts                     # Creation and entry point for server
```

## Current Goal:
<b>Working Prototype V1</b>
<ul>
  <li>Working Post System with API linked to Facebook, Instagram, LinkedIn, and Tiktok</li>
  <li>Calendar with all of the Scheduled Posts</li>
  <li>Calendar Sharing</li>
  <li>Accept, Reject, and Comment for Calendar Sharing</li>
    <ul>
        <li>Accept Post: Continue with Posting</li>
        <li>Reject Post: Put an X on Post</li>
        <li>Comment: Add a comment on each post</li>
        <li>Can be Global Accept and Reject aswell for the entire calendar</li>
    </ul>
</ul>

<b>Frontend:</b> React with either JavaScript or TypeScript
<br>
<b>Backend:</b> MongoDB (May change)

## Prerequisites

### General
- Node.js 
- MongoDB running locally (Use Compass to view the database)
- [ngrok](https://ngrok.com/) account (free tier works). Needed because TikTok requires a public HTTPS redirect URI, which `localhost` can't satisfy

### For TikTok
- A TikTok Developer account at https://developers.tiktok.com
- A TikTok app registered in the Developer Portal with:
  - Login Kit enabled
  - Content Posting API enabled (with Direct Post configuration turned on)
  - Scopes added: `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.publish`, `video.upload`
- **Your TikTok test account must be set to a Private account**
- A lot of installs for stuff like ngrok

## Setup (TikTok)
1. Add you tiktok account in Sandbox Settings for testing
   - **Must be set private**
3. Clone the repo, run `npm install` in both `/server` and `/frontend`
4. Copy `.env.example` to `.env` in `/server` and fill in:
   - `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` (from TikTok Developer Portal)
   - `MONGODB_URI=mongodb://localhost:27017/tiktok_api`
   - `BASE_URL=http://localhost:5173` (NO TRAILING SLASH BECAUSE IT WILL BREAK CORS)
   - `REDIRECT_URI`, `PUBLIC_URL` and `PORT` — see below
5. Download ngrok and create an account to get an authtoken in dashboard (https://dashboard.ngrok.com/get-started/setup/windows)
6. Start ngrok: `ngrok http 5000` (or whatever port your server uses)
7. Copy the ngrok HTTPS URL it gives you
8. In TikTok Developer Portal, set the **Redirect URI** under the login kit to:
   `https://<your-ngrok-url>/logAuth/oauth2/callback`
9. Set `REDIRECT_URI` and `PUBLIC_URL` in your `.env` to match exactly
   - **ngrok's free-tier URL changes every time you restart it.** 
10. Run the backend: `npm run dev` (in `/server`)
11. Run the frontend: `npm run dev` (in `./`) (Just run it in the base folder)
12. Visit `http://localhost:5173`, click "Log In"

## Current Limitations

- Photo posting (`PULL_FROM_URL`) requires a **verified domain** in TikTok's 
  Developer Portal — ngrok's rotating domain can't be verified, so photo 
  posting won't work out of the box without your own stable domain. So we need a live domain.
- Posts are restricted to private until we pass the review process for our application
- Using an ngrok domain instead of a live one in the internet. Required to run ngrok everytime
