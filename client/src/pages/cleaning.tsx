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
import { Switch } from "@/components/ui/switch";
import {
  SprayCan, Zap, LogOut, ArrowLeft, Minus, Plus,
  CheckCircle, Sparkles, LayoutList, Clock, Info,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { PaymentMethod } from "@shared/schema";
import PaymentMethodSelector from "@/components/payment-method-selector";

type CleaningTier = "basic" | "deep";

const TIER_CONFIG: Record<CleaningTier, {
  label: string;
  description: string;
  basePay: number;
  includes: string[];
}> = {
  basic: {
    label: "Basic Organizing",
    description: "Light tidying and organizing your dorm room",
    basePay: 20,
    includes: [
      "Make bed and arrange pillows",
      "Organize desk and shelves",
      "Pick up and sort clothes",
      "Take out trash and recycling",
      "General tidying and straightening",
    ],
  },
  deep: {
    label: "Deep Room Clean",
    description: "Thorough cleaning of your entire dorm room",
    basePay: 45,
    includes: [
      "Everything in Basic Organizing",
      "Vacuum and mop floors",
      "Wipe down all surfaces and counters",
      "Clean mirrors and windows",
      "Sanitize bathroom area",
      "Dust shelves, vents, and fixtures",
      "Clean appliances (microwave, mini-fridge)",
    ],
  },
};

const HOURLY_RATE = 15;

export default function CleaningPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [tier, setTier] = useState<CleaningTier>("basic");
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [dormLocation, setDormLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const tierInfo = TIER_CONFIG[tier];
  const extraHours = Math.max(0, estimatedHours - 1);
  const extraHoursCost = extraHours * HOURLY_RATE;
  const totalPrice = tierInfo.basePay + extraHoursCost;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tasks", {
        title: `Dorm ${tierInfo.label}${estimatedHours > 1 ? ` (${estimatedHours}hr est.)` : ""}`,
        description: `${tierInfo.label} service. Estimated ${estimatedHours} hour${estimatedHours > 1 ? "s" : ""}. Base pay: $${tierInfo.basePay}${extraHoursCost > 0 ? `, plus $${extraHoursCost} for ${extraHours} extra hour${extraHours > 1 ? "s" : ""} at $${HOURLY_RATE}/hr` : ""}. ${notes ? `Notes: ${notes}` : ""}`.trim(),
        category: "dorm_cleaning",
        budget: totalPrice,
        location: dormLocation,
        paymentMethod: paymentMethod,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Cleaning order placed!", description: "A Tasker will arrive at your dorm soon." });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my/posted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setCheckoutOpen(false);
      navigate("/");
    },
    onError: () => {
      toast({ title: "Failed to place order", description: "Please try again.", variant: "destructive" });
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
            <SprayCan className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-lg" data-testid="text-cleaning-title">Dorm Cleaning</span>
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
          <h2 className="text-2xl font-bold" data-testid="text-page-heading">Dorm Cleaning Service</h2>
          <p className="text-muted-foreground text-sm">Choose your cleaning level and a Tasker will handle the rest</p>
        </div>

        <Card data-testid="card-cleaning-tier">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <SprayCan className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-base">Cleaning Type</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["basic", "deep"] as CleaningTier[]).map((t) => {
                const info = TIER_CONFIG[t];
                const isSelected = tier === t;
                const Icon = t === "basic" ? LayoutList : Sparkles;
                return (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-colors text-left ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                    data-testid={`button-tier-${t}`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-muted-foreground"}`} />
                      <span className={`font-semibold ${isSelected ? "text-blue-600" : "text-foreground"}`}>
                        {info.label}
                      </span>
                      <span className={`ml-auto text-sm font-bold ${isSelected ? "text-blue-600" : "text-muted-foreground"}`}>
                        ${info.basePay}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-whats-included">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-base">What's Included — {tierInfo.label}</h3>
            </div>
            <ul className="space-y-2">
              {tierInfo.includes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="card-estimated-hours">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-base">Estimated Time</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">First hour included in base pay</span>
                <p className="text-xs text-muted-foreground">+${HOURLY_RATE}/hr after the first hour</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={estimatedHours <= 1}
                  onClick={() => setEstimatedHours((h) => Math.max(1, h - 1))}
                  data-testid="button-hours-minus"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-bold w-12 text-center" data-testid="text-hours-count">
                  {estimatedHours}hr
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={estimatedHours >= 6}
                  onClick={() => setEstimatedHours((h) => Math.min(6, h + 1))}
                  data-testid="button-hours-plus"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {extraHours > 0 && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-muted-foreground flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  {extraHours} extra hour{extraHours > 1 ? "s" : ""} at ${HOURLY_RATE}/hr adds ${extraHoursCost} to the base pay.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{tierInfo.label} — base pay</span>
            <span>${tierInfo.basePay}</span>
          </div>
          {extraHours > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{extraHours} extra hr{extraHours > 1 ? "s" : ""} x ${HOURLY_RATE}/hr</span>
              <span>+${extraHoursCost}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t pt-2">
            <span className="font-semibold text-sm">Total</span>
            <span className="text-lg font-bold" data-testid="text-total-price">${totalPrice}</span>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => setCheckoutOpen(true)}
          data-testid="button-continue-checkout"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Continue — ${totalPrice}
        </Button>
      </main>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SprayCan className="w-5 h-5 text-blue-600" />
              Place Cleaning Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{tierInfo.label}</span>
                <span className="font-medium">${tierInfo.basePay}</span>
              </div>
              {extraHours > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{extraHours} extra hr{extraHours > 1 ? "s" : ""} at ${HOURLY_RATE}/hr</span>
                  <span className="font-medium">+${extraHoursCost}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Estimated time: {estimatedHours} hour{estimatedHours > 1 ? "s" : ""}
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span data-testid="text-checkout-total">${totalPrice}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dorm-location">Dorm Location *</Label>
              <Input
                id="dorm-location"
                placeholder="e.g., McCarthy Hall, Room 215"
                value={dormLocation}
                onChange={(e) => setDormLocation(e.target.value)}
                data-testid="input-dorm-location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaning-notes">Notes for Tasker (optional)</Label>
              <Textarea
                id="cleaning-notes"
                placeholder="Any special instructions? e.g., Focus on the bathroom area"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={2}
                data-testid="input-cleaning-notes"
              />
            </div>

            <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />

            <Button
              className="w-full"
              size="lg"
              disabled={!dormLocation.trim() || !paymentMethod || createOrderMutation.isPending}
              onClick={() => createOrderMutation.mutate()}
              data-testid="button-place-order"
            >
              {createOrderMutation.isPending ? "Placing Order..." : `Place Order — $${totalPrice}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
