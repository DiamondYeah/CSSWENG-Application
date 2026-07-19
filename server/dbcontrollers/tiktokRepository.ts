// Import User and interface
import SocialMediaAccount, { type ISocialMediaAccount } from "../models/socialMediaAccount.ts"; 

// Interface for TikTokAPIResponse
interface TiktokAPIResponse{

    accountID: string;
    platform?: string;
    platformAccountID: string;
    accessToken: string;
    refreshToken: string;
    scope: string;
    tokenExpiresIn: Date;
    refreshExpiresIn: Date;

};


// Interface for TikTokAPIResponse
interface TiktokAPIResponseSeconds{

    accountID: string;
    platform?: string;
    platformAccountID: string;
    accessToken: string;
    refreshToken: string;
    scope: string;
    tokenExpiresIn: number;
    refreshExpiresIn: number;

};



// Function creates a new user document if open id has not yet existed. Else, updates current one
export async function createOrSaveUserTokens(tiktokAPI: TiktokAPIResponse): Promise<ISocialMediaAccount | null>{

    return await SocialMediaAccount.findOneAndUpdate(

        {platformAccountID: tiktokAPI.platformAccountID}, // Identifier
        {   // Data to be stored
            ...tiktokAPI 
        },
        {   // Create new document if ID not found
            returnDocument: 'after',
            upsert: true
        }

    );

}


// Function creates a new user document if open id has not yet existed. Else, updates current one
// Version uses Date for tokenExpiresIn and refreshExpiresIn
export async function createOrSaveUserTokensFromSeconds(tiktokAPI: TiktokAPIResponseSeconds): Promise<ISocialMediaAccount | null>{


    return createOrSaveUserTokens({

        ...tiktokAPI,
        tokenExpiresIn: new Date(Date.now() + tiktokAPI.tokenExpiresIn * 1000),
        refreshExpiresIn: new Date(Date.now() + tiktokAPI.refreshExpiresIn * 1000),

    });

}




// Function returns User Info by checking userID parameter
export async function findUserByID(userID: string): Promise<ISocialMediaAccount | null>{

    return await SocialMediaAccount.findById(userID);

}


