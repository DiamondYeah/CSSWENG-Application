import type { Request } from "express";

// Import type of IAccount and ISocialMediaAccount from mongoose file
import {type IAccount} from "../models/account.ts";
import {type ISocialMediaAccount} from "../models/socialMediaAccount.ts";



// Interface for AuthUserRequest. 
// It extends Request and adds a account field to the request call so if checks pass, req will return with user info.
// Helps with checking and security.
export interface AuthUserRequest extends Request{

    account?: IAccount;
    tiktokAccount?: ISocialMediaAccount;

}
