import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_CONFIG, USC_BUILDINGS, POPULAR_LANGUAGES } from "@/lib/constants";
import type { TaskCategory } from "@shared/schema";
import { LayoutGrid, Filter, Search } from "lucide-react";

interface TaskFiltersProps {
  selectedCategory: TaskCategory | "all";
  onCategoryChange: (category: TaskCategory | "all") => void;
  genderFilter?: string;
  onGenderChange?: (gender: string) => void;
  buildingFilter?: string;
  onBuildingChange?: (building: string) => void;
  languageFilter?: string;
  onLanguageChange?: (language: string) => void;
}

export function TaskFilters({ 
  selectedCategory, 
  onCategoryChange,
  genderFilter,
  onGenderChange,
  buildingFilter,
  onBuildingChange,
  languageFilter,
  onLanguageChange
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

      {(onGenderChange !== undefined || onBuildingChange !== undefined) && (
        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2 font-medium">
            <Filter className="w-4 h-4" />
            Filters:
          </div>
          
          {onGenderChange !== undefined && (
            <div className="flex items-center gap-2">
              <select
                className="h-8 text-sm border-input bg-background rounded-md px-2 ring-offset-background outline-none border focus-visible:ring-1 focus-visible:ring-ring"
                value={genderFilter || ""}
                onChange={(e) => onGenderChange(e.target.value)}
              >
                <option value="">Any Poster Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {onBuildingChange !== undefined && (
            <div className="flex items-center gap-2">
              <select
                className="h-8 text-sm border-input bg-background rounded-md px-2 ring-offset-background outline-none border focus-visible:ring-1 focus-visible:ring-ring w-[180px]"
                value={buildingFilter || ""}
                onChange={(e) => onBuildingChange(e.target.value)}
              >
                <option value="">Any Building</option>
                {USC_BUILDINGS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {onLanguageChange !== undefined && (
            <div className="flex items-center gap-2">
              <select
                className="h-8 text-sm border-input bg-background rounded-md px-2 ring-offset-background outline-none border focus-visible:ring-1 focus-visible:ring-ring"
                value={languageFilter || ""}
                onChange={(e) => onLanguageChange(e.target.value)}
              >
                <option value="">Any Language</option>
                {POPULAR_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
