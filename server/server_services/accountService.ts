
import {createAccount, verifyPasswordInformation, findAccountByUsername} from "../dbcontrollers/accountRepository.ts"
import { type IAccount } from "../models/account.ts";
import {type BaseAccountInfo} from "../types/account.ts"


export async function registerAccount(accountInput: BaseAccountInfo): Promise <IAccount>{


    // Check if account already existing by searching for inputted username in database
    const existingAccount: IAccount | null = await findAccountByUsername(accountInput.username);

    // Throw error if user is found
    if(existingAccount)
        throw new Error("ACCOUNT_ALREADY_EXISTS");


    return await createAccount(accountInput);

}


export async function loginAccount(username: string, password: string): Promise <IAccount>{

    // Check if account already existing by searching for inputted username in database
    const existingAccount: IAccount | null = await findAccountByUsername(username);

    if(!existingAccount)
        throw new Error("USERNAME_NOT_FOUND");

    
    const checkPasswordMatch: boolean = await verifyPasswordInformation(password, existingAccount.cryptedPassword);
    
    if(!checkPasswordMatch)
        throw new Error("PASSWORD_MISMATCH");

    return existingAccount;

}