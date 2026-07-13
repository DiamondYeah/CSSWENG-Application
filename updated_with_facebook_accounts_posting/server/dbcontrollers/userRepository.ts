import User, { type IUser } from "../models/user.ts"; 
import SocialConnection, { type ISocialConnection, type SocialPlatform } from "../models/socialConnection.ts";
import mongoose from "mongoose";

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

export async function createOrSaveUserTokens(tokenData: UserTokenData): Promise<IUser | null> {
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

export async function createOrSaveUserTokensFromSeconds(tokenData: UserTokenDataSeconds): Promise<IUser | null> {
    return createOrSaveUserTokens({
        ...tokenData,
        tokenExpiresIn: new Date(Date.now() + tokenData.tokenExpiresIn * 1000),
        refreshExpiresIn: tokenData.refreshExpiresIn !== undefined
            ? new Date(Date.now() + tokenData.refreshExpiresIn * 1000)
            : undefined,
    });
}

export async function findUserByID(userID: string): Promise<IUser | null> {
    return await User.findById(userID);
}

interface SocialConnectionTokenDataSeconds {
    platform: SocialPlatform;
    platformOpenID: string;
    accessToken: string;
    refreshToken?: string;
    scope: string;
    tokenExpiresIn: number;
    refreshExpiresIn?: number;
    handle?: string;
    label?: string;
}

// Reuses the account behind the current session cookie if there is one,
// otherwise creates a fresh empty account to hang connections off of.
export async function getOrCreateAccount(existingUserID?: string): Promise<IUser> {
    if (existingUserID) {
        const existing = await User.findById(existingUserID);
        if (existing) return existing;
    }
    return await User.create({});
}

// Upserts a connection by (platform, platformOpenID) so reconnecting the
// same LinkedIn account just refreshes its token instead of duplicating it,
// while a *different* LinkedIn account becomes a brand new entry.
export async function linkSocialConnection(
    ownerID: string,
    tokenData: SocialConnectionTokenDataSeconds
): Promise<ISocialConnection | null> {
    const { tokenExpiresIn, refreshExpiresIn, ...rest } = tokenData;

    return await SocialConnection.findOneAndUpdate(
        { platform: tokenData.platform, platformOpenID: tokenData.platformOpenID },
        {
            ...rest,
            owner: ownerID,
            tokenExpiresIn: new Date(Date.now() + tokenExpiresIn * 1000),
            refreshExpiresIn: refreshExpiresIn !== undefined
                ? new Date(Date.now() + refreshExpiresIn * 1000)
                : undefined,
        },
        { returnDocument: "after", upsert: true }
    );
}

export async function listSocialConnections(
    ownerID: string,
    platform?: SocialPlatform
): Promise<ISocialConnection[]> {
    return await SocialConnection.find({ owner: ownerID, ...(platform ? { platform } : {}) });
}

export async function findOwnedSocialConnection(
    ownerID: string,
    connectionID: string
): Promise<ISocialConnection | null> {

    if (!mongoose.Types.ObjectId.isValid(connectionID)) {
        return null;
    }

    return await SocialConnection.findOne({
        _id: new mongoose.Types.ObjectId(connectionID),
        owner: new mongoose.Types.ObjectId(ownerID)
    });
}

export async function deleteSocialConnection(
    ownerID: string,
    connectionID: string
): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(connectionID)) {
        return false;
    }

    const result = await SocialConnection.deleteOne({
        _id: new mongoose.Types.ObjectId(connectionID),
        owner: new mongoose.Types.ObjectId(ownerID),
    });

    return result.deletedCount > 0;
}