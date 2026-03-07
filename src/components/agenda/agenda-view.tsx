"use client";

import { useState, useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  isToday,
  isSameDay,
} from "date-fns";
import { useTasks } from "@/hooks/use-tasks";
import { CalendarView } from "./calendar-view";
import { TodayFocusPanel } from "./today-focus-panel";
import { QuickAddRegister } from "./quick-add-register";
import { TaskFormDialog } from "@/components/register/task-form-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/types/database";

type Task = Tables<"tasks"> & {
  categories?: Tables<"categories"> | null;
};

export function AgendaView() {
  const { data: tasks, isLoading } = useTasks({
    status: ["pending", "in_progress", "completed", "overdue"],
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const scheduledTasks = useMemo(
    () => tasks?.filter((t) => t.scheduled_start) ?? [],
    [tasks]
  );

  const todayTasks = useMemo(
    () =>
      scheduledTasks.filter(
        (t) => t.scheduled_start && isToday(new Date(t.scheduled_start))
      ),
    [scheduledTasks]
  );

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[300px] w-full rounded-lg sm:h-[500px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        <CalendarView
          tasks={scheduledTasks}
          onTaskClick={handleTaskClick}
        />
        <div className="space-y-4">
          <TodayFocusPanel tasks={todayTasks} />
          <QuickAddRegister />
        </div>
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        task={editingTask}
      />
    </div>
  );
}
