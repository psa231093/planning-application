"use client";

import {
  format,
  formatDistanceToNow,
  isPast,
  isWithinInterval,
  addDays,
  startOfToday,
} from "date-fns";
import {
  Briefcase,
  User,
  TrendingUp,
  Heart,
  Dumbbell,
  BookOpen,
  Star,
  Calendar,
  CheckSquare,
  Target,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goal } from "@/lib/mock-store";

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  professional: { label: "Professional", icon: Briefcase },
  personal: { label: "Personal", icon: User },
  financial: { label: "Financial", icon: TrendingUp },
  health: { label: "Health", icon: Heart },
  fitness: { label: "Fitness", icon: Dumbbell },
  learning: { label: "Learning", icon: BookOpen },
  other: { label: "Other", icon: Star },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  low: { label: "Low", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500" },
  medium: { label: "Medium", bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-600 dark:text-blue-400" },
  high: { label: "High", bg: "bg-orange-50 dark:bg-orange-950", text: "text-orange-600 dark:text-orange-400" },
  urgent: { label: "Urgent", bg: "bg-red-50 dark:bg-red-950", text: "text-red-600 dark:text-red-400" },
};

const STATUS_CONFIG: Record<string, { label: string; dotClass: string }> = {
  active: { label: "Active", dotClass: "bg-emerald-500" },
  paused: { label: "Paused", dotClass: "bg-amber-500" },
  completed: { label: "Completed", dotClass: "bg-violet-500" },
};

function ProgressRing({
  progress,
  color,
  size = 56,
}: {
  progress: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted/30"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-[10px] font-bold tabular-nums leading-none"
          style={{ color }}
        >
          {progress}%
        </span>
      </div>
    </div>
  );
}

function getDateStatus(targetDate: string | null) {
  if (!targetDate) return null;
  const date = new Date(targetDate);
  const today = startOfToday();
  if (isPast(date) && date < today) {
    return { text: "Overdue", className: "text-red-500" };
  }
  if (isWithinInterval(date, { start: today, end: addDays(today, 30) })) {
    return {
      text: formatDistanceToNow(date, { addSuffix: true }),
      className: "text-amber-500",
    };
  }
  return { text: format(date, "MMM d, yyyy"), className: "text-muted-foreground" };
}

interface GoalCardProps {
  goal: Goal;
  taskCount: number;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

export function GoalCard({ goal, taskCount, onClick, onEdit }: GoalCardProps) {
  const catConfig = CATEGORY_CONFIG[goal.category] ?? CATEGORY_CONFIG.other;
  const CatIcon = catConfig.icon;
  const priorityConfig = PRIORITY_CONFIG[goal.priority] ?? PRIORITY_CONFIG.medium;
  const statusConfig = STATUS_CONFIG[goal.status] ?? { label: goal.status, dotClass: "bg-muted-foreground" };
  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const totalMilestones = goal.milestones.length;
  const dateStatus = getDateStatus(goal.target_date);

  return (
    <div
      className={cn(
        "relative bg-card rounded-xl border cursor-pointer",
        "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        "group overflow-hidden",
        goal.status === "completed" && "opacity-70"
      )}
      style={{ borderLeftWidth: "3px", borderLeftColor: goal.color }}
      onClick={onClick}
    >
      {/* Edit button — revealed on hover */}
      <button
        className={cn(
          "absolute top-3 right-3 z-10 p-1.5 rounded-md",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
        onClick={onEdit}
        title="Edit goal"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <div className="p-5">
        {/* Top row: meta + ring */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {/* Category + status */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CatIcon className="h-3 w-3 shrink-0" />
                <span>{catConfig.label}</span>
              </div>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <div className="flex items-center gap-1">
                <span
                  className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusConfig.dotClass)}
                />
                <span className="text-xs text-muted-foreground">{statusConfig.label}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 pr-7">
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {goal.description}
              </p>
            )}
          </div>

          {/* Progress ring */}
          <ProgressRing progress={goal.progress} color={goal.color} size={56} />
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${goal.progress}%`,
                backgroundColor: goal.color,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            {/* Priority badge */}
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                priorityConfig.bg,
                priorityConfig.text
              )}
            >
              {priorityConfig.label}
            </span>

            {/* Milestones */}
            {totalMilestones > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckSquare className="h-3 w-3 shrink-0" />
                <span>
                  {completedMilestones}/{totalMilestones}
                </span>
              </div>
            )}

            {/* Tasks */}
            {taskCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="h-3 w-3 shrink-0" />
                <span>{taskCount}</span>
              </div>
            )}
          </div>

          {/* Date */}
          {dateStatus && (
            <div className={cn("flex items-center gap-1 text-xs", dateStatus.className)}>
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{dateStatus.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
