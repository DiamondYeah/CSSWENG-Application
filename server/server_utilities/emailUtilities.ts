import { type emailDeatils } from "../types/email.ts";

// Function checks email type to be sent and returns the starting subject on the email
export function mapEmailTypeToSubject(emailDetails: emailDeatils){

    let subjectDetails: string = "";
    let textDetails: string = "";

    switch(emailDetails.subjectType){


        case "calendarComment":

            subjectDetails = "New Comment On: ";
            textDetails = `
                <p><strong>Notification Alert!</strong></p>
                <p><strong>${emailDetails.commenterName ?? "Anonymous User"}</strong> commented on your scheduled post <strong>${emailDetails.subjectTitle}</strong>:</p>
                <blockquote>${emailDetails.text}</blockquote>
                ${emailDetails.calendarLink ? `<p><a href="${emailDetails.calendarLink}"><strong>View calendar Here</strong></a></p>` : ""}`;

            break;

        case "postRejection":

            subjectDetails = "Post was Rejected On: ";    
            textDetails = `
                <p><strong>Notification Alert!</strong></p>
                <p><strong>${emailDetails.commenterName ?? "Anonymous User"}</strong> rejected one of your scheduled posts on <strong>${emailDetails.subjectTitle}</strong>:</p>
                <blockquote>${emailDetails.text}</blockquote>
                ${emailDetails.calendarLink ? `<p><a href="${emailDetails.calendarLink}"><strong>View calendar Here</strong></a></p>` : ""}`;
            break;      

        case "postAcceptance":

            subjectDetails = "Post was Accepted On: ";
            textDetails = `
                <p><strong>Notification Alert!</strong></p>
                <p><strong>${emailDetails.commenterName ?? "Anonymous User"}</strong> accepted one on your scheduled post on <strong>${emailDetails.subjectTitle}</strong>:</p>
                <blockquote>${emailDetails.text}</blockquote>
                ${emailDetails.calendarLink ? `<p><a href="${emailDetails.calendarLink}"><strong>View calendar Here</strong></a></p>` : ""}`;
            break;

        case "calendarRejection":

            subjectDetails = "Scheduled Calendar was Rejected On: ";
            textDetails = `
                <p><strong>Notification Alert!</strong></p>
                <p><strong>${emailDetails.commenterName ?? "Anonymous User"}</strong> rejected the entire calendar <strong>${emailDetails.subjectTitle}</strong>:</p>
                <blockquote>${emailDetails.text}</blockquote>
                ${emailDetails.calendarLink ? `<p><a href="${emailDetails.calendarLink}"><strong>View calendar Here</strong></a></p>` : ""}`;
            break;

        case "calendarAcceptance":

            subjectDetails = "Scheduled Calendar was Accepted On: ";
            textDetails = `
                <p><strong>Notification Alert!</strong></p>
                <p><strong>${emailDetails.commenterName ?? "Anonymous User"}</strong> accepted the entire calendar <strong>${emailDetails.subjectTitle}</strong>:</p>
                <blockquote>${emailDetails.text}</blockquote>
                ${emailDetails.calendarLink ? `<p><a href="${emailDetails.calendarLink}"><strong>View calendar Here</strong></a></p>` : ""}`;
            break;

        default:
            subjectDetails = "Email Sent: "
            textDetails = `<p><strong>Notification Alert!</strong></p>`;


    }

    return {subjectDetails, textDetails};

}