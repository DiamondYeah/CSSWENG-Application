import React from "react"
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok } from "react-icons/fa6"

// Import types
import {type Platform} from "../types/account.ts"


interface IconProps {
  size?: number;
  color?: string;
}

const FacebookIcon = ({ size = 16, color = "currentColor" }: IconProps) => (
  <FaFacebookF size={size} color={color} />
);


const InstagramIcon = ({ size = 16, color = "currentColor" }: IconProps) => (
  <FaInstagram size={size} color={color} />
);


const LinkedinIcon = ({ size = 16, color = "currentColor" }: IconProps) => (
  <FaLinkedinIn size={size} color={color} />
);


const TiktokIcon = ({ size = 16, color = "currentColor" }: IconProps) => (
  <FaTiktok size={size} color={color} />
);


export const PLATFORM_META: Record<Platform, { Icon: React.ComponentType<IconProps>; color: string }> = {
  facebook: { Icon: FacebookIcon, color: "#1877F2" },
  linkedin: { Icon: LinkedinIcon, color: "#0A66C2" },
  instagram: { Icon: InstagramIcon, color: "#E1306C" },
  tiktok: { Icon: TiktokIcon, color: "#000000" },
};
