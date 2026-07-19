// Interface storing basic information of user before account was made
export interface BaseAccountInfo{

    username: string;
    email: string;
    plainPassword: string; // Password not yet hashed

}