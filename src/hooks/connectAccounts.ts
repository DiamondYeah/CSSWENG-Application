import {useState, useEffect} from "react";

// Constants for API links
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const CONNECTED_ACCOUNTS_DIRECT = `${API_BASE}/userInfo/getconnectedaccounts`;

// Import types
import {type socialAccountInfo} from "../types/account.ts"


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

                console.log("RESULTS");
                console.log(accountFetchInfo);

                const connectedAccount: socialAccountInfo[] = accountFetchInfo.data.map((acc: any) => ({

                    id: acc.id,
                    name: acc.name ?? "unknown",
                    handle: `${acc.handle ?? "unknown"}`,
                    platform: acc.platform,

                }))

                // Perform filter to add new account not alreadey existing in accounts/ prevA(Added checking to be idempotent). 
                // Return previous list if duplicate.
                setAccounts(prevA => {

                    const newAccounts = connectedAccount.filter(
                        ca => !prevA.some(p => p.id == ca.id)
                    )

                    return [...prevA, ...newAccounts];

                });

            }
            catch(e){

                console.log("Error: " + e);
                setError(String(e));

            }
            finally{

                setIsLoading(false);

            }

        }

        // Call function
        loadSocialAccounts();

    }, []);

    // Return result
    return {accounts, isLoading, error};

}