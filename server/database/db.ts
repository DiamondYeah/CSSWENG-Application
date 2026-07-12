import mongoose from "mongoose";

async function connectDB(): Promise<void> {

    try{

        // Connect to MongoDB with URI found at env
        await mongoose.connect(process.env.MONGOOSE_DATABASE_URI as string);
        console.log("MongoDB Connected");

    }
    catch(err){

        console.error("Error: " + err);
        process.exit(1); // Force current process to close

    }



};


export default connectDB;

