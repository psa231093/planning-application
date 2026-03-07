export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TASK_STATUSES = [
  "unscheduled",
  "pending",
  "in_progress",
  "completed",
  "overdue",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const GOAL_STATUSES = ["active", "completed", "archived"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "text-blue-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

export const PRIORITY_BG_COLORS: Record<Priority, string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  unscheduled: "bg-gray-100 text-gray-700",
  pending: "bg-blue-100 text-blue-700",
  in_progress: "bg-violet-100 text-violet-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

export const DEFAULT_CATEGORIES = [
  { name: "Work", color: "#8B5CF6" },
  { name: "Personal", color: "#3B82F6" },
  { name: "Health", color: "#10B981" },
  { name: "Learning", color: "#F59E0B" },
] as const;

export const NAV_ITEMS = [
  { label: "Register", href: "/register", icon: "Inbox" },
  { label: "Agenda", href: "/agenda", icon: "Calendar" },
  { label: "Dashboard", href: "/dashboard", icon: "BarChart3" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;
