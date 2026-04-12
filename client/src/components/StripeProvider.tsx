import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

export const StripeProvider: React.FC<{
    clientSecret: string | null;
    customerSessionClientSecret?: string | null;
    children: React.ReactNode;
}> = ({ clientSecret, customerSessionClientSecret, children }) => {
    if (!clientSecret) return null;

    const options: any = {
        clientSecret,
        appearance: {
            theme: 'stripe',
            variables: {
                colorPrimary: '#7c3aed',
            },
        }
    };

    if (customerSessionClientSecret) {
        options.customerSessionClientSecret = customerSessionClientSecret;
    }

    return (
        <Elements
            stripe={stripePromise}
            options={options}
        >
            {children}
        </Elements>
    );
};
