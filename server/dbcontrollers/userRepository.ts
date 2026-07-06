// Import User and interface
import User, { type IUser } from "../models/user.ts"; 

// Base shape shared by all providers
interface UserTokenData {
    tiktokOpenID?: string;
    linkedinOpenID?: string;
    accessToken: string;
    refreshToken?: string;
    scope: string;
    tokenExpiresIn: Date;
    refreshExpiresIn?: Date;
}

interface UserTokenDataSeconds {
    tiktokOpenID?: string;
    linkedinOpenID?: string;
    accessToken: string;
    refreshToken?: string;
    scope: string;
    tokenExpiresIn: number;
    refreshExpiresIn?: number;
}

// Function creates a new user document if open id has not yet existed. Else, updates current one
export async function createOrSaveUserTokens(tokenData: UserTokenData): Promise<IUser | null> {

    // Build the identifier from whichever provider ID was supplied
    const identifier = tokenData.tiktokOpenID
        ? { tiktokOpenID: tokenData.tiktokOpenID }
        : tokenData.linkedinOpenID
        ? { linkedinOpenID: tokenData.linkedinOpenID }
        : null;

    if (!identifier) {
        throw new Error("No provider open ID supplied to createOrSaveUserTokens");
    }

    return await User.findOneAndUpdate(
        identifier,
        { ...tokenData },
        {
            returnDocument: 'after',
            upsert: true
        }
    );
}

// Function creates a new user document if open id has not yet existed. Else, updates current one
// Version uses Date for tokenExpiresIn and refreshExpiresIn
export async function createOrSaveUserTokensFromSeconds(tokenData: UserTokenDataSeconds): Promise<IUser | null> {

    return createOrSaveUserTokens({
        ...tokenData,
        tokenExpiresIn: new Date(Date.now() + tokenData.tokenExpiresIn * 1000),
        refreshExpiresIn: tokenData.refreshExpiresIn !== undefined
            ? new Date(Date.now() + tokenData.refreshExpiresIn * 1000)
            : undefined,
    });
}

// Function returns User Info by checking userID parameter
export async function findUserByID(userID: string): Promise<IUser | null> {
    return await User.findById(userID);
}