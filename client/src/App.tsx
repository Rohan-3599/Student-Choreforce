import AuthPage from './pages/AuthPage';
import PaymentMethodsManager from './components/PaymentMethodsManager';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import RequesterPage from "@/pages/requester";
import TaskerPage from "@/pages/tasker";
import LaundryPage from "@/pages/laundry";
import CleaningPage from "@/pages/cleaning";
import CustomTaskPage from "@/pages/custom-task";
import ProfilePage from "@/pages/profile";
import ResetPasswordPage from "@/pages/reset-password";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-pulse shadow-lg shadow-primary/25">
            <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Initializing TaskForce...</p>
        </div>
      </div>
    );
  }

  // Strict Protection: Only show AuthPage if not logged in
  if (!user) {
    return (
      <Switch>
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/" component={AuthPage} />
        <Route path="/signup" component={AuthPage} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={RequesterPage} />
      <Route path="/tasker" component={TaskerPage} />
      <Route path="/laundry" component={LaundryPage} />
      <Route path="/cleaning" component={CleaningPage} />
      <Route path="/custom" component={CustomTaskPage} />
      <Route path="/payments" component={PaymentMethodsManager} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
