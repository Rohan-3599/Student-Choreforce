import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { TaskCard } from "@/components/task-card";
import { TaskFilters } from "@/components/task-filters";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Zap, LogOut, ListChecks, ClipboardList } from "lucide-react";
import type { Task, TaskCategory, InsertTask } from "@shared/schema";
import type { User } from "@shared/models/auth";
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | "all">("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const categoryParam = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
  const { data: tasks, isLoading } = useQuery<(Task & { poster?: User | null })[]>({
    queryKey: [`/api/tasks${categoryParam}`],
  });

  const { data: selectedTask } = useQuery<Task & { poster?: User | null; claimer?: User | null }>({
    queryKey: [`/api/tasks/${selectedTaskId}`],
    enabled: !!selectedTaskId,
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTask) => apiRequest("POST", "/api/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task posted!", description: "Your task is now visible to other students." });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
    },
  });

  const claimMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest("POST", `/api/tasks/${taskId}/claim`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task claimed!", description: "You've claimed this task. Time to get to work!" });
      setSelectedTaskId(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to claim task.", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest("POST", `/api/tasks/${taskId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task completed!", description: "Great job, Trojan!" });
      setSelectedTaskId(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to complete task.", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest("POST", `/api/tasks/${taskId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task cancelled", description: "Your task has been cancelled." });
      setSelectedTaskId(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to cancel task.", variant: "destructive" });
    },
  });

  const openTasks = tasks?.filter((t) => t.status === "open") ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">TaskForce</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/my-tasks">
              <Button variant="outline" size="sm" data-testid="button-my-tasks">
                <ListChecks className="w-3.5 h-3.5 mr-1.5" />
                My Tasks
              </Button>
            </Link>
            <CreateTaskDialog onSubmit={(data) => createMutation.mutate(data)} isPending={createMutation.isPending} />
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {(user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")}
                </AvatarFallback>
              </Avatar>
              <a href="/api/logout">
                <Button variant="ghost" size="icon" data-testid="button-logout">
                  <LogOut className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-welcome">
            Welcome back, {user?.firstName ?? "Trojan"}
          </h1>
          <p className="text-muted-foreground">Browse open tasks or post your own.</p>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TaskFilters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
          <p className="text-sm text-muted-foreground" data-testid="text-task-count">
            {openTasks.length} open {openTasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-md" />
            ))}
          </div>
        ) : openTasks.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <ClipboardList className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No open tasks</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {selectedCategory !== "all"
                ? `No open ${CATEGORY_CONFIG_LABEL[selectedCategory]} tasks right now. Try a different category.`
                : "Be the first to post a task and get help from fellow Trojans!"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {openTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={user?.id}
                onClaim={(id) => claimMutation.mutate(id)}
                onViewDetail={(id) => setSelectedTaskId(id)}
                isClaimPending={claimMutation.isPending}
              />
            ))}
          </div>
        )}
      </main>

      <TaskDetailDialog
        task={selectedTask ?? null}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
        currentUserId={user?.id}
        onClaim={(id) => claimMutation.mutate(id)}
        onComplete={(id) => completeMutation.mutate(id)}
        onCancel={(id) => cancelMutation.mutate(id)}
        isClaimPending={claimMutation.isPending}
        isCompletePending={completeMutation.isPending}
        isCancelPending={cancelMutation.isPending}
      />
    </div>
  );
}

const CATEGORY_CONFIG_LABEL: Record<string, string> = {
  grocery_shopping: "Grocery Shopping",
  dorm_cleaning: "Dorm Cleaning",
  laundry: "Laundry",
};
