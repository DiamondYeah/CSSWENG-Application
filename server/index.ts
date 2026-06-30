// Import express libraries needed for server
import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";

// Load env file
dotenv.config();
console.log("BASE_URL loaded as:", process.env.BASE_URL);

// Import routes
import loginRoute from "./routes/loginRoute.ts";
import userInfoRoute from "./routes/userInfoRoute.ts";
import videoRoute from "./routes/videoRoute.ts";
import photoRoute from "./routes/photoRoute.ts";

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

// Access files stored in /publicfiles in browser
app.use("/publicfiles", express.static(path.join(process.cwd(), "publicfiles"))); 

// Create server
app.listen(process.env.PORT || 5000, () => {

    console.log(`Server has opened with port ${process.env.PORT || 5000}`);
});


