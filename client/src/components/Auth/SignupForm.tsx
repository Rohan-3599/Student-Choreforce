import React, { useState, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Check, X, ShieldCheck } from "lucide-react";

const languagesOptions = ["English", "Chinese", "Spanish"];
const genders = ["Man", "Woman", "Prefer Not to Say"];

export default function SignupForm({ onToggle, onSuccess }: { onToggle: () => void; onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState(genders[2]);
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [error, setError] = useState("");

  const { register, isRegistering } = useAuth();

  const passwordRequirements = useMemo(() => [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const isPasswordValid = passwordRequirements.every(req => req.met);

  function toggleLanguage(lang: string) {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    
    if (!email.toLowerCase().endsWith("@usc.edu")) {
      setError("Please use a valid @usc.edu email address.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please ensure your password meets all strength criteria.");
      return;
    }

    try {
      const payload = {
        email, 
        password,
        first_name: firstName, 
        last_name: lastName,
        birth_date: birthDate ? birthDate.toISOString().slice(0, 10) : null,
        gender: gender.toLowerCase().replaceAll(" ", "_"),
        languages
      };
      await register(payload);
      onSuccess(email);
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    }
  }


  return (
    <div className="flex justify-center items-center min-h-[40vh] py-6 px-4">
      <Card className="w-full max-w-xl shadow-2xl border-primary/20 bg-background/95 backdrop-blur overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500"></div>
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="text-2xl font-extrabold tracking-tight text-center">Create account</CardTitle>
          <CardDescription className="text-center text-muted-foreground text-sm">
            Join the USC student chore marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" placeholder="Tommy" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" placeholder="Trojan" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">USC Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tommy@usc.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {email.length > 0 && !email.toLowerCase().endsWith("@usc.edu") && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <X className="w-3 h-3" /> Must be a @usc.edu email address
                </p>
              )}
              {email.length > 0 && email.toLowerCase().endsWith("@usc.edu") && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Valid USC email
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <div className="bg-secondary/20 p-3 rounded-lg border border-border/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Password strength
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                      {req.met ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <X className="w-3 h-3 text-muted-foreground/30" />
                      )}
                      <span className={req.met ? "text-foreground" : "text-muted-foreground"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <DatePicker
                  selected={birthDate}
                  onChange={(d: Date | null) => setBirthDate(d)}
                  dateFormat="MM/dd/yyyy"
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-background"
                  placeholderText="MM/DD/YYYY"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="h-10">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

      

            <div className="space-y-3 pt-2 border-t mt-4">
              <Label className="font-semibold text-sm">Languages Spoken</Label>
              <div className="flex flex-wrap gap-3">
                {languagesOptions.map(lang => (
                  <div key={lang} className="flex items-center space-x-2 bg-secondary/30 px-3 py-1.5 rounded-lg">
                    <Checkbox
                      id={`lang-${lang}`}
                      checked={languages.includes(lang)}
                      onCheckedChange={() => toggleLanguage(lang)}
                    />
                    <Label htmlFor={`lang-${lang}`} className="text-xs font-medium cursor-pointer">
                      {lang}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full mt-4 h-11 text-lg font-bold" disabled={isRegistering || !isPasswordValid}>
              {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center bg-secondary/10 pt-4 pb-6">
          <p className="text-xs text-muted-foreground">Already have an account?</p>
          <Button 
            variant="ghost" 
            className="text-primary font-bold text-sm h-auto p-0 hover:bg-transparent hover:underline" 
            onClick={onToggle}
          >
            Log in to your account
          </Button>
          <p className="text-[10px] text-muted-foreground pt-2">By signing up, you agree to our Terms of Service and Privacy Policy.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
