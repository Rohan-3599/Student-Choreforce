import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [, setLocation] = useLocation();

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-background/95 backdrop-blur overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl text-center text-destructive">Invalid Link</CardTitle>
            <CardDescription className="text-center">This password reset link is invalid or missing details.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
               <Button className="w-full" variant="outline">Back to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", { email, token, newPassword: password });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to reset password.");
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link might have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Student Choreforce</h1>
        </div>

        <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-background/95 backdrop-blur overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
          <CardContent className="pt-10 pb-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-700">Password Reset!</h3>
            <p className="text-muted-foreground text-sm">
              Your password has been successfully updated.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary" onClick={() => setLocation("/")}>
              Log In Now
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
          <Zap className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Student Choreforce</h1>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-background/95 backdrop-blur overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500"></div>
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">Set New Password</CardTitle>
          <CardDescription className="text-center text-muted-foreground text-sm">
            Enter a new password for <span className="font-semibold">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting || !password}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
