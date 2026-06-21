# TikTok API Testing Project

**Mainly for Performing and testing the TikTok API for AgilaPost.**

## Features
- Logging in to TikTok Account
- Obtaining OAuth Token and Refreshing Token if Expired
- Obtaining User Information
- Obtaining User Query (Options for posting)
- Video Initial Upload Details (Posting ID and Upload_URL)
- Video Uploading and Posting
- JSON Data and Message Display
- Console.Log displaying Fetch Info and Errors

## Project Structure

```
tiktok_api/
├── frontend/
│   └── src/
│       ├── components/        # Reusable UI (only buttons at the moment)
│       ├── controller/        # Performs backend API calls
│       └── pages/             # Page components
│
└── server/
    ├── routes/                # HTTP route handlers
    ├── dbcontrollers/         # Database CRUD logic
    ├── models/                # Mongoose schemas 
    ├── database/              # MongoDB connection setup
    └── publicfiles/           # Static folder for serving uploaded photos publicly
```

## Prerequisites

- Node.js 
- MongoDB running locally (Use Compass to view database)
- [ngrok](https://ngrok.com/) account (free tier works). Needed because TikTok requires a public HTTPS redirect URI, which `localhost` can't satisfy
- A TikTok Developer account at https://developers.tiktok.com
- A TikTok app registered in the Developer Portal with:
  - Login Kit enabled
  - Content Posting API enabled (with Direct Post configuration turned on)
  - Scopes added: `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.publish`, `video.upload`
- **Your TikTok test account must be set to a Private account**
- A lot of installs for stuff like ngrok

## Setup

1. Add you tiktok account in Sandbox Settings for testing
   - **Must be set private**
3. Clone the repo, run `npm install` in both `/server` and `/frontend`
4. Copy `.env.example` to `.env` in `/server` and fill in:
   - `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` (from TikTok Developer Portal)
   - `MONGODB_URI=mongodb://localhost:27017/tiktok_api`
   - `BASE_URL=http://localhost:5173` (NO TRAILING SLASH BECAUSE IT WILL BREAK CORS)
   - `REDIRECT_URI` and `PORT` — see below
5. Download ngrok and create an account to get an authtoken in dashboard (https://dashboard.ngrok.com/get-started/setup/windows)
6. Start ngrok: `ngrok http 5000` (or whatever port your server uses)
7. Copy the ngrok HTTPS URL it gives you
8. In TikTok Developer Portal, set the **Redirect URI** under the login kit to:
   `https://<your-ngrok-url>/logAuth/oauth2/callback`
9. Set `REDIRECT_URI` in your `.env` to match exactly
   - **ngrok's free-tier URL changes every time you restart it.** 
10. Run the backend: `npm run dev` (in `/server`)
11. Run the frontend: `npm run dev` (in `/frontend`)
12. Visit `http://localhost:5173`, click "Log In"

## Current Limitations

- Photo posting (`PULL_FROM_URL`) requires a **verified domain** in TikTok's 
  Developer Portal — ngrok's rotating domain can't be verified, so photo 
  posting won't work out of the box without your own stable domain. So we need a live domain.
- Posts are restricted to private until we pass the review process for our application

## Future Updates

- SOLID Principles
- Post Storing

