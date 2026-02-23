import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { TaskCard } from "@/components/task-card";
import { TaskFilters } from "@/components/task-filters";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, LogOut, ClipboardList, Send } from "lucide-react";
import type { Task, TaskCategory } from "@shared/schema";
import type { User } from "@shared/models/auth";
import { Link } from "wouter";

export default function TaskerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | "all">("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const categoryParam = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
  const { data: allTasks, isLoading: allLoading } = useQuery<(Task & { poster?: User | null })[]>({
    queryKey: [`/api/tasks${categoryParam}`],
  });

  const { data: claimedTasks, isLoading: claimedLoading } = useQuery<(Task & { poster?: User | null })[]>({
    queryKey: ["/api/tasks/my/claimed"],
  });

  const { data: selectedTask } = useQuery<Task & { poster?: User | null; claimer?: User | null }>({
    queryKey: [`/api/tasks/${selectedTaskId}`],
    enabled: !!selectedTaskId,
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

  const openTasks = allTasks?.filter((t) => t.status === "open" && t.posterId !== user?.id) ?? [];
  const myActiveClaimed = claimedTasks?.filter((t) => t.status === "claimed") ?? [];
  const myCompletedClaimed = claimedTasks?.filter((t) => t.status === "completed") ?? [];

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
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-switch-requester">
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Switch to Requester
              </Button>
            </Link>
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
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-tasker-title">
            Find Tasks
          </h1>
          <p className="text-muted-foreground">Browse available tasks and earn money helping fellow Trojans.</p>
        </div>

        <Tabs defaultValue="browse">
          <TabsList data-testid="tabs-tasker">
            <TabsTrigger value="browse" data-testid="tab-browse">
              Browse ({openTasks.length})
            </TabsTrigger>
            <TabsTrigger value="my-jobs" data-testid="tab-my-jobs">
              My Jobs ({myActiveClaimed.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({myCompletedClaimed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <TaskFilters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
              <p className="text-sm text-muted-foreground" data-testid="text-task-count">
                {openTasks.length} available {openTasks.length === 1 ? "task" : "tasks"}
              </p>
            </div>

            {allLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-md" />
                ))}
              </div>
            ) : openTasks.length === 0 ? (
              <EmptyState message="No open tasks available right now. Check back soon!" />
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
          </TabsContent>

          <TabsContent value="my-jobs" className="mt-6">
            {claimedLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-md" />)}
              </div>
            ) : myActiveClaimed.length === 0 ? (
              <EmptyState message="You haven't claimed any tasks yet. Browse available tasks to get started!" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myActiveClaimed.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={user?.id}
                    onViewDetail={(id) => setSelectedTaskId(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {claimedLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-md" />)}
              </div>
            ) : myCompletedClaimed.length === 0 ? (
              <EmptyState message="No completed tasks yet. Claim a task to start earning!" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCompletedClaimed.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={user?.id}
                    onViewDetail={(id) => setSelectedTaskId(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <TaskDetailDialog
        task={selectedTask ?? null}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
        currentUserId={user?.id}
        onClaim={(id) => claimMutation.mutate(id)}
        onComplete={(id) => completeMutation.mutate(id)}
        isClaimPending={claimMutation.isPending}
        isCompletePending={completeMutation.isPending}
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 space-y-3">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
        <ClipboardList className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}
