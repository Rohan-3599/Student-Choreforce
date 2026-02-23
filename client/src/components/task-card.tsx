import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, DollarSign, CheckCircle } from "lucide-react";
import { CATEGORY_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import type { Task } from "@shared/schema";
import type { User } from "@shared/models/auth";
import { formatDistanceToNow } from "date-fns";

interface TaskCardProps {
  task: Task & { poster?: User | null };
  currentUserId?: string;
  onClaim?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onViewDetail?: (taskId: string) => void;
  isClaimPending?: boolean;
  isCompletePending?: boolean;
}

export function TaskCard({ task, currentUserId, onClaim, onComplete, onViewDetail, isClaimPending, isCompletePending }: TaskCardProps) {
  const category = CATEGORY_CONFIG[task.category];
  const status = STATUS_CONFIG[task.status];
  const CategoryIcon = category.icon;
  const isOwner = currentUserId === task.posterId;
  const isClaimer = currentUserId === task.claimerId;
  const canClaim = task.status === "open" && !isOwner && currentUserId;
  const canComplete = task.status === "claimed" && (isOwner || isClaimer);

  return (
    <Card className="hover-elevate group" data-testid={`card-task-${task.id}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className={`w-10 h-10 rounded-md ${category.bgColor} flex items-center justify-center shrink-0`}>
            <CategoryIcon className={`w-5 h-5 ${category.color}`} />
          </div>
          <Badge variant={status.variant} data-testid={`badge-status-${task.id}`}>
            {status.label}
          </Badge>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold leading-snug line-clamp-2" data-testid={`text-task-title-${task.id}`}>
            {task.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-task-desc-${task.id}`}>
            {task.description}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span data-testid={`text-task-location-${task.id}`}>{task.location}</span>
          </div>
          {task.createdAt && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t">
          <div className="flex items-center gap-2">
            {task.poster && (
              <Avatar className="w-6 h-6">
                <AvatarImage src={task.poster.profileImageUrl ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(task.poster.firstName?.[0] ?? "") + (task.poster.lastName?.[0] ?? "")}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="text-xs text-muted-foreground">
              {task.poster?.firstName ?? "Anonymous"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 font-bold text-base" data-testid={`text-task-budget-${task.id}`}>
              <DollarSign className="w-4 h-4" />
              {task.budget}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canClaim && onClaim && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onClaim(task.id)}
              disabled={isClaimPending}
              data-testid={`button-claim-${task.id}`}
            >
              {isClaimPending ? "Claiming..." : "Claim Task"}
            </Button>
          )}
          {canComplete && onComplete && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onComplete(task.id)}
              disabled={isCompletePending}
              data-testid={`button-complete-${task.id}`}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              {isCompletePending ? "Completing..." : "Mark Complete"}
            </Button>
          )}
          {onViewDetail && (
            <Button
              size="sm"
              variant={(canClaim || canComplete) ? "outline" : "default"}
              className="w-full"
              onClick={() => onViewDetail(task.id)}
              data-testid={`button-view-${task.id}`}
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
