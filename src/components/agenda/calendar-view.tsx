"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  isTomorrow,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Play, Square, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryBadge } from "@/components/shared/category-badge";
import { TaskPriorityIcon } from "@/components/shared/task-priority-icon";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useTimer, formatElapsed } from "@/hooks/use-timer";
import { useIsMobile, useIsTablet, useIsTabletLandscape } from "@/hooks/use-mobile";
import type { Tables } from "@/types/database";
import type { Priority } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";
import { expandRecurringTasks, baseTaskId } from "@/lib/utils/recurrence";

type Task = Tables<"tasks"> & {
  categories?: Tables<"categories"> | null;
};

type CalendarViewType = "day" | "week" | "month" | "list";

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewType>("week");
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isTabletLandscape = useIsTabletLandscape();

  // On mobile, week/month views are replaced with day view
  const effectiveView: CalendarViewType =
    isMobile && (view === "week" || view === "month") ? "day" : view;

  // Wrap onTaskClick so virtual recurring instances open their parent task
  const handleTaskClick = useMemo(() => {
    if (!onTaskClick) return undefined;
    return (task: Task) => {
      const pid = baseTaskId(task.id);
      if (pid !== task.id) {
        const parent = tasks.find((t) => t.id === pid);
        if (parent) return onTaskClick(parent);
      }
      onTaskClick(task);
    };
  }, [onTaskClick, tasks]);

  const navigate = (direction: "prev" | "next") => {
    if (effectiveView === "day") {
      setCurrentDate(
        direction === "prev"
          ? subDays(currentDate, 1)
          : addDays(currentDate, 1)
      );
    } else if (effectiveView === "week") {
      setCurrentDate(
        direction === "prev"
          ? subWeeks(currentDate, 1)
          : addWeeks(currentDate, 1)
      );
    } else {
      setCurrentDate(
        direction === "prev"
          ? subMonths(currentDate, 1)
          : addMonths(currentDate, 1)
      );
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const headerLabel = useMemo(() => {
    if (effectiveView === "list") return "All scheduled tasks";
    if (effectiveView === "day")
      return isMobile || isTablet
        ? format(currentDate, "EEE, MMM d, yyyy")
        : format(currentDate, "EEEE, MMMM d, yyyy");
    if (effectiveView === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  }, [currentDate, effectiveView, isMobile, isTablet]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {effectiveView !== "list" && (
            <>
              <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </>
          )}
          <h2 className={cn("text-base font-semibold sm:text-lg", effectiveView !== "list" && "ml-2")}>
            {headerLabel}
          </h2>
        </div>

        <Tabs
          value={effectiveView}
          onValueChange={(v) => setView(v as CalendarViewType)}
        >
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            {!isMobile && <TabsTrigger value="week">Week</TabsTrigger>}
            {!isMobile && <TabsTrigger value="month">Month</TabsTrigger>}
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {effectiveView === "month" && (
        <MonthView
          currentDate={currentDate}
          tasks={tasks}
          onTaskClick={handleTaskClick}
        />
      )}
      {effectiveView === "week" && (
        <WeekView
          currentDate={currentDate}
          tasks={tasks}
          onTaskClick={handleTaskClick}
          isTablet={isTablet || isTabletLandscape}
        />
      )}
      {effectiveView === "day" && (
        <DayView
          currentDate={currentDate}
          tasks={tasks}
          onTaskClick={handleTaskClick}
        />
      )}
      {effectiveView === "list" && (
        <ListView tasks={tasks} onTaskClick={handleTaskClick} />
      )}
    </div>
  );
}

// Shared task row with timer — used in DayView and ListView
function TaskTimerRow({
  task,
  onTaskClick,
  compact = false,
}: {
  task: Task;
  onTaskClick?: (task: Task) => void;
  compact?: boolean;
}) {
  const { isRunning, elapsed, start, stop } = useTimer();
  const updateTask = useUpdateTask();

  const handleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) {
      const secs = stop();
      const mins = Math.max(1, Math.round(secs / 60));
      updateTask.mutate({
        id: task.id,
        actual_minutes: (task.actual_minutes ?? 0) + mins,
      });
    } else {
      start();
    }
  };

  const isCompleted = task.status === "completed";

  return (
    <div
      className={cn(
        "mb-1 flex w-full items-center gap-2 rounded-md text-left",
        compact ? "px-1.5 py-1" : "px-3 py-2",
        isCompleted ? "bg-green-50 text-green-700 dark:bg-green-950/30" : "bg-primary/10 text-foreground hover:bg-primary/15"
      )}
      style={
        task.categories
          ? { borderLeft: `4px solid ${task.categories.color}` }
          : { borderLeft: "4px solid transparent" }
      }
    >
      {/* Clickable title area */}
      <button
        onClick={() => onTaskClick?.(task)}
        className="min-w-0 flex-1 text-left"
      >
        <p className={cn("flex items-center gap-1 truncate text-sm font-medium", isCompleted && "line-through")}>
          {task.is_recurring && (
            <Repeat className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          )}
          {task.title}
        </p>
        <div className="flex items-center gap-2">
          {task.estimated_minutes && (
            <span className="text-xs text-muted-foreground">
              {task.estimated_minutes}m est.
            </span>
          )}
          {task.actual_minutes != null && task.actual_minutes > 0 && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              {task.actual_minutes}m actual
            </span>
          )}
          {isRunning && (
            <span className="text-xs font-mono text-amber-500">
              {formatElapsed(elapsed)}
            </span>
          )}
        </div>
      </button>

      {/* Timer button */}
      {!isCompleted && (
        <button
          onClick={handleTimer}
          title={isRunning ? "Stop timer" : "Start timer"}
          className={cn(
            "shrink-0 rounded p-2.5 transition-colors",
            isRunning
              ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"
          )}
        >
          {isRunning ? (
            <Square className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      <TaskPriorityIcon priority={task.priority as Priority} />
      {task.categories && !compact && (
        <CategoryBadge name={task.categories.name} color={task.categories.color} />
      )}
    </div>
  );
}

function MonthView({
  currentDate,
  tasks,
  onTaskClick,
}: {
  currentDate: Date;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const tasksByDay = useMemo(() => {
    const expanded = expandRecurringTasks(tasks, calStart, calEnd);
    const map = new Map<string, Task[]>();
    expanded.forEach((task) => {
      if (task.scheduled_start) {
        const key = format(new Date(task.scheduled_start), "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(task);
      }
    });
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, calStart.toISOString()]);

  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-7 border-b">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={key}
              className={cn(
                "min-h-[100px] border-b border-r p-1.5",
                !isCurrentMonth && "bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday(day) && "bg-primary text-primary-foreground font-semibold",
                  !isCurrentMonth && "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className={cn(
                      "block w-full truncate rounded px-1.5 py-0.5 text-left text-xs",
                      task.status === "completed"
                        ? "bg-green-100 text-green-700 line-through"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    style={
                      task.categories
                        ? {
                            borderLeft: `3px solid ${task.categories.color}`,
                          }
                        : undefined
                    }
                  >
                    <span className="flex items-center gap-1">
                      {task.is_recurring && (
                        <Repeat className="h-2.5 w-2.5 shrink-0 opacity-70" />
                      )}
                      {task.title}
                    </span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="block px-1.5 text-xs text-muted-foreground">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  tasks,
  onTaskClick,
  isTablet = false,
}: {
  currentDate: Date;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  isTablet?: boolean;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const expandedTasks = useMemo(
    () => expandRecurringTasks(tasks, weekStart, weekEnd),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, weekStart.toISOString()]
  );

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm

  const getTasksForDayHour = (day: Date, hour: number) => {
    return expandedTasks.filter((task) => {
      if (!task.scheduled_start) return false;
      const start = new Date(task.scheduled_start);
      return isSameDay(start, day) && start.getHours() === hour;
    });
  };

  const getDayCapacity = (day: Date) => {
    const total = expandedTasks
      .filter((t) => t.scheduled_start && isSameDay(new Date(t.scheduled_start), day))
      .reduce((sum, t) => sum + (t.estimated_minutes ?? 0), 0);
    return total;
  };

  const formatCapacity = (mins: number) => {
    if (mins === 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  };

  const capacityColor = (mins: number) => {
    if (mins <= 360) return "text-emerald-600 dark:text-emerald-400";
    if (mins <= 480) return "text-amber-500 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
  };

  return (
    <div className="rounded-lg border overflow-auto">
      <div className={cn("grid border-b sticky top-0 bg-background z-10", isTablet ? "grid-cols-[44px_repeat(7,1fr)]" : "grid-cols-[60px_repeat(7,1fr)]")}>
        <div className="p-2" />
        {days.map((day) => {
          const cap = getDayCapacity(day);
          const capLabel = formatCapacity(cap);
          return (
          <div
            key={day.toISOString()}
            className={cn(
              "p-2 text-center border-l",
              isToday(day) && "bg-primary/5"
            )}
          >
            <div className="text-xs text-muted-foreground">
              {format(day, "EEE")}
            </div>
            <div
              className={cn(
                "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                isToday(day) && "bg-primary text-primary-foreground"
              )}
            >
              {format(day, "d")}
            </div>
            {capLabel && (
              <div className={cn("mt-0.5 text-[10px] font-medium", capacityColor(cap))}>
                {capLabel}
              </div>
            )}
          </div>
          );
        })}
      </div>
      <div className={cn("grid", isTablet ? "grid-cols-[44px_repeat(7,1fr)]" : "grid-cols-[60px_repeat(7,1fr)]")}>
        {hours.map((hour) => (
          <div key={hour} className="contents">
            <div className="border-b p-1.5 text-right text-xs text-muted-foreground">
              {format(new Date().setHours(hour, 0), "h a")}
            </div>
            {days.map((day) => {
              const hourTasks = getTasksForDayHour(day, hour);
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className={cn(
                    "min-h-[48px] border-b border-l p-0.5",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  {hourTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className={cn(
                        "mb-0.5 block w-full truncate rounded px-1.5 py-1 text-left text-xs font-medium",
                        task.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-primary/15 text-primary hover:bg-primary/25"
                      )}
                      style={
                        task.categories
                          ? {
                              borderLeft: `3px solid ${task.categories.color}`,
                            }
                          : undefined
                      }
                    >
                      <span className="flex items-center gap-1">
                        {task.is_recurring && (
                          <Repeat className="h-2.5 w-2.5 shrink-0 opacity-70" />
                        )}
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayView({
  currentDate,
  tasks,
  onTaskClick,
}: {
  currentDate: Date;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}) {
  const dayStart = startOfDay(currentDate);
  const dayEnd = endOfDay(currentDate);

  const expandedTasks = useMemo(
    () => expandRecurringTasks(tasks, dayStart, dayEnd),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, dayStart.toISOString()]
  );

  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6am to 9pm

  const getTasksForHour = (hour: number) => {
    return expandedTasks.filter((task) => {
      if (!task.scheduled_start) return false;
      const start = new Date(task.scheduled_start);
      return isSameDay(start, currentDate) && start.getHours() === hour;
    });
  };

  const dayTasks = expandedTasks.filter(
    (t) => t.scheduled_start && isSameDay(new Date(t.scheduled_start), currentDate)
  );
  const totalMins = dayTasks.reduce((sum, t) => sum + (t.estimated_minutes ?? 0), 0);
  const formatMins = (m: number) => {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return h > 0 ? (rem > 0 ? `${h}h ${rem}m` : `${h}h`) : `${m}m`;
  };
  const capColor =
    totalMins <= 360
      ? "text-emerald-600 dark:text-emerald-400"
      : totalMins <= 480
      ? "text-amber-500 dark:text-amber-400"
      : "text-red-500 dark:text-red-400";

  return (
    <div className="rounded-lg border">
      {totalMins > 0 && (
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <span className="text-xs text-muted-foreground">
            {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
          </span>
          <span className={cn("text-xs font-medium", capColor)}>
            · {formatMins(totalMins)} planned
          </span>
        </div>
      )}
      <div className="grid grid-cols-[56px_1fr] sm:grid-cols-[80px_1fr]">
        {hours.map((hour) => {
          const hourTasks = getTasksForHour(hour);
          return (
            <div key={hour} className="contents">
              <div className="border-b border-r p-1.5 text-right text-[10px] text-muted-foreground sm:p-2 sm:text-xs">
                {format(new Date().setHours(hour, 0), "h a")}
              </div>
              <div className="min-h-[56px] border-b p-1">
                {hourTasks.map((task) => (
                  <TaskTimerRow
                    key={task.id}
                    task={task}
                    onTaskClick={onTaskClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}) {
  const listEnd = useMemo(() => addDays(new Date(), 90), []);

  const grouped = useMemo(() => {
    // Expand recurring tasks over the next 90 days + any past tasks
    const pastStart = addDays(new Date(), -365);
    const allExpanded = expandRecurringTasks(tasks, pastStart, listEnd);

    const map = new Map<string, Task[]>();
    allExpanded
      .filter((t) => t.scheduled_start)
      .forEach((task) => {
        const key = format(new Date(task.scheduled_start!), "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(task);
      });

    map.forEach((dayTasks) =>
      dayTasks.sort(
        (a, b) =>
          new Date(a.scheduled_start!).getTime() -
          new Date(b.scheduled_start!).getTime()
      )
    );

    const today = format(new Date(), "yyyy-MM-dd");

    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const aIsPast = a < today;
        const bIsPast = b < today;
        if (aIsPast && !bIsPast) return 1;  // past → end
        if (!aIsPast && bIsPast) return -1; // future → start
        return a.localeCompare(b);          // same group: chronological
      })
      .map(([dateStr, dayTasks]) => ({
        date: new Date(dateStr + "T00:00:00"),
        tasks: dayTasks,
        dateStr,
      }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, listEnd]);

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-center">
        <p className="text-sm text-muted-foreground">No scheduled tasks.</p>
      </div>
    );
  }

  return (
    <div className="divide-y overflow-hidden rounded-lg border">
      {grouped.map(({ date, tasks: dayTasks, dateStr }) => {
        const completed = dayTasks.filter((t) => t.status === "completed").length;
        const totalMins = dayTasks.reduce(
          (sum, t) => sum + (t.estimated_minutes ?? 0),
          0
        );

        let dayLabel: string;
        if (isToday(date)) dayLabel = "Today";
        else if (isTomorrow(date)) dayLabel = "Tomorrow";
        else dayLabel = format(date, "EEEE, MMM d");

        return (
          <div key={dateStr}>
            {/* Day header */}
            <div className="flex items-center gap-3 bg-muted/30 px-4 py-2.5">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isToday(date) && "text-primary"
                )}
              >
                {dayLabel}
              </span>
              <span className="text-xs text-muted-foreground">
                {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
                {completed > 0 && ` · ${completed} done`}
                {totalMins > 0 && ` · ${totalMins}m`}
              </span>
            </div>

            {/* Task rows */}
            {dayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 border-t px-4 py-1.5"
              >
                <span className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {format(new Date(task.scheduled_start!), "h:mm a")}
                </span>
                <div className="min-w-0 flex-1">
                  <TaskTimerRow task={task} onTaskClick={onTaskClick} />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
