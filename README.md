## LinkedIn API Testing for AgilaPost

Mainly for performing and testing the LinkedIn API for AgilaPost.

## Features
Logging in to LinkedIn Account: Performs and test the 3-Legged OAuth 2.0 flow.

Obtaining OAuth Token: Intercepts the short-lived authorization code and trades it for a secure access token.

Obtaining User Information: Pulls details from the modern OpenID Connect layer (/v2/userinfo) to automatically resolve account parameters.

Extracting Author Identity IDs: Automatically isolates the unique profile author identifier (urn:li:person:...) required for posting.

Multi-Media Processing Pipeline: Integrated with file handling to register media assets, stream raw binary vectors, and deploy finalized container payloads.

JSON Data and Message Display: Built-in interactive feedback dashboard.

Console.Log displaying Fetch Info and Errors: A custom virtual scrolling telemetry panel to trace network logs and structural API objects in real-time.

## Project Structure

linkedin_api/  
├── src          #Frontend directory           
│   |
    ├──App.tsx  
    ├──App.css  
│   ├── components/            
│       ├── LinkedInTester.tsx      #Main interface control grid & logic         
│  
│
└── backend/                      #Backend server directory  
    └── server.ts              #Secure Express endpoint handlers & file uploads  

## Prerequisites
Node.js installed on your local machine.

A LinkedIn Developer Account at https://developer.linkedin.com.

A LinkedIn App registered in the Developer Portal with:

- Sign In with LinkedIn using OpenID Connect enabled.  
- Share on LinkedIn or Community Management API permissions enabled.  

## Setup
Clone the repository and install dependencies in the root directory: npm install

**Run the Backend Proxy Server**
- Open a terminal window and run the Express file stream router: npx ts-node server.ts 
- Expected confirmation output: Server running on http://localhost:3001

**Run the Frontend Workspace**  

- Open a separate concurrent terminal window and launch the Vite development suite: npm run dev
- Execute the Sandbox Workflow:
  Visit http://localhost:5173 in your browser.
  Step 1: Get Auth URL followed by Login with LinkedIn to authenticate a test profile.

  Step 2 Press "Trade code for token" to trade the authorization code for an Access Token.

  Step 3: to bind your target profile URN string, write your content inside the Production Posting Pipeline

## Current Limitations
Client-Side Secret Exposure: Because the app configuration keys are hardcoded into the component state for ease of local testing, they remain visible to anyone opening browser developer tools.

## Future Updates
SOLID Principles