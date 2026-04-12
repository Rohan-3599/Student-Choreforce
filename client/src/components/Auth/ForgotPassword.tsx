import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Something went wrong.");
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] py-12 px-4">
        <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-background/95 backdrop-blur overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
          <CardContent className="pt-10 pb-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-700">Check Your Email</h3>
            <p className="text-muted-foreground text-sm">
              If an account exists for <span className="font-semibold">{email}</span>, a password reset link has been sent.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" onClick={onBack}>
              Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh] py-12 px-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-background/95 backdrop-blur overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500"></div>
        <CardHeader className="space-y-2 pb-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="absolute left-4 top-6 h-8 w-8 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold tracking-tight text-center mt-2">Reset Password</CardTitle>
          <CardDescription className="text-center text-muted-foreground text-sm">
            Enter your @usc.edu email to receive a password reset link.
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
              <Label htmlFor="email">USC Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tommy@usc.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting || !email.trim()}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
