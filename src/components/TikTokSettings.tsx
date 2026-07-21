// Import types
import {type UserQueryInfo} from "../types/tiktok.ts"


// Interface for TikTok Settigns
interface TikTokSettingsDetails{

    queryInfo: UserQueryInfo | null;
    privacyLevel: string;
    isPhotoPost: boolean;
    setPrivacyLevel: (val: string) => void;
    privacyError: boolean;
    allowComments: boolean;
    setAllowComments: (val: boolean) => void;
    allowDuet: boolean;
    setAllowDuet: (val: boolean) => void;
    allowStitch: boolean;
    setAllowStitch: (val: boolean) => void;
    isCommercialContent: boolean;
    setIsCommercialContent: (val: boolean) => void;
    isYourOwnBrand: boolean;
    setIsYourOwnBrand: (val: boolean) => void;
    isBrandedContent: boolean;
    setIsBrandedContent: (val: boolean) => void;
    commercialContentError: boolean;
}


// Function export components primarily for different settings/option when posting to TikTok API
export function TikTokSettings({queryInfo, privacyLevel, isPhotoPost, setPrivacyLevel, privacyError, allowComments,
    setAllowComments, allowDuet, setAllowDuet, allowStitch, setAllowStitch, isCommercialContent, setIsCommercialContent,
    isYourOwnBrand, setIsYourOwnBrand, isBrandedContent, setIsBrandedContent, commercialContentError}: TikTokSettingsDetails): React.JSX.Element{

    return(
        <>
        
            {/** Added for Mainly TikTok Settings */}
            {/** Copy this if you wish to have a section mainly for setting up Posts for your API and change the fields */}
            <div className= {`cp-card ${privacyError ? "cp-card-error" : ""}`}>
                <div className="cp-section-title">TikTok Settings</div>
                <div className="cp-section-sub">Enter information to allow posting in TikTok</div>

                <div className="cp-schedule-row">
                    <div className="cp-field">
                    <label>Privacy Settings<span className="required">*</span></label>
                    <select value = {privacyLevel} onChange = {(e) => setPrivacyLevel(e.target.value)}>
                        <option value = "" disabled>Select Privacy Level</option>
                        {queryInfo?.privacy_level_options.map(pLevel => (
                        <option key={pLevel} value={pLevel} disabled = {isBrandedContent && pLevel == "SELF_ONLY"}>
                            {pLevel}{isBrandedContent && pLevel == "SELF_ONLY" ? " (not available for branded content)" : ""}</option>))}
                    </select>
                    </div>

                    <div className="cp-field">

                    <label>Allow Users To</label>


                    <div className = "cp-field-checkbox">

                        <label className = "cp-checkbox">

                            <input type = "checkbox" checked = {allowComments} disabled = {queryInfo?.comment_disabled} 
                                    onChange = {(e) => setAllowComments(e.target.checked)}>
                            </input>
                            <div>

                                <span className = "cp-checkmark-label">Allow Comments</span>
                                {queryInfo?.comment_disabled && (<span className = "cp-privacy-notice">Comments are disabled in your account.</span>)}
                            </div>

                        </label>

                        {/** Only show if media is not a photo */}
                        {!isPhotoPost && (

                            <>
                                <label className = "cp-checkbox">

                                    <input type = "checkbox" checked = {allowDuet} disabled = {queryInfo?.duet_disabled} 
                                            onChange = {(e) => setAllowDuet(e.target.checked)}>
                                    </input>


                                    <div>

                                        <span className = "cp-checkmark-label">Allow Duets</span>
                                        {queryInfo?.duet_disabled && (<span className = "cp-privacy-notice">Duets are disabled in your account.</span>)}
                                    </div>

                                </label>

                                <label className = "cp-checkbox">

                                    <input type = "checkbox" checked = {allowStitch} disabled = {queryInfo?.stitch_disabled} 
                                            onChange = {(e) => setAllowStitch(e.target.checked)}>
                                    </input>
                                    <div>

                                        <span className = "cp-checkmark-label">Allow Stitch</span>
                                        {queryInfo?.stitch_disabled && (<span className = "cp-privacy-notice">Stitches are disabled in your account.</span>)}
                                    </div>

                                </label>                        
                                        
                            </>

                        )}


                    </div>

                    </div>

                </div>

                <div className={`cp-card ${commercialContentError ? "cp-card-error" : ""}`}>
                    <div className="cp-section-title">TikTok Commercial Content</div>
                    <div className="cp-section-sub">Disclose whether content promotes a product or service</div>



                    <label className = "cp-commercial-checkbox">

                        <span className = "cp-checkmark-commercial-label">Disclose Video for Commercial Content</span>
                        <input type = "checkbox" checked = {isCommercialContent} 
                            onChange = {(e) => {

                                setIsCommercialContent(e.target.checked); // Toggle Commercial Content
                                if (!e.target.checked) { // If commercial content is not checked, set brand states to false

                                    setIsYourOwnBrand(false);
                                    setIsBrandedContent(false);

                                }

                            }}
                        ></input>

                    </label>


                    {isCommercialContent && (

                        <>
                        
                            <div className = "cp-commercial-checkbox-options-holder">

                                <div className = "cp-commercial-checkbox-options">

                                    <label className = "cp-commercial-checkbox">

                                        <span className = "cp-checkmark-commercial-options-label">Promote Your Brand</span>
                                        <input type = "checkbox" checked = {isYourOwnBrand} 
                                            onChange = {(e) => setIsYourOwnBrand(e.target.checked) } // Toggle Own Brand
                                        ></input>

                                    </label>


                                    <span className = "cp-section-commercial-sub">By selecting this option, you are promoting your own brand or business. 
                                            This video will be classified as <b>Branded Organic</b>.</span>

                                </div>


                                <div className = "cp-commercial-checkbox-options">

                                    <label className = "cp-commercial-checkbox">

                                        <span className = "cp-checkmark-commercial-options-label">Promote Branded Content</span>
                                        <input type = "checkbox" checked = {isBrandedContent} 
                                            onChange = {(e) => setIsBrandedContent(e.target.checked)} // Toggle Brand Content
                                        ></input>
                                    
                                    </label>

                                    <span className = "cp-section-commercial-sub">By selecting this option, you are promoting another brand or third party. 
                                        This video will be classified as <b>Branded Content</b>.</span>

                                </div>


                            </div>




                            {/** Display notice for promotion */}
                            {(isYourOwnBrand || isBrandedContent) && (

                                <div className = "cp-section-commercial-notice">
                                    {isBrandedContent ? "Your photo/video will be labeled as 'Paid partnership'."
                                    : "Your photo/video will be labeled as 'Promotional content'."} 
                                    <br></br> This cannot be changed once your video has been posted.
                                </div>

                            )}


                            {/** Display error */}
                            {commercialContentError && (

                                <div className = "cp-privacy-notice">
                                    You need to indicate if your content promotes yourself, a third party, or both.
                                </div>

                            )}
                        
                        
                        </>

                    )}
                    

                </div>
            

            </div>
        
        </>
    );
}
