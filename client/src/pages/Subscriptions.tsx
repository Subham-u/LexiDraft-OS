import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import SubscriptionCard from '@/components/payment/SubscriptionCard';

export default function Subscriptions() {
  const { toast } = useToast();
  
  const handleSubscription = (data: any) => {
    toast({
      title: "Subscription Created",
      description: "Your subscription has been created successfully.",
    });
    console.log("Subscription data:", data);
  };

  const basicFeatures = [
    { text: "Access to basic contract templates", included: true },
    { text: "5 contracts per month", included: true },
    { text: "Email support", included: true },
    { text: "AI contract drafting", included: false },
    { text: "Access to premium templates", included: false },
    { text: "Legal verification", included: false },
    { text: "Priority support", included: false },
  ];

  const proFeatures = [
    { text: "Access to all contract templates", included: true },
    { text: "Unlimited contracts", included: true },
    { text: "AI contract drafting", included: true },
    { text: "Email & phone support", included: true },
    { text: "Access to premium templates", included: true },
    { text: "Legal verification (2 per month)", included: true },
    { text: "Priority support", included: false },
  ];

  const enterpriseFeatures = [
    { text: "Access to all contract templates", included: true },
    { text: "Unlimited contracts", included: true },
    { text: "Advanced AI contract drafting", included: true },
    { text: "24/7 priority support", included: true },
    { text: "Access to premium templates", included: true },
    { text: "Unlimited legal verification", included: true },
    { text: "Dedicated account manager", included: true },
  ];

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight">Choose the Right Plan for Your Business</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Get access to advanced features with our flexible subscription plans. 
          All plans include our core contract management functionalities.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-8">
        <SubscriptionCard
          title="Basic"
          description="Perfect for individuals and small businesses"
          price={499}
          interval="monthly"
          features={basicFeatures}
          onSubscribe={handleSubscription}
        />
        
        <SubscriptionCard
          title="Professional"
          description="Ideal for growing businesses"
          price={1499}
          interval="monthly"
          features={proFeatures}
          popularPlan={true}
          onSubscribe={handleSubscription}
        />
        
        <SubscriptionCard
          title="Enterprise"
          description="For large organizations with complex needs"
          price={4999}
          interval="monthly"
          features={enterpriseFeatures}
          onSubscribe={handleSubscription}
        />
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Need a Custom Plan?</h2>
        <p className="max-w-2xl mx-auto text-muted-foreground mb-6">
          We offer customized enterprise solutions tailored to your organization's specific requirements.
          Contact our sales team to discuss your needs.
        </p>
        <a 
          href="mailto:enterprise@lexidraft.com" 
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          Contact Sales
        </a>
      </div>

      <div className="mt-16 py-8 border-t border-border">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Secure Payments</h3>
            <p className="text-muted-foreground">
              Your payment information is securely processed by Cashfree. We never store your card details.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Flexible Billing</h3>
            <p className="text-muted-foreground">
              Choose between monthly or annual billing. Cancel or upgrade your plan at any time.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">30-Day Money Back</h3>
            <p className="text-muted-foreground">
              Not satisfied? Get a full refund within the first 30 days, no questions asked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}