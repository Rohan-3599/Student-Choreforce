import SignupForm from './components/Auth/SignupForm';
import PaymentMethodsManager from './components/PaymentMethodsManager';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import RequesterPage from "@/pages/requester";
import TaskerPage from "@/pages/tasker";
import ShopPage from "@/pages/shop";
import LaundryPage from "@/pages/laundry";
import CleaningPage from "@/pages/cleaning";
import CustomTaskPage from "@/pages/custom-task";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <p className="text-sm text-muted-foreground">Loading TaskForce...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <Switch>
      <Route path="/signup" component={SignupForm} />
      <Route path="/" component={RequesterPage} />
      <Route path="/tasker" component={TaskerPage} />
      <Route path="/shop" component={ShopPage} />
      <Route path="/laundry" component={LaundryPage} />
      <Route path="/cleaning" component={CleaningPage} />
      <Route path="/custom" component={CustomTaskPage} />
      <Route path="/payments" component={PaymentMethodsManager} />
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
