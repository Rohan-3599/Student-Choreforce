import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function LoginForm({ onToggle, onRequireVerification }: { onToggle: () => void; onRequireVerification: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isLoggingIn } = useAuth();
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password, rememberMe });
    } catch (err: any) {
      if (err?.message?.includes("verify your email")) {
        onRequireVerification(email);
      } else {
        setError(err?.message || "Login failed");
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh] py-12 px-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-background/95 backdrop-blur overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500"></div>
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center text-muted-foreground text-base">
            Log in to manage your Student Choreforce tasks.
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tommy@usc.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer text-muted-foreground">
                Stay logged in for 7 days
              </Label>
            </div>
            <Button type="submit" className="w-full h-11" disabled={isLoggingIn}>
              {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center bg-secondary/10 pt-4 pb-6">
          <p className="text-sm text-muted-foreground">Don't have an account?</p>
          <Button 
            variant="ghost" 
            className="text-primary font-bold text-base h-auto p-0 hover:bg-transparent hover:underline" 
            onClick={onToggle}
          >
            Join your fellow Trojans on Choreforce
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
