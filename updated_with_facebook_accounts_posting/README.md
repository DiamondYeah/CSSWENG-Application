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

  ## Update - 1.2 (LinkedIn Integration)

<details>
<summary><b>Update Details</b></summary>

### Additions

#### LinkedIn Integration with Accounts and Post Page

- Added LinkedIn OAuth 2.0 (OpenID Connect) authentication.
- Clicking the LinkedIn button in the Accounts page now redirects users to LinkedIn for OAuth authentication.
- Successful authentication returns the user's LinkedIn profile and stores it in the database.
- Connected LinkedIn accounts are now displayed in the Accounts page alongside TikTok accounts.
- Added a unified Connected Accounts endpoint to retrieve all linked social media accounts from a single API call.

#### LinkedIn Post Integration

- Added support for publishing LinkedIn text posts.
- Added support for publishing LinkedIn image posts.
- Added support for publishing LinkedIn video posts.
- Users can now upload an image or video directly from the Post Page and publish it to LinkedIn.
- Video uploads automatically wait until LinkedIn finishes processing before publishing the post.
- Upload status is handled automatically before post creation to prevent publishing incomplete media.
- LinkedIn posting is now integrated into the existing multi-platform upload flow together with TikTok.

#### Multiple LinkedIn Account Support

- Implemented support for connecting multiple LinkedIn accounts to a single AgilaPost account.
- Since LinkedIn automatically reuses the current browser session during OAuth authentication, the system generates a unique authentication URL that users can open in an Incognito/Private browsing window.
- Users can authenticate a different LinkedIn account without signing out of their existing browser session.
- After successful authentication, users are automatically redirected back to AgilaPost where the newly connected LinkedIn account is added to the Connected Accounts page.
- Connected LinkedIn accounts can be selected individually when publishing posts.

#### Calendar Scheduling

- Added a Calendar Scheduler for planning future social media posts.
- Users can choose between publishing immediately or scheduling a post for a future date and time.
- Scheduled posts are automatically displayed on the Calendar page.
- The backend stores scheduled posts in the database and continuously monitors pending scheduled posts.
- When the scheduled date and time is reached, the system automatically publishes the post to the selected social media platforms.
- Scheduled publishing currently supports TikTok, LinkedIn, Facebook, and Instagram.
- Users can easily view all upcoming scheduled posts from the calendar interface.

#### Backend Support

- Added LinkedIn Authentication Service for OAuth handling.
- Added LinkedIn Post Service for creating text, image, and video posts.
- Added LinkedIn Post Route for handling all LinkedIn publishing requests.
- Added LinkedIn User Information endpoint for retrieving authenticated user profile information.
- Extended the generalized User model to support LinkedIn account information.
- Reused the existing authentication middleware for LinkedIn protected routes.

### Changes

- Accounts page now supports Facebook, Instagram, LinkedIn, and TikTok accounts.
- Connected accounts are now loaded from a single backend endpoint instead of fetching each platform separately.
- Post upload hook now supports posting to multiple social media platforms.
- fetchController now includes LinkedIn upload and profile fetch functions.
- Upload controller now determines whether media should be uploaded as an image or video before creating the LinkedIn post.
- Improved project structure by separating LinkedIn authentication and posting logic into dedicated services.
- Added support for connecting multiple LinkedIn accounts.
- Updated the LinkedIn OAuth flow to generate an Incognito/Private Browsing authentication URL, allowing users to connect additional LinkedIn accounts without signing out of their existing browser session.
- Improved the Connected Accounts workflow to display and manage multiple LinkedIn accounts.
- Post publishing now supports selecting from multiple connected LinkedIn accounts.
- Calendar page now displays all scheduled posts based on their assigned date and time.
- Upload workflow now determines whether a post should be published immediately or scheduled for automatic publishing.
- Backend scheduler continuously checks pending scheduled posts and publishes them automatically when their scheduled time is reached.
- Database models were extended to store scheduling information such as scheduled date, scheduled time, and publishing status.

### Future Additions

- Improve upload progress feedback for larger media uploads.
- Calendar Approval / Rejection workflow.
- Calendar comments.

</details>

## Prerequisites

### General

- Node.js
- MongoDB running locally (Use Compass to view the database)
- ngrok account (free tier works).
- Backend server runs locally on **port 5000** (or update the ngrok command if you use another port).

### For LinkedIn

- A LinkedIn Developer account at https://www.linkedin.com/developers/
- A LinkedIn application created in the LinkedIn Developer Portal with:
  - Sign In with LinkedIn using OpenID Connect enabled.
  - Share on LinkedIn (`w_member_social`) permission enabled.
- A public HTTPS URL (ngrok) because LinkedIn OAuth callbacks require HTTPS.

---

## Setup (LinkedIn)

1. Clone the repository.

2. Install the frontend dependencies.

```bash
npm install
```

3. Navigate to the `/server` folder and install the required dependencies.

```bash
npm install
npm install mongoose
npm install multer
npm install axios
```

4. Copy `.env.example` to `.env` inside `/server` and configure the following variables:

```env
LINKEDIN_CLIENT_ID=<your-linkedin-client-id>
LINKEDIN_CLIENT_SECRET=<your-linkedin-client-secret>

LINKEDIN_REDIRECT_URI=https://<your-ngrok-url>/auth/linkedin/oauth2/callback

BASE_URL=http://localhost:5173
ACCOUNTS_REDIRECT_URL=http://localhost:5173/accounts

PORT=5000
```

> **Important:** Do **NOT** add a trailing slash to `BASE_URL` or CORS will fail.

5. Download ngrok and obtain an authentication token:

https://dashboard.ngrok.com/get-started/setup/windows

6. Start ngrok.

```bash
ngrok http 5000
```

7. Copy the generated HTTPS URL.

8. In the LinkedIn Developer Portal, add the following Authorized Redirect URL:

```text
https://<your-ngrok-url>/auth/linkedin/oauth2/callback
```

9. Update the following environment variables whenever your ngrok URL changes:

- `LINKEDIN_REDIRECT_URI`
- `VITE_API_BASE_URL`

10. Run the backend.

```bash
npm run dev
```

11. Run the frontend.

```bash
npm run dev
```

12. Visit:

```text
http://localhost:5173
```

13. Navigate to the **Accounts** page and click **Connect LinkedIn** to begin the OAuth authentication flow.

### Connecting Multiple LinkedIn Accounts

1. Click **Connect LinkedIn** from the Accounts page.
2. The application generates a unique authentication URL for connecting another LinkedIn account.
3. Open the generated URL in an **Incognito/Private Browsing** window.
4. Sign in using a different LinkedIn account.
5. After successful authentication, you will automatically be redirected back to AgilaPost.
6. The newly connected LinkedIn account will appear in the Connected Accounts page and can be selected when creating posts.

## Update - 1.3 (Facebook & Instagram Integration)

<details>
<summary><b>Update Details</b></summary>

### Additions

#### Facebook Integration with Accounts and Post Page

- Added Facebook OAuth authentication.
- Clicking the Facebook button in the Accounts page now redirects users to Facebook for OAuth authentication.
- Successful authentication returns the user's Facebook profile and stores it in the database.
- Connected Facebook accounts are now displayed in the Accounts page alongside TikTok and LinkedIn accounts.
- Added Facebook account support to the unified Connected Accounts endpoint.

#### Instagram Integration with Accounts and Post Page

- Added Instagram OAuth authentication.
- Clicking the Instagram button in the Accounts page now redirects users to Instagram for OAuth authentication.
- Successful authentication returns the user's Instagram profile and stores it in the database.
- Connected Instagram accounts are now displayed in the Accounts page alongside Facebook, LinkedIn, and TikTok accounts.
- Added Instagram account support to the unified Connected Accounts endpoint.

#### Facebook Post Integration

- Added support for publishing Facebook text posts.
- Added support for publishing Facebook image posts.
- Added support for publishing Facebook video posts.
- Users can now upload media directly from the Post Page and publish it to Facebook.
- Facebook posting is integrated into the existing multi-platform upload workflow.

#### Instagram Post Integration

- Added support for publishing Instagram image posts.
- Added support for publishing Instagram video posts.
- Users can now upload media directly from the Post Page and publish it to Instagram.
- Instagram posting is integrated into the existing multi-platform upload workflow.

#### Backend Support

- Added Facebook Authentication Service for OAuth handling.
- Added Instagram Authentication Service for OAuth handling.
- Added Facebook Post Service for creating Facebook posts.
- Added Instagram Post Service for creating Instagram posts.
- Added Facebook User Information endpoint for retrieving authenticated user information.
- Added Instagram User Information endpoint for retrieving authenticated user information.
- Extended the generalized User model to support Facebook and Instagram account information.
- Reused the existing authentication middleware for Facebook and Instagram protected routes.

### Changes

- Accounts page now fully supports Facebook, Instagram, LinkedIn, and TikTok accounts.
- Connected Accounts endpoint now retrieves all connected social media accounts through a single backend request.
- Post upload hook now supports Facebook and Instagram uploads.
- Upload controller automatically determines the appropriate upload flow depending on the selected platform.
- Calendar Scheduler now supports scheduled publishing for Facebook and Instagram.
- Scheduled Facebook and Instagram posts are automatically published when their scheduled date and time is reached.
- Unified the multi-platform upload workflow to support Facebook, Instagram, LinkedIn, and TikTok from a single post.
- Improved media upload handling across all supported social media platforms.

### Future Additions

- Improve upload progress feedback for larger media uploads.

</details>

## Prerequisites

### General

- Node.js
- MongoDB running locally (Use Compass to view the database)
- ngrok account (free tier works).
- Backend server runs locally on **port 5000** (or update the ngrok command if you use another port).

### For Facebook

- A Facebook Developer account at https://developers.facebook.com/
- A Facebook App created in the Meta Developer Dashboard.
- A public HTTPS URL (ngrok) because Facebook OAuth callbacks require HTTPS.

### For Instagram

- An Instagram Professional (Business or Creator) account.
- An Instagram App created in the Meta Developer Dashboard.
- A public HTTPS URL (ngrok) because Instagram OAuth callbacks require HTTPS.

---

## Setup (Meta)

Clone the repository.

Run the frontend installation:

```bash
npm install
```

Navigate to the server folder and install the required dependencies:

```bash
npm install
npm install mongoose
npm install multer
npm install axios
```

Copy `.env.example` to `.env` inside `/server` and fill in:

```env
FACEBOOK_APP_ID=<your-facebook-app-id>
FACEBOOK_APP_SECRET=<your-facebook-app-secret>
FACEBOOK_REDIRECT_URI=https://<your-ngrok-url>/facebookAuth/facebook/oauth2/callback

INSTAGRAM_APP_ID=<your-instagram-app-id>
INSTAGRAM_APP_SECRET=<your-instagram-app-secret>
INSTAGRAM_REDIRECT_URI=https://<your-ngrok-url>/instagramAuth/instagram/oauth2/callback

BASE_URL=http://localhost:5173
ACCOUNTS_REDIRECT_URL=http://localhost:5173/accounts

PORT=5000
```

**Important:** Do **NOT** add a trailing slash to `BASE_URL` or CORS will fail.

Download ngrok and create an account to obtain an authentication token:

https://dashboard.ngrok.com/get-started/setup/windows

Start ngrok:

```bash
ngrok http 5000
```

Copy the HTTPS URL generated by ngrok.

In the Facebook Developer Dashboard, add the following Valid OAuth Redirect URI:

```text
https://<your-ngrok-url>/facebookAuth/facebook/oauth2/callback
```

In the Instagram Developer Dashboard, add the following Valid OAuth Redirect URI:

```text
https://<your-ngrok-url>/instagramAuth/instagram/oauth2/callback
```

Update the following environment variables whenever your ngrok URL changes:

- `FACEBOOK_REDIRECT_URI`
- `INSTAGRAM_REDIRECT_URI`
- `VITE_API_BASE_URL` (frontend)

Run the backend inside `/server`:

```bash
npm run dev
```

Run the frontend from the project root:

```bash
npm run dev
```

Visit:

```text
http://localhost:5173
```

Navigate to the **Accounts** page and click **Connect Facebook** or **Connect Instagram** to begin the OAuth authentication flow.
