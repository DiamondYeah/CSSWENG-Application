import React from "react"

// Import types
import {type Platform} from "../types/account.ts"


interface IconProps {
  size?: number;
  color?: string;
}

const FacebookIcon = ({ size = 16, color = "currentColor" }: IconProps) => (

  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M14 8.5h-1.6c-.6 0-1.1.4-1.1 1.2V11H14l-.3 2.2h-2.4V19H9V13.2H7.2V11H9V9.4C9 7 10.4 5 12.8 5H14v3.5z"
      fill={color}
    />
  </svg>

  );


const InstagramIcon = ({ size = 16, color = "currentColor" }: IconProps) => (

  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="16" rx="5" stroke={color} strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3.4" stroke={color} strokeWidth="1.8" />
    <circle cx="16.5" cy="7.5" r="1" fill={color} />
  </svg>

);


const LinkedinIcon = ({ size = 16, color = "currentColor" }: IconProps) => (

  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <text
      x="12"
      y="16.5"
      textAnchor="middle"
      fontSize="11"
      fontWeight="700"
      fontFamily="Arial, Helvetica, sans-serif"
      fill={color}
    >
      in
    </text>
  </svg>

);


const TiktokIcon = ({ size = 16, color = "currentColor" }: IconProps) => (

  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="17" r="3" fill={color} />
    <path d="M12 4v13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path
      d="M12 4c0 3 2.5 5 5 5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>

);


export const PLATFORM_META: Record<Platform, { Icon: React.ComponentType<IconProps>; color: string }> = {
  facebook: { Icon: FacebookIcon, color: "#1877F2" },
  linkedin: { Icon: LinkedinIcon, color: "#0A66C2" },
  instagram: { Icon: InstagramIcon, color: "#E1306C" },
  tiktok: { Icon: TiktokIcon, color: "#000000" },
};