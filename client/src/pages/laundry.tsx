import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  WashingMachine, Zap, LogOut, ArrowLeft, Minus, Plus,
  CheckCircle, Droplets, Wind, Thermometer, RotateCw,
} from "lucide-react";
import { Link, useLocation } from "wouter";

type ServiceType = "wash" | "dry" | "both";

const SERVICE_LABELS: Record<ServiceType, string> = {
  wash: "Washing Only",
  dry: "Drying Only",
  both: "Wash & Dry",
};

const SERVICE_ICONS: Record<ServiceType, typeof Droplets> = {
  wash: Droplets,
  dry: Wind,
  both: WashingMachine,
};

const WASH_TEMPS = ["Cold", "Warm", "Hot"] as const;
const WASH_CYCLES = ["Normal", "Delicates", "Heavy Duty", "Quick Wash", "Permanent Press"] as const;
const DRY_HEATS = ["No Heat / Air Dry", "Low", "Medium", "High"] as const;
const DRY_CYCLES = ["Normal", "Delicates", "Heavy Duty", "Timed Dry", "Permanent Press"] as const;

const PRICE_PER_LOAD = 20;

export default function LaundryPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [loads, setLoads] = useState(1);
  const [serviceType, setServiceType] = useState<ServiceType>("both");
  const [washTemp, setWashTemp] = useState<string>("Cold");
  const [washCycle, setWashCycle] = useState<string>("Normal");
  const [dryHeat, setDryHeat] = useState<string>("Medium");
  const [dryCycle, setDryCycle] = useState<string>("Normal");
  const [pickupLocation, setPickupLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const totalPrice = loads * PRICE_PER_LOAD;
  const showWasher = serviceType === "wash" || serviceType === "both";
  const showDryer = serviceType === "dry" || serviceType === "both";

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const settingsParts: string[] = [];
      if (showWasher) settingsParts.push(`Wash: ${washTemp}, ${washCycle}`);
      if (showDryer) settingsParts.push(`Dry: ${dryHeat}, ${dryCycle}`);

      const res = await apiRequest("POST", "/api/tasks", {
        title: `Laundry ${SERVICE_LABELS[serviceType]} — ${loads} load${loads > 1 ? "s" : ""}`,
        description: `${SERVICE_LABELS[serviceType]} service for ${loads} load${loads > 1 ? "s" : ""}. ${settingsParts.join(". ")}. ${notes ? `Notes: ${notes}` : ""}`.trim(),
        category: "laundry",
        budget: totalPrice,
        location: pickupLocation,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Laundry order placed!", description: "A Tasker will pick up your laundry soon." });
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
            <WashingMachine className="w-5 h-5 text-violet-600" />
            <span className="font-bold text-lg" data-testid="text-laundry-title">Laundry Service</span>
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
          <h2 className="text-2xl font-bold" data-testid="text-page-heading">Configure Your Laundry</h2>
          <p className="text-muted-foreground text-sm">Pick your settings and a Tasker will handle the rest</p>
        </div>

        <Card data-testid="card-load-amount">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-violet-600" />
              <h3 className="font-semibold text-base">Load Amount</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">${PRICE_PER_LOAD} per load</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={loads <= 1}
                  onClick={() => setLoads((l) => Math.max(1, l - 1))}
                  data-testid="button-loads-minus"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-bold w-8 text-center" data-testid="text-loads-count">{loads}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={loads >= 10}
                  onClick={() => setLoads((l) => Math.min(10, l + 1))}
                  data-testid="button-loads-plus"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-service-type">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <WashingMachine className="w-5 h-5 text-violet-600" />
              <h3 className="font-semibold text-base">Service Type</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["wash", "dry", "both"] as ServiceType[]).map((type) => {
                const Icon = SERVICE_ICONS[type];
                const isSelected = serviceType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setServiceType(type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? "border-violet-600 bg-violet-50 dark:bg-violet-950/30"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                    data-testid={`button-service-${type}`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? "text-violet-600" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${isSelected ? "text-violet-600" : "text-muted-foreground"}`}>
                      {SERVICE_LABELS[type]}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {showWasher && (
          <Card data-testid="card-washer-settings">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-base">Washer Settings</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Thermometer className="w-3.5 h-3.5" />
                    Water Temperature
                  </Label>
                  <Select value={washTemp} onValueChange={setWashTemp}>
                    <SelectTrigger data-testid="select-wash-temp">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WASH_TEMPS.map((t) => (
                        <SelectItem key={t} value={t} data-testid={`option-wash-temp-${t.toLowerCase()}`}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <RotateCw className="w-3.5 h-3.5" />
                    Wash Cycle
                  </Label>
                  <Select value={washCycle} onValueChange={setWashCycle}>
                    <SelectTrigger data-testid="select-wash-cycle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WASH_CYCLES.map((c) => (
                        <SelectItem key={c} value={c} data-testid={`option-wash-cycle-${c.toLowerCase().replace(/\s+/g, "-")}`}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showDryer && (
          <Card data-testid="card-dryer-settings">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-base">Dryer Settings</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Thermometer className="w-3.5 h-3.5" />
                    Heat Level
                  </Label>
                  <Select value={dryHeat} onValueChange={setDryHeat}>
                    <SelectTrigger data-testid="select-dry-heat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DRY_HEATS.map((h) => (
                        <SelectItem key={h} value={h} data-testid={`option-dry-heat-${h.toLowerCase().replace(/[\s\/]+/g, "-")}`}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <RotateCw className="w-3.5 h-3.5" />
                    Dry Cycle
                  </Label>
                  <Select value={dryCycle} onValueChange={setDryCycle}>
                    <SelectTrigger data-testid="select-dry-cycle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DRY_CYCLES.map((c) => (
                        <SelectItem key={c} value={c} data-testid={`option-dry-cycle-${c.toLowerCase().replace(/\s+/g, "-")}`}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="rounded-lg border bg-violet-50 dark:bg-violet-950/20 p-4 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{loads} load{loads > 1 ? "s" : ""} x ${PRICE_PER_LOAD}</span>
            <span className="text-lg font-bold" data-testid="text-total-price">${totalPrice}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {SERVICE_LABELS[serviceType]} · {showWasher ? `${washTemp}, ${washCycle}` : ""}{showWasher && showDryer ? " · " : ""}{showDryer ? `${dryHeat}, ${dryCycle}` : ""}
          </p>
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
              <WashingMachine className="w-5 h-5 text-violet-600" />
              Place Laundry Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{loads} load{loads > 1 ? "s" : ""} — {SERVICE_LABELS[serviceType]}</span>
                <span className="font-medium">${totalPrice}</span>
              </div>
              {showWasher && (
                <div className="text-xs text-muted-foreground">
                  Wash: {washTemp}, {washCycle}
                </div>
              )}
              {showDryer && (
                <div className="text-xs text-muted-foreground">
                  Dry: {dryHeat}, {dryCycle}
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span data-testid="text-checkout-total">${totalPrice}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup-location">Pickup Location *</Label>
              <Input
                id="pickup-location"
                placeholder="e.g., McCarthy Hall, Room 215"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                data-testid="input-pickup-location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="laundry-notes">Notes for Tasker (optional)</Label>
              <Textarea
                id="laundry-notes"
                placeholder="Any special instructions? e.g., Separate whites and colors"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={2}
                data-testid="input-laundry-notes"
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!pickupLocation.trim() || createOrderMutation.isPending}
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
