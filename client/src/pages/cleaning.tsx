import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USC_BUILDINGS } from "@/lib/constants";
import {
  SprayCan, ArrowLeft, CheckCircle, Clock, Info,
  ChefHat, Bath, Bed, Camera, Calendar as CalendarIcon,
  X, Loader2, ChevronDown
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useLocation } from "wouter";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { StripeProvider } from "@/components/StripeProvider";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { UserNav } from "@/components/user-nav";

const ROOMS = [
  { id: "kitchen", label: "Kitchen", icon: ChefHat },
  { id: "bathroom", label: "Bathroom", icon: Bath },
  { id: "bedroom", label: "Bedroom", icon: Bed },
];

const PRICE_PER_15_MIN = 12.50;

export default function CleaningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [timeInMinutes, setTimeInMinutes] = useState(60);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeWindow, setTimeWindow] = useState("09:00 AM - 10:00 AM");
  const [notes, setNotes] = useState("");
  const [dormLocation, setDormLocation] = useState(user?.building_name || "");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerSessionClientSecret, setCustomerSessionClientSecret] = useState<string | null>(null);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);

  const subtotal = useMemo(() => {
    const laborPerRoom = (timeInMinutes / 15) * PRICE_PER_15_MIN;
    return laborPerRoom * Math.max(1, selectedRooms.length);
  }, [timeInMinutes, selectedRooms.length]);

  const serviceFee = useMemo(() => {
    return subtotal * 0.18;
  }, [subtotal]);

  const totalPrice = useMemo(() => {
    return subtotal + serviceFee;
  }, [subtotal, serviceFee]);

  const toggleRoom = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const handlePhotoUpload = (roomId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Keep it under 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotos(prev => ({ ...prev, [roomId]: event.target?.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (roomId: string) => {
    setPhotos(prev => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white dark:bg-card sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <SprayCan className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-lg">Dorm Cleaning</span>
          </div>
          <UserNav />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold font-outfit">Detailed Dorm Cleaning</h2>
          <p className="text-muted-foreground text-sm">Select rooms, time, and schedule your service</p>
        </div>

        {/* Room Selection */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <SprayCan className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-base">Which rooms need cleaning?</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {ROOMS.map((room) => {
                const Icon = room.icon;
                const isSelected = selectedRooms.includes(room.id);
                return (
                  <button
                    key={room.id}
                    onClick={() => toggleRoom(room.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                      isSelected 
                        ? "border-blue-600 bg-blue-50 text-blue-600" 
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-sm font-medium">{room.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time Selection */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-base">How much time is needed?</h3>
            </div>
            <div className="space-y-4">
              <Select 
                value={timeInMinutes.toString()} 
                onValueChange={(v) => setTimeInMinutes(parseInt(v))}
              >
                <SelectTrigger className="w-full h-12 text-lg">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (i + 1) * 15).map((mins) => (
                    <SelectItem key={mins} value={mins.toString()}>
                      {mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}` : `${mins} minutes`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <Info className="w-4 h-4 shrink-0" />
                <p>Labor is calculated per 15-minute block. More rooms will require more time and care.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload (Optional) */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-base">Add Room Photos (Optional)</h3>
            </div>
            <p className="text-sm text-muted-foreground">Photos help Taskers understand the scope of work.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ROOMS.map((room) => {
                const hasPhoto = !!photos[room.id];
                return (
                  <div key={room.id} className="relative group">
                    {hasPhoto ? (
                      <div className="relative aspect-square rounded-lg overflow-hidden border">
                        <img src={photos[room.id]} alt={room.label} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removePhoto(room.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-1 text-center">
                          {room.label}
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-muted hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all">
                        <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-[11px] font-medium text-muted-foreground text-center px-2">Upload {room.label}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handlePhotoUpload(room.id, e)}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-base">Schedule Cleaning</h3>
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
                      fromDate={new Date()}
                      toDate={addDays(new Date(), 7)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Start Window (1 Hour)</Label>
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

        {/* Notes */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="font-semibold text-base">What exactly do you need cleaned?</Label>
            <Textarea
              placeholder="e.g., Focus on the kitchen floor, wipe the microwave, deep clean bathroom tiles..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </CardContent>
        </Card>

        <Collapsible className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">${totalPrice.toFixed(2)}</span>
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
                <span>Labor Cost ({(timeInMinutes/15).toFixed(0)} x 15m @ $12.50)</span>
                <span>${((timeInMinutes/15)*12.50).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total Rooms selected</span>
                <span>x {Math.max(1, selectedRooms.length)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-1 border-t border-dashed">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Service Fee (18%)</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
            </CollapsibleContent>
        </Collapsible>

        <Button
          className="w-full h-12 text-lg font-bold"
          disabled={selectedRooms.length === 0 || isInitializingPayment}
          onClick={async () => {
            try {
              setIsInitializingPayment(true);
              const amountCents = Math.round(totalPrice * 100);
              const data = await apiRequest("POST", "/api/payments/create-payment-intent", { amount: amountCents }).then(r => r.json());
              setClientSecret(data.clientSecret);
              if (data.customerSessionClientSecret) {
                setCustomerSessionClientSecret(data.customerSessionClientSecret);
              }
              setCheckoutOpen(true);
            } catch (err) {
              toast({ title: "Error", description: "Failed to initialize payment. Please try again.", variant: "destructive" });
            } finally {
              setIsInitializingPayment(false);
            }
          }}
        >
          {isInitializingPayment ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Initializing...
            </div>
          ) : (
            selectedRooms.length === 0 ? "Select at least one room" : `Continue — $${totalPrice.toFixed(2)}`
          )}
        </Button>
      </main>

      {/* Stripe Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
          </DialogHeader>
          <StripeProvider clientSecret={clientSecret} customerSessionClientSecret={customerSessionClientSecret}>
            <CheckoutForm 
              onClose={() => setCheckoutOpen(false)}
              totalPrice={totalPrice}
              orderData={{
                selectedRooms,
                timeInMinutes,
                photos,
                selectedDate,
                timeWindow,
                notes,
                dormLocation
              }}
              dormLocation={dormLocation}
              setDormLocation={setDormLocation}
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
  orderData,
  dormLocation,
  setDormLocation
}: { 
  onClose: () => void, 
  totalPrice: number, 
  orderData: any,
  dormLocation: string,
  setDormLocation: (loc: string) => void
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const createOrderMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const { selectedRooms, timeInMinutes, notes, selectedDate, timeWindow, photos } = orderData;
      
      const res = await apiRequest("POST", "/api/tasks", {
        title: `Dorm Cleaning — ${selectedRooms.join(", ")}`,
        description: `Rooms: ${selectedRooms.join(", ")}. Duration: ${timeInMinutes}m. Scheduled: ${format(new Date(selectedDate), "PPPP")} @ ${timeWindow}. ${notes ? `Instructions: ${notes}` : ""}`.trim(),
        category: "dorm_cleaning",
        budget: Math.round(totalPrice * 100),
        location: dormLocation,
        paymentStatus: "paid",
        stripePaymentIntentId: paymentIntentId,
        photos: photos
      });
      return res.json();
    },
    onSuccess: async () => {
      if (saveAsDefault && dormLocation) {
        try {
          await apiRequest("PUT", "/api/auth/profile", { building_name: dormLocation });
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        } catch (err) {
          console.error("Failed to update default building:", err);
        }
      }
      toast({ title: "Cleaning order placed!", description: "A Tasker will arrive at the scheduled time." });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my/posted"] });
      onClose();
      navigate("/");
    },
    onError: () => {
      toast({ title: "Failed to place order", description: "Please try again.", variant: "destructive" });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !dormLocation) return;

    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        toast({ title: "Payment failed", description: error.message, variant: "destructive" });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        createOrderMutation.mutate(paymentIntent.id);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Dorm Location *</Label>
          <Select value={dormLocation} onValueChange={setDormLocation}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select building..." />
            </SelectTrigger>
            <SelectContent>
              {USC_BUILDINGS.map((building) => (
                <SelectItem key={building} value={building}>{building}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="saveDefault" 
            onCheckedChange={(checked) => setSaveAsDefault(checked === true)}
          />
          <Label htmlFor="saveDefault" className="text-xs text-muted-foreground cursor-pointer">
            Save as default location
          </Label>
        </div>
      </div>

      <PaymentElement />
      
      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full h-12 text-lg font-bold" 
          disabled={!stripe || isProcessing || !dormLocation}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </div>
          ) : `Pay $${totalPrice.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}
