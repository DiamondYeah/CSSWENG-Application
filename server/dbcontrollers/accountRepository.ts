// Install bcrypt for password hashing for security
import bcrypt from "bcrypt";

// Import Account and interface
import Account, { type IAccount } from "../models/account.ts"; 
import {type BaseAccountInfo} from "../types/account.ts"


// Determines how many iterations of the bcrypt algorithm is performed to hash the password.
// Iterations is equal to 2^SALT_ROUNDS
const SALT_ROUNDS = 10


// Function creates new Account by fetching info from parameter and rerturning it. Also performs hashing on plainPassword
export async function createAccount(accountInfo : BaseAccountInfo): Promise<IAccount>{

    // Hash the passed password from accountInfo for the Account
    const cryptedPassword = await bcrypt.hash(accountInfo.plainPassword, SALT_ROUNDS);

    return await Account.create({

        username: accountInfo.username,
        email: accountInfo.email,
        cryptedPassword: cryptedPassword

    });

}


// Function returns boolean result of parameters that check if plain and crypted passwords match.
export async function verifyPasswordInformation(plainPassword: string, cryptedPassword: string){

    return await bcrypt.compare(plainPassword, cryptedPassword);

}


// Function returns Account Info by checking username parameter and using it to find a similar username from database
export async function findAccountByUsername(username: string): Promise<IAccount | null>{

    return await Account.findOne({username});

}


// Function returns Account Info by checking accountID parameter and using it to find a similar accountID from database
export async function findAccountByID(accountID: string): Promise<IAccount | null>{

    return await Account.findById(accountID);

}

// Function returns User Account by checking token parameter and using it to find a similar shareToken from database
export async function findAccountByShareToken(token: string): Promise<IAccount | null>{

    return await Account.findOne({shareToken: token});

}


// Function finds a account and updates said account to include a shareToken and expiration date of said shareToken
// Returns updated account
export async function createAccountShareToken(accountID: string, crytoToken: string, expireDate: Date){

    return await Account.findByIdAndUpdate(accountID, {

        shareToken: crytoToken,
        shareTokenExpiresIn: expireDate,

    })

}