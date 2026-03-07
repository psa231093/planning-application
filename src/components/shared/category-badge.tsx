"use client";

import { Badge } from "@/components/ui/badge";

interface CategoryBadgeProps {
  name: string;
  color: string;
}

export function CategoryBadge({ name, color }: CategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-transparent px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </Badge>
  );
}
