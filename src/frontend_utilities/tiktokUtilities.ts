import type { socialAccountInfo } from "../types/account.ts";
import type { UserQueryInfo } from "../types/tiktok.ts";


// Functions gets info from parameter and merges all tiktok accounts together into one queryinfo.
// Returns mergedinfos, options for the merged accounts, and the minimum video time limit
export function getMergedTikTokQueryInfo(selectedAccounts: string[], accounts: socialAccountInfo[], 
                                    getSpecificQueryInfo: (id: string) => UserQueryInfo | null): UserQueryInfo | null{

const selectedTikTokAcconts = selectedAccounts.filter(id => accounts.find(acc => acc.id == id && acc.platform == "tiktok"))

if(selectedTikTokAcconts.length <= 0)
    return null;


const queryInfos: UserQueryInfo[] = selectedTikTokAcconts.map(id => getSpecificQueryInfo(id)).filter((q): q is UserQueryInfo => q != null);

if(queryInfos.length <= 0)
    return null;


return{

    ...queryInfos[0],

    // For any account disable if there is any restriction on it are not
    // For max video post duration, get the one with the least max post duration amount
    privacy_level_options: queryInfos.reduce((commonLevels, info) => commonLevels.filter((level: string) => info.privacy_level_options.includes(level)), queryInfos[0].privacy_level_options),
    comment_disabled: queryInfos.some(q => q.comment_disabled) ?? queryInfos[0].comment_disabled,
    duet_disabled: queryInfos.some(q => q.duet_disabled) ?? queryInfos[0].duet_disabled,
    stitch_disabled: queryInfos.some(q => q.stitch_disabled) ?? queryInfos[0].stitch_disabled,
    max_video_post_duration_sec: Math.min(...queryInfos.map(q => q.max_video_post_duration_sec)) ?? queryInfos[0].max_video_post_duration_sec,

}


}