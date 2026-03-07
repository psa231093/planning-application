"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Plus,
  X,
  Briefcase,
  User,
  TrendingUp,
  Heart,
  Dumbbell,
  BookOpen,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCreateGoal, useUpdateGoal } from "@/hooks/use-goals";
import type { Goal, GoalCategory, GoalPriority, Milestone } from "@/lib/mock-store";

const GOAL_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#EF4444",
  "#6366F1",
  "#14B8A6",
];

const CATEGORIES: { value: GoalCategory; label: string; icon: React.ElementType }[] = [
  { value: "professional", label: "Professional", icon: Briefcase },
  { value: "personal", label: "Personal", icon: User },
  { value: "financial", label: "Financial", icon: TrendingUp },
  { value: "health", label: "Health", icon: Heart },
  { value: "fitness", label: "Fitness", icon: Dumbbell },
  { value: "learning", label: "Learning", icon: BookOpen },
  { value: "other", label: "Other", icon: Star },
];

const PRIORITIES: { value: GoalPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.enum(["professional", "personal", "financial", "health", "fitness", "learning", "other"]),
  color: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
}

export function GoalFormDialog({ open, onOpenChange, goal }: GoalFormDialogProps) {
  const isEditing = !!goal;
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const [targetDate, setTargetDate] = useState<Date | undefined>(
    goal?.target_date ? new Date(goal.target_date) : undefined
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>(goal?.milestones ?? []);
  const [newMilestone, setNewMilestone] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: goal?.title ?? "",
      description: goal?.description ?? "",
      priority: (goal?.priority as GoalPriority) ?? "medium",
      category: (goal?.category as GoalCategory) ?? "professional",
      color: goal?.color ?? "#8B5CF6",
    },
  });

  const selectedColor = watch("color");
  const selectedCategory = watch("category");
  const selectedPriority = watch("priority");

  useEffect(() => {
    if (open) {
      reset({
        title: goal?.title ?? "",
        description: goal?.description ?? "",
        priority: (goal?.priority as GoalPriority) ?? "medium",
        category: (goal?.category as GoalCategory) ?? "professional",
        color: goal?.color ?? "#8B5CF6",
      });
      setTargetDate(goal?.target_date ? new Date(goal.target_date) : undefined);
      setMilestones(goal?.milestones ?? []);
      setNewMilestone("");
    }
  }, [open, goal, reset]);

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    setMilestones((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: newMilestone.trim(),
        completed: false,
        order: prev.length,
      },
    ]);
    setNewMilestone("");
  };

  const removeMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const onSubmit = handleSubmit(async (values) => {
    const data = {
      ...values,
      target_date: targetDate?.toISOString() ?? null,
      milestones,
    };

    if (isEditing && goal) {
      await updateGoal.mutateAsync({ id: goal.id, ...data });
    } else {
      await createGoal.mutateAsync({ ...data, title: values.title });
    }
    onOpenChange(false);
  });

  const isPending = createGoal.isPending || updateGoal.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Goal" : "New Goal"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 pt-1">
          {/* Color swatches */}
          <div className="flex items-center gap-2 flex-wrap">
            {GOAL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "h-7 w-7 rounded-full transition-all duration-150 border-2",
                  selectedColor === color
                    ? "ring-2 ring-offset-2 ring-foreground/40 scale-110 border-white"
                    : "border-transparent scale-100"
                )}
                style={{ backgroundColor: color }}
                onClick={() => setValue("color", color)}
              />
            ))}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="goal-title"
              {...register("title")}
              placeholder="e.g. Launch product v2.0"
              style={{ borderLeftWidth: "3px", borderLeftColor: selectedColor }}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-desc">Description</Label>
            <Textarea
              id="goal-desc"
              {...register("description")}
              placeholder="What does achieving this goal mean to you?"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all duration-150",
                    selectedCategory === value
                      ? "border-transparent text-white shadow-sm"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                  style={
                    selectedCategory === value
                      ? { backgroundColor: selectedColor }
                      : {}
                  }
                  onClick={() => setValue("category", value)}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex gap-2">
              {PRIORITIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs border transition-all duration-150",
                    selectedPriority === value
                      ? "border-transparent text-white shadow-sm"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  )}
                  style={
                    selectedPriority === value
                      ? { backgroundColor: selectedColor }
                      : {}
                  }
                  onClick={() => setValue("priority", value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Date */}
          <div className="space-y-1.5">
            <Label>Target Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !targetDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate ? format(targetDate, "PPP") : "Pick a target date"}
                  {targetDate && (
                    <span
                      className="ml-auto text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetDate(undefined);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={(d) => {
                    setTargetDate(d);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            <Label>Milestones</Label>
            {milestones.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {milestones.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2 group">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="flex-1 text-sm">{m.title}</span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(m.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                placeholder="Add a milestone checkpoint..."
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMilestone();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addMilestone}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              style={{ backgroundColor: selectedColor, borderColor: selectedColor }}
            >
              {isPending
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                ? "Save Changes"
                : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
