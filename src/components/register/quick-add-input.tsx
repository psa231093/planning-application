"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Calendar, Clock, Flag, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreateTask } from "@/hooks/use-tasks";
import { useCategories } from "@/hooks/use-categories";
import {
  parseNaturalLanguage,
  getTokens,
} from "@/lib/utils/natural-language";

const TOKEN_ICONS = {
  date: Calendar,
  time: Calendar,
  duration: Clock,
  priority: Flag,
  category: Tag,
};

const TOKEN_COLORS = {
  date: "bg-blue-100 text-blue-700",
  time: "bg-blue-100 text-blue-700",
  duration: "bg-green-100 text-green-700",
  priority: "bg-orange-100 text-orange-700",
  category: "bg-violet-100 text-violet-700",
};

export function QuickAddInput() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();
  const { data: categories } = useCategories();

  const categoryNames = useMemo(
    () => categories?.map((c) => c.name) ?? [],
    [categories]
  );

  const tokens = useMemo(
    () => (input.length > 2 ? getTokens(input, categoryNames) : []),
    [input, categoryNames]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const parsed = parseNaturalLanguage(trimmed, categoryNames);

    const matchedCategory = parsed.categoryMatch
      ? categories?.find(
          (c) => c.name.toLowerCase() === parsed.categoryMatch!.toLowerCase()
        )
      : null;

    createTask.mutate({
      title: parsed.title || trimmed,
      priority: parsed.priority ?? "medium",
      estimated_minutes: parsed.estimatedMinutes,
      scheduled_start: parsed.scheduledStart?.toISOString() ?? null,
      scheduled_end: parsed.scheduledStart && parsed.estimatedMinutes
        ? new Date(
            parsed.scheduledStart.getTime() + parsed.estimatedMinutes * 60000
          ).toISOString()
        : null,
      status: parsed.scheduledStart ? "pending" : "unscheduled",
      category_id: matchedCategory?.id ?? null,
    });

    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Add a task... try "Tomorrow 2pm Design homepage 1h"'
            className="h-11 pl-4 pr-4 text-base"
            autoFocus
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || createTask.isPending}
          size="default"
          className="h-11 px-4"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </div>

      {tokens.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tokens.map((token, i) => {
            const Icon = TOKEN_ICONS[token.type];
            return (
              <Badge
                key={`${token.type}-${i}`}
                variant="outline"
                className={`gap-1 border-transparent text-xs ${TOKEN_COLORS[token.type]}`}
              >
                <Icon className="h-3 w-3" />
                {token.value}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
