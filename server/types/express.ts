import type { Request } from "express";

// Import type of IUser from mongoose file
import {type IUser} from "../models/user.ts"

// Interface for AuthUserRequest. 
// It extends Request and adds a user field to the request call so if checks pass, req will return with user info.
export interface AuthUserRequest extends Request{

    user?: IUser;

}
