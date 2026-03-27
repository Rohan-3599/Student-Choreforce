import { useState, useMemo, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  WashingMachine, Zap, LogOut, ArrowLeft, Minus, Plus,
  CheckCircle, Droplets, Wind, Thermometer, RotateCw, Shirt,
  ChevronDown, ChevronUp, CalendarIcon
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import type { PaymentMethod } from "@shared/schema";
import PaymentMethodSelector from "@/components/payment-method-selector";
import { StripeProvider } from "@/components/StripeProvider";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

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

const PRICE_LABOR = 10.00;
const PRICE_WASHER_BASE = 1.50;
const PRICE_DRYER_BASE = 1.25;
const PRICE_SOIL_MEDIUM = 0.25;
const PRICE_SOIL_HEAVY = 0.50;
const PRICE_EXTRA_LOAD = 4.99;
const PRICE_FOLDING_LOAD = 1.99;
const SERVICE_FEE_PERCENT = 0.18;

const SOIL_LEVELS = ["Light", "Medium", "Heavy"] as const;

const USC_HOUSING = [
  "Birnkrant Residential College", "Marks Tower", "New North Residential College",
  "Pardee Tower", "McCarthy Honors Residential College", "Parkside Arts & Humanities Residential College",
  "Parkside International Residential College", "Cale and Irani Residential College",
  "Cardinal Gardens", "Parkside Apartments", "Webb Tower", "Annenberg House",
  "Cardinal ’N Gold", "Century Apartments", "Cowlings and Ilium Residential College",
  "La Sorbonne Apartments", "McClintock Apartments", "McMorrow Residential College",
  "Nemirovsky and Bohnett Residential College", "Troy Hall"
];

const SCHEDULE_WINDOWS = ["ASAP", ...Array.from({ length: 12 }, (_, i) => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + i + 1);
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${timeStr} Window`;
})];

export default function LaundryPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [loads, setLoads] = useState(1);
  const [serviceType, setServiceType] = useState<ServiceType>("both");
  const [washTemp, setWashTemp] = useState<string>("Cold");
  const [washCycle, setWashCycle] = useState<string>("Normal");
  const [soilLevel, setSoilLevel] = useState<string>("Light");
  const [dryHeat, setDryHeat] = useState<string>("Medium");
  const [dryCycle, setDryCycle] = useState<string>("Normal");
  const [pickupLocation, setPickupLocation] = useState("");
  const [schedule, setSchedule] = useState("ASAP");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeWindow, setTimeWindow] = useState<string>("10:00 AM - 11:00 AM");
  const [notes, setNotes] = useState("");
  const [foldingLoads, setFoldingLoads] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerSessionClientSecret, setCustomerSessionClientSecret] = useState<string | null>(null);

  const showWasher = serviceType === "wash" || serviceType === "both";
  const showDryer = serviceType === "dry" || serviceType === "both";

  // Calculate subtotal and total
  const subtotal = useMemo(() => {
    let price = PRICE_LABOR;
    if (showWasher) {
      price += PRICE_WASHER_BASE;
      if (soilLevel === "Medium") price += PRICE_SOIL_MEDIUM;
      if (soilLevel === "Heavy") price += PRICE_SOIL_HEAVY;
    }
    if (showDryer) {
      price += PRICE_DRYER_BASE;
    }
    // Additional loads
    price += (loads - 1) * PRICE_EXTRA_LOAD;
    // Folding service
    price += foldingLoads * PRICE_FOLDING_LOAD;
    return Number(price.toFixed(2));
  }, [showWasher, showDryer, soilLevel, loads, foldingLoads]);

  const serviceFee = useMemo(() => {
    return Number((subtotal * SERVICE_FEE_PERCENT).toFixed(2));
  }, [subtotal]);

  const totalPrice = useMemo(() => {
    return Number((subtotal + serviceFee).toFixed(2));
  }, [subtotal, serviceFee]);

  const additionalLoadsPrice = (loads - 1) * PRICE_EXTRA_LOAD;

  useEffect(() => {
    console.log("Price updated:", totalPrice, "Soil:", soilLevel, "Loads:", loads);
  }, [totalPrice, soilLevel, loads]);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentIntentId = params.get('payment_intent');
    const redirectStatus = params.get('redirect_status');

    if (paymentIntentId && redirectStatus === 'succeeded') {
      const storedOrderStr = sessionStorage.getItem('pending_laundry_order');
      if (storedOrderStr) {
        try {
          const { orderData, totalPrice, localPickupLocation } = JSON.parse(storedOrderStr);
          const settingsParts: string[] = [];
          const { serviceType, loads, washTemp, washCycle, soilLevel, dryCycle, selectedDate, timeWindow, foldingLoads, notes } = orderData;
          
          if (serviceType !== "dry") settingsParts.push(`Wash: ${washTemp}, ${washCycle}, Soil: ${soilLevel}`);
          if (serviceType !== "wash") settingsParts.push(`Dry: ${dryCycle}`);
          if (foldingLoads > 0) settingsParts.push(`Folding: ${foldingLoads} load${foldingLoads > 1 ? "s" : ""}`);
          
          const dateStr = selectedDate ? format(new Date(selectedDate), "PPPP") : "TBD";
          settingsParts.push(`Scheduled for: ${dateStr} @ ${timeWindow}`);

          apiRequest("POST", "/api/tasks", {
            title: `Laundry Order — ${loads} load${loads > 1 ? "s" : ""}`,
            description: `${settingsParts.join(". ")}. ${notes ? `Special Instructions: ${notes}` : ""}`.trim(),
            category: "laundry",
            budget: Math.round(totalPrice * 100),
            location: localPickupLocation,
            paymentStatus: "paid",
            stripePaymentIntentId: paymentIntentId,
          }).then(() => {
             toast({ title: "Order Placed!", description: "A Tasker will be notified via USC housing services." });
             queryClient.invalidateQueries({ queryKey: ["/api/tasks/my/posted"] });
             sessionStorage.removeItem('pending_laundry_order');
             window.history.replaceState({}, document.title, window.location.pathname);
             navigate("/");
          }).catch(() => {
             toast({ title: "Task Creation Failed", description: "Payment was successful but we failed to save the order. Please contact support.", variant: "destructive" });
             sessionStorage.removeItem('pending_laundry_order');
             window.history.replaceState({}, document.title, window.location.pathname);
          });
        } catch (e) {
          console.error("Failed to parse pending order", e);
        }
      }
    }
  }, [navigate, toast]);
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
              <span className="text-sm text-muted-foreground">$4.99 per additional load (max 4)</span>
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
                  disabled={loads >= 4}
                  onClick={() => setLoads((l) => Math.min(4, l + 1))}
                  data-testid="button-loads-plus"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-folding-service">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shirt className="w-5 h-5 text-violet-600" />
              <h3 className="font-semibold text-base">Folding Service</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">$1.99 per load (max 4)</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={foldingLoads <= 0}
                  onClick={() => setFoldingLoads((l) => Math.max(0, l - 1))}
                  data-testid="button-folding-minus"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-bold w-8 text-center" data-testid="text-folding-count">{foldingLoads}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={foldingLoads >= 4}
                  onClick={() => setFoldingLoads((l) => Math.min(4, l + 1))}
                  data-testid="button-folding-plus"
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
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${isSelected
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Thermometer className="w-3 h-3" />
                    Temp
                  </Label>
                  <Select value={washTemp} onValueChange={setWashTemp}>
                    <SelectTrigger data-testid="select-wash-temp" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Cold", "Warm", "Hot"].map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <RotateCw className="w-3 h-3" />
                    Cycle
                  </Label>
                  <Select value={washCycle} onValueChange={setWashCycle}>
                    <SelectTrigger data-testid="select-wash-cycle" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Normal", "Perm Press", "Delicates/Bulky"].map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Zap className="w-3 h-3" />
                    Soil Level
                  </Label>
                  <Select value={soilLevel} onValueChange={setSoilLevel}>
                    <SelectTrigger data-testid="select-soil-level" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOIL_LEVELS.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {s}
                        </SelectItem>
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
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Thermometer className="w-3.5 h-3.5" />
                    Settings
                  </Label>
                  <Select value={dryCycle} onValueChange={setDryCycle}>
                    <SelectTrigger data-testid="select-dry-cycle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Delicates", "No Heat", "Low Temp", "Med Temp", "High Temp"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-scheduling">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-base">Schedule Order</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Pick a Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Time Window (1 Hour)</Label>
                <Select value={timeWindow} onValueChange={setTimeWindow}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select window" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "08:00 AM - 09:00 AM", "09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM",
                      "11:00 AM - 12:00 PM", "12:00 PM - 01:00 PM", "01:00 PM - 02:00 PM",
                      "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM", "04:00 PM - 05:00 PM",
                      "05:00 PM - 06:00 PM", "06:00 PM - 07:00 PM", "07:00 PM - 08:00 PM"
                    ].map((win) => (
                      <SelectItem key={win} value={win}>{win}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-special-requests">
          <CardContent className="pt-6 space-y-3">
            <Label className="font-semibold text-base">Special Instructions</Label>
            <Textarea
              placeholder="e.g., Please hang dry my favorites, use extra softener..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </CardContent>
        </Card>

        <Collapsible className="rounded-lg border bg-violet-50 dark:bg-violet-950/20 p-4 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg" data-testid="text-total-price">${totalPrice.toFixed(2)}</span>
              <Badge variant="outline" className="bg-white/50">Total</Badge>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <span className="text-xs mr-1">View Details</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-2 pt-2 border-t">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tasker Labor Fee</span>
              <span>${PRICE_LABOR.toFixed(2)}</span>
            </div>
            {showWasher && (
              <>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Washer Base (1st load)</span>
                  <span>${PRICE_WASHER_BASE.toFixed(2)}</span>
                </div>
                {soilLevel !== "Light" && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Soil Level ({soilLevel})</span>
                    <span>+${(soilLevel === "Medium" ? PRICE_SOIL_MEDIUM : PRICE_SOIL_HEAVY).toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            {showDryer && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Dryer Base (1st load)</span>
                <span>${PRICE_DRYER_BASE.toFixed(2)}</span>
              </div>
            )}
            {loads > 1 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Additional Loads ({loads - 1})</span>
                <span>+${additionalLoadsPrice.toFixed(2)}</span>
              </div>
            )}
            {foldingLoads > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Folding Service ({foldingLoads} load{foldingLoads > 1 ? 's' : ''})</span>
                <span>+${(foldingLoads * PRICE_FOLDING_LOAD).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-muted-foreground font-medium pt-2 border-t border-dashed">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground font-medium">
              <span>Service Fee (18%)</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>
          </CollapsibleContent>

          <p className="text-[10px] text-muted-foreground italic mt-2">
            * Payment is processed upfront via Stripe to confirm the order.
          </p>
        </Collapsible>

        <Button
          className="w-full"
          size="lg"
          onClick={async () => {
            try {
              const amountCents = Math.round(totalPrice * 100);
              const data = await apiRequest("POST", "/api/payments/create-payment-intent", { amount: amountCents }).then(r => r.json());
              setClientSecret(data.clientSecret);
              if (data.customerSessionClientSecret) {
                setCustomerSessionClientSecret(data.customerSessionClientSecret);
              }
              setCheckoutOpen(true);
            } catch (err) {
              toast({ title: "Error", description: "Failed to initialize payment. Please try again.", variant: "destructive" });
            }
          }}
          data-testid="button-continue-checkout"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Continue — ${totalPrice.toFixed(2)}
        </Button>
      </main>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <StripeProvider clientSecret={clientSecret} customerSessionClientSecret={customerSessionClientSecret}>
            <CheckoutForm
              onClose={() => setCheckoutOpen(false)}
              totalPrice={totalPrice}
              orderData={{
                serviceType,
                loads,
                washTemp,
                washCycle,
                soilLevel,
                dryCycle,
                selectedDate,
                timeWindow,
                foldingLoads,
                notes,
                pickupLocation
              }}
            />
          </StripeProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckoutForm({
  onClose,
  totalPrice,
  orderData
}: {
  onClose: () => void,
  totalPrice: number,
  orderData: any
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [localPickupLocation, setLocalPickupLocation] = useState(orderData.pickupLocation);

  const createOrderMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const settingsParts: string[] = [];
      const { serviceType, loads, washTemp, washCycle, soilLevel, dryCycle, selectedDate, timeWindow, foldingLoads, notes } = orderData;

      if (serviceType !== "dry") settingsParts.push(`Wash: ${washTemp}, ${washCycle}, Soil: ${soilLevel}`);
      if (serviceType !== "wash") settingsParts.push(`Dry: ${dryCycle}`);
      if (foldingLoads > 0) settingsParts.push(`Folding: ${foldingLoads} load${foldingLoads > 1 ? "s" : ""}`);
      
      const dateStr = selectedDate ? format(new Date(selectedDate), "PPPP") : "TBD";
      settingsParts.push(`Scheduled for: ${dateStr} @ ${timeWindow}`);

      const res = await apiRequest("POST", "/api/tasks", {
        title: `Laundry Order — ${loads} load${loads > 1 ? "s" : ""}`,
        description: `${settingsParts.join(". ")}. ${notes ? `Special Instructions: ${notes}` : ""}`.trim(),
        category: "laundry",
        budget: Math.round(totalPrice * 100),
        location: localPickupLocation,
        paymentStatus: "paid",
        stripePaymentIntentId: paymentIntentId,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Order Placed!", description: "A Tasker will be notified via USC housing services." });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my/posted"] });
      onClose();
      navigate("/");
    },
    onError: () => {
      toast({ title: "Task Creation Failed", description: "Payment was successful but we failed to save the order. Please contact support.", variant: "destructive" });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !localPickupLocation) return;

    setIsProcessing(true);

    sessionStorage.setItem('pending_laundry_order', JSON.stringify({
      orderData,
      totalPrice,
      localPickupLocation
    }));

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/laundry",
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({ title: "Payment Failed", description: error.message, variant: "destructive" });
    } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      // Some payment methods might stay in processing for a bit, but we'll treat them as success for the task creation
      createOrderMutation.mutate(paymentIntent.id);
    } else {
      toast({ title: "Payment Pending", description: "Your payment is being processed. We will notify you once it's confirmed.", variant: "default" });
    }

    // Always reset processing unless we are redirecting (not the case with if_required)
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <WashingMachine className="w-5 h-5 text-violet-600" />
          Finalize Payment
        </DialogTitle>
      </DialogHeader>

      <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
        <div className="flex justify-between font-bold">
          <span>Order Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <div className="text-[10px] text-muted-foreground grid grid-cols-2 gap-1">
          <div>Loads: {orderData.loads}</div>
          <div>Type: {SERVICE_LABELS[orderData.serviceType as ServiceType]}</div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pickup-location">Confirm USC On-Campus Housing *</Label>
        <Select value={localPickupLocation} onValueChange={setLocalPickupLocation}>
          <SelectTrigger id="pickup-location">
            <SelectValue placeholder="Select building..." />
          </SelectTrigger>
          <SelectContent>
            {USC_HOUSING.map((building) => (
              <SelectItem key={building} value={building}>{building}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-3 border rounded-lg bg-white">
        <PaymentElement />
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || isProcessing || !localPickupLocation}
      >
        {isProcessing ? "Processing..." : `Pay & Place Order`}
      </Button>
    </form>
  );
}
