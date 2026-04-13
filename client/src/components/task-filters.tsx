import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_CONFIG, USC_BUILDINGS, POPULAR_LANGUAGES } from "@/lib/constants";
import type { TaskCategory } from "@shared/schema";
import { LayoutGrid, Filter, Search } from "lucide-react";
import { useMemo } from "react";

interface TaskFiltersProps {
  selectedCategory: TaskCategory | "all";
  onCategoryChange: (category: TaskCategory | "all") => void;
  languageFilter?: string;
  onLanguageChange?: (language: string) => void;
  buildingFilter?: string;
  onBuildingChange?: (building: string) => void;
}

export function TaskFilters({ 
  selectedCategory, 
  onCategoryChange,
  languageFilter,
  onLanguageChange,
  buildingFilter,
  onBuildingChange
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3" data-testid="task-filters">
      <div className="flex items-center gap-2 flex-wrap">
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

      {(onLanguageChange !== undefined || onBuildingChange !== undefined) && (
        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2 font-medium">
            <Filter className="w-4 h-4" />
            Filters:
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {onLanguageChange !== undefined && (
              <Select value={languageFilter || "none"} onValueChange={(v) => onLanguageChange(v === "none" ? "" : v)}>
                <SelectTrigger className="w-[140px] h-9" data-testid="select-filter-language">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any Language</SelectItem>
                  {POPULAR_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {onBuildingChange !== undefined && (
              <Select value={buildingFilter || "none"} onValueChange={(v) => onBuildingChange(v === "none" ? "" : v)}>
                <SelectTrigger className="w-[180px] h-9" data-testid="select-filter-building">
                  <SelectValue placeholder="Building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any Building</SelectItem>
                  {USC_BUILDINGS.map((building) => (
                    <SelectItem key={building} value={building}>{building}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
