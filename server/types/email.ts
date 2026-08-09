export type SubjectType = "calendarComment" | "postRejection" | "postAcceptance" | "calendarRejection" | "calendarAcceptance";

// Interface storing basic information of email to be send
export interface emailDeatils{

    receiver: string;
    subjectType: SubjectType; // Determines type of the email
    subjectTitle: string; // Other information for the email subject 
    text: string;
    commenterName?: string;
    calendarLink?: string;

}
