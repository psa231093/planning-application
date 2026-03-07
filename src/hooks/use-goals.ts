"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/providers/auth-provider";
import { mockStore } from "@/lib/mock-store";
import type { Goal } from "@/lib/mock-store";
import { toast } from "sonner";

export function useGoals(filters?: { status?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["goals", filters],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 80));
      let result = mockStore.getGoals();
      if (filters?.status) {
        result = result.filter((g) => g.status === filters.status);
      }
      return result;
    },
    enabled: !!user,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newGoal: Partial<Goal> & { title: string }) => {
      await new Promise((r) => setTimeout(r, 50));
      return mockStore.createGoal(newGoal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal created");
    },
    onError: () => {
      toast.error("Failed to create goal");
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      await new Promise((r) => setTimeout(r, 50));
      const result = mockStore.updateGoal(id, updates);
      if (!result) throw new Error("Goal not found");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: () => {
      toast.error("Failed to update goal");
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 50));
      mockStore.deleteGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal deleted");
    },
    onError: () => {
      toast.error("Failed to delete goal");
    },
  });
}
