import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { TaskCard } from "@/components/task-card";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, LogOut, ClipboardList, HardHat, WashingMachine, SprayCan, PenLine } from "lucide-react";
import type { Task, InsertTask } from "@shared/schema";
import type { User } from "@shared/models/auth";
import { Link } from "wouter";

export default function RequesterPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: postedTasks, isLoading: postedLoading } = useQuery<(Task & { poster?: User | null })[]>({
    queryKey: ["/api/tasks/my/posted"],
  });

  const { data: selectedTask } = useQuery<Task & { poster?: User | null; claimer?: User | null }>({
    queryKey: [`/api/tasks/${selectedTaskId}`],
    enabled: !!selectedTaskId,
  });

  const cancelMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest("POST", `/api/tasks/${taskId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task cancelled" });
      setSelectedTaskId(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        return;
      }
      toast({ title: "Error", description: "Failed to cancel task.", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest("POST", `/api/tasks/${taskId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task completed!", description: "Thanks for confirming!" });
      setSelectedTaskId(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        return;
      }
      toast({ title: "Error", description: "Failed to complete task.", variant: "destructive" });
    },
  });

  const openTasks = postedTasks?.filter((t) => t.status === "open") ?? [];
  const activeTasks = postedTasks?.filter((t) => t.status === "claimed") ?? [];
  const pastTasks = postedTasks?.filter((t) => t.status === "completed" || t.status === "cancelled") ?? [];

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
            <Link href="/laundry">
              <Button variant="outline" size="sm" data-testid="button-laundry">
                <WashingMachine className="w-3.5 h-3.5 mr-1.5" />
                Laundry
              </Button>
            </Link>
            <Link href="/cleaning">
              <Button variant="outline" size="sm" data-testid="button-cleaning">
                <SprayCan className="w-3.5 h-3.5 mr-1.5" />
                Cleaning
              </Button>
            </Link>
            <Link href="/custom">
              <Button variant="outline" size="sm" data-testid="button-custom-task">
                <PenLine className="w-3.5 h-3.5 mr-1.5" />
                Custom Task
              </Button>
            </Link>
            <Link href="/tasker">
              <Button variant="outline" size="sm" data-testid="button-switch-tasker">
                <HardHat className="w-3.5 h-3.5 mr-1.5" />
                Switch to Tasker
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {(user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => logout()}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-requester-title">
            My Requests
          </h1>
          <p className="text-muted-foreground">Track your chores and requests.</p>
        </div>

        <Tabs defaultValue="open">
          <TabsList data-testid="tabs-requester">
            <TabsTrigger value="open" data-testid="tab-open">
              Open ({openTasks.length})
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">
              Active ({activeTasks.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Past ({pastTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6">
            {postedLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-md" />)}
              </div>
            ) : openTasks.length === 0 ? (
              <EmptyState message="No open tasks. Select a service above to get help from fellow Trojans!" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {openTasks.map((task) => (
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

          <TabsContent value="active" className="mt-6">
            {postedLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-md" />)}
              </div>
            ) : activeTasks.length === 0 ? (
              <EmptyState message="No tasks in progress right now." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={user?.id}
                    onComplete={(id) => completeMutation.mutate(id)}
                    onViewDetail={(id) => setSelectedTaskId(id)}
                    isCompletePending={completeMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {postedLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-md" />)}
              </div>
            ) : pastTasks.length === 0 ? (
              <EmptyState message="No completed or cancelled tasks yet." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastTasks.map((task) => (
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
        onComplete={(id) => completeMutation.mutate(id)}
        onCancel={(id) => cancelMutation.mutate(id)}
        isCompletePending={completeMutation.isPending}
        isCancelPending={cancelMutation.isPending}
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
