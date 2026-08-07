// Import express libraries needed for server
import express from "express";
import type { Application} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";
import cron from 'node-cron';


// Load env file
dotenv.config();
console.log("BASE_URL loaded as:", process.env.BASE_URL);

// Import routes
import loginRoute from "./routes/loginRoute.ts";
import userInfoRoute from "./routes/userInfoRoute.ts";
import videoRoute from "./routes/videoRoute.ts";
import photoRoute from "./routes/photoRoute.ts";
import postRoute from "./routes/postRoute.ts";
import accountRoute from "./routes/accountRoute.ts";
import categoryRoute from "./routes/categoryRoute.ts";

// for linkedin
import linkedinAuthRoute from "./routes/linkedinAuthRoute.ts";
import linkedinPostRoute from "./routes/linkedinPostRoute.ts";

// for facebook
import facebookAuthRoute from "./routes/facebookAuthRoutes.ts";
import facebookPostRoute from "./routes/facebookPostRoute.ts";

// for instagram
import instagramAuthRoute from "./routes/instagramAuthRoutes.ts";
import instagramPostRoute from "./routes/instagramPostRoute.ts";

// Import function to check for any awaiting scheduled posts that require to be posted
import {processScheduledDuePosts} from "./server_services/tiktokScheduledPostService.ts";
import {processLinkedInScheduledPosts} from "./server_services/linkedinScheduledPostService.ts";
import { processFacebookScheduledPosts } from "./server_services/facebookScheduledPostService.ts";
import { processInstagramScheduledPosts } from "./server_services/instagramScheduledPostService.ts";

// Import database
import connectDB from "./database/db.ts"


// Create/Open Database
await connectDB();


// Create server
const app: Application = express();

// Mount middleware like cookieParser and corse and routes
app.use(express.json());
app.use(cookieParser());
app.use(cors({

    // Allows cookies to be send along domains
    origin: process.env.BASE_URL,
    credentials: true

}));
app.use("/logAuth", loginRoute);
app.use("/userInfo", userInfoRoute);
app.use("/videoUpload", videoRoute);
app.use("/photoUpload", photoRoute);
app.use("/postInfo", postRoute);
app.use("/account", accountRoute);
app.use("/category", categoryRoute);

app.use("/auth", linkedinAuthRoute);
app.use("/linkedinPost", linkedinPostRoute);

app.use("/facebookAuth", facebookAuthRoute);
app.use("/facebookPost", facebookPostRoute);

app.use("/instagramAuth", instagramAuthRoute);
app.use("/instagramPost", instagramPostRoute);

// Access files stored in /publicfiles in browser
app.use("/publicfiles", express.static(path.join(process.cwd(), "publicfiles")));

app.use("/mediauploads", express.static(path.join(process.cwd(), "mediauploads")));

// Variable that will act as a gate to prevent any double checks if an existing promise is already running.
let isProcessingPosts = false;


// Perform a cron schedule that will call a function that will find for any awaiting schedule posts and process due ones.
cron.schedule(String(process.env.CRON_SCHEDULE_CHECK), async () => {

    if(isProcessingPosts){

        console.log("Check currently in progress. Skipping this schedule check.");  
        return;

    }

    isProcessingPosts = true;
    console.log("Checking for scheduled posts...");

    try{

        // Call function to find and process any awiting scheduled posts
        await processScheduledDuePosts();

        await processLinkedInScheduledPosts();

        await processFacebookScheduledPosts();

        await processInstagramScheduledPosts();
        
    }catch(err){

        console.error("Error occured when processing awaiting scheduled posts: ", err);

    }finally{

        isProcessingPosts = false; // Set to false so it will allow next cron schedule check to go through
    }


});



// Create server
app.listen(process.env.PORT || 5000, () => {

    console.log(`Server has opened with port ${process.env.PORT || 5000}`);

});


