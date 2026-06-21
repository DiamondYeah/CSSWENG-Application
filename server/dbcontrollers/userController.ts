import User, { type IUser } from "../models/user.ts"; 


interface TiktokAPIResponse{

    tiktokOpenID: string;
    accessToken: string;
    refreshToken: string;
    scope: string;
    tokenExpiresIn: number;
    refreshExpiresIn: number;

};


// Function creates a new user document if open id has not yet existed. Else, updates current one
async function createorUpdateUserAPI(tiktokAPI: TiktokAPIResponse): Promise<typeof newUser>{

    // Convert to expires and refresh into dates
    const expiresInDate: Date = new Date(Date.now() + tiktokAPI.tokenExpiresIn * 1000);
    const refreshInDate: Date = new Date(Date.now() + tiktokAPI.refreshExpiresIn * 1000);


    const newUser = await User.findOneAndUpdate(

        {tiktokOpenID: tiktokAPI.tiktokOpenID}, // Identifier
        {   // Data to be stored

            tiktokOpenID: tiktokAPI.tiktokOpenID,
            accessToken: tiktokAPI.accessToken,
            refreshToken: tiktokAPI.refreshToken,
            scope: tiktokAPI.scope,
            tokenExpiresIn: expiresInDate,
            refreshExpiresIn: refreshInDate

        },
        {   // Create new document if ID not found
            returnDocument: 'after',
            upsert: true
        }

    );

    return newUser;

};


// Function returns User Info by checking userID parameter
// Mongoose and schema already provide implicit annotation of type
export async function findUser(userID: string){

    return await User.findById(userID);

}


// Function refereshes user token to prevent relogin when expired
export async function refreshToken(user: IUser): Promise<typeof updatedUser>{


    // Perform token fetch but for refreshing the token (grant type is refresh_token)
    const tokenFetch = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {

        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ 
            client_key: process.env.TIKTOK_CLIENT_KEY as string, 
            client_secret: process.env.TIKTOK_CLIENT_SECRET as string,
            grant_type: "refresh_token", 
            refresh_token: user.refreshToken,
        }),

    });


    const refreshUserData = await tokenFetch.json();
    console.log("Refresh Token Details:", refreshUserData);


    // Update user information
    const updatedUser = await createorUpdateUserAPI({

            tiktokOpenID: user.tiktokOpenID,
            accessToken: refreshUserData.access_token,
            refreshToken: refreshUserData.refresh_token,
            scope: refreshUserData.scope,
            tokenExpiresIn: refreshUserData.expires_in,
            refreshExpiresIn: refreshUserData.refresh_expires_in

    });

    return updatedUser;

};



// Function refereshes user token to prevent relogin when expired
export async function checkTokenIfExpired(userID: string): Promise<typeof user>{


    let user = await User.findById(userID);

    if(!user){

        console.log("User not found with given ID!");
        return null;

    }

    if(user.tokenExpiresIn < new Date())
        user = await refreshToken(user);


    return user;
};



export default createorUpdateUserAPI;
