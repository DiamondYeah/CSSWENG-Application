// Import type from other type files
import { type Platform } from "./account";
import { type PostMediaStatus} from "./tiktok";

// Approval state for the shared-calendar review flow. "pending" means no
// decision has been made yet by whoever the calendar was shared with.
export type PostApprovalStatus = "pending" | "approved" | "rejected";

export interface PostComment {
  id: string;
  text: string;
  createdAt: string; // ISO timestamp
}

// Interface for SchedulePost. Used for storing/showing date and time for post infromation
export interface ScheduledPost {

  id: string;
  accountId: string;
  platform: Platform;
  date: string;
  time: string;
  title?: string;
  snippet?: string;
  hasComment?: boolean;
  status?: PostMediaStatus;

  // Shared-calendar approval fields — set by whoever the calendar link was shared with.
  approvalStatus?: PostApprovalStatus;
  rejectionReason?: string; // only meaningful when approvalStatus === "rejected"; may be empty per spec
  comments?: PostComment[];


}
