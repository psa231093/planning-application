"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Pencil,
  Trash2,
  Plus,
  Target,
  Calendar,
  MessageSquare,
  CheckSquare2,
  Pause,
  Play,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateGoal, useDeleteGoal } from "@/hooks/use-goals";
import { CATEGORY_CONFIG } from "./goal-card";
import type { Goal, GoalNote } from "@/lib/mock-store";
import type { Tables } from "@/types/database";

type Task = Tables<"tasks"> & { categories?: Tables<"categories"> | null };

function ProgressRing({
  progress,
  color,
  size = 120,
}: {
  progress: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 9;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
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
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-3xl font-bold tabular-nums" style={{ color }}>
          {progress}%
        </span>
        <span className="text-[11px] text-muted-foreground tracking-wide uppercase">
          complete
        </span>
      </div>
    </div>
  );
}

interface GoalDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  tasks: Task[];
  onEdit: () => void;
}

export function GoalDetailPanel({
  open,
  onOpenChange,
  goal,
  tasks,
  onEdit,
}: GoalDetailPanelProps) {
  const [newNote, setNewNote] = useState("");
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const catConfig = CATEGORY_CONFIG[goal.category] ?? CATEGORY_CONFIG.other;
  const CatIcon = catConfig.icon;
  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  const handleMilestoneToggle = (milestoneId: string, checked: boolean) => {
    const updated = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: checked } : m
    );
    const completedCount = updated.filter((m) => m.completed).length;
    const newProgress =
      updated.length > 0
        ? Math.round((completedCount / updated.length) * 100)
        : goal.progress;
    updateGoal.mutate({ id: goal.id, milestones: updated, progress: newProgress });
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGoal.mutate({ id: goal.id, progress: Number(e.target.value) });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: GoalNote = {
      id: crypto.randomUUID(),
      content: newNote.trim(),
      created_at: new Date().toISOString(),
    };
    updateGoal.mutate({ id: goal.id, notes: [...goal.notes, note] });
    setNewNote("");
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${goal.title}"? This cannot be undone.`)) return;
    await deleteGoal.mutateAsync(goal.id);
    onOpenChange(false);
  };

  const handleStatusToggle = () => {
    const next =
      goal.status === "active"
        ? "paused"
        : goal.status === "paused"
        ? "active"
        : goal.status;
    updateGoal.mutate({ id: goal.id, status: next });
  };

  const handleMarkComplete = () => {
    updateGoal.mutate({ id: goal.id, status: "completed", progress: 100 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 flex flex-col gap-0 max-h-[90vh] overflow-hidden">
        {/* Colored top accent + header */}
        <div
          className="px-6 pt-6 pb-4 border-b"
          style={{ borderTopWidth: "4px", borderTopColor: goal.color }}
        >
          <DialogHeader className="space-y-0 text-left">
            <DialogTitle className="text-base font-semibold leading-snug pr-8">
              {goal.title}
            </DialogTitle>
          </DialogHeader>
          {goal.description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {goal.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: goal.color }}
            >
              <CatIcon className="h-3 w-3" />
              {catConfig.label}
            </span>
            <span className="text-xs capitalize text-muted-foreground">
              {goal.priority} priority
            </span>
            {goal.target_date && (
              <>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(goal.target_date), "MMM d, yyyy")}
                </span>
              </>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            {/* Progress ring + slider */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <ProgressRing progress={goal.progress} color={goal.color} size={130} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Adjust progress</span>
                  <span className="font-medium">{goal.progress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={goal.progress}
                  onChange={handleProgressChange}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: goal.color }}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Milestones */}
            {goal.milestones.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <CheckSquare2 className="h-3.5 w-3.5" style={{ color: goal.color }} />
                  Milestones
                  <span className="ml-auto normal-case tracking-normal font-normal">
                    {completedMilestones}/{goal.milestones.length} done
                  </span>
                </h4>

                {/* Milestone progress bar */}
                <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width:
                        goal.milestones.length > 0
                          ? `${(completedMilestones / goal.milestones.length) * 100}%`
                          : "0%",
                      backgroundColor: goal.color,
                    }}
                  />
                </div>

                <div className="space-y-2.5">
                  {[...goal.milestones]
                    .sort((a, b) => a.order - b.order)
                    .map((milestone) => (
                      <div key={milestone.id} className="flex items-start gap-2.5">
                        <Checkbox
                          id={milestone.id}
                          checked={milestone.completed}
                          onCheckedChange={(checked) =>
                            handleMilestoneToggle(milestone.id, checked as boolean)
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor={milestone.id}
                          className={cn(
                            "text-sm cursor-pointer leading-snug",
                            milestone.completed &&
                              "line-through text-muted-foreground"
                          )}
                        >
                          {milestone.title}
                        </label>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {goal.milestones.length > 0 && <div className="border-t" />}

            {/* Linked Tasks */}
            {tasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" style={{ color: goal.color }} />
                  Linked Tasks
                  <span className="ml-auto normal-case tracking-normal font-normal">
                    {completedTasks}/{tasks.length} done
                  </span>
                </h4>
                <div className="space-y-1.5">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          task.status === "completed"
                            ? "bg-emerald-500"
                            : task.status === "in_progress"
                            ? "bg-blue-500"
                            : "bg-muted-foreground/40"
                        )}
                      />
                      <span
                        className={cn(
                          "flex-1 min-w-0 truncate",
                          task.status === "completed" &&
                            "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </span>
                      {task.categories && (
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: task.categories.color }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tasks.length > 0 && <div className="border-t" />}

            {/* Notes */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" style={{ color: goal.color }} />
                Notes & Updates
              </h4>
              <div className="space-y-2 mb-4">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Log a progress update, insight, or note..."
                  rows={3}
                  className="text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Note
                </Button>
              </div>

              {goal.notes.length > 0 && (
                <div className="space-y-2.5">
                  {[...goal.notes]
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((note) => (
                      <div
                        key={note.id}
                        className="bg-muted/40 rounded-lg p-3 border border-border/50"
                      >
                        <p className="text-sm leading-relaxed">{note.content}</p>
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                          {format(new Date(note.created_at), "MMM d, yyyy · h:mm a")}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="border-t p-4 flex items-center gap-2">
          {goal.status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStatusToggle}
              className="flex-1 gap-1.5"
            >
              {goal.status === "active" ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Activate
                </>
              )}
            </Button>
          )}
          {goal.status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkComplete}
              className="flex-1 gap-1.5 text-emerald-600 hover:text-emerald-600 hover:border-emerald-500"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:border-destructive shrink-0"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
