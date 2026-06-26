// Import User and interface
import User, { type IUser } from "../models/user.ts"; 

// Import userRepo functions and service functions
import {createOrSaveUserTokens, findUserByID} from "./userRepository.ts"
import {refreshTikTokToken} from "../server_services/tiktokAuthService.ts"



// Function refereshes user token to prevent relogin when expired
export async function checkTokenIfExpired(userID: string): Promise<IUser | null>{


    let user = await findUserByID(userID);

    if(!user){

        console.log("User not found with given ID!");
        return null;

    }

    if(user.tokenExpiresIn < new Date()){

        user = await refreshTikTokToken(user);

        // If not null, update user's API
        if(user)
            user = await createOrSaveUserTokens(user);

    }



    return user;
};



