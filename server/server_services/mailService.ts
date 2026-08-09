import nodemailer from "nodemailer";
import dotenv from "dotenv";


// Import email utility and type
import {mapEmailTypeToSubject} from "../server_utilities/emailUtilities.ts";
import { type emailDeatils } from "../types/email.ts";

// Load env file
dotenv.config();




// Create a transporter to send messages via SMTP
const transporter = nodemailer.createTransport({
    
  pool: true,
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT ?? 587) === 465, // Use TLS from the start (required for port 465)
  auth: {

    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,

  },

});



// Functions sends email to receiver with content obtained from mapEmailTypeToSubject depending on subject type
export async function sendEmailToReceiver(commentDetails: emailDeatils){

    // Get starting email subject
    const {subjectDetails, textDetails} = mapEmailTypeToSubject(commentDetails)

    try{

        await transporter.sendMail({

            from: `AgilaPost <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
            to: commentDetails.receiver,
            subject: `${subjectDetails}${commentDetails.subjectTitle}`,
            html: textDetails,

        });


    }catch(err){

        console.error("Failed to send comment notification email: ", err);

    }


}

