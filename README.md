# CSSWENG-Application - AgilaPost
Repo for version control for the development of the application. Description will change for any additions and updates to the app.

### Live Domain Link (Render.com)
https://agila-post.onrender.com/

&emsp;

## Changelog

### Update - 1.4 (Accounts! Accounts! Accounts! And also Shared Calendar Functionality)
<details>
<summary><b>Update Details</b></summary>

### Additions

<ol>
<b><li>Working Accounts :D</li></b>
<ul>
    <li>Added Account Model (username, email, password) for AgilaPost</li>
    <li>Almost everything in the backend has been restructured to fit the new Account-SocialMediaAccount format. (Took a lot of time :C)</li>
    <li>Social Media Connections like TikTok and LinkedIn now live independently as SocialMediaAccount documents; they are now linked to an Account document</li>
    <li>SocialMediaAccount now requires a logged-in Account to properly work, instead of it working by itself</li>
    <li>Multiple Social Media Connections can exist in one Account Document</li>
    <li>Added working registration pages, including associated routes and functions to create Accounts</li>
    <li>Used Bcyrpt for password hashing for security purposes</li>
    <li>Error-checking for Sign In and Sign Up such as invalid password or mismatch</li>
    <li>Added a protected-route wrapper for pages that require an account so it will redirect you back to the Sign In page when you try to access them.</li>
</ul>
    
<b><li>Shared Calendar Functionality</li></b>
<ul>
    <li>Shared Calendar Functionality now allows any user who has the link to reject, accept, and comment on posts.</li>
    <li>Replace the sample data with data fetched from the database</li>
    <li>Approval status is separate from publish status, as depending on the status of a post, it will either publish or not (Rejected won't be published unless changed)</li>
    <li>Users can reject posts and give an optional message as to the rejection.</li>
    <li>Users can comment on posts anonymously</li>
    <li>Users can also approve and reject all posts found in the upper-right corner (Reject also gives an optional field for reason)</li>
    <li>Results of posts are now reflected properly on the Calendar page with the status of said posts.</li>
    <li>Rebuilt Queue Page to actually contain data fetched from the database, including the acceptance status and comments of each post.</li>
</ul>

<b><li>Queue Updates</li></b>
<ul>
    <li>Replace the sample data with data fetched from the database</li>
    <li>Removed unneeded functions and displays, and only kept the important ones (mainly ones for displaying the posts)</li>
    <li>Changed some functions such as the search bar to make it more simplistic</li>
    <li>Posts are split into Scheduled and Published Posts with a working counter for each</li>
    <li>Each section will show associated posts, including info of posts, approval status, and comments (if any)</li>
    <li>Each status has an associated color for better view as seen in the color of the left border and the status below each post (Red = Rejected)</li>
    <li>Rejected posts will have a reason right beside them</li>
    <li>Popup for comment icons will show the number of posts associated with the post.</li>
    <li>Clicking the comment icon, will reveal a dropdown with a list of comments and the date they were created at.</li>
</ul>

<b><li>Post Page Update</li></b>
<ul>
    <li>Fixed display for TikTok Settings as CSS for them was lost</li>
    <li>Added a media preview for both uploaded videos and images. Deallocated when unmounting to prevent memory leaks.</li>
    <li>Semi-fixed the checkbox hover issue to prevent hover when disabled (Still hovers when on label but not on checkbox).</li>
</ul>

</ol>


### Changes
<ul>
    <li>Social Media accounts are now associated with an Account document instead of being independent of each other</li>
    <li>Queue.tsx's tab values changed "scheduled"/"published" to "pending"/"published" status values to match what the backend actually uses</li>
    <li>Removed a lot of Queue functionality like account filter, document/media preview since there's no functionality for them yet</li>
    <li>Added account name to Shared Calendar to let users know which account it comes from</li>
    <li>mapPostToSchedulePost middle now carries approval status and rejection reason to include the new changes for post approval status and reason</li>
    <li>Updated README with new Changes and to include what was lost...</li>
</ul>

### Fixes
<ul>
  <li>CSS display for TikTok settings being lost and using default style.</li>
  <li>Fixed an object-literal syntax mistake in the comment-mapping function that caused every mapped comment to come out as undefined instead of a real comment object</li>
  <li>Two mismatched field-name lookups that caused approval status and rejection reason to always fall back to default regardless of post's real state</li>
  <li>Removed several unused imports, types, and state variables left over from earlier drafts and commits, as it would prevent render from working</li>
</ul>

### Next Goals
<ul>
  <b><li> What I'll do Next (A lot of stuff again :\ :\ )</li></b>
  <ul>
    <li>Make sure posts actually don't immediately post if they have a schedule</li>
    <li>Add remaining TikTok error codes (unaudited_client_can_only_post_to_private_accounts, etc.</li>
    <li>Fix the hover effect as it still works when hovering on the label but not the checkbox</li>
    <li>Check for error fields/conditions (ESPECIALLY FOR TikTok Commercial Content fields)</li>
    <li>Add TikTok Account name to the TikTok account document (Add a new optional username field)</li>
    <li>Add an option to provide a username for commenters or people who used the shared calendar link?</li>
  </ul>
  <b><li> Future Additions/To Do List </li></b>
  <ul>
    <li>Add Instagram and YouTube platform support following the same pattern as TikTok (useInstagramUpload, InstagramSettings.tsx)</li>
    <li>Fix UserPost.tsx to make it cleaner and less cluttered (Tbh it's still cluttered even with my changes :/)</li>
    <li>Category Working</li>
    <li>Fix any bugs and up the security</li>
  </ul>
</ul>
</details>

### Update - 1.3 (Live Domain!)

<b>It's gone... README got overwritten and the 1.3 changelog is just gone from any branch or commit :(</b><br>
<b>If i have motivation maybe ill add it again </b>


### Update - 1.2 (Calendar Post View and Sharing & TikTok Settings for Approval)
<details>
<summary><b>Update Details</b></summary>

### Additions

<ol>
<li>Working Calendar View</li>
    <ul>
        <li>When adding a schedule for Posting, it will now show up when u open up the Calendar view</li>
        <li>Details of the post will be shown in the cell where you scheduled the post in the Calendar via a red block component </li>
        <li>The scheduled post will include details such as Title, Platform (Icon not yet added), Captions (if any), and the time for when it will be posted</li>
        <li>Multiple posts can occupy the same cell if they are both on the same date.</li>
    </ul>

<li>Calendar Sharing via Link</li>
    <ul>
        <li>The top-right calendar view now features a share button that when pressed, shows an alert saying that a link has been created to the clipboard with an expiry date</li>
        <li>Updated user model to include new shareToken and shareTokenExpiresIn for storing share calendar links</li>
        <li>Opening link to the browser will load a simplified view of just the calendar with all of the scheduled posts linked to the user who shared the token</li>
        <li>NOTE1: Top-middle shows SampleAccount. Will eventually update to include the Account name once Registration/Login is added</li>
        <li>NOTE2: Will include approval, denial, comment system here</li>
    </ul>
<li>New Post Field - Commercial Content & Consent Compliance for TikTok Approval</li>
    <ul>
        <li>Added a new sub-component field in TikTok Settings of the Post page: TikTok Commercial Content disclosure and compliance agreements</li>
        <li>Users can now toggle for the TikTok video to disclose that it is for promotional content of either their own brand, third-party, or both</li>
        <li>When clicking "Disclose Video for Commercial Content," a dropdown appears with 2 new checkboxes for what type of promotions w/ descriptions</li>
        <li>Will display a notice depending on how your post will be treated as commercial content, whether you selected Promote Your Brand, Promote Branded Content, or both</li>
        <li>Above the Upload Post Button, there will now be a dynamic consent declaration notice indicating whether Branded Content is selected (Music Usage Confirmation vs. Branded Content Policy + Music Usage Confirmation)</li>
        <li>Selecting Branded Content disabled SELF_ONLY posting as part of TikTok compliance guidelines</li>
        <li>Added new fields for the commercial content fields themselves through the different functions, and routed to let the API know about the promotion</li>
        <li>Videos on TikTok will actually show if they're promotional content or not</li>
    </ul>

<li>Post Page Update</li>
    <ul>
        <li>Loaded posts in the page are updated to better reflect live information depending on the connected API. (TikTok is currently implemented)</li>
        <li>TikTok - Post page now displays the connected creator's live nickname and avatar from the API for compliance guidelines</li>
        <li>TikTok - Added new errors and notices connected to commercial content and whether the account is allowed to post or not</li>
        <li>TikTok - Disable Posting if TikTok account is not allowed to post based on fetched query information</li>
        <li>Upload status polling now correctly reflects real-time TikTok status instead of getting stuck on "Processing..." infinitely</li>
    </ul>
<li>Account Page Update</li>
    <ul>
        <li>Working Logout Button removes the account, and logging in redirects you back to the login page</li>
    </ul>
<li>New Folders</li>
    <ul>
        <li>types (src and server) - Stores files of different interfaces if multiple files are referencing said interface to avoid being tightly coupled</li>
    </ul>
</ol>


### Changes
<ul>
    <li>Added * for Date and Time as they are required</li>
    <li>Adjusted sizes of fonts in the Post page</li>
    <li>Moved types that are referenced by multiple files into their own types folder to avoid being tightly coupled.</li>
    <li>Increased POLL_INTERVAL for checking the status of the post to stay within TikTok's checking rate limit</li>
    <li>Added isYourOwnBrand and isBrandedContent fields for the posting interface and the system to reflect on the TikTok App</li>
    <li>Added inner try-catch on videoRoute.ts /poststatus so DB write issue can no longer block user from seeing real TikTok status</li>
    <li>Updated README with new Changes</li>
</ul>

### Fixes
<ul>
    <li>Account information is not showing in AgilaPost as the data returned from the router is stored in an array.</li>
    <li>Swapped the order of the router for photoRoute so that findUserAuth is checked first before getting the photos</li>
    <li>Post status issue repeatedly saying Processing... when uploading post as the router was mapping the return status to the raw response status from the TikTok API.</li>
    <li>Double "@" appearing in account handles as a prefix is being added in multiple layers</li>
    <li></li>
    
</ul>

### Next Goals
<ul>
  <li> What I'll do Next (Alot of stuff :\ )</li>
  <ul>
    <li>Prepare for Live Domain (So I can finally add Photo Upload)</li>
    <li>Account Model and Login/Registration</li>
    <li>Show Account Name in shared calendar view</li>
    <li>Video preview in media field instead of name and size (still includes name and size for details)</li>
    <li>Add remaining TikTok error codes (unaudited_client_can_only_post_to_private_accounts, etc.</li>
    <li>Fix the hover effect as it still works on disabled checkboxes</li>
    <li>Update the design for the checkboxes?</li>
    <li>Make sure posts actually don't immediately post if they have a schedule</li>
    <li>Check for error fields/conditions (ESPECIALLY FOR TikTok Commercial Content fields)</li>
  </ul>
  <li> Preparation for Going to a Live Domain - via Render.com </li>
  <ul>
    <li>Remove console logs that show sensitive information</li>
    <li>Remove ngrok dependency entirely and point VITE_API_BASE_URL / REDIRECT_URI at real domain</li>
    <li>Configure Express CORS middleware for the real frontend origin specifically</li>
    <li>Verify photo upload domain with TikTok for PULL_FROM_URL support</li>
    <li>Switch multer video storage from memoryStorage to diskStorage for live domain</li>
    <li>Confirm .env files are untracked in git</li>
    <li>Randomize photo/video? filenames and add a way to clean up any public files</li>
  </ul>
  <li> Future Additions/To Do List </li>
  <ul>
    <li>Adding Design Changes for TikTok Approval</li>
    <li>Add Instagram and YouTube platform support following the same pattern as TikTok (useInstagramUpload, InstagramSettings.tsx)</li>
    <li>Fix UserPost.tsx to make it cleaner and less cluttered (Tbh it's still cluttered even with my changes :/)</li>
    <li>Calendar Approval/Denial with Comments</li>
    <li>Music Picker</li>
  </ul>
</ul>
</details>

### Update - 1.1 (TikTok Integration)
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
    <li>Prepare for Live Domain</li>
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
- Live Domain via Render.com
- Calendar Page with date Navigation
- Registration and Login for Website Account
- Account Page to connect to various social media accounts (TikTok works only so far) w/ LogOut (Connected to Account document)
- Obtaining OAuth token and refreshing token if expired (TikTok)
- CSRF Safety
- Models for database storage of said User and Post Information (Made to be generalized to be used by various APIS)
- Fetch functions for API calls, such as obtaining User Info and Queries
- Semi-working post page with fields (Title, Caption, Video Upload, TikTok API Settings)
- Field Validation for Post Page
- Publishing and Uploading Videos to TikTok
- TikTok Commercial Content and Disclosure Settings
- Calendar Post View and Sharing
- Shared Calendar Functionality including approving, denying, and commenting on posts
- Queue view to see status of posts, including comments for each


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
│       └── pages/                   # User views w/ functionality
|       └── types/                   # Interfaces
│
└── server/
    ├── database/                    # MongoDB connection setup
    ├── dbcontrollers/               # Database CRUD logic
    ├── middleware/                  # Auth/request middleware for routes
    ├── models/                      # Mongoose schemas
    ├── publicfiles/                 # Static folder for uploaded videos
    ├── publicphotos/                 # Static folder for uploaded photos
    ├── routes/                      # HTTP route handlers
    ├── server_services/             # External API call logic
    ├── server_utilities/            # Helper functions
    └── pages/                       # Interfaces
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
