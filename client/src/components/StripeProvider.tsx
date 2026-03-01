import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const StripeProvider: React.FC<{
    clientSecret: string | null;
    children: React.ReactNode;
}> = ({ clientSecret, children }) => {
    if (!clientSecret) return <>{children}</>;

    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#7c3aed',
                    },
                }
            }}
        >
            {children}
        </Elements>
    );
};
