"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  AlertTriangle,
} from "lucide-react";
import { PRIORITY_COLORS, type Priority } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";

const icons: Record<Priority, React.ElementType> = {
  low: ArrowDown,
  medium: ArrowRight,
  high: ArrowUp,
  urgent: AlertTriangle,
};

interface TaskPriorityIconProps {
  priority: Priority;
  className?: string;
}

export function TaskPriorityIcon({ priority, className }: TaskPriorityIconProps) {
  const Icon = icons[priority];
  return (
    <Icon
      className={cn("h-4 w-4", PRIORITY_COLORS[priority], className)}
    />
  );
}
