"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { X } from "lucide-react";

interface TaskFiltersProps {
  priorityFilter: string;
  categoryFilter: string;
  onPriorityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClear: () => void;
}

export function TaskFilters({
  priorityFilter,
  categoryFilter,
  onPriorityChange,
  onCategoryChange,
  onClear,
}: TaskFiltersProps) {
  const { data: categories } = useCategories();
  const hasFilters = priorityFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="flex items-center gap-2">
      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories?.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2">
          <X className="mr-1 h-3 w-3" />
          Clear
          <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
            {(priorityFilter !== "all" ? 1 : 0) +
              (categoryFilter !== "all" ? 1 : 0)}
          </Badge>
        </Button>
      )}
    </div>
  );
}
