import React, { useEffect, useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

function AddCardForm({ onAdded, onCancel }: { onAdded: () => void, onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    try {
      const r = await axios.post("/payments/create-setup-intent", {}, { headers: { Authorization: `Bearer ${token}` } });
      const clientSecret = r.data.client_secret;
      const card = elements.getElement(CardElement)!;
      const result = await stripe.confirmCardSetup(clientSecret, { payment_method: { card } });

      if (result.error) {
        setError(result.error.message || "Failed to add card.");
        setLoading(false);
        return;
      }

      await axios.post("/payments/save-payment-method", { payment_method: result.setupIntent?.payment_method }, { headers: { Authorization: `Bearer ${token}` } });
      onAdded();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleAdd} className="space-y-4 p-4 border rounded-lg bg-secondary/10 mt-4 animate-in fade-in slide-in-from-top-4">
      <h4 className="font-semibold text-sm">Enter Card Details</h4>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="p-3 border rounded-md bg-background">
        <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } } } }} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!stripe || loading} className="min-w-[120px]">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving</> : "Add Card"}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentMethodsManager() {
  const [methods, setMethods] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const r = await axios.get("/api/users/me/payment-methods", { headers: { Authorization: `Bearer ${token}` } });
      setMethods(r.data.methods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMethods();
  }, [token]);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Payment Methods
          </CardTitle>
          <CardDescription>Manage your saved cards for quick checkout.</CardDescription>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" variant="outline" className="flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add New
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : methods.length === 0 && !isAdding ? (
          <div className="text-center p-8 border border-dashed rounded-lg bg-secondary/5">
            <p className="text-muted-foreground mb-4">You have no saved payment methods.</p>
            <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Add a Card
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {methods.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-secondary/40 rounded flex items-center justify-center font-bold text-xs uppercase tracking-wider text-primary">
                    {m.brand}
                  </div>
                  <div>
                    <p className="font-semibold font-mono text-sm tracking-widest">•••• •••• •••• {m.last4}</p>
                    <p className="text-xs text-muted-foreground">Expires {m.expMonth}/{m.expYear}</p>
                  </div>
                </div>
                {m.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Default</span>}
              </div>
            ))}
          </div>
        )}

        {isAdding && (
          <Elements stripe={stripePromise}>
            <AddCardForm
              onAdded={() => { setIsAdding(false); fetchMethods(); }}
              onCancel={() => setIsAdding(false)}
            />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
}
