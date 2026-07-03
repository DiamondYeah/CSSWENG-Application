import {useState, useEffect} from "react";

// Constants for API links
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const CONNECTED_ACCOUNTS_DIRECT = `${API_BASE}/userInfo/getconnectedaccounts`;


// Interface for social account info
interface socialAccountInfo{

    id: string,
    name: string,
    handle: string,
    avatarUrl?: string,
    platform: string

}


// Hook performs fetch to route to get connected social media accounts to user. Includes useEffect to reload data immediately
export function useConnectAccounts(){

    const [accounts, setAccounts] = useState<socialAccountInfo[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        async function loadSocialAccounts(){

            try{

                const accountFetch = await fetch(CONNECTED_ACCOUNTS_DIRECT, {credentials: "include"})

                if(!accountFetch.ok)
                    throw new Error(`Request Failed: ${accountFetch.status}`);


                // Convert fetch to json and get data
                const accountFetchInfo = await accountFetch.json();

                const connectedAccount: socialAccountInfo = {

                    id: accountFetchInfo.data.open_id,
                    name: accountFetchInfo.data.display_name ?? "unknown",
                    handle: `@${accountFetchInfo.data.username ?? "unknown"}`,
                    platform: "TikTok"

                }

                // Add new account if not duplicate (Added checking to be idempotent). Return previous list if duplicate.
                setAccounts(prevA => {

                    const alreadyExists = prevA.some(prevA => prevA.id == connectedAccount.id);
                    return alreadyExists ? prevA : [...prevA, connectedAccount];

                });

            }
            catch(e){

                console.log("Error: " + e);
                setError(String(e));

            }
            finally{

                console.log("Accounts stored: ", accounts);
                setIsLoading(false);

            }

        }

        // Call function
        loadSocialAccounts();

    }, []);

    // Return result
    return {accounts, isLoading, error};

}