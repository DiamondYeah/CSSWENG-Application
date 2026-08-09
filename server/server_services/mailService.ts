import Mailjet from "node-mailjet";
import dotenv from "dotenv";

// Import email utility and type
import {mapEmailTypeToSubject} from "../server_utilities/emailUtilities.ts";
import { type emailDeatils } from "../types/email.ts";

// Load env file
dotenv.config();

// Create a mailjet object client
const mailjet = (Mailjet as any).apiConnect(
    process.env.MAILJET_API_KEY as string,
    process.env.MAILJET_API_SECRET as string,
);

// Functions sends email to receiver via Resend with content obtained from mapEmailTypeToSubject depending on subject type
export async function sendEmailToReceiver(commentDetails: emailDeatils){

    // Get starting email subject
    const {subjectDetails, textDetails} = mapEmailTypeToSubject(commentDetails)

    try{

        // Send email with information via Mailjet
        await mailjet.post("send", {version: "v3.1"}).request({

            Messages: [
                {
                    From: {
                        Email: process.env.MAILJET_FROM as string,
                        Name: "AgilaPost",
                    },
                    To: [
                        {
                            Email: commentDetails.receiver,
                        },
                    ],
                    Subject: `${subjectDetails}${commentDetails.subjectTitle}`,
                    HTMLPart: textDetails,
                },
            ],

        });



    }catch(err){

        console.error("Failed to send comment notification email: ", err);

    }


}

