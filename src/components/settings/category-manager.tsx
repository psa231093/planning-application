"use client";

import { useState } from "react";
import { useCategories, useCreateCategory } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Tag } from "lucide-react";

const PRESET_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
  "#F97316",
  "#84CC16",
];

export function CategoryManager() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    createCategory.mutate(
      { name: trimmed, color: newColor },
      {
        onSuccess: () => {
          setNewName("");
          setNewColor(PRESET_COLORS[0]);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Categories
        </CardTitle>
        <CardDescription>
          Organize your tasks with color-coded categories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : categories && categories.length > 0 ? (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No categories yet. Create one below.
          </p>
        )}

        <div className="space-y-3 border-t pt-4">
          <Label>New category</Label>
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || createCategory.isPending}
              size="sm"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className="h-11 w-11 rounded-full border-2 transition-transform hover:scale-110 sm:h-7 sm:w-7"
                style={{
                  backgroundColor: color,
                  borderColor: newColor === color ? "white" : "transparent",
                  boxShadow:
                    newColor === color ? `0 0 0 2px ${color}` : "none",
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
