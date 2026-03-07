"use client";

import { format } from "date-fns";
import { CheckCircle2, Circle, Clock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskPriorityIcon } from "@/components/shared/task-priority-icon";
import { CategoryBadge } from "@/components/shared/category-badge";
import { useUpdateTask } from "@/hooks/use-tasks";
import type { Tables } from "@/types/database";
import type { Priority } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";

type Task = Tables<"tasks"> & {
  categories?: Tables<"categories"> | null;
};

interface TodayFocusPanelProps {
  tasks: Task[];
}

export function TodayFocusPanel({ tasks }: TodayFocusPanelProps) {
  const updateTask = useUpdateTask();

  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const topTasks = [...tasks]
    .sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
    )
    .slice(0, 3);

  const handleToggle = (task: Task) => {
    const isCompleted = task.status === "completed";
    updateTask.mutate({
      id: task.id,
      status: isCompleted ? "pending" : "completed",
      completed_at: isCompleted ? null : new Date().toISOString(),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Today&apos;s Focus
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks scheduled for today.
          </p>
        ) : (
          <div className="space-y-2">
            {topTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleToggle(task)}
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </Button>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      task.status === "completed" &&
                        "text-muted-foreground line-through"
                    )}
                  >
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {task.scheduled_start && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(task.scheduled_start), "h:mm a")}
                      </span>
                    )}
                    {task.estimated_minutes && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {task.estimated_minutes}m
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {task.categories && (
                    <CategoryBadge
                      name={task.categories.name}
                      color={task.categories.color}
                    />
                  )}
                  <TaskPriorityIcon priority={task.priority as Priority} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
