import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns";

// Import email utility and type
import {mapEmailTypeToSubject} from "../server_utilities/emailUtilities.ts";
import { type emailDeatils } from "../types/email.ts";

// Load env file
dotenv.config();

// Force IPv4 DNS resolution to make SMTP work
dns.setDefaultResultOrder("ipv4first");


// Create a transporter options list for SMTP 
const transportOptions: any = {
    
  pool: true,
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT ?? 587) === 465, // Use TLS from the start (required for port 465)
  family: 4,
  auth: {

    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,

  },

};


// Create a transporter to send messages via SMTP
const transporter = nodemailer.createTransport(transportOptions);



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

