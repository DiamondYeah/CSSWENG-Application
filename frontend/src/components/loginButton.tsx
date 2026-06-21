
// Interface for button data
interface ButtonData {

    url?: string;
    buttonLabel?: string;
    onClick?: () => any;

}


// Function redirects user to href link
function openURL(link: string): void{

    window.location.href = link;

}



function Button({url, buttonLabel, onClick}: ButtonData): React.JSX.Element{
 
    // Perform different function depending if url or onClick has value
    const handleClick = () => {

        if(url)
            openURL(url);
        else if(onClick)
            onClick();
    }


    return(
        <>
            <button onClick= {handleClick}>{buttonLabel}</button>
        </>
    );

}

export default Button;