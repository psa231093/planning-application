import type { Tables } from "@/types/database";
import { addDays, addMonths, subDays, subMonths, setHours, setMinutes, startOfToday } from "date-fns";

type Task = Tables<"tasks"> & {
  categories?: Tables<"categories"> | null;
};
type Category = Tables<"categories">;

export type Milestone = { id: string; title: string; completed: boolean; order: number };
export type GoalNote = { id: string; content: string; created_at: string };
export type GoalCategory = "professional" | "personal" | "financial" | "health" | "fitness" | "learning" | "other";
export type GoalPriority = "low" | "medium" | "high" | "urgent";
export type Goal = Tables<"goals"> & {
  priority: GoalPriority;
  category: GoalCategory;
  color: string;
  milestones: Milestone[];
  notes: GoalNote[];
};

const USER_ID = "dev-user-001";
const now = new Date();

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat-work",
    user_id: USER_ID,
    name: "Work",
    color: "#8B5CF6",
    icon: null,
    sort_order: 0,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
  {
    id: "cat-personal",
    user_id: USER_ID,
    name: "Personal",
    color: "#3B82F6",
    icon: null,
    sort_order: 1,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
  {
    id: "cat-health",
    user_id: USER_ID,
    name: "Health",
    color: "#10B981",
    icon: null,
    sort_order: 2,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
  {
    id: "cat-learning",
    user_id: USER_ID,
    name: "Learning",
    color: "#F59E0B",
    icon: null,
    sort_order: 3,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
];

const SEED_GOALS: Goal[] = [
  {
    id: "goal-01",
    user_id: USER_ID,
    title: "Launch Product v2.0",
    description: "Build and ship the next major version with real-time collaboration features and a fully redesigned UX.",
    target_date: addMonths(now, 3).toISOString(),
    status: "active",
    progress: 65,
    priority: "urgent",
    category: "professional",
    color: "#8B5CF6",
    milestones: [
      { id: "m-01-1", title: "Design mockups & user research", completed: true, order: 0 },
      { id: "m-01-2", title: "Backend API development", completed: true, order: 1 },
      { id: "m-01-3", title: "Frontend integration", completed: true, order: 2 },
      { id: "m-01-4", title: "Beta testing with select users", completed: false, order: 3 },
      { id: "m-01-5", title: "Production launch & monitoring", completed: false, order: 4 },
    ],
    notes: [
      { id: "n-01-1", content: "Completed initial design phase ahead of schedule. Users responded very positively to the new collaboration mockups.", created_at: subDays(now, 14).toISOString() },
      { id: "n-01-2", content: "API work done. Starting frontend integration this week. On track for Q2 launch.", created_at: subDays(now, 3).toISOString() },
    ],
    created_at: subDays(now, 60).toISOString(),
    updated_at: subDays(now, 3).toISOString(),
  },
  {
    id: "goal-02",
    user_id: USER_ID,
    title: "Run a Half Marathon",
    description: "Complete a 21km race in under 2 hours. Build up from current 5K baseline with structured training.",
    target_date: addMonths(now, 6).toISOString(),
    status: "active",
    progress: 40,
    priority: "medium",
    category: "fitness",
    color: "#10B981",
    milestones: [
      { id: "m-02-1", title: "Complete 4-week base building phase", completed: true, order: 0 },
      { id: "m-02-2", title: "Run comfortable 5K (under 30 min)", completed: true, order: 1 },
      { id: "m-02-3", title: "Complete first 10K run", completed: false, order: 2 },
      { id: "m-02-4", title: "15K long run milestone", completed: false, order: 3 },
      { id: "m-02-5", title: "Half marathon race day", completed: false, order: 4 },
    ],
    notes: [
      { id: "n-02-1", content: "Feeling stronger after consistent 3x/week training. Ready to push to 10K distances next month.", created_at: subDays(now, 7).toISOString() },
    ],
    created_at: subDays(now, 45).toISOString(),
    updated_at: subDays(now, 7).toISOString(),
  },
  {
    id: "goal-03",
    user_id: USER_ID,
    title: "Build Emergency Fund ($20K)",
    description: "Save 6 months of living expenses to create financial security and peace of mind.",
    target_date: addMonths(now, 12).toISOString(),
    status: "active",
    progress: 30,
    priority: "high",
    category: "financial",
    color: "#F59E0B",
    milestones: [
      { id: "m-03-1", title: "First $2,000 saved", completed: true, order: 0 },
      { id: "m-03-2", title: "$5,000 milestone", completed: true, order: 1 },
      { id: "m-03-3", title: "$10,000 halfway point", completed: false, order: 2 },
      { id: "m-03-4", title: "$15,000 checkpoint", completed: false, order: 3 },
      { id: "m-03-5", title: "$20,000 goal reached", completed: false, order: 4 },
    ],
    notes: [
      { id: "n-03-1", content: "Cut dining out by 60% this month. Extra $400 redirected to the fund. Staying disciplined.", created_at: subDays(now, 5).toISOString() },
    ],
    created_at: subDays(now, 90).toISOString(),
    updated_at: subDays(now, 5).toISOString(),
  },
  {
    id: "goal-04",
    user_id: USER_ID,
    title: "TypeScript & Advanced Patterns",
    description: "Master TypeScript's advanced type system and design patterns to write more robust, maintainable code.",
    target_date: addMonths(now, 2).toISOString(),
    status: "active",
    progress: 80,
    priority: "medium",
    category: "learning",
    color: "#3B82F6",
    milestones: [
      { id: "m-04-1", title: "Core TypeScript fundamentals", completed: true, order: 0 },
      { id: "m-04-2", title: "Advanced types (generics, conditionals, mapped)", completed: true, order: 1 },
      { id: "m-04-3", title: "Design patterns in TypeScript", completed: true, order: 2 },
      { id: "m-04-4", title: "Real-world project with full type safety", completed: true, order: 3 },
      { id: "m-04-5", title: "Write blog post or teach someone else", completed: false, order: 4 },
    ],
    notes: [
      { id: "n-04-1", content: "Finished the advanced generics chapter. Applying conditional types directly to the planning dashboard. Almost there.", created_at: subDays(now, 4).toISOString() },
    ],
    created_at: subDays(now, 75).toISOString(),
    updated_at: subDays(now, 4).toISOString(),
  },
  {
    id: "goal-05",
    user_id: USER_ID,
    title: "Intentional Work-Life Balance",
    description: "Establish clear boundaries and routines that protect personal time without sacrificing professional impact.",
    target_date: null,
    status: "paused",
    progress: 25,
    priority: "low",
    category: "personal",
    color: "#EC4899",
    milestones: [
      { id: "m-05-1", title: "Define non-negotiable personal time blocks", completed: true, order: 0 },
      { id: "m-05-2", title: "No-work weekends for 4 consecutive weeks", completed: false, order: 1 },
      { id: "m-05-3", title: "Daily evening wind-down routine", completed: false, order: 2 },
      { id: "m-05-4", title: "Monthly personal reflection habit", completed: false, order: 3 },
    ],
    notes: [
      { id: "n-05-1", content: "Pausing this goal while the v2.0 deadline is pressing. Will revisit after launch.", created_at: subDays(now, 10).toISOString() },
    ],
    created_at: subDays(now, 120).toISOString(),
    updated_at: subDays(now, 10).toISOString(),
  },
  {
    id: "goal-06",
    user_id: USER_ID,
    title: "Launch Developer Blog",
    description: "Build a personal technical blog to share knowledge, build a following, and establish thought leadership.",
    target_date: subMonths(now, 1).toISOString(),
    status: "completed",
    progress: 100,
    priority: "high",
    category: "professional",
    color: "#6366F1",
    milestones: [
      { id: "m-06-1", title: "Choose platform & set up custom domain", completed: true, order: 0 },
      { id: "m-06-2", title: "Design & build the blog", completed: true, order: 1 },
      { id: "m-06-3", title: "Write first 3 technical articles", completed: true, order: 2 },
      { id: "m-06-4", title: "Share on social media & reach 100 readers", completed: true, order: 3 },
    ],
    notes: [
      { id: "n-06-1", content: "Blog launched! First article got 2k views after hitting HN front page. Incredible response.", created_at: subDays(now, 35).toISOString() },
      { id: "n-06-2", content: "Marking complete — exceeded the goal. Now at 850 newsletter subscribers.", created_at: subDays(now, 30).toISOString() },
    ],
    created_at: subDays(now, 180).toISOString(),
    updated_at: subDays(now, 30).toISOString(),
  },
];

function makeDate(dayOffset: number, hour: number, minute = 0): string {
  const d = dayOffset === 0 ? startOfToday() : dayOffset > 0 ? addDays(startOfToday(), dayOffset) : subDays(startOfToday(), Math.abs(dayOffset));
  return setMinutes(setHours(d, hour), minute).toISOString();
}

const SEED_TASKS: Task[] = [
  // Unscheduled inbox tasks
  {
    id: "task-01",
    user_id: USER_ID,
    title: "Research competitor pricing strategies",
    description: "Analyze top 5 competitors and create comparison spreadsheet",
    category_id: "cat-work",
    goal_id: "goal-01",
    priority: "high",
    status: "unscheduled",
    estimated_minutes: 90,
    actual_minutes: null,
    scheduled_start: null,
    scheduled_end: null,
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 0,
    created_at: subDays(now, 2).toISOString(),
    updated_at: subDays(now, 2).toISOString(),
    categories: DEFAULT_CATEGORIES[0],
  },
  {
    id: "task-02",
    user_id: USER_ID,
    title: "Buy groceries for the week",
    description: null,
    category_id: "cat-personal",
    goal_id: null,
    priority: "medium",
    status: "unscheduled",
    estimated_minutes: 45,
    actual_minutes: null,
    scheduled_start: null,
    scheduled_end: null,
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 1,
    created_at: subDays(now, 1).toISOString(),
    updated_at: subDays(now, 1).toISOString(),
    categories: DEFAULT_CATEGORIES[1],
  },
  {
    id: "task-03",
    user_id: USER_ID,
    title: "Read chapter 5 of Designing Data-Intensive Applications",
    description: null,
    category_id: "cat-learning",
    goal_id: "goal-04",
    priority: "low",
    status: "unscheduled",
    estimated_minutes: 60,
    actual_minutes: null,
    scheduled_start: null,
    scheduled_end: null,
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 2,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[3],
  },
  {
    id: "task-04",
    user_id: USER_ID,
    title: "Fix authentication bug in production",
    description: "Users are getting 401 errors intermittently",
    category_id: "cat-work",
    goal_id: "goal-01",
    priority: "urgent",
    status: "unscheduled",
    estimated_minutes: 120,
    actual_minutes: null,
    scheduled_start: null,
    scheduled_end: null,
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 3,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[0],
  },
  {
    id: "task-05",
    user_id: USER_ID,
    title: "Schedule dentist appointment",
    description: null,
    category_id: "cat-health",
    goal_id: null,
    priority: "medium",
    status: "unscheduled",
    estimated_minutes: 15,
    actual_minutes: null,
    scheduled_start: null,
    scheduled_end: null,
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 4,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[2],
  },

  // Scheduled tasks for today
  {
    id: "task-10",
    user_id: USER_ID,
    title: "Team standup meeting",
    description: "Daily sync with engineering team",
    category_id: "cat-work",
    goal_id: null,
    priority: "high",
    status: "pending",
    estimated_minutes: 30,
    actual_minutes: null,
    scheduled_start: makeDate(0, 9, 0),
    scheduled_end: makeDate(0, 9, 30),
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 0,
    created_at: subDays(now, 3).toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[0],
  },
  {
    id: "task-11",
    user_id: USER_ID,
    title: "Code review: Dashboard PR #247",
    description: "Review the new analytics dashboard implementation",
    category_id: "cat-work",
    goal_id: "goal-01",
    priority: "high",
    status: "in_progress",
    estimated_minutes: 60,
    actual_minutes: null,
    scheduled_start: makeDate(0, 10, 0),
    scheduled_end: makeDate(0, 11, 0),
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 0,
    created_at: subDays(now, 1).toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[0],
  },
  {
    id: "task-12",
    user_id: USER_ID,
    title: "Gym session - Upper body",
    description: null,
    category_id: "cat-health",
    goal_id: "goal-02",
    priority: "medium",
    status: "pending",
    estimated_minutes: 60,
    actual_minutes: null,
    scheduled_start: makeDate(0, 17, 0),
    scheduled_end: makeDate(0, 18, 0),
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 0,
    created_at: subDays(now, 5).toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[2],
  },
  {
    id: "task-13",
    user_id: USER_ID,
    title: "Write blog post outline",
    description: "Draft outline for technical blog about React patterns",
    category_id: "cat-learning",
    goal_id: "goal-04",
    priority: "medium",
    status: "pending",
    estimated_minutes: 45,
    actual_minutes: null,
    scheduled_start: makeDate(0, 14, 0),
    scheduled_end: makeDate(0, 14, 45),
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 0,
    created_at: subDays(now, 2).toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[3],
  },

  // Scheduled for tomorrow
  {
    id: "task-20",
    user_id: USER_ID,
    title: "Sprint planning session",
    description: "Q2 sprint planning with product team",
    category_id: "cat-work",
    goal_id: null,
    priority: "high",
    status: "pending",
    estimated_minutes: 120,
    actual_minutes: null,
    scheduled_start: makeDate(1, 10, 0),
    scheduled_end: makeDate(1, 12, 0),
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 0,
    created_at: subDays(now, 3).toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[0],
  },
  {
    id: "task-21",
    user_id: USER_ID,
    title: "Deploy API v2 to staging",
    description: null,
    category_id: "cat-work",
    goal_id: null,
    priority: "urgent",
    status: "pending",
    estimated_minutes: 30,
    actual_minutes: null,
    scheduled_start: makeDate(1, 14, 0),
    scheduled_end: makeDate(1, 14, 30),
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 0,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[0],
  },

  // Scheduled for day after tomorrow
  {
    id: "task-30",
    user_id: USER_ID,
    title: "1:1 with manager",
    description: null,
    category_id: "cat-work",
    goal_id: null,
    priority: "medium",
    status: "pending",
    estimated_minutes: 30,
    actual_minutes: null,
    scheduled_start: makeDate(2, 11, 0),
    scheduled_end: makeDate(2, 11, 30),
    completed_at: null,
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 0,
    created_at: subDays(now, 4).toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[0],
  },

  // Recurring tasks (expand in agenda views)
  {
    id: "task-rec-01",
    user_id: USER_ID,
    title: "Daily standup",
    description: "Quick team sync — what did you do, what will you do, any blockers?",
    category_id: "cat-work",
    goal_id: null,
    priority: "medium",
    status: "pending",
    estimated_minutes: 15,
    actual_minutes: null,
    scheduled_start: makeDate(0, 9, 0),
    scheduled_end: makeDate(0, 9, 15),
    completed_at: null,
    is_recurring: true,
    recurrence_rule: { frequency: "daily" },
    sort_order: 0,
    created_at: subDays(now, 10).toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[0],
  },
  {
    id: "task-rec-02",
    user_id: USER_ID,
    title: "Weekly review & planning",
    description: "Review last week, set priorities for next week",
    category_id: "cat-personal",
    goal_id: null,
    priority: "high",
    status: "pending",
    estimated_minutes: 45,
    actual_minutes: null,
    scheduled_start: makeDate(0, 18, 0),
    scheduled_end: makeDate(0, 18, 45),
    completed_at: null,
    is_recurring: true,
    recurrence_rule: { frequency: "weekly" },
    sort_order: 0,
    created_at: subDays(now, 14).toISOString(),
    updated_at: now.toISOString(),
    categories: DEFAULT_CATEGORIES[1],
  },

  // Completed tasks (for dashboard)
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `task-done-${i}`,
    user_id: USER_ID,
    title: [
      "Update API documentation",
      "Fix CSS grid layout",
      "Run performance audit",
      "Design onboarding flow",
      "Set up CI/CD pipeline",
      "Optimize database queries",
      "Write unit tests for auth",
      "Morning meditation",
      "Review pull requests",
      "Create project roadmap",
      "Weekly meal prep",
      "Complete TypeScript course module",
    ][i],
    description: null,
    category_id: ["cat-work", "cat-work", "cat-work", "cat-work", "cat-work", "cat-work", "cat-work", "cat-health", "cat-work", "cat-work", "cat-personal", "cat-learning"][i],
    goal_id: null,
    priority: (["medium", "high", "medium", "high", "urgent", "high", "medium", "low", "medium", "high", "low", "medium"] as const)[i],
    status: "completed" as const,
    estimated_minutes: [30, 45, 60, 90, 120, 60, 45, 20, 30, 60, 45, 40][i],
    actual_minutes: [35, 40, 55, 80, 100, 70, 50, 20, 25, 65, 50, 35][i],
    scheduled_start: makeDate(-Math.floor(i / 2) - 1, 9 + (i % 4) * 2),
    scheduled_end: null,
    completed_at: subDays(now, Math.floor(i / 2) + 1).toISOString(),
    is_recurring: false,
    recurrence_rule: null,
    sort_order: 0,
    created_at: subDays(now, Math.floor(i / 2) + 3).toISOString(),
    updated_at: subDays(now, Math.floor(i / 2) + 1).toISOString(),
    categories: DEFAULT_CATEGORIES[["cat-work", "cat-work", "cat-work", "cat-work", "cat-work", "cat-work", "cat-work", "cat-health", "cat-work", "cat-work", "cat-personal", "cat-learning"].indexOf(["cat-work", "cat-work", "cat-work", "cat-work", "cat-work", "cat-work", "cat-work", "cat-health", "cat-work", "cat-work", "cat-personal", "cat-learning"][i]) === -1 ? 0 : [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 3][i]],
  })) as Task[],
];

// In-memory store
let tasks: Task[] = [...SEED_TASKS];
let categories: Category[] = [...DEFAULT_CATEGORIES];
let goals: Goal[] = [...SEED_GOALS];

export const mockStore = {
  getTasks: (): Task[] => [...tasks],

  getCategories: (): Category[] => [...categories],

  createTask: (newTask: Partial<Task> & { title: string }): Task => {
    const cat = newTask.category_id
      ? categories.find((c) => c.id === newTask.category_id) ?? null
      : null;

    const task: Task = {
      id: crypto.randomUUID(),
      user_id: USER_ID,
      title: newTask.title,
      description: newTask.description ?? null,
      category_id: newTask.category_id ?? null,
      goal_id: newTask.goal_id ?? null,
      priority: newTask.priority ?? "medium",
      status: newTask.status ?? "unscheduled",
      estimated_minutes: newTask.estimated_minutes ?? null,
      actual_minutes: null,
      scheduled_start: newTask.scheduled_start ?? null,
      scheduled_end: newTask.scheduled_end ?? null,
      completed_at: null,
      is_recurring: newTask.is_recurring ?? false,
      recurrence_rule: newTask.recurrence_rule ?? null,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categories: cat,
    };
    tasks = [task, ...tasks];
    return task;
  },

  updateTask: (id: string, updates: Partial<Task>): Task | null => {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const updatedCat =
      updates.category_id !== undefined
        ? categories.find((c) => c.id === updates.category_id) ?? null
        : tasks[index].categories;

    tasks[index] = {
      ...tasks[index],
      ...updates,
      categories: updatedCat,
      updated_at: new Date().toISOString(),
    };
    tasks = [...tasks];
    return tasks[index];
  },

  deleteTask: (id: string): void => {
    tasks = tasks.filter((t) => t.id !== id);
  },

  getGoals: (): Goal[] => [...goals],

  createGoal: (newGoal: Partial<Goal> & { title: string }): Goal => {
    const goal: Goal = {
      id: crypto.randomUUID(),
      user_id: USER_ID,
      title: newGoal.title,
      description: newGoal.description ?? null,
      target_date: newGoal.target_date ?? null,
      status: newGoal.status ?? "active",
      progress: newGoal.progress ?? 0,
      priority: newGoal.priority ?? "medium",
      category: newGoal.category ?? "professional",
      color: newGoal.color ?? "#8B5CF6",
      milestones: newGoal.milestones ?? [],
      notes: newGoal.notes ?? [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    goals = [goal, ...goals];
    return goal;
  },

  updateGoal: (id: string, updates: Partial<Goal>): Goal | null => {
    const index = goals.findIndex((g) => g.id === id);
    if (index === -1) return null;
    goals[index] = { ...goals[index], ...updates, updated_at: new Date().toISOString() };
    goals = [...goals];
    return goals[index];
  },

  deleteGoal: (id: string): void => {
    goals = goals.filter((g) => g.id !== id);
  },

  createCategory: (cat: { name: string; color: string }): Category => {
    const newCat: Category = {
      id: crypto.randomUUID(),
      user_id: USER_ID,
      name: cat.name,
      color: cat.color,
      icon: null,
      sort_order: categories.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    categories = [...categories, newCat];
    return newCat;
  },
};
