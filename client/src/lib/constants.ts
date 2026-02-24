import { ShoppingCart, SprayCan, WashingMachine, ClipboardList } from "lucide-react";
import type { TaskCategory, TaskStatus } from "@shared/schema";

export const CATEGORY_CONFIG: Record<TaskCategory, {
  label: string;
  icon: typeof ShoppingCart;
  color: string;
  bgColor: string;
  price: number;
}> = {
  grocery_shopping: {
    label: "Grocery Shopping",
    icon: ShoppingCart,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    price: 0,
  },
  dorm_cleaning: {
    label: "Dorm Cleaning",
    icon: SprayCan,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    price: 35,
  },
  laundry: {
    label: "Laundry",
    icon: WashingMachine,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    price: 20,
  },
  other: {
    label: "Custom Task",
    icon: ClipboardList,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    price: 0,
  },
};

export const STATUS_CONFIG: Record<TaskStatus, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}> = {
  open: { label: "Open", variant: "default" },
  claimed: { label: "Claimed", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "secondary" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};
