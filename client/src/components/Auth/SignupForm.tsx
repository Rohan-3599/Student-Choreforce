import React, { useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const languagesOptions = ["English", "Chinese", "Spanish"];
const genders = ["Men", "Women", "No preference"];

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState(genders[2]);
  const [uscId, setUscId] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [error, setError] = useState("");

  function toggleLanguage(lang: string) {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        email, password,
        first_name: firstName, last_name: lastName,
        birth_date: birthDate ? birthDate.toISOString().slice(0, 10) : null,
        gender: gender.toLowerCase().replace(" ", "_"),
        usc_id: uscId,
        languages
      };
      const resp = await axios.post("/auth/signup", payload);
      localStorage.setItem("token", resp.data.token);
      window.location.href = "/";
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || err.message);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh] py-12 px-4">
      <Card className="w-full max-w-xl shadow-2xl border-primary/20 bg-background/95 backdrop-blur overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500"></div>
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-center">Join TaskForce</CardTitle>
          <CardDescription className="text-center text-muted-foreground text-base">
            Create an account to start earning or getting chores done.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-foreground/80">USC Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tommy@usc.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11 transition-all focus:border-primary"
              />
              <p className="text-[10px] text-muted-foreground mt-1 px-1">Must be a valid @usc.edu email address.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold text-foreground/80">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 transition-all focus:border-primary" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-semibold text-foreground/80">First name</Label>
                <Input id="firstName" placeholder="Tommy" value={firstName} onChange={e => setFirstName(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-semibold text-foreground/80">Last name</Label>
                <Input id="lastName" placeholder="Trojan" value={lastName} onChange={e => setLastName(e.target.value)} required className="h-11" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="font-semibold text-foreground/80">Birth Date</Label>
                <div className="relative">
                  <DatePicker
                    selected={birthDate}
                    onChange={(d: Date | null) => setBirthDate(d)}
                    dateFormat="yyyy-MM-dd"
                    className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-background"
                    placeholderText="YYYY-MM-DD"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="font-semibold text-foreground/80">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="h-11">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uscId" className="font-semibold text-foreground/80">USC ID Number (Optional)</Label>
              <Input id="uscId" placeholder="1234567890" value={uscId} onChange={e => setUscId(e.target.value)} className="h-11" />
            </div>

            <div className="space-y-3 pt-2 border-t mt-6">
              <Label className="font-semibold text-foreground/80">Languages Spoken</Label>
              <div className="flex flex-wrap gap-5">
                {languagesOptions.map(lang => (
                  <div key={lang} className="flex items-center space-x-2 bg-secondary/30 px-3 py-2 rounded-lg transition-colors hover:bg-secondary/50">
                    <Checkbox
                      id={`lang-${lang}`}
                      checked={languages.includes(lang)}
                      onCheckedChange={() => toggleLanguage(lang)}
                    />
                    <Label htmlFor={`lang-${lang}`} className="text-sm font-medium cursor-pointer">
                      {lang}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 bg-gradient-to-br from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-primary-foreground font-bold text-lg h-12 transition-all duration-300 shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 rounded-xl">
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground bg-secondary/10 pt-4">
          <p>By clicking Create Account, you agree to our Terms of Service and Privacy Policy.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
