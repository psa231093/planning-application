"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/providers/auth-provider";
import { mockStore } from "@/lib/mock-store";
import { toast } from "sonner";

export function useCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 50));
      return mockStore.getCategories();
    },
    enabled: !!user,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: { name: string; color: string }) => {
      await new Promise((r) => setTimeout(r, 50));
      return mockStore.createCategory(category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
    },
    onError: () => {
      toast.error("Failed to create category");
    },
  });
}
