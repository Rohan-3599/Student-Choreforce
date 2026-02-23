import { Button } from "@/components/ui/button";
import { CATEGORY_CONFIG } from "@/lib/constants";
import type { TaskCategory } from "@shared/schema";
import { LayoutGrid } from "lucide-react";

interface TaskFiltersProps {
  selectedCategory: TaskCategory | "all";
  onCategoryChange: (category: TaskCategory | "all") => void;
}

export function TaskFilters({ selectedCategory, onCategoryChange }: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="task-filters">
      <Button
        variant={selectedCategory === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange("all")}
        data-testid="filter-all"
      >
        <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
        All
      </Button>
      {(Object.entries(CATEGORY_CONFIG) as [TaskCategory, typeof CATEGORY_CONFIG[TaskCategory]][]).map(
        ([key, config]) => {
          const Icon = config.icon;
          return (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(key)}
              data-testid={`filter-${key}`}
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {config.label}
            </Button>
          );
        }
      )}
    </div>
  );
}
