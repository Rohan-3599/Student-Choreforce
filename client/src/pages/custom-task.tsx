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
  ClipboardList, ArrowLeft, Minus, Plus,
  CheckCircle, DollarSign, MapPin, Pencil,
  Camera, X, Loader2, AlertTriangle, Info
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { StripeProvider } from "@/components/StripeProvider";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { UserNav } from "@/components/user-nav";
import { moderateContent } from "@/lib/moderation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react";

const MIN_PRICE = 5;
const MAX_PRICE = 500;

export default function CustomTaskPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(15);
  const [location, setLocation] = useState(user?.building_name || "");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeWindow, setTimeWindow] = useState("09:00 AM - 10:00 AM");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerSessionClientSecret, setCustomerSessionClientSecret] = useState<string | null>(null);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);

  const subtotal = price;
  const serviceFee = useMemo(() => subtotal * 0.18, [subtotal]);
  const totalPrice = useMemo(() => subtotal + serviceFee, [subtotal, serviceFee]);

  const isFormValid = title.trim().length >= 3 && description.trim().length >= 10 && location.trim().length >= 2 && price >= MIN_PRICE;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Keep it under 5MB", variant: "destructive" });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target?.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    const titleResult = moderateContent(title);
    const descResult = moderateContent(description);

    if (titleResult.isFlagged || descResult.isFlagged) {
      setModerationError(titleResult.reason || descResult.reason || "Prohibited content detected.");
      toast({ 
        title: "Content Flagged", 
        description: "Your task contains prohibited words or phrases. Please review.", 
        variant: "destructive" 
      });
      return;
    }

    setModerationError(null);
    
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
            <ClipboardList className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-lg">Custom Task</span>
          </div>
          <UserNav />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold">Post a Custom Task</h2>
          <p className="text-muted-foreground text-sm">Describe what you need done and set your price</p>
        </div>

        {moderationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Content Violation</p>
              <p>{moderationError}</p>
            </div>
          </div>
        )}

        <Card>
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
                onChange={(e) => {
                  setTitle(e.target.value);
                  setModerationError(null);
                }}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description *</Label>
              <Textarea
                id="task-description"
                placeholder="Describe exactly what you need done. Be specific so Taskers know what to expect."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setModerationError(null);
                }}
                className="resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{description.length}/500 characters</p>
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload (Optional) */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-base">Attach Photos (Optional)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-muted hover:border-amber-400 hover:bg-amber-50/30 cursor-pointer transition-all">
                <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-[10px] font-medium text-muted-foreground">Add Photo</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-base">Your Price</h3>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                disabled={price <= MIN_PRICE}
                onClick={() => setPrice((p) => Math.max(MIN_PRICE, p - 5))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-3xl font-bold">${price}</span>
              <Button
                variant="outline"
                size="icon"
                disabled={price >= MAX_PRICE}
                onClick={() => setPrice((p) => Math.min(MAX_PRICE, p + 5))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-base">Schedule Task</h3>
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

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-base">Location</h3>
            </div>
            <div className="space-y-4">
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a USC building" />
                </SelectTrigger>
                <SelectContent>
                  {USC_BUILDINGS.map((building) => (
                    <SelectItem key={building} value={building}>{building}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2 px-1">
                <Checkbox 
                  id="saveDefault" 
                  checked={saveAsDefault} 
                  onCheckedChange={(checked) => setSaveAsDefault(checked === true)}
                />
                <label htmlFor="saveDefault" className="text-xs text-muted-foreground cursor-pointer">
                  Save as default location
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Collapsible className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">${totalPrice.toFixed(2)}</span>
                <Badge variant="outline" className="bg-white/50 border-amber-200">Total</Badge>
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
                <span>Tasker Budget</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Service Fee (18%)</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-1 border-t border-dashed">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </CollapsibleContent>
        </Collapsible>

        <Button
          className="w-full h-12 text-lg font-bold bg-amber-600 hover:bg-amber-700"
          disabled={!isFormValid || isInitializingPayment}
          onClick={handleContinue}
        >
          {isInitializingPayment ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Initializing...
            </div>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Review & Post — ${totalPrice.toFixed(2)}
            </>
          )}
        </Button>
      </main>

      {/* Stripe Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Task</DialogTitle>
          </DialogHeader>
          <StripeProvider clientSecret={clientSecret} customerSessionClientSecret={customerSessionClientSecret}>
            <CheckoutForm 
              onClose={() => setCheckoutOpen(false)}
              totalPrice={totalPrice}
              orderData={{
                title: title.trim(),
                description: description.trim(),
                location,
                photos,
                selectedDate,
                timeWindow
              }}
              location={location}
              setLocation={setLocation}
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
  location,
  setLocation
}: { 
  onClose: () => void, 
  totalPrice: number, 
  orderData: any,
  location: string,
  setLocation: (loc: string) => void
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const createOrderMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const { title, description, photos, selectedDate, timeWindow } = orderData;
      
      const res = await apiRequest("POST", "/api/tasks", {
        title,
        description: `${description.trim()}. Scheduled for: ${format(new Date(selectedDate), "PPPP")} @ ${timeWindow}`.trim(),
        category: "other",
        budget: Math.round(totalPrice * 100),
        location,
        paymentStatus: "paid",
        stripePaymentIntentId: paymentIntentId,
        photos: photos
      });
      return res.json();
    },
    onSuccess: async () => {
      if (saveAsDefault && location) {
        try {
          await apiRequest("PUT", "/api/auth/profile", { building_name: location });
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        } catch (err) {
          console.error("Failed to update default building:", err);
        }
      }
      toast({ title: "Task posted!", description: "Your task is now visible to Taskers." });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my/posted"] });
      onClose();
      navigate("/");
    },
    onError: () => {
      toast({ title: "Failed to post task", description: "Please try again.", variant: "destructive" });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !location) return;

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
          <Label>Confirm Location *</Label>
          <Select value={location} onValueChange={setLocation}>
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
          className="w-full h-12 text-lg font-bold bg-amber-600 hover:bg-amber-700" 
          disabled={!stripe || isProcessing || !location}
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
