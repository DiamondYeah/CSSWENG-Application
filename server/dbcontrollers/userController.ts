// Import User and interface
import User, { type IUser } from "../models/user.ts"; 

// Import userRepo functions and service functions
import {createOrSaveUserTokens, findUserByID} from "./userRepository.ts"
import {refreshTikTokToken} from "../server_services/tiktokAuthService.ts"



// Function refereshes user token to prevent relogin when expired
export async function checkTokenIfExpired(userID: string): Promise<IUser | null> {

    let user = await findUserByID(userID);

    if (!user) {
        console.log("User not found with given ID!");
        return null;
    }

    // Only attempt TikTok refresh for users that actually have a TikTok identity
    if (user.tiktokOpenID && user.tokenExpiresIn < new Date()) {

        const refreshedUser = await refreshTikTokToken(user);

        if (refreshedUser && refreshedUser.tiktokOpenID) {
            user = await createOrSaveUserTokens({
                tiktokOpenID: refreshedUser.tiktokOpenID,
                accessToken: refreshedUser.accessToken,
                refreshToken: refreshedUser.refreshToken,
                scope: refreshedUser.scope,
                tokenExpiresIn: refreshedUser.tokenExpiresIn,
                refreshExpiresIn: refreshedUser.refreshExpiresIn,
            });
        }

    }

    return user;
};



