  // Interface for TikTok Settigns
  interface TikTokConsentDetails{
  
      isCommercialContent: boolean;
      isYourOwnBrand: boolean;
      isBrandedContent: boolean;

  }
  
  // Function returns TikTok User Consent depending on which are selected for Commercial Content and Promotion
  function TikTokConsent({isCommercialContent, isYourOwnBrand, isBrandedContent}: TikTokConsentDetails): React.JSX.Element | null {

    if(!isCommercialContent)
      return null;
    else if (isBrandedContent)
      return (
        <p>By posting, you agree to TikTok's{" "}
          <a href="https://www.tiktok.com/legal/page/global/bc-policy/en" target="_blank" rel="noreferrer">Branded Content Policy</a> and{" "}
          <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noreferrer">Music Usage Confirmation.</a>
        </p>
      );
    else if(isYourOwnBrand)
      return (
        <p>By posting, you agree to TikTok's{" "}
          <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noreferrer">Music Usage Confirmation.</a>
        </p>
      );


    return null; // If all fails, return null

  }


  export default TikTokConsent;