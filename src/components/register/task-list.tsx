"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface TaskSectionProps {
  label: string;
  color: string;
  count: number;
  children: ReactNode;
  defaultOpen?: boolean;
  isInbox?: boolean;
}

export function TaskSection({
  label,
  color,
  count,
  children,
  defaultOpen = true,
  isInbox = false,
}: TaskSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={
        isInbox
          ? "border-b last:border-b-0 bg-muted/30"
          : "border-b last:border-b-0"
      }
    >
      {/* Section header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center gap-2 px-6 py-2.5 text-left transition-colors hover:bg-muted/50"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className={isInbox ? "text-sm font-semibold" : "text-sm font-semibold"}>
          {label}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${color}18`,
            color: color,
          }}
        >
          {count}
        </span>
        {isInbox && count > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            · needs scheduling
          </span>
        )}
      </button>

      {/* Task rows */}
      {isOpen && <div>{children}</div>}
    </div>
  );
}
