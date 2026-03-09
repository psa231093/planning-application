"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, setHours, setMinutes, startOfDay } from "date-fns";
import { CalendarIcon, X, Repeat, Zap } from "lucide-react";
import type { RecurrenceFreq } from "@/lib/utils/recurrence";
import { taskSchema, type TaskFormData } from "@/lib/validations/task";
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type Task = Tables<"tasks"> & {
  categories?: Tables<"categories"> | null;
};

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
}: TaskFormDialogProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: categories } = useCategories();
  const isEditing = !!task;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFreq>("weekly");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: null,
      category_id: null,
      goal_id: null,
      priority: "medium",
      status: "unscheduled",
      estimated_minutes: null,
      scheduled_start: null,
      scheduled_end: null,
      is_recurring: false,
      notes: null,
      difficulty_points: null,
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        category_id: task.category_id,
        goal_id: task.goal_id,
        priority: task.priority,
        status: task.status,
        estimated_minutes: task.estimated_minutes,
        scheduled_start: task.scheduled_start,
        scheduled_end: task.scheduled_end,
        is_recurring: task.is_recurring,
        notes: task.notes ?? null,
        difficulty_points: task.difficulty_points ?? null,
      });
      // Sync local date/time state from task
      if (task.scheduled_start) {
        const d = new Date(task.scheduled_start);
        setSelectedDate(d);
        setStartTime(format(d, "HH:mm"));
      } else {
        setSelectedDate(undefined);
        setStartTime("");
      }
      setIsRecurring(task.is_recurring);
      if (task.is_recurring && task.recurrence_rule) {
        const rule = task.recurrence_rule as { frequency?: RecurrenceFreq };
        setRecurrenceFreq(rule.frequency ?? "weekly");
      }
    } else {
      reset({
        title: "",
        description: null,
        category_id: null,
        goal_id: null,
        priority: "medium",
        status: "unscheduled",
        estimated_minutes: null,
        scheduled_start: null,
        scheduled_end: null,
        is_recurring: false,
      });
      setSelectedDate(undefined);
      setStartTime("");
      setIsRecurring(false);
      setRecurrenceFreq("weekly");
    }
  }, [task, reset]);

  // Helper to build an ISO datetime from selectedDate + time string (HH:mm)
  const buildDatetime = (date: Date | undefined, time: string): string | null => {
    if (!date) return null;
    if (!time) return startOfDay(date).toISOString();
    const [hours, mins] = time.split(":").map(Number);
    return setMinutes(setHours(date, hours), mins).toISOString();
  };

  const onSubmit = (data: TaskFormData) => {
    // Build scheduled_start and scheduled_end from local state
    const scheduledStart = buildDatetime(selectedDate, startTime);

    const finalData: TaskFormData = {
      ...data,
      scheduled_start: scheduledStart,
      scheduled_end: null,
      // Auto-set status to "pending" when a date is assigned
      status: scheduledStart && data.status === "unscheduled" ? "pending" : data.status,
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? { frequency: recurrenceFreq } : null,
    };

    if (isEditing) {
      updateTask.mutate(
        { id: task.id, ...finalData },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createTask.mutate(finalData, {
        onSuccess: () => {
          onOpenChange(false);
          reset();
          setSelectedDate(undefined);
          setStartTime("");
        },
      });
    }
  };

  const currentPriority = watch("priority");
  const currentCategoryId = watch("category_id");
  const currentDifficulty = watch("difficulty_points");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Task" : "Create Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details..."
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={currentPriority}
                onValueChange={(val) =>
                  setValue("priority", val as TaskFormData["priority"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={currentCategoryId ?? "none"}
                onValueChange={(val) =>
                  setValue("category_id", val === "none" ? null : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_minutes">Estimated time (minutes)</Label>
            <Input
              id="estimated_minutes"
              type="number"
              min={1}
              placeholder="e.g. 30"
              {...register("estimated_minutes", {
                setValueAs: (v) =>
                  v === "" || v === null || v === undefined
                    ? null
                    : parseInt(v, 10),
              })}
            />
          </div>

          {/* Schedule: Date + Time pickers */}
          <div className="space-y-2">
            <Label>Schedule</Label>
            <div className="flex items-center gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal sm:w-[180px]",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date ?? undefined);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {selectedDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setSelectedDate(undefined);
                    setStartTime("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {selectedDate && (
              <div className="flex items-center gap-2 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="start_time" className="text-xs text-muted-foreground">
                    Start time
                  </Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full sm:w-[130px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Label className="flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                Repeat
              </Label>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isRecurring ? "bg-primary" : "bg-muted"
                )}
                role="switch"
                aria-checked={isRecurring}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                    isRecurring ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {isRecurring && (
              <div className="flex gap-1.5">
                {(["daily", "weekly", "monthly"] as RecurrenceFreq[]).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setRecurrenceFreq(freq)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                      recurrenceFreq === freq
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Difficulty
            </Label>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((point) => {
                const labels: Record<number, string> = {
                  1: "Very easy",
                  2: "Easy",
                  3: "Moderate",
                  4: "Hard",
                  5: "Very hard",
                };
                const selected = currentDifficulty === point;
                return (
                  <button
                    key={point}
                    type="button"
                    onClick={() =>
                      setValue(
                        "difficulty_points",
                        selected ? null : point
                      )
                    }
                    title={labels[point]}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    {point}
                  </button>
                );
              })}
              {currentDifficulty && (
                <span className="ml-1 self-center text-xs text-muted-foreground">
                  {
                    { 1: "Very easy", 2: "Easy", 3: "Moderate", 4: "Hard", 5: "Very hard" }[
                      currentDifficulty
                    ]
                  }
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes, context, or progress updates..."
              rows={3}
              {...register("notes")}
            />
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTask.isPending || updateTask.isPending}
            >
              {isEditing ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
