import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ClipboardList, Zap, LogOut, ArrowLeft, Minus, Plus,
  CheckCircle, DollarSign, MapPin, FileText, Pencil,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { PaymentMethod } from "@shared/schema";
import PaymentMethodSelector from "@/components/payment-method-selector";

const MIN_PRICE = 5;
const MAX_PRICE = 500;

export default function CustomTaskPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(15);
  const [location, setLocation] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const isFormValid = title.trim().length >= 3 && description.trim().length >= 10 && location.trim().length >= 2 && price >= MIN_PRICE;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tasks", {
        title: title.trim(),
        description: description.trim(),
        category: "other",
        budget: price,
        location: location.trim(),
        paymentMethod: paymentMethod,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Task posted!", description: "Your task is now visible to Taskers." });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my/posted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setCheckoutOpen(false);
      navigate("/");
    },
    onError: () => {
      toast({ title: "Failed to post task", description: "Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white dark:bg-card sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <ClipboardList className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-lg" data-testid="text-custom-title">Custom Task</span>
          </div>
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
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold" data-testid="text-page-heading">Post a Custom Task</h2>
          <p className="text-muted-foreground text-sm">Describe what you need done and set your price — a fellow Trojan will pick it up</p>
        </div>

        <Card data-testid="card-task-details">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-base">Task Details</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title *</Label>
              <Input
                id="task-title"
                placeholder="e.g., Pick up my package from the mailroom"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                data-testid="input-task-title"
              />
              <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description *</Label>
              <Textarea
                id="task-description"
                placeholder="Describe exactly what you need done. Be specific so Taskers know what to expect. Include any details like timing, size, or special requirements."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
                rows={4}
                maxLength={500}
                data-testid="input-task-description"
              />
              <p className="text-xs text-muted-foreground">{description.length}/500 characters</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-price">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-base">Your Price</h3>
            </div>
            <p className="text-sm text-muted-foreground">Set how much you're willing to pay for this task</p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                disabled={price <= MIN_PRICE}
                onClick={() => setPrice((p) => Math.max(MIN_PRICE, p - 5))}
                data-testid="button-price-minus"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-3xl font-bold" data-testid="text-price">${price}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={price >= MAX_PRICE}
                onClick={() => setPrice((p) => Math.min(MAX_PRICE, p + 5))}
                data-testid="button-price-plus"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-center">
              <Input
                type="number"
                min={MIN_PRICE}
                max={MAX_PRICE}
                value={price}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setPrice(Math.max(MIN_PRICE, Math.min(MAX_PRICE, val)));
                }}
                className="w-28 text-center"
                data-testid="input-price-custom"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">Min ${MIN_PRICE} — Max ${MAX_PRICE}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-location">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-base">Location</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-location">Where should the Tasker go? *</Label>
              <Input
                id="task-location"
                placeholder="e.g., Leavey Library, 2nd floor"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                data-testid="input-task-location"
              />
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm">Total</span>
            <span className="text-lg font-bold" data-testid="text-total-price">${price}</span>
          </div>
          {title.trim() && (
            <p className="text-xs text-muted-foreground truncate">{title.trim()}</p>
          )}
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!isFormValid}
          onClick={() => setCheckoutOpen(true)}
          data-testid="button-continue-checkout"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Review & Post — ${price}
        </Button>
      </main>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-600" />
              Confirm Your Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="font-medium text-sm" data-testid="text-review-title">{title.trim()}</div>
              <p className="text-xs text-muted-foreground line-clamp-3" data-testid="text-review-description">{description.trim()}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span data-testid="text-review-location">{location.trim()}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>You'll pay</span>
                <span data-testid="text-checkout-total">${price}</span>
              </div>
            </div>

            <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />

            <Button
              className="w-full"
              size="lg"
              disabled={!paymentMethod || createOrderMutation.isPending}
              onClick={() => createOrderMutation.mutate()}
              data-testid="button-place-order"
            >
              {createOrderMutation.isPending ? "Posting..." : `Post Task — $${price}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
