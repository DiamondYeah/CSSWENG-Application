import type { Account, Post } from "../pages/Calendar";

// Sample accounts across all 4 supported platforms
export const SAMPLE_ACCOUNTS: Account[] = [
  { id: "acc-1", name: "AgilaPost Official", platform: "facebook" },
  { id: "acc-2", name: "agilapost.demo", platform: "instagram" },
  { id: "acc-3", name: "AgilaPost Inc.", platform: "linkedin" },
  { id: "acc-4", name: "@agilapost", platform: "tiktok" },
];

// Helper to get YYYY-MM-DD strings relative to today, so posts always land
// on visible days no matter when you open the calendar
function dateOffset(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split("T")[0];
}

// Sample posts spread across this month, various platforms and states
export const SAMPLE_POSTS: Post[] = [
  {
    id: "post-1",
    accountId: "acc-1",
    platform: "facebook",
    date: dateOffset(-2),
    time: "09:00 AM",
    title: "Behind the scenes at our studio",
    snippet: "Take a look at how we prep every shoot before going live...",
    hasImage: true,
    hasComment: true,
  },
  {
    id: "post-2",
    accountId: "acc-2",
    platform: "instagram",
    date: dateOffset(0),
    time: "12:30 PM",
    title: "New product drop 🎉",
    snippet: "Our summer collection just landed — swipe to see all colors.",
    hasImage: true,
  },
  {
    id: "post-3",
    accountId: "acc-3",
    platform: "linkedin",
    date: dateOffset(0),
    time: "08:00 AM",
    title: "Hiring: Senior Frontend Engineer",
    snippet: "We're growing the team — check out the full job posting.",
    hasDocument: true,
  },
  {
    id: "post-4",
    accountId: "acc-4",
    platform: "tiktok",
    date: dateOffset(1),
    time: "06:00 PM",
    title: "Day in the life of our dev team",
    snippet: "A quick look at how AgilaPost gets built, one bug at a time.",
    hasImage: true,
    hasComment: true,
  },
  {
    id: "post-5",
    accountId: "acc-1",
    platform: "facebook",
    date: dateOffset(3),
    time: "03:15 PM",
    title: "Weekend flash sale",
    snippet: "20% off everything, this weekend only.",
  },
  {
    id: "post-6",
    accountId: "acc-2",
    platform: "instagram",
    date: dateOffset(5),
    time: "11:00 AM",
    title: "Client spotlight",
    snippet: "Shoutout to one of our favorite partners this month!",
    hasImage: true,
  },
  {
    id: "post-7",
    accountId: "acc-4",
    platform: "tiktok",
    date: dateOffset(-5),
    time: "07:45 PM",
    title: "Quick tutorial: scheduling made easy",
    snippet: "Here's how to schedule a week of content in under 5 minutes.",
    hasComment: true,
  },
  {
    id: "post-8",
    accountId: "acc-3",
    platform: "linkedin",
    date: dateOffset(7),
    time: "10:00 AM",
    title: "Case study: 3x engagement in 30 days",
    snippet: "Here's exactly how one of our clients grew their reach.",
    hasDocument: true,
  },
];
