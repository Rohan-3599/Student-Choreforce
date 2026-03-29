import React, { useState } from "react";
import LoginForm from "@/components/Auth/LoginForm";
import SignupForm from "@/components/Auth/SignupForm";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

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
      
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onToggle={() => setIsLogin(false)} />
        ) : (
          <SignupForm onToggle={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}
