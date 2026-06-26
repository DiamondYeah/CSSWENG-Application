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

    // Get session user id from cookies and check if empty
    const userID = req.cookies.session_user_id;
    if(!userID)
        return res.status(401).json({ success: false, message: "Session User ID not Found!" });

    // Get user info from database and check if empty
    const user: IUser | null = await checkTokenIfExpired(userID as string);
    if(!user)
        return res.status(401).json({ success: false, message: "User not Found with Session User ID!" });

    // If both checks pass return user data
    req.user = user;
    next();

}