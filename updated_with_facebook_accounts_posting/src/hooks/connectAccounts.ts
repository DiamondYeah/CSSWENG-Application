import {useState, useEffect} from "react";

// Constants for API links
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const CONNECTED_ACCOUNTS_DIRECT = `${API_BASE}/userInfo/getconnectedaccounts`;


// Interface for social account info
interface socialAccountInfo{
    id: string,
    _id: string, 
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

                // Backend now returns an array of accounts, one entry per connected provider
                const incomingAccounts: socialAccountInfo[] = (accountFetchInfo.data ?? []).map((acc: any) => ({
                    id: acc.id,
                    _id: acc._id, 
                    name: acc.name ?? "unknown",
                    handle: acc.handle ?? "unknown",
                    platform: acc.platform ?? "unknown"
                }));

                // Merge in new accounts, skipping duplicates by id
                setAccounts(prevA => {

                    const merged = [...prevA];

                    incomingAccounts.forEach(newAcc => {
                        const alreadyExists = merged.some(existing => existing.id === newAcc.id);
                        if (!alreadyExists)
                            merged.push(newAcc);
                    });

                    return merged;

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