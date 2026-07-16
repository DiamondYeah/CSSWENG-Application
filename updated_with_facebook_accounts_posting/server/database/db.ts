import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import { Grid } from "lucide-react";
export let gridFSBucket: GridFSBucket;

async function connectDB(): Promise<void> {

    try{

        // Connect to MongoDB with URI found at env
        await mongoose.connect(process.env.MOONGOOSE_DATABASE_URI as string);
        
        gridFSBucket = new GridFSBucket(
            mongoose.connection.db!,
            {
                bucketName: "linkedinMedia"
            }
        )
        
        console.log("MongoDB Connected");
        console.log("GridFS Ready")

    }
    catch(err){

        console.error("Error: " + err);
        process.exit(1); // Force current process to close

    }

};


export default connectDB;

