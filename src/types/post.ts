// Import type from other type files
import { type Platform } from "./account";
import { type PostMediaStatus} from "./tiktok";


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


}
