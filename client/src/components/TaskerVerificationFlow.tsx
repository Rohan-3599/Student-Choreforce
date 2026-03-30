import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, UploadCloud, FileCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export function TaskerVerificationFlow({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<"intro" | "form" | "upload" | "processing" | "success">("intro");
  const [dob, setDob] = useState<Date | null>(null);
  const [status, setStatus] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/verify-tasker");
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
    onError: () => {
      toast({ title: "Verification Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
      setStep("form");
    }
  });

  const handleSimulatedSubmit = () => {
    setStep("processing");
    // Simulate real-world 3rd party processing delay
    setTimeout(() => {
      verifyMutation.mutate();
    }, 2500);
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
                To keep our community safe and compliant, we need to quickly verify your identity before you can start earning.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/30 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">Requirements:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Must be exactly 18 years or older.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Must be a US Citizen or have valid Work Authorization.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Provide a valid Government ID.
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
              <CardDescription>Enter your details exactly as they appear on your ID.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <DatePicker
                  selected={dob}
                  onChange={(d: Date | null) => setDob(d)}
                  dateFormat="MM/dd/yyyy"
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-background"
                  placeholderText="MM/DD/YYYY"
                />
              </div>
              <div className="space-y-2">
                <Label>Citizenship / Work Auth Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select your status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us_citizen">US Citizen</SelectItem>
                    <SelectItem value="green_card">Permanent Resident (Green Card)</SelectItem>
                    <SelectItem value="work_visa">Valid Work Visa</SelectItem>
                    <SelectItem value="other">Other Work Authorization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               {(!dob || !status) && (
                <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Please fill out all fields to continue.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("intro")} className="w-full">Back</Button>
              <Button 
                onClick={() => setStep("upload")} 
                className="w-full"
                disabled={!dob || !status}
              >
                Next
              </Button>
            </CardFooter>
          </>
        )}

        {step === "upload" && (
          <>
            <CardHeader>
              <CardTitle>Upload Government Proof</CardTitle>
              <CardDescription>Please provide a clear scan or photo of your Driver's License, State ID, or Passport.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-input rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-secondary/20 transition-colors cursor-pointer relative">
                 <input 
                   type="file" 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   accept="image/*,.pdf"
                   onChange={(e) => {
                     if (e.target.files && e.target.files.length > 0) {
                       setFile(e.target.files[0]);
                     }
                   }}
                 />
                 {file ? (
                   <>
                     <FileCheck className="w-10 h-10 text-green-500 mb-3" />
                     <p className="text-sm font-semibold">{file.name}</p>
                     <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
                   </>
                 ) : (
                   <>
                     <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
                     <p className="text-sm font-semibold">Click or drag file to upload</p>
                     <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, PDF (Max 10MB)</p>
                   </>
                 )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("form")} className="w-full">Back</Button>
              <Button 
                onClick={handleSimulatedSubmit} 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={!file || verifyMutation.isPending}
              >
                Submit Application
              </Button>
            </CardFooter>
          </>
        )}

        {step === "processing" && (
          <CardContent className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Verifying Identity</h3>
              <p className="text-sm text-muted-foreground">Scanning documents and verifying eligibility...</p>
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
