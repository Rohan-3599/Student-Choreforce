import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Clock, DollarSign, User, CreditCard } from "lucide-react";
import { CATEGORY_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import { TaskChat } from "@/components/task-chat";
import { PaymentMethodBadge } from "@/components/payment-method-selector";
import type { Task, PaymentMethod } from "@shared/schema";
import type { User as AuthUser } from "@shared/models/auth";
import { formatDistanceToNow } from "date-fns";

interface TaskDetailDialogProps {
  task: (Task & { poster?: AuthUser | null; claimer?: AuthUser | null }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
  onClaim?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
  isClaimPending?: boolean;
  isCompletePending?: boolean;
  isCancelPending?: boolean;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  currentUserId,
  onClaim,
  onComplete,
  onCancel,
  isClaimPending,
  isCompletePending,
  isCancelPending,
}: TaskDetailDialogProps) {
  if (!task) return null;

  const category = CATEGORY_CONFIG[task.category];
  const status = STATUS_CONFIG[task.status];
  const CategoryIcon = category.icon;
  const isOwner = currentUserId === task.posterId;
  const isClaimer = currentUserId === task.claimerId;
  const canClaim = task.status === "open" && !isOwner && currentUserId;
  const canComplete = task.status === "claimed" && (isOwner || isClaimer);
  const canCancel = task.status === "open" && isOwner;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-md ${category.bgColor} flex items-center justify-center shrink-0`}>
              <CategoryIcon className={`w-5 h-5 ${category.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg leading-snug" data-testid="text-detail-title">
                {task.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={status.variant} data-testid="badge-detail-status">{status.label}</Badge>
                <span className="text-xs text-muted-foreground">{category.label}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2 flex-1 overflow-auto">
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-detail-description">
            {task.description}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                Service Fee
              </div>
              <p className="font-bold text-lg" data-testid="text-detail-budget">${(task.budget / 100).toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                Location
              </div>
              <p className="text-sm font-medium" data-testid="text-detail-location">{task.location}</p>
            </div>
          </div>

          {task.paymentMethod && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40" data-testid="section-payment-method">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Payment:</span>
              <PaymentMethodBadge method={task.paymentMethod as PaymentMethod} />
              {task.paymentStatus === "paid" && (
                <Badge variant="default" className="bg-emerald-600 ml-auto" data-testid="badge-payment-paid">Paid</Badge>
              )}
              {task.paymentStatus === "pending" && task.status !== "open" && (
                <Badge variant="outline" className="ml-auto text-amber-600 border-amber-300" data-testid="badge-payment-pending">Payment Pending</Badge>
              )}
            </div>
          )}


          {task.createdAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Posted {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3.5 h-3.5" /> Posted by
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={task.poster?.profileImageUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {(task.poster?.firstName?.[0] ?? "") + (task.poster?.lastName?.[0] ?? "")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {task.poster?.firstName} {task.poster?.lastName}
                </span>
              </div>
            </div>

            {task.claimer && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="w-3.5 h-3.5" /> Claimed by
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={task.claimer.profileImageUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {(task.claimer.firstName?.[0] ?? "") + (task.claimer.lastName?.[0] ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {task.claimer.firstName} {task.claimer.lastName}
                  </span>
                </div>
              </div>
            )}
          </div>

          {currentUserId && task.claimerId && (isOwner || isClaimer) && (
            <TaskChat
              taskId={task.id}
              currentUserId={currentUserId}
              taskStatus={task.status}
            />
          )}

          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {canClaim && onClaim && (
              <Button onClick={() => onClaim(task.id)} disabled={isClaimPending} data-testid="button-detail-claim">
                {isClaimPending ? "Claiming..." : "Claim This Task"}
              </Button>
            )}
            {canComplete && onComplete && (
              <Button onClick={() => onComplete(task.id)} disabled={isCompletePending} data-testid="button-detail-complete">
                {isCompletePending ? "Completing..." : "Mark Complete"}
              </Button>
            )}
            {canCancel && onCancel && (
              <Button variant="destructive" onClick={() => onCancel(task.id)} disabled={isCancelPending} data-testid="button-detail-cancel">
                {isCancelPending ? "Cancelling..." : "Cancel Task"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
