import {useState, useEffect} from "react";
import {fetchQueryInfo} from "../controller/fetchController.ts";

// Import types
import {type UserQueryInfo} from "../types/tiktok.ts"


// Function performs fetch to obtain user query info of the user assuming they have already logged in the website. Includes useEffect to reload data immediately.s
export function useUserQueryInfo(){

    const [queryInfo, setQueryInfo] = useState<UserQueryInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        let ignore = false; // Ignore prevents double checking

        async function loadUserQueryInfo(){

            try{

                const queryFetch = await fetchQueryInfo()

                // Get data of fetch return
                const queryInfo = await queryFetch.data;

                // Add new query if ignore is false (wasnt ran twice)
                if(!ignore)
                    setQueryInfo(queryInfo);

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

    }, []);

    // Return result
    return {queryInfo, isLoading, error};

}

