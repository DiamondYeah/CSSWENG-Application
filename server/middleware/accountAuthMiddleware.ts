import type { Request, Response, NextFunction } from "express";

// Import types
import {type IAccount} from "../models/account.ts"
import {type AuthUserRequest} from "../types/express.ts"

// Import Controller Functions
import {findAccountByID} from "../dbcontrollers/accountRepository.ts";


// Middleware function before every route is performed to check validaity of session user id.
// Checks if ID is available and has an associated user in the database. Also resets userID if expired
export async function findAccountAuth(req: AuthUserRequest, res: Response, next: NextFunction){

    // Get session user id from cookies and check if empty
    const accountID = req.cookies.session_account_id;

    if(!accountID)
        return res.status(401).json({ success: false, message: "Not logged in!" });


    try{

        // Get user info from database and check if empty
        const account: IAccount | null = await findAccountByID(accountID);

        if(!account)
            return res.status(401).json({ success: false, message: "Account not Found with Session User ID!" });

        // If both checks pass return user data
        req.account = account;
        next();


    }catch(err){

        console.error("Authentication with Account Failed: " + err);
        return res.status(401).json({ success: false, message: "Session has expired. Please reconnect account!" });

    }


}