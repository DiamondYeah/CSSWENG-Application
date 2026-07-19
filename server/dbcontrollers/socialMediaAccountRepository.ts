// Import User and interface
import SocialMediaAccount, { type ISocialMediaAccount } from "../models/socialMediaAccount.ts"; 

// Function returns Specific Social Media Account Info by checking Account ID and the platform to find a similar one in the database
export async function findSpecificSocialMediaAccount(accountID: string, platform: string): Promise<ISocialMediaAccount | null>{

  return await SocialMediaAccount.findOne({ accountID, platform });

}


// Function finds all social media accounts connected to the accountID and returns array of social media accounts connected to account
export async function findAllSocialMediaAccounts(accountID: string): Promise<ISocialMediaAccount[]>{

    return await SocialMediaAccount.find({accountID});

}
