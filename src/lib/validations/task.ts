import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(500),
  description: z.string().max(5000).optional().nullable(),
  category_id: z.string().optional().nullable(),
  goal_id: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum([
    "unscheduled",
    "pending",
    "in_progress",
    "completed",
    "overdue",
  ]),
  estimated_minutes: z.number().int().positive().optional().nullable(),
  scheduled_start: z.string().datetime().optional().nullable(),
  scheduled_end: z.string().datetime().optional().nullable(),
  is_recurring: z.boolean(),
  recurrence_rule: z.any().optional().nullable(),
});

export const quickAddSchema = z.object({
  title: z.string().min(1, "Task title is required"),
});

export type TaskFormData = z.infer<typeof taskSchema>;
export type QuickAddFormData = z.infer<typeof quickAddSchema>;
