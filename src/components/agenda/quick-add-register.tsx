"use client";

import { useState } from "react";
import { Inbox, Plus, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreateTask } from "@/hooks/use-tasks";
import { toast } from "sonner";

type Priority = "low" | "medium" | "high" | "urgent";

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-slate-500 border-slate-200 hover:border-slate-400" },
  { value: "medium", label: "Med", color: "text-blue-600 border-blue-200 hover:border-blue-400" },
  { value: "high", label: "High", color: "text-orange-600 border-orange-200 hover:border-orange-400" },
  { value: "urgent", label: "Urgent", color: "text-red-600 border-red-200 hover:border-red-400" },
];

const PRIORITY_ACTIVE: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-300",
  medium: "bg-blue-50 text-blue-700 border-blue-300",
  high: "bg-orange-50 text-orange-700 border-orange-300",
  urgent: "bg-red-50 text-red-700 border-red-300",
};

export function QuickAddRegister() {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);
  const createTask = useCreateTask();

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    createTask.mutate(
      {
        title: trimmed,
        priority,
        status: "unscheduled",
        scheduled_start: null,
        scheduled_end: null,
      },
      {
        onSuccess: () => {
          setRecentlyAdded((prev) => [trimmed, ...prev].slice(0, 3));
          setTitle("");
          toast.success("Added to Register");
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Inbox className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-sm font-semibold">Quick Add to Register</h3>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Input */}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Task name..."
          className="h-10 text-sm sm:h-8"
        />

        {/* Priority row + button */}
        <div className="flex items-center gap-1.5">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={cn(
                "flex-1 rounded-md border text-[11px] py-2.5 min-h-[44px] transition-all duration-100 sm:py-1 sm:min-h-0",
                priority === opt.value
                  ? PRIORITY_ACTIVE[opt.value]
                  : opt.color + " bg-transparent"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          className="w-full h-11 text-sm gap-1.5 sm:h-8 sm:text-xs"
          onClick={handleSubmit}
          disabled={!title.trim() || createTask.isPending}
        >
          <Plus className="h-3.5 w-3.5" />
          Add to Register
        </Button>

        {/* Recently added */}
        {recentlyAdded.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Just added
            </p>
            {recentlyAdded.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <ArrowRight className="h-3 w-3 shrink-0 text-primary/60" />
                <span className="truncate">{t}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
