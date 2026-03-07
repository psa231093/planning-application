"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/providers/auth-provider";
import { mockStore } from "@/lib/mock-store";
import type { Tables } from "@/types/database";
import { toast } from "sonner";

type Task = Tables<"tasks"> & {
  categories?: Tables<"categories"> | null;
};

type TaskStatus = "unscheduled" | "pending" | "in_progress" | "completed" | "overdue";

type TaskFilters = {
  status?: TaskStatus | TaskStatus[];
  category_id?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  scheduled?: boolean;
  startDate?: string;
  endDate?: string;
};

function buildQueryKey(filters: TaskFilters) {
  return ["tasks", filters] as const;
}

export function useTasks(filters: TaskFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: buildQueryKey(filters),
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 100));

      let result = mockStore.getTasks();

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          result = result.filter((t) => (filters.status as TaskStatus[]).includes(t.status));
        } else {
          result = result.filter((t) => t.status === filters.status);
        }
      }

      if (filters.category_id) {
        result = result.filter((t) => t.category_id === filters.category_id);
      }

      if (filters.priority) {
        result = result.filter((t) => t.priority === filters.priority);
      }

      if (filters.scheduled === true) {
        result = result.filter((t) => t.scheduled_start !== null);
      } else if (filters.scheduled === false) {
        result = result.filter((t) => t.scheduled_start === null);
      }

      return result;
    },
    enabled: !!user,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTask: Partial<Task> & { title: string }) => {
      await new Promise((r) => setTimeout(r, 50));
      return mockStore.createTask(newTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
    },
    onError: () => {
      toast.error("Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      await new Promise((r) => setTimeout(r, 50));
      const result = mockStore.updateTask(id, updates);
      if (!result) throw new Error("Task not found");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 50));
      mockStore.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });
}
