
export type PostMediaStatus = "pending" | "processing" | "failed" | "expired" | "published"


// Interface for user query info. Used to store types on information regarding user query information fetched from API.
export interface UserQueryInfo{

    comment_disabled: boolean,
    duet_disabled: boolean,
    stitch_disabled: boolean,
    max_video_post_duration_sec: number,
    creator_avatar_url: string,
    creator_nickname: string,
    creator_username: string,
    privacy_level_options: string[]

}
