import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface VerifyEmailPromptProps {
  email: string;
  onBack: () => void;
}

export default function VerifyEmailPrompt({ email, onBack }: VerifyEmailPromptProps) {
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await apiRequest("POST", "/api/auth/resend-verification", { email });
      if (!res.ok) {
        throw new Error("Failed to resend verification email");
      }
      toast({
        title: "Email Sent",
        description: "Please check your inbox for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send email",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Mail className="w-8 h-8 text-primary" />
      </div>
      
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        Check Your Email
      </h2>
      
      <p className="text-muted-foreground mb-6">
        We sent a verification link to <span className="font-semibold text-foreground">{email}</span>.
        Please click the link in that email to verify your account.
      </p>

      <div className="flex flex-col gap-3 w-full">
        <Button 
          onClick={handleResend} 
          disabled={isResending}
          className="w-full"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 outline-none animate-spin" />
              Sending...
            </>
          ) : (
            "Resend Verification Email"
          )}
        </Button>

        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Login
        </Button>
      </div>
    </div>
  );
}
