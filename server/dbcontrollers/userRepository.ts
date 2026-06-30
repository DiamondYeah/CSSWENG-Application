// Import User and interface
import User, { type IUser } from "../models/user.ts"; 

// Interface for TikTokAPIResponse
interface TiktokAPIResponse{

    tiktokOpenID: string;
    accessToken: string;
    refreshToken: string;
    scope: string;
    tokenExpiresIn: Date;
    refreshExpiresIn: Date;

};


// Interface for TikTokAPIResponse
interface TiktokAPIResponseSeconds{

    tiktokOpenID: string;
    accessToken: string;
    refreshToken: string;
    scope: string;
    tokenExpiresIn: number;
    refreshExpiresIn: number;

};



// Function creates a new user document if open id has not yet existed. Else, updates current one
export async function createOrSaveUserTokens(tiktokAPI: TiktokAPIResponse): Promise<IUser | null>{

    return await User.findOneAndUpdate(

        {tiktokOpenID: tiktokAPI.tiktokOpenID}, // Identifier
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
export async function createOrSaveUserTokensFromSeconds(tiktokAPI: TiktokAPIResponseSeconds): Promise<IUser | null>{


    return createOrSaveUserTokens({

        ...tiktokAPI,
        tokenExpiresIn: new Date(Date.now() + tiktokAPI.tokenExpiresIn * 1000),
        refreshExpiresIn: new Date(Date.now() + tiktokAPI.refreshExpiresIn * 1000),

    });

}




// Function returns User Info by checking userID parameter
// Mongoose and schema already provide implicit annotation of type
export async function findUserByID(userID: string): Promise<IUser | null>{

    return await User.findById(userID);

}
