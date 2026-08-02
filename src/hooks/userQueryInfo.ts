import {useState, useEffect} from "react";
import {fetchQueryInfo} from "../controller/fetchController.ts";

// Import types
import {type UserQueryInfo} from "../types/tiktok.ts"


// Function performs fetch to obtain user query info of the user assuming they have already logged in the website. Includes useEffect to reload data immediately.s
export function useUserQueryInfo(accountIDs: string[]){

    const [queryInfo, setQueryInfo] = useState<UserQueryInfo[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        // Check if parameter is empty to avoid fetching
        if(accountIDs.length <= 0){

            setIsLoading(false);
            return;

        }

        let ignore = false; // Ignore prevents double checking


        async function loadUserQueryInfo(){

            try{

                setIsLoading(true);

                const queryFetch = await fetchQueryInfo(accountIDs);


                // Add new query if ignore is false (wasnt ran twice) and data exists of fetch return
                if(!ignore && queryFetch.data)
                    setQueryInfo(queryFetch.data); // Set query info with the fetch data

            }
            catch(e){

                if(!ignore)
                    setError(String(e));

            }
            finally{

                if(!ignore)
                    setIsLoading(false);

            }

        }

        // Call function
        loadUserQueryInfo();
        return() => {ignore = true;} // Return if ignore is true

    }, [accountIDs.join(",")]); // Re-render if account selection changes


    function getSpecificQueryInfo(platformAccountID: string): UserQueryInfo | null{

        // Find specific query info in object array that has similar platformAccountID with parameter
        if(queryInfo)
            return queryInfo.find((q: any) => q.platformAccountID == platformAccountID) ?? null;

        return null;

    }

    // Return result
    return {queryInfo, isLoading, error, getSpecificQueryInfo};

}

