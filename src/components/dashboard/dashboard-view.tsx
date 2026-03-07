"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "./metric-card";
import { useTasks } from "@/hooks/use-tasks";
import { useCategories } from "@/hooks/use-categories";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, isSameDay, startOfDay, addDays } from "date-fns";
import { expandRecurringTasks } from "@/lib/utils/recurrence";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Workload tooltip
// ---------------------------------------------------------------------------
function WorkloadTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: WorkloadDay }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  if (!d.taskCount) {
    return (
      <div className="rounded-lg border bg-card px-3 py-2.5 shadow-sm">
        <p className="text-xs font-semibold">{d.fullDate}</p>
        <p className="mt-1 text-xs text-muted-foreground">No tasks scheduled</p>
      </div>
    );
  }

  const capPct = Math.round((d.mins / 480) * 100);
  const capColor =
    d.mins <= 360
      ? "text-emerald-600 dark:text-emerald-400"
      : d.mins <= 480
      ? "text-amber-500"
      : "text-red-500";

  const hh = Math.floor(d.mins / 60);
  const mm = d.mins % 60;
  const timeLabel = hh > 0 ? (mm > 0 ? `${hh}h ${mm}m` : `${hh}h`) : `${mm}m`;

  return (
    <div className="min-w-[160px] rounded-lg border bg-card px-3 py-2.5 shadow-sm">
      <p className="mb-2 text-xs font-semibold">{d.fullDate}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Planned</span>
          <span className="font-medium">{timeLabel}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Tasks</span>
          <span className="font-medium">{d.taskCount}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Capacity</span>
          <span className={cn("font-medium", capColor)}>{capPct}%</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WorkloadDay {
  date: string;
  fullDate: string;
  dayStr: string;
  mins: number;
  hours: number;
  taskCount: number;
  isToday: boolean;
  fill: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function DashboardView() {
  const { data: allTasks, isLoading } = useTasks({});
  const { data: categories } = useCategories();
  const isMobile = useIsMobile();

  // ── Basic metrics ──────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    if (!allTasks) return null;

    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === "completed").length;
    const incomplete = allTasks.filter((t) =>
      ["unscheduled", "pending", "in_progress"].includes(t.status)
    ).length;
    const overdue = allTasks.filter((t) => t.status === "overdue").length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, incomplete, overdue, completionRate };
  }, [allTasks]);

  // ── Workload forecast (14 days) ────────────────────────────────────────────
  const workloadForecast = useMemo((): WorkloadDay[] => {
    if (!allTasks) return [];

    const today = startOfDay(new Date());
    const forecastEnd = addDays(today, 13);

    // Active scheduled tasks only (no completed, no unscheduled)
    const activeTasks = allTasks.filter(
      (t) => t.scheduled_start && t.status !== "completed"
    );

    // Expand recurring tasks across the forecast window
    const expanded = expandRecurringTasks(activeTasks, today, forecastEnd);

    return Array.from({ length: 14 }, (_, i) => {
      const day = addDays(today, i);
      const dayStr = format(day, "yyyy-MM-dd");
      const isCurrentDay = i === 0;

      const dayTasks = expanded.filter(
        (t) =>
          t.scheduled_start &&
          format(new Date(t.scheduled_start), "yyyy-MM-dd") === dayStr
      );

      const totalMins = dayTasks.reduce(
        (sum, t) => sum + (t.estimated_minutes ?? 0),
        0
      );
      const hours = Math.round((totalMins / 60) * 10) / 10;

      const fill =
        totalMins === 0
          ? "hsl(var(--muted-foreground) / 0.2)"
          : totalMins <= 360
          ? "#10B981"
          : totalMins <= 480
          ? "#F59E0B"
          : "#EF4444";

      return {
        date: isCurrentDay
          ? "Today"
          : i < 7
          ? format(day, "EEE d")
          : format(day, "MMM d"),
        fullDate: format(day, "EEEE, MMMM d"),
        dayStr,
        mins: totalMins,
        hours,
        taskCount: dayTasks.length,
        isToday: isCurrentDay,
        fill,
      };
    });
  }, [allTasks]);

  // ── Forecast summary stats ─────────────────────────────────────────────────
  const forecastSummary = useMemo(() => {
    if (!workloadForecast.length) return null;

    const thisWeek = workloadForecast.slice(0, 7);
    const nextWeek = workloadForecast.slice(7, 14);

    const avgHours = (days: WorkloadDay[]) => {
      const withWork = days.filter((d) => d.taskCount > 0);
      if (!withWork.length) return 0;
      return (
        Math.round(
          (withWork.reduce((s, d) => s + d.hours, 0) / withWork.length) * 10
        ) / 10
      );
    };

    const overloadedDays = workloadForecast.filter(
      (d) => d.mins > 480
    ).length;
    const freeDays = workloadForecast.filter((d) => d.mins === 0).length;
    const busiest = workloadForecast.reduce(
      (max, d) => (d.hours > max.hours ? d : max),
      workloadForecast[0]
    );

    return {
      thisWeekAvg: avgHours(thisWeek),
      nextWeekAvg: avgHours(nextWeek),
      overloadedDays,
      freeDays,
      busiestDay: busiest.hours > 0 ? busiest : null,
    };
  }, [workloadForecast]);

  // ── Completion by day ──────────────────────────────────────────────────────
  const completionByDay = useMemo(() => {
    if (!allTasks) return [];

    const last14Days = Array.from({ length: 14 }, (_, i) =>
      subDays(new Date(), 13 - i)
    );

    return last14Days.map((day) => {
      const dayTasks = allTasks.filter(
        (t) => t.completed_at && isSameDay(new Date(t.completed_at), day)
      );
      return {
        date: format(day, "MMM d"),
        completed: dayTasks.length,
      };
    });
  }, [allTasks]);

  // ── Tasks by category ──────────────────────────────────────────────────────
  const tasksByCategory = useMemo(() => {
    if (!allTasks || !categories) return [];

    const categoryMap = new Map<
      string,
      { name: string; color: string; count: number }
    >();

    allTasks.forEach((task) => {
      const cat = task.category_id
        ? categories.find((c) => c.id === task.category_id)
        : null;
      const name = cat?.name ?? "Uncategorized";
      const color = cat?.color ?? "#94A3B8";

      if (!categoryMap.has(name)) {
        categoryMap.set(name, { name, color, count: 0 });
      }
      categoryMap.get(name)!.count++;
    });

    return Array.from(categoryMap.values());
  }, [allTasks, categories]);

  // ── Tasks by priority ──────────────────────────────────────────────────────
  const tasksByPriority = useMemo(() => {
    if (!allTasks) return [];

    const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
    allTasks.forEach((t) => {
      counts[t.priority]++;
    });

    return [
      { priority: "Urgent", count: counts.urgent, fill: "#EF4444" },
      { priority: "High", count: counts.high, fill: "#F97316" },
      { priority: "Medium", count: counts.medium, fill: "#F59E0B" },
      { priority: "Low", count: counts.low, fill: "#3B82F6" },
    ];
  }, [allTasks]);

  // ── Status distribution ────────────────────────────────────────────────────
  const statusDistribution = useMemo(() => {
    if (!allTasks) return [];

    const counts: Record<string, number> = {};
    allTasks.forEach((t) => {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    });

    const colors: Record<string, string> = {
      completed: "#10B981",
      in_progress: "#8B5CF6",
      pending: "#3B82F6",
      unscheduled: "#94A3B8",
      overdue: "#EF4444",
    };

    const labels: Record<string, string> = {
      completed: "Completed",
      in_progress: "In Progress",
      pending: "Pending",
      unscheduled: "Unscheduled",
      overdue: "Overdue",
    };

    return Object.entries(counts).map(([status, count]) => ({
      name: labels[status] ?? status,
      value: count,
      fill: colors[status] ?? "#94A3B8",
    }));
  }, [allTasks]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* ── Metric cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard title="Total Tasks" value={metrics.total} icon={ListTodo} />
        <MetricCard
          title="Completed"
          value={metrics.completed}
          icon={CheckCircle2}
        />
        <MetricCard title="Incomplete" value={metrics.incomplete} icon={Clock} />
        <MetricCard
          title="Overdue"
          value={metrics.overdue}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Completion Rate"
          value={`${metrics.completionRate}%`}
          icon={TrendingUp}
        />
      </div>

      {/* ── Workload forecast ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          {/* Title row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">
                14-Day Workload Forecast
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Planned hours per day · includes recurring tasks
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-3 rounded-sm bg-emerald-500" />
                ≤ 6h
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-3 rounded-sm bg-amber-500" />
                6 – 8h
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-3 rounded-sm bg-red-500" />
                &gt; 8h
              </span>
            </div>
          </div>

          {/* Summary stat chips */}
          {forecastSummary && (
            <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">
                  This week avg
                </p>
                <p className="mt-0.5 text-xl font-semibold leading-none">
                  {forecastSummary.thisWeekAvg}
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                    h / day
                  </span>
                </p>
              </div>

              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">
                  Next week avg
                </p>
                <p className="mt-0.5 text-xl font-semibold leading-none">
                  {forecastSummary.nextWeekAvg}
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                    h / day
                  </span>
                </p>
              </div>

              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">
                  Overloaded days
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-xl font-semibold leading-none",
                    forecastSummary.overloadedDays > 0
                      ? "text-red-500"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {forecastSummary.overloadedDays}
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                    &gt; 8h
                  </span>
                </p>
              </div>

              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Free days</p>
                <p className="mt-0.5 text-xl font-semibold leading-none text-emerald-600 dark:text-emerald-400">
                  {forecastSummary.freeDays}
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                    open
                  </span>
                </p>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 210}>
            <BarChart
              data={workloadForecast}
              barCategoryGap="22%"
              margin={{ top: 6, right: isMobile ? 16 : 28, left: isMobile ? 0 : -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${v}h`}
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
              />
              <Tooltip
                content={<WorkloadTooltip />}
                cursor={{
                  fill: "hsl(var(--muted-foreground) / 0.08)",
                  radius: 4,
                }}
              />

              {/* Capacity threshold reference lines */}
              <ReferenceLine
                y={6}
                stroke="#F59E0B"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: "6h",
                  position: "right",
                  fontSize: 10,
                  fill: "#F59E0B",
                }}
              />
              <ReferenceLine
                y={8}
                stroke="#EF4444"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: "8h",
                  position: "right",
                  fontSize: 10,
                  fill: "#EF4444",
                }}
              />

              <Bar dataKey="hours" radius={[5, 5, 0, 0]} maxBarSize={44}>
                {workloadForecast.map((entry, index) => (
                  <Cell
                    key={`wl-${index}`}
                    fill={entry.fill}
                    fillOpacity={entry.taskCount === 0 ? 0.4 : 1}
                    stroke={
                      entry.isToday ? "hsl(var(--foreground))" : "transparent"
                    }
                    strokeWidth={entry.isToday ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Charts row 1 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Task completion over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Task Completion (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={completionByDay}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={isMobile ? false : ({ name, value }) => `${name}: ${value}`}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                {isMobile && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row 2 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Tasks by category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tasksByCategory} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  type="number"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  width={isMobile ? 70 : 100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {tasksByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tasksByPriority}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="priority"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {tasksByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
