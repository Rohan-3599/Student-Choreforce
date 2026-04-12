import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, CheckCircle2, AlertTriangle, Fingerprint } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export function TaskerVerificationFlow({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<"intro" | "form" | "processing" | "success">("intro");
  const [isUsCitizen, setIsUsCitizen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: async (sessionId?: string) => {
      // First update the user profile with is_us_citizen
      await apiRequest("PUT", "/api/auth/profile", { is_us_citizen: isUsCitizen });
      
      const res = await fetch("/api/auth/verify-tasker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Verification failed");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate the user query so the app knows we are verified
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setStep("success");
      setTimeout(() => {
        onSuccess();
      }, 2000);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Verification Incomplete", 
        description: error.message, 
        variant: "destructive" 
      });
      setStep("form");
    }
  });

  const handleStartStripeIdentity = async () => {
    try {
      setIsProcessingStripe(true);
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe not loaded");

      // We explicitly create a verification session
      const res = await apiRequest("POST", "/api/payments/create-verification-session", {});
      const { clientSecret, sessionId } = await res.json();

      if (!clientSecret) throw new Error("Failed to create Identity session");

      const { error } = await (stripe as any).verifyIdentity(clientSecret);

      if (error) {
        toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
        setIsProcessingStripe(false);
      } else {
        // Success! Set verified state
        setStep("processing");
        verifyMutation.mutate(sessionId);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start identity verification", variant: "destructive" });
      setIsProcessingStripe(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 px-4">
      <Card className="w-full max-w-lg shadow-xl border-primary/20 bg-background/95 backdrop-blur overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500"></div>
        
        {step === "intro" && (
          <>
            <CardHeader className="text-center space-y-3 pb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight">Become a Tasker</CardTitle>
              <CardDescription className="text-base">
                To keep our community safe and compliant, we need to quickly verify your identity via Stripe before you can start earning.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/30 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">Requirements:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Must be a US Citizen.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Provide a valid Government ID (Driver License or Passport).
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full h-11" onClick={() => setStep("form")}>Start Verification</Button>
            </CardFooter>
          </>
        )}

        {step === "form" && (
          <>
            <CardHeader>
              <CardTitle>Identity Information</CardTitle>
              <CardDescription>Confirm your eligibility and prepare your ID for facial scan verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="flex items-start space-x-3 p-4 border rounded-md bg-muted/20">
                <Checkbox
                  id="us-citizen"
                  checked={isUsCitizen}
                  onCheckedChange={(checked) => setIsUsCitizen(!!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="us-citizen" className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-semibold">
                    I am a US Citizen
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Required to perform tasks and receive payouts.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-md bg-muted/20">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="terms" className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-semibold">
                    I agree to the Terms of Service
                  </Label>
                </div>
              </div>
               
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                onClick={handleStartStripeIdentity} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!isUsCitizen || !agreedToTerms || isProcessingStripe}
              >
                {isProcessingStripe ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing Scanner...</>
                ) : (
                  <><Fingerprint className="mr-2 h-4 w-4" /> Verify Identity with Stripe</>
                )}
              </Button>
              <Button variant="ghost" onClick={() => setStep("intro")} className="w-full text-xs" disabled={isProcessingStripe}>
                Back
              </Button>
            </CardFooter>
          </>
        )}

        {step === "processing" && (
          <CardContent className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Wrapping up</h3>
              <p className="text-sm text-muted-foreground">Saving your verification details...</p>
            </div>
          </CardContent>
        )}

        {step === "success" && (
          <CardContent className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-green-600">Verification Complete!</h3>
              <p className="text-sm text-muted-foreground">You are now fully authorized to work on TaskForce.</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
