"use client";

import { CategoryManager } from "./category-manager";

export function SettingsView() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <CategoryManager />
    </div>
  );
}
