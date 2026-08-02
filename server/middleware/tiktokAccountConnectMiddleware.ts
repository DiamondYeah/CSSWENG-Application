import type { Response, NextFunction } from "express";

// Import types
import {type IAccount} from "../models/account.ts"
import {type AuthUserRequest} from "../types/express.ts"

// Import Controller and services Functions
import {findSpecificSocialMediaAccount} from "../dbcontrollers/socialMediaAccountRepository.ts";
import {checkTokenIfExpired} from "../server_services/tiktokAuthService.ts";
import {type ISocialMediaAccount} from "../models/socialMediaAccount.ts";


export async function findTikTokAccount(req: AuthUserRequest, res: Response, next: NextFunction){

    const account: IAccount = req.account as IAccount;
    const body = req.body ?? {};

    const socialMediaAccountsIDs: string[] | undefined = Array.isArray(body.socialMediaAccountsIDs)? body.socialMediaAccountsIDs : undefined;

    try{

        // Stores array of tiktokAccounts that are valid for use
        const validSocialMediaAccounts= [];


        if(socialMediaAccountsIDs && Array.isArray(socialMediaAccountsIDs) && socialMediaAccountsIDs.length > 0){

            for(const platformAccountID of socialMediaAccountsIDs){

                // Find specific tiktok account with the given account id
                let platformAccount: ISocialMediaAccount | null = await findSpecificSocialMediaAccount(String(account._id), "tiktok", platformAccountID);

                // Checks if tiktokAccount exists
                if(!platformAccount)
                    return res.status(404).json({ success: false, message: "No Social Media Account Found!"});

                // Perform specific checks depending on platform
                if(platformAccount.platform == "tiktok"){

                    // Check for the tiktok token to see if expired.
                    platformAccount = await checkTokenIfExpired(String(platformAccount._id));

                    // Checks if tiktok account token is expires or not 
                    if(!platformAccount)
                        return res.status(401).json({ success: false, message: "Tiktok Session Token expired. Please reconnect account!"});

                }

                // Push social media account to array
                validSocialMediaAccounts.push(platformAccount);                

            }
        }
        else if(!socialMediaAccountsIDs || socialMediaAccountsIDs.length <= 0){

            let firstValidTikTokAccount = await findSpecificSocialMediaAccount(String(account._id), "tiktok")

                // Checks if tiktokAccount exists
                if(!firstValidTikTokAccount)
                    return res.status(404).json({ success: false, message: "No Social Media Account Found!"});


                // Perform specific checks depending on platform
                if(firstValidTikTokAccount.platform == "tiktok"){

                    // Check for the tiktok token to see if expired.
                    firstValidTikTokAccount = await checkTokenIfExpired(String(firstValidTikTokAccount._id));

                    // Checks if tiktok account token is expires or not 
                    if(!firstValidTikTokAccount)
                        return res.status(401).json({ success: false, message: "Tiktok Session Token expired. Please reconnect account!"});

                }

                // Push social media account to array
                validSocialMediaAccounts.push(firstValidTikTokAccount);     
        }

        // Check if any accounts were found.
        if(validSocialMediaAccounts.length <= 0)
            return res.status(404).json({ success: false, message: "No Social Media Accounts Found!"});

        // If both checks pass return tiktok account data for both singular and array
        req.tiktokAccounts = validSocialMediaAccounts as ISocialMediaAccount[];
        req.tiktokAccount = validSocialMediaAccounts[0] as ISocialMediaAccount;

        next();

    }catch(err){

        console.error("TikTok Account Connected Failed: " + err);
        return res.status(500).json({ success: false, message: "Unexcepect error when obtaining a Social Media Account connection!" });

    }

}