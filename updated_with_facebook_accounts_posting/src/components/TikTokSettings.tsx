import type { UserQueryInfo } from "../hooks/userQueryInfo";


// Interface for TikTok Settigns
interface TikTokSettingsDetails{

    queryInfo: UserQueryInfo | null;
    privacyLevel: string;
    setPrivacyLevel: (val: string) => void;
    privacyError: boolean;
    allowComments: boolean;
    setAllowComments: (val: boolean) => void;
    allowDuet: boolean;
    setAllowDuet: (val: boolean) => void;
    allowStitch: boolean;
    setAllowStitch: (val: boolean) => void;

}


// Function export components primarily for different settings/option when posting to TikTok API
export function TikTokSettings({queryInfo, privacyLevel, setPrivacyLevel, privacyError, allowComments,
    setAllowComments, allowDuet, setAllowDuet, allowStitch, setAllowStitch}: TikTokSettingsDetails): React.JSX.Element{

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
                    {queryInfo?.privacy_level_options.map(privacyLevel => (
                    <option key={privacyLevel} value={privacyLevel}>{privacyLevel}</option>))}
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

                </div>

                </div>

            </div>
        

        </div>
    
    
    </>);
}
