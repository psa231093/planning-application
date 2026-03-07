import { addDays, addWeeks, addMonths } from "date-fns";
import type { Tables } from "@/types/database";

type Task = Tables<"tasks"> & {
  categories?: Tables<"categories"> | null;
};

export type RecurrenceFreq = "daily" | "weekly" | "monthly";

export interface RecurrenceRule {
  frequency: RecurrenceFreq;
}

/**
 * Expand a single recurring task into instances within [rangeStart, rangeEnd].
 * Each instance is a shallow copy with adjusted scheduled_start/end and a
 * composite id (`parentId__occurrenceISO`) so callers can detect them.
 */
function expandRecurringTask(
  task: Task,
  rangeStart: Date,
  rangeEnd: Date
): Task[] {
  const rule = task.recurrence_rule as RecurrenceRule | null;
  const freq = rule?.frequency;
  if (!freq || !task.scheduled_start) return [];

  const firstStart = new Date(task.scheduled_start);
  const durationMs = task.scheduled_end
    ? new Date(task.scheduled_end).getTime() - firstStart.getTime()
    : 60 * 60 * 1000; // default 1 hr

  const instances: Task[] = [];
  let current = firstStart;
  let iter = 0;
  const MAX_ITER = 500;

  while (current <= rangeEnd && iter < MAX_ITER) {
    iter++;
    if (current >= rangeStart) {
      const occEnd = new Date(current.getTime() + durationMs);
      instances.push({
        ...task,
        id: `${task.id}__${current.toISOString()}`,
        scheduled_start: current.toISOString(),
        scheduled_end: occEnd.toISOString(),
      });
    }
    if (freq === "daily") current = addDays(current, 1);
    else if (freq === "weekly") current = addWeeks(current, 1);
    else if (freq === "monthly") current = addMonths(current, 1);
    else break;
  }

  return instances;
}

/**
 * Given a task list, expand recurring tasks into instances within the given
 * date range. Non-recurring tasks pass through unchanged.
 *
 * The returned objects are shallow copies; the `id` of virtual instances
 * has the form `"<parentId>__<isoDate>"`.
 */
export function expandRecurringTasks(
  tasks: Task[],
  rangeStart: Date,
  rangeEnd: Date
): Task[] {
  const result: Task[] = [];
  for (const task of tasks) {
    if (task.is_recurring && task.scheduled_start && task.recurrence_rule) {
      result.push(...expandRecurringTask(task, rangeStart, rangeEnd));
    } else {
      result.push(task);
    }
  }
  return result;
}

/** Returns the base (parent) task id from a potentially virtual instance id. */
export function baseTaskId(id: string): string {
  return id.includes("__") ? id.split("__")[0] : id;
}
