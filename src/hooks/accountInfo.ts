import {useState, useEffect} from "react";
import {fetchAccountInfo} from "../controller/fetchController.ts";

interface AccountInfo{

    id: string,
    username: string;
    email: string;

}


// Function performs fetch to obtain user query info of the user assuming they have already logged in the website. Includes useEffect to reload data immediately.s
export function useAccountInfo(skip: boolean = false){

    const [account, setAccount] = useState<AccountInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!skip);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        // Immediately return if skip is true since we already fetched account info
        if(skip)
            return;


        let ignore = false;


        async function loadAccountInfo(){

            try{

                setIsLoading(true);

                const accountFetch = await fetchAccountInfo();

                // Return immediately if ignore is true since we already fetched to avoid double fetch
                if(ignore)
                    return

                // Add account info if data exists of fetch return
                if(accountFetch.success && accountFetch.data)
                    setAccount(accountFetch.data); // Set account info with the fetch data
                else
                    setError(accountFetch.message ?? "accountFetch returned with no data!");

            }
            catch(err){

                if(!ignore){

                    console.error("Failed to fetch acccount info: ", err)
                    setError(String(err));

                }


            }
            finally{

                if(!ignore)
                    setIsLoading(false);

            }

        }

        // Call function
        loadAccountInfo();

        // Set ignore to true once returned
        return () => {ignore = true}

    }, [skip]); 


    // Return result
    return {account, isLoading, error};

}

