"use client";

import { useState } from "react";
import {
  format,
  addDays,
  startOfToday,
  setHours,
  setMinutes,
  isToday,
  isTomorrow,
} from "date-fns";

import {
  Pencil,
  Trash2,
  CalendarIcon,
  CalendarPlus,
  MoreHorizontal,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import type { Tables } from "@/types/database";
import type { Priority } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";

type Task = Tables<"tasks"> & {
  categories?: Tables<"categories"> | null;
};

interface TaskTableRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  isMobile?: boolean;
}

// Pill badge color maps
const PRIORITY_PILL: Record<string, string> = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function getTimeBlockLabel(dateStr: string): { label: string; className: string } {
  const hour = new Date(dateStr).getHours();
  if (hour < 12)
    return {
      label: "Morning",
      className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    };
  if (hour < 17)
    return {
      label: "Afternoon",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    };
  return {
    label: "Evening",
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  };
}

function getDueDateDisplay(dateStr: string): {
  label: string;
  className: string;
} {
  const d = new Date(dateStr);
  if (isToday(d))
    return {
      label: "Today",
      className:
        "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    };
  if (isTomorrow(d))
    return {
      label: "Tomorrow",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    };
  return {
    label: format(d, "MMM d"),
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };
}

export function TaskTableRow({ task, onEdit, isMobile }: TaskTableRowProps) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [pendingTime, setPendingTime] = useState("09:00");

  const isScheduled = !!task.scheduled_start;

  const handleDelete = () => {
    deleteTask.mutate(task.id);
  };

  const handleDateSelected = (date: Date) => {
    setPendingDate(date);
    setPendingTime("09:00");
  };

  const handleConfirmSchedule = () => {
    if (!pendingDate) return;
    const [hours, minutes] = pendingTime.split(":").map(Number);
    const scheduledStart = setMinutes(setHours(pendingDate, hours), minutes).toISOString();
    const durationMs = (task.estimated_minutes ?? 60) * 60 * 1000;
    const scheduledEnd = new Date(new Date(scheduledStart).getTime() + durationMs).toISOString();
    updateTask.mutate({
      id: task.id,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      status: "pending",
    });
    setPendingDate(null);
    setPendingTime("09:00");
    setScheduleOpen(false);
  };

  const handleSchedulePopoverClose = (open: boolean) => {
    setScheduleOpen(open);
    if (!open) {
      setPendingDate(null);
      setPendingTime("09:00");
    }
  };

  const handleUnschedule = () => {
    updateTask.mutate({
      id: task.id,
      scheduled_start: null,
      scheduled_end: null,
      status: "unscheduled",
    });
  };

  const dueDateInfo = task.scheduled_start
    ? getDueDateDisplay(task.scheduled_start)
    : null;

  const timeBlockInfo = task.scheduled_start
    ? getTimeBlockLabel(task.scheduled_start)
    : null;

  // Shared schedule popover content (reused in both mobile and desktop)
  const schedulePicker = (
    <Popover open={scheduleOpen} onOpenChange={handleSchedulePopoverClose}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground min-h-[36px]">
          <CalendarPlus className="h-3 w-3" />
          <span>Set date</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {pendingDate ? (
          <div className="flex flex-col gap-3 p-4 w-56">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPendingDate(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium">
                {format(pendingDate, "EEE, MMM d")}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Start time</label>
              <input
                type="time"
                value={pendingTime}
                onChange={(e) => setPendingTime(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmSchedule()}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
            <button
              onClick={handleConfirmSchedule}
              className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Schedule
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex flex-col gap-0.5 border-b p-2">
              <button
                onClick={() => handleDateSelected(startOfToday())}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Today
              </button>
              <button
                onClick={() => handleDateSelected(addDays(startOfToday(), 1))}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Tomorrow
              </button>
              <button
                onClick={() => handleDateSelected(addDays(startOfToday(), 7))}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Next week
              </button>
            </div>
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={(date) => {
                if (date) handleDateSelected(date);
              }}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground/50 hover:text-muted-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(task)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {isScheduled && (
          <DropdownMenuItem onClick={handleUnschedule}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Unschedule
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Mobile card layout
  if (isMobile) {
    return (
      <div className="border-b px-4 py-3 transition-colors hover:bg-muted/20">
        {/* Row 1: title + actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(task)}
            className="min-h-[44px] flex-1 text-left flex items-center min-w-0"
          >
            <p className="truncate text-sm font-medium">{task.title}</p>
          </button>
          {actionsMenu}
        </div>

        {/* Row 2: date, time block, priority badges */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {dueDateInfo ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                dueDateInfo.className
              )}
            >
              {dueDateInfo.label}
              {task.is_recurring && " ↻"}
            </span>
          ) : (
            schedulePicker
          )}
          {timeBlockInfo && (
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                timeBlockInfo.className
              )}
            >
              {timeBlockInfo.label}
            </span>
          )}
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              PRIORITY_PILL[task.priority] ?? PRIORITY_PILL.medium
            )}
          >
            {PRIORITY_LABEL[task.priority] ?? "Medium"}
          </span>
          {task.categories && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${task.categories.color}18`,
                color: task.categories.color,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: task.categories.color }}
              />
              {task.categories.name}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Desktop table row
  return (
    <div
      className="group grid grid-cols-[minmax(0,1fr)_120px_90px_120px_90px_40px] items-center gap-2 border-b px-6 py-2 transition-colors hover:bg-muted/20"
    >
      {/* Task name column */}
      <div className="flex items-center">
        <button
          onClick={() => onEdit(task)}
          className="min-w-0 text-left"
        >
          <p className="truncate text-sm">{task.title}</p>
        </button>
      </div>

      {/* Due date column */}
      <div>
        {dueDateInfo ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
              dueDateInfo.className
            )}
          >
            {dueDateInfo.label}
            {task.is_recurring && " \u21BB"}
          </span>
        ) : (
          schedulePicker
        )}
      </div>

      {/* Time block column */}
      <div>
        {timeBlockInfo ? (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
              timeBlockInfo.className
            )}
          >
            {timeBlockInfo.label}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/30">&mdash;</span>
        )}
      </div>

      {/* Category column */}
      <div>
        {task.categories ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${task.categories.color}18`,
              color: task.categories.color,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: task.categories.color }}
            />
            {task.categories.name}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/30">&mdash;</span>
        )}
      </div>

      {/* Priority column */}
      <div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
            PRIORITY_PILL[task.priority] ?? PRIORITY_PILL.medium
          )}
        >
          {PRIORITY_LABEL[task.priority] ?? "Medium"}
        </span>
      </div>

      {/* Actions column */}
      <div>
        {actionsMenu}
      </div>
    </div>
  );
}
