import React, { useState, useEffect } from "react";
import LoginForm from "@/components/Auth/LoginForm";
import SignupForm from "@/components/Auth/SignupForm";
import ForgotPassword from "@/components/Auth/ForgotPassword";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

import VerifyEmailPrompt from "@/components/Auth/VerifyEmailPrompt";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      // Small timeout ensures the toast system is fully mounted
      setTimeout(() => {
        toast({
          title: "Email Verified!",
          description: "Your account is now fully active. You can log in below.",
        });
      }, 500);
      
      // Clean up the URL parameter quietly
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
          <Zap className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Student Choreforce</h1>
          <p className="text-muted-foreground text-sm font-medium">Helping fellow Trojans get things done.</p>
        </div>
      </div>
      
      <div className="w-full max-w-xl">
        {unverifiedEmail ? (
          <div className="flex justify-center items-center py-12 px-4">
             <div className="w-full max-w-md bg-card border border-primary/20 rounded-xl shadow-2xl p-8 backdrop-blur overflow-hidden">
               <VerifyEmailPrompt 
                  email={unverifiedEmail} 
                  onBack={() => { setUnverifiedEmail(null); setIsLogin(true); }} 
               />
             </div>
          </div>
        ) : isForgot ? (
          <ForgotPassword
             onBack={() => { setIsForgot(false); setIsLogin(true); }}
          />
        ) : isLogin ? (
          <LoginForm 
            onToggle={() => { setIsLogin(false); setIsForgot(false); }} 
            onForgot={() => { setIsForgot(true); setIsLogin(false); }}
            onRequireVerification={(email) => setUnverifiedEmail(email)} 
          />
        ) : (
          <SignupForm 
            onToggle={() => { setIsLogin(true); setIsForgot(false); }} 
            onSuccess={(email) => setUnverifiedEmail(email)} 
          />
        )}
      </div>
    </div>
  );
}
