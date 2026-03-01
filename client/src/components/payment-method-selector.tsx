import type { PaymentMethod } from "@shared/schema";
import { CreditCard, Building2, DollarSign, Wallet } from "lucide-react";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof CreditCard;
  color: string;
  bgColor: string;
}[] = [
    {
      id: "paypal",
      label: "PayPal",
      description: "Pay securely with PayPal",
      icon: CreditCard,
      color: "text-[#003087]",
      bgColor: "bg-[#003087]/5 border-[#003087]",
    },
    {
      id: "venmo",
      label: "Venmo",
      description: "Send via Venmo @username",
      icon: Wallet,
      color: "text-[#3D95CE]",
      bgColor: "bg-[#3D95CE]/5 border-[#3D95CE]",
    },
    {
      id: "zelle",
      label: "Zelle",
      description: "Transfer via Zelle email/phone",
      icon: Building2,
      color: "text-[#6C1CD3]",
      bgColor: "bg-[#6C1CD3]/5 border-[#6C1CD3]",
    },
    {
      id: "cashapp",
      label: "Cash App",
      description: "Pay with $cashtag",
      icon: DollarSign,
      color: "text-[#00D632]",
      bgColor: "bg-[#00D632]/5 border-[#00D632]",
    },
    {
      id: "credit_card",
      label: "Credit/Debit Card",
      description: "Pay with Visa, Mastercard, etc.",
      icon: CreditCard,
      color: "text-slate-700",
      bgColor: "bg-slate-700/5 border-slate-700",
    },
    {
      id: "apple_pay",
      label: "Apple Pay",
      description: "Fast checkout with Apple Pay",
      icon: Wallet,
      color: "text-black",
      bgColor: "bg-black/5 border-black",
    },
  ];

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  allowedMethods?: PaymentMethod[];
}

export default function PaymentMethodSelector({ selected, onSelect, allowedMethods }: PaymentMethodSelectorProps) {
  const filteredMethods = allowedMethods
    ? PAYMENT_METHODS.filter(m => allowedMethods.includes(m.id))
    : PAYMENT_METHODS;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Payment Method</label>
      <div className="grid grid-cols-2 gap-2">
        {filteredMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={`flex items-center gap-2.5 p-3 rounded-lg border-2 transition-all text-left ${isSelected
                  ? `${method.bgColor} ring-1 ring-offset-1`
                  : "border-muted hover:border-muted-foreground/30 bg-background"
                }`}
              data-testid={`payment-method-${method.id}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isSelected ? method.color : "text-muted-foreground"}`} />
              <div className="min-w-0">
                <p className={`text-sm font-medium leading-tight ${isSelected ? method.color : "text-foreground"}`}>
                  {method.label}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                  {method.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod | null | undefined }) {
  if (!method) return null;
  const config = PAYMENT_METHODS.find((m) => m.id === method);
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.color}`} data-testid={`badge-payment-${method}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

export function getPaymentMethodLabel(method: PaymentMethod | null | undefined): string {
  if (!method) return "Not selected";
  const config = PAYMENT_METHODS.find((m) => m.id === method);
  return config?.label ?? method;
}
