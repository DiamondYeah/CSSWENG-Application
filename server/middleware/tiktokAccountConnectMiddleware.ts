import type { Response, NextFunction } from "express";

// Import types
import {type IAccount} from "../models/account.ts"
import {type AuthUserRequest} from "../types/express.ts"

// Import Controller and services Functions
import {findSpecificSocialMediaAccount} from "../dbcontrollers/socialMediaAccountRepository.ts";
import {checkTokenIfExpired} from "../server_services/tiktokAuthService.ts";
import { type ISocialMediaAccount } from "../models/socialMediaAccount.ts";


export async function findTikTokAccount(req: AuthUserRequest, res: Response, next: NextFunction){

    const account: IAccount = req.account as IAccount;

    try{

        // Find specific tiktok account with the given account id
        const tiktokAccount: ISocialMediaAccount | null = await findSpecificSocialMediaAccount(String(account._id), "tiktok");

        // Checks if tiktokAccount exists
        if(!tiktokAccount)
            return res.status(404).json({ success: false, message: "No TikTok Account Found!"});


        // Check for the tiktok token to see if expired.
        const refreshTikTokAccount: ISocialMediaAccount | null = await checkTokenIfExpired(String(tiktokAccount._id));

        // Checks if tiktok account token is expires or not 
        if(!refreshTikTokAccount)
            return res.status(401).json({ success: false, message: "Tiktok Session Token expired. Please reconnect account!"});


        // If both checks pass return tiktok account data
        req.tiktokAccount = refreshTikTokAccount as ISocialMediaAccount;
        next();

    }catch(err){

        console.error("TikTok Account Connected Failed: " + err);
        return res.status(500).json({ success: false, message: "Unexcepect error when obtaining a TikTok connection!" });

    }

}