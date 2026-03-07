"use client";

import { useState, useMemo } from "react";
import { isBefore, startOfToday } from "date-fns";
import { useTasks } from "@/hooks/use-tasks";
import { QuickAddInput } from "./quick-add-input";
import { TaskTableRow } from "./task-list-item";
import { TaskSection } from "./task-list";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskFilters } from "./task-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";
import type { Tables } from "@/types/database";

type Task = Tables<"tasks"> & {
  categories?: Tables<"categories"> | null;
};

interface TaskGroup {
  id: string;
  label: string;
  tasks: Task[];
  color: string;
}

export function RegisterView() {
  const { data: allTasks, isLoading } = useTasks({
    status: ["unscheduled", "pending", "in_progress"],
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];
    return allTasks.filter((task) => {
      if (priorityFilter !== "all" && task.priority !== priorityFilter)
        return false;
      if (categoryFilter !== "all" && task.category_id !== categoryFilter)
        return false;
      return true;
    });
  }, [allTasks, priorityFilter, categoryFilter]);

  // Register only shows what needs action: unscheduled (inbox) and overdue
  const groups: TaskGroup[] = useMemo(() => {
    const inbox: Task[] = [];
    const overdue: Task[] = [];

    for (const task of filteredTasks) {
      if (!task.scheduled_start) {
        inbox.push(task);
      } else if (isBefore(new Date(task.scheduled_start), startOfToday())) {
        overdue.push(task);
      }
      // Today/tomorrow/upcoming are handled in Agenda
    }

    overdue.sort(
      (a, b) =>
        new Date(a.scheduled_start!).getTime() -
        new Date(b.scheduled_start!).getTime()
    );

    const sections: TaskGroup[] = [];
    if (inbox.length > 0)
      sections.push({ id: "inbox", label: "Inbox", tasks: inbox, color: "#6B7280" });
    if (overdue.length > 0)
      sections.push({ id: "overdue", label: "Overdue", tasks: overdue, color: "#EF4444" });

    return sections;
  }, [filteredTasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTask(null);
  };

  const clearFilters = () => {
    setPriorityFilter("all");
    setCategoryFilter("all");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="border-b bg-background px-6 py-4">
        <QuickAddInput />
        <div className="mt-3">
          <TaskFilters
            priorityFilter={priorityFilter}
            categoryFilter={categoryFilter}
            onPriorityChange={setPriorityFilter}
            onCategoryChange={setCategoryFilter}
            onClear={clearFilters}
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {/* Column headers */}
        <div className="sticky top-0 z-10 border-b bg-muted/50 backdrop-blur-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_120px_90px_120px_90px_40px] items-center gap-2 px-6 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Task name</span>
            <span>Due date</span>
            <span>Time block</span>
            <span>Category</span>
            <span>Priority</span>
            <span></span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-0 px-6 pt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-none border-b" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">All caught up</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Everything has been scheduled. Head to Agenda to see your plan.
            </p>
          </div>
        ) : (
          <div className="pb-8">
            {groups.map((group) => (
              <TaskSection
                key={group.id}
                label={group.label}
                color={group.color}
                count={group.tasks.length}
                isInbox={group.id === "inbox"}
              >
                {group.tasks.map((task) => (
                  <TaskTableRow
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                  />
                ))}
              </TaskSection>
            ))}
          </div>
        )}
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        task={editingTask}
      />
    </div>
  );
}
