import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

// Import fetchAccountInfo function from controller
import {fetchAccountInfo} from "../controller/fetchController.ts";


function LoggedInWrapper({children}: {children: React.ReactNode}){

    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {

        async function checkedLoggedInStatus(){

            try{

                // Fetch account information if it exists
                const accountFetch = await fetchAccountInfo();

                setIsLoggedIn(accountFetch.success); // Set logged in info to whenever fetch info was a success or not.


            }catch(err){

                setIsLoggedIn(false); // If fetch failed, automatically set to false

            }

        }

        checkedLoggedInStatus(); 

    }, []);



    if(isLoggedIn == null) // If still fetching, show loading screen
        return <div style = { {margin: "50px", color: "#6d28d9", fontWeight: "bold", fontSize: "35px"}}>Loading...</div>;
    else if(!isLoggedIn) // If isLoggedIn failed, move to SignIn page.
        return <Navigate to = "/signin" replace = {true} />;

    // if logged in show the contents of the page
    return <>{children}</>;

}


export default LoggedInWrapper;