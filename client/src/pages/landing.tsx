import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, SprayCan, WashingMachine, ArrowRight, Shield, Zap, Users, DollarSign, CreditCard, Wallet, Building2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight" data-testid="text-logo">TaskForce</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <a href="/api/login" data-testid="button-login">
              <Button variant="outline" size="sm">Log in</Button>
            </a>
            <a href="/api/login" data-testid="button-get-started">
              <Button size="sm">Get Started <ArrowRight className="w-3 h-3 ml-1" /></Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium" data-testid="badge-usc">
                <Shield className="w-3.5 h-3.5" />
                Built for USC Trojans
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]" data-testid="text-hero-title">
                Get your chores done by fellow
                <span className="text-primary"> Trojans</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed" data-testid="text-hero-subtitle">
                Post tasks at set prices and let trusted USC students handle your grocery shopping, dorm cleaning, and laundry. Or earn money by completing tasks for others.
              </p>
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <a href="/api/login">
                  <Button size="lg" data-testid="button-hero-cta">
                    Start Posting Tasks
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                <a href="/api/login">
                  <Button size="lg" variant="outline" data-testid="button-hero-earn">
                    Earn as a Tasker
                    <DollarSign className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Free to join
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  USC students only
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Set prices per category
                </div>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <ServicePreviewCard
                  icon={ShoppingCart}
                  title="Grocery Shopping"
                  description="Fresh groceries delivered to your dorm"
                  price="10% + 15%"
                  colorClass="text-emerald-600 dark:text-emerald-400"
                  bgClass="bg-emerald-50 dark:bg-emerald-950/30"
                />
                <ServicePreviewCard
                  icon={WashingMachine}
                  title="Laundry"
                  description="Wash, dry, and fold service"
                  price="$20"
                  colorClass="text-violet-600 dark:text-violet-400"
                  bgClass="bg-violet-50 dark:bg-violet-950/30"
                />
              </div>
              <div className="pt-8">
                <ServicePreviewCard
                  icon={SprayCan}
                  title="Dorm Cleaning"
                  description="Deep clean your living space"
                  price="$35"
                  colorClass="text-blue-600 dark:text-blue-400"
                  bgClass="bg-blue-50 dark:bg-blue-950/30"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight" data-testid="text-how-it-works">How it works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Two ways to use TaskForce</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-4">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg">Need Help? (Requester)</h3>
                <div className="space-y-3">
                  <StepItem step="1" text="Post a task with category, title, and location" />
                  <StepItem step="2" text="Price is automatically set based on the category" />
                  <StepItem step="3" text="A tasker claims and completes your task" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-4">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg">Want to Earn? (Tasker)</h3>
                <div className="space-y-3">
                  <StepItem step="1" text="Browse open tasks from fellow Trojans" />
                  <StepItem step="2" text="Claim a task that fits your schedule" />
                  <StepItem step="3" text="Complete the task and earn the set price" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Set Prices</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Transparent, fixed pricing for every category</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <PriceCard
              icon={ShoppingCart}
              title="Grocery Shopping"
              price={25}
              description="Pick up groceries from nearby stores and deliver to your dorm"
              colorClass="text-emerald-600 dark:text-emerald-400"
              bgClass="bg-emerald-50 dark:bg-emerald-950/30"
            />
            <PriceCard
              icon={SprayCan}
              title="Dorm Cleaning"
              price={35}
              description="Deep clean your dorm room, bathroom, and common areas"
              colorClass="text-blue-600 dark:text-blue-400"
              bgClass="bg-blue-50 dark:bg-blue-950/30"
            />
            <PriceCard
              icon={WashingMachine}
              title="Laundry"
              price={20}
              description="Wash, dry, and fold your clothes with care"
              colorClass="text-violet-600 dark:text-violet-400"
              bgClass="bg-violet-50 dark:bg-violet-950/30"
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Why TaskForce?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Built specifically for the Trojan community</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <FeatureCard
              icon={Shield}
              title="Trusted Network"
              description="Only verified USC students. Your tasks stay within the Trojan family."
            />
            <FeatureCard
              icon={Zap}
              title="Fast Turnaround"
              description="Most tasks are completed within hours. Post now, relax later."
            />
            <FeatureCard
              icon={CreditCard}
              title="Flexible Payments"
              description="Pay with PayPal, Venmo, Zelle, or Cash App. Choose what works for you."
            />
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <h3 className="text-lg font-semibold text-muted-foreground">Accepted Payment Methods</h3>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2 text-[#003087]" data-testid="logo-paypal">
              <CreditCard className="w-6 h-6" />
              <span className="font-semibold">PayPal</span>
            </div>
            <div className="flex items-center gap-2 text-[#3D95CE]" data-testid="logo-venmo">
              <Wallet className="w-6 h-6" />
              <span className="font-semibold">Venmo</span>
            </div>
            <div className="flex items-center gap-2 text-[#6C1CD3]" data-testid="logo-zelle">
              <Building2 className="w-6 h-6" />
              <span className="font-semibold">Zelle</span>
            </div>
            <div className="flex items-center gap-2 text-[#00D632]" data-testid="logo-cashapp">
              <DollarSign className="w-6 h-6" />
              <span className="font-semibold">Cash App</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">TaskForce</span>
          </div>
          <p>Fight On! Built by Trojans, for Trojans.</p>
        </div>
      </footer>
    </div>
  );
}

function ServicePreviewCard({ icon: Icon, title, description, price, colorClass, bgClass }: {
  icon: typeof ShoppingCart;
  title: string;
  description: string;
  price: string;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-5 space-y-3">
        <div className={`w-10 h-10 rounded-md ${bgClass} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="text-lg font-bold">{price}</div>
      </CardContent>
    </Card>
  );
}

function StepItem({ step, text }: { step: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {step}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function PriceCard({ icon: Icon, title, price, description, colorClass, bgClass }: {
  icon: typeof ShoppingCart;
  title: string;
  price: number;
  description: string;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-6 space-y-4 text-center">
        <div className={`w-14 h-14 rounded-md ${bgClass} flex items-center justify-center mx-auto`}>
          <Icon className={`w-7 h-7 ${colorClass}`} />
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
        <div className="text-4xl font-bold text-primary" data-testid={`text-price-${title.toLowerCase().replace(/ /g, '-')}`}>${price}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon: Icon, title, description }: {
  icon: typeof Shield;
  title: string;
  description: string;
}) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-6 space-y-3">
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
