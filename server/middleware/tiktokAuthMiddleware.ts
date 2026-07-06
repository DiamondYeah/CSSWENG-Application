import type { Request, Response, NextFunction } from "express";

// Import IUser interface
import type { IUser } from "../models/user.ts";

// Import Controller Functions
import {checkTokenIfExpired} from "../dbcontrollers/userController.ts";


// AuthUserRequest adds a user field to the request call so if checks pass, req will return with user info
export interface AuthUserRequest extends Request{

    user?: IUser;
}


// Middleware function before every route is performed to check validaity of session user id.
// Checks if ID is available and has an associated user in the database. Also resets userID if expired
export async function findUserAuth(req: AuthUserRequest, res: Response, next: NextFunction){

    const userID = req.cookies.session_user_id;
    if(!userID)
        return res.status(401).json({ success: false, message: "Session User ID not Found!" });

    try {

        const user: IUser | null = await checkTokenIfExpired(userID as string);
        if(!user)
            return res.status(401).json({ success: false, message: "User not Found with Session User ID!" });

        req.user = user;
        next();

    } catch (err) {

        console.error("Error in findUserAuth: " + err);
        return res.status(500).json({ success: false, message: "Unexpected error while verifying session." });

    }

}