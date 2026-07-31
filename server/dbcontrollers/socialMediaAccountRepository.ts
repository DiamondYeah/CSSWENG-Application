// Import User and interface
import SocialMediaAccount, { type ISocialMediaAccount, type platforms } from "../models/socialMediaAccount.ts"; 

// Function returns Specific Social Media Account Info by checking Account ID and the platform to find a similar one in the database
export async function findSpecificSocialMediaAccount(accountID: string, platform: platforms, platformAccountID?: string): Promise<ISocialMediaAccount | null>{

  if(platformAccountID)
    return await SocialMediaAccount.findOne({ accountID, platformAccountID, platform });

  return await SocialMediaAccount.findOne({ accountID, platform });

}


// Function finds all social media accounts connected to the accountID and returns array of social media accounts connected to account
export async function findAllSocialMediaAccounts(accountID: string): Promise<ISocialMediaAccount[]>{

    return await SocialMediaAccount.find({accountID});

}

/*
export async function createSocialMediaAccount(
    accountID: string,
    data: {
        platform: platforms;
        platformAccountID: string;
        accessToken: string;
        refreshToken?: string;
        scope: string;
        tokenExpiresIn: number;
        refreshExpiresIn?: number;
    }
): Promise<ISocialMediaAccount> {

    return await SocialMediaAccount.create({

        accountID,
        platform: data.platform,
        platformAccountID: data.platformAccountID,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? "",
        scope: data.scope,
        tokenExpiresIn: new Date(Date.now() + data.tokenExpiresIn * 1000),
        refreshExpiresIn: new Date(
            Date.now() + (data.refreshExpiresIn ?? data.tokenExpiresIn) * 1000
        )

    });

}
    */
export async function createSocialMediaAccount(
    accountID: string,
    data: {
        platform: platforms;
        platformAccountID: string;
        accessToken: string;
        refreshToken?: string;
        scope: string;
        tokenExpiresIn: number;
        refreshExpiresIn?: number;

    }
): Promise<ISocialMediaAccount> {

    return await SocialMediaAccount.findOneAndUpdate(

        {
            platform: data.platform,
            platformAccountID: data.platformAccountID
        },

        {
            accountID,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? "",
            scope: data.scope,
            tokenExpiresIn: new Date(Date.now() + data.tokenExpiresIn * 1000),
            refreshExpiresIn: new Date(
                Date.now() + (data.refreshExpiresIn ?? data.tokenExpiresIn) * 1000
            ),

        },

        {
            returnDocument: "after",
            upsert: true,
            runValidators: true
        }

    );

}