export type Platform = "facebook" | "linkedin" | "instagram" | "tiktok";

// Interface for Account mainly for calendar
export interface Account {
  id: string;
  name: string;
  platform: Platform;
}

// Interface for social account info. Mainly used for hook in containing information to various APIs
export interface socialAccountInfo{

    id: string,
    name: string,
    handle: string,
    avatarUrl?: string,
    platform: string

}
