// Import express libraries needed for server
import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv"

// Load env file
dotenv.config();
console.log("BASE_URL loaded as:", process.env.BASE_URL)

// Import routes
import loginRoute from "./routes/loginRoute.ts";
import linkedinAuthRoute from "./routes/linkedinAuthRoutes.ts";
import userInfoRoute from "./routes/userInfoRoute.ts";
import videoRoute from "./routes/videoRoute.ts";
import photoRoute from "./routes/photoRoute.ts";
import linkedinPostRoute from "./routes/linkedinPostRoute.ts";
import facebookAuthRoute from "./routes/facebookAuthRoutes.ts";
import instagramAuthRoute from "./routes/instagramAuthRoutes.ts";
import instagramPostRoute from "./routes/instagramPostRoute.ts";

// Import database
import connectDB from "./database/db.ts"
import facebookPostRoute from "./routes/facebookPostRoute.ts";

// Import Scheduler
import { checkScheduledLinkedInPosts } from "./server_services/linkedinScheduler.ts";
import { checkScheduledMetaPosts } from "./server_services/metaScheduler.ts";

// Create/Open Database
await connectDB();


// Create server
const app: Application = express();

// Mount middleware like cookieParser and corse and routes
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.BASE_URL,
    credentials: true
}));

app.use("/logAuth", loginRoute);
app.use("/auth", linkedinAuthRoute);
app.use("/userInfo", userInfoRoute);
app.use("/videoUpload", videoRoute);
app.use("/photoUpload", photoRoute);
app.use("/linkedinPost", linkedinPostRoute);
app.use("/facebookAuth", facebookAuthRoute);
app.use("/facebookPost", facebookPostRoute);
app.use("/instagramAuth", instagramAuthRoute);
app.use("/instagramPost", instagramPostRoute);

// Access files stored in /publicfiles in browser
app.use("/publicfiles", express.static(path.join(process.cwd(), "publicfiles"))); 

// Create server
app.listen(process.env.PORT || 5000, () => {

    console.log(`Server has opened with port ${process.env.PORT || 5000}`);
});

let schedulerRunning = false;
const schedulerIntervalMs = 5 * 1000;

setInterval(async () => {
    if (schedulerRunning) return;
    schedulerRunning = true;
    try {
        await checkScheduledLinkedInPosts();
        await checkScheduledMetaPosts();
    } catch (error) {
        console.error("Scheduled post check failed:", error instanceof Error ? error.message : error);
    } finally {
        schedulerRunning = false;
    }
}, schedulerIntervalMs);