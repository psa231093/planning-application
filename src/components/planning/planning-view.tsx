"use client";

import { useState, useMemo } from "react";
import { useGoals } from "@/hooks/use-goals";
import { useTasks } from "@/hooks/use-tasks";
import { GoalCard } from "./goal-card";
import { GoalFormDialog } from "./goal-form-dialog";
import { GoalDetailPanel } from "./goal-detail-panel";
import { TopNav } from "@/components/layout/top-nav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Target,
  TrendingUp,
  CheckCircle2,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import type { Goal } from "@/lib/mock-store";

type StatusFilter = "all" | "active" | "paused" | "completed";
type SortOption = "priority" | "deadline" | "progress";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function PlanningView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const { data: goals = [], isLoading } = useGoals();
  const { data: allTasks = [] } = useTasks();

  // Always show the freshest version of the selected goal
  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) ?? null,
    [goals, selectedGoalId]
  );

  const stats = useMemo(() => {
    const active = goals.filter((g) => g.status === "active").length;
    const paused = goals.filter((g) => g.status === "paused").length;
    const completed = goals.filter((g) => g.status === "completed").length;
    const avgProgress =
      goals.length > 0
        ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
        : 0;
    return { total: goals.length, active, paused, completed, avgProgress };
  }, [goals]);

  const filtered = useMemo(() => {
    let result = [...goals];
    if (statusFilter !== "all") {
      result = result.filter((g) => g.status === statusFilter);
    }
    result.sort((a, b) => {
      if (sortBy === "priority") {
        return (
          (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4)
        );
      }
      if (sortBy === "progress") {
        return b.progress - a.progress;
      }
      if (sortBy === "deadline") {
        if (!a.target_date && !b.target_date) return 0;
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return (
          new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
        );
      }
      return 0;
    });
    return result;
  }, [goals, statusFilter, sortBy]);

  const tasksByGoal = useMemo(() => {
    const map: Record<string, number> = {};
    for (const task of allTasks) {
      if (task.goal_id) {
        map[task.goal_id] = (map[task.goal_id] ?? 0) + 1;
      }
    }
    return map;
  }, [allTasks]);

  const linkedTasks = useMemo(
    () => allTasks.filter((t) => t.goal_id === selectedGoalId),
    [allTasks, selectedGoalId]
  );

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoalId(goal.id);
    setDetailOpen(true);
  };

  const handleEdit = (goal?: Goal) => {
    setEditingGoal(goal ?? selectedGoal);
    setFormOpen(true);
  };

  const handleDetailClose = (open: boolean) => {
    setDetailOpen(open);
    if (!open) setSelectedGoalId(null);
  };

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Planning">
        <Button
          size="sm"
          onClick={() => {
            setEditingGoal(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Goal
        </Button>
      </TopNav>

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Page header */}
          <div>
            <h2 className="text-xl font-bold tracking-tight">Long-Term Goals</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Define your vision, track milestones, and align daily work with what matters most.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total Goals",
                value: stats.total,
                icon: Layers,
                iconClass: "text-primary",
              },
              {
                label: "Active",
                value: stats.active,
                icon: TrendingUp,
                iconClass: "text-emerald-500",
              },
              {
                label: "Avg. Progress",
                value: `${stats.avgProgress}%`,
                icon: Target,
                iconClass: "text-blue-500",
              },
              {
                label: "Completed",
                value: stats.completed,
                icon: CheckCircle2,
                iconClass: "text-violet-500",
              },
            ].map(({ label, value, icon: Icon, iconClass }) => (
              <div
                key={label}
                className="bg-card rounded-xl border p-4 space-y-2"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
                  <span className="text-xs">{label}</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{value}</p>
              </div>
            ))}
          </div>

          {/* Filters + Sort */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3 h-6">
                  All
                  <span className="ml-1.5 text-[10px] opacity-60 tabular-nums">
                    {stats.total}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs px-3 h-6">
                  Active
                  <span className="ml-1.5 text-[10px] opacity-60 tabular-nums">
                    {stats.active}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="paused" className="text-xs px-3 h-6">
                  Paused
                  <span className="ml-1.5 text-[10px] opacity-60 tabular-nums">
                    {stats.paused}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs px-3 h-6">
                  Done
                  <span className="ml-1.5 text-[10px] opacity-60 tabular-nums">
                    {stats.completed}
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-lg px-3 py-1.5 bg-background">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
              >
                <option value="priority">Priority</option>
                <option value="deadline">Deadline</option>
                <option value="progress">Progress</option>
              </select>
            </div>
          </div>

          {/* Goals grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 bg-muted/50 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-muted-foreground">
                {statusFilter === "all"
                  ? "No goals yet"
                  : `No ${statusFilter} goals`}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">
                {statusFilter === "all"
                  ? "Create your first long-term goal to start aligning your daily work with what matters."
                  : "Try switching the filter to see other goals."}
              </p>
              {statusFilter === "all" && (
                <Button
                  className="mt-5"
                  onClick={() => {
                    setEditingGoal(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create your first goal
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  taskCount={tasksByGoal[goal.id] ?? 0}
                  onClick={() => handleGoalClick(goal)}
                  onEdit={(e) => {
                    e.stopPropagation();
                    handleEdit(goal);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit dialog */}
      <GoalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        goal={editingGoal}
      />

      {/* Detail panel */}
      {selectedGoal && (
        <GoalDetailPanel
          open={detailOpen}
          onOpenChange={handleDetailClose}
          goal={selectedGoal}
          tasks={linkedTasks}
          onEdit={() => handleEdit(selectedGoal)}
        />
      )}
    </div>
  );
}
