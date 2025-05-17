import { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentType } from '@/types/payment';
import PaymentModal from './PaymentModal';

interface SubscriptionFeature {
  text: string;
  included: boolean;
}

interface SubscriptionCardProps {
  title: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: SubscriptionFeature[];
  popularPlan?: boolean;
  onSubscribe?: (data: any) => void;
}

export default function SubscriptionCard({
  title,
  description,
  price,
  interval,
  features,
  popularPlan = false,
  onSubscribe,
}: SubscriptionCardProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSuccess = (data: any) => {
    if (onSubscribe) {
      onSubscribe(data);
    }
    setShowPaymentModal(false);
  };

  return (
    <>
      <Card className={`w-full max-w-sm mx-auto border ${popularPlan ? 'border-primary shadow-lg relative' : ''}`}>
        {popularPlan && (
          <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-4 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
            Most Popular
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          <div className="mt-4">
            <span className="text-3xl font-bold">₹{price}</span>
            <span className="text-muted-foreground">/{interval}</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className={`flex-shrink-0 w-5 h-5 mr-2 rounded-full flex items-center justify-center ${feature.included ? 'text-primary' : 'text-muted-foreground'}`}>
                  {feature.included ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <span className="text-sm">-</span>
                  )}
                </span>
                <span className={feature.included ? '' : 'text-muted-foreground'}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            className={`w-full ${popularPlan ? 'bg-primary hover:bg-primary/90' : ''}`}
            onClick={() => setShowPaymentModal(true)}
          >
            Subscribe Now
          </Button>
        </CardFooter>
      </Card>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={price}
        productInfo={title}
        paymentType={PaymentType.SUBSCRIPTION}
        onSuccess={handleSuccess}
        isSubscription={true}
        subscriptionInterval={interval}
        title={`Subscribe to ${title}`}
        description={`${interval.charAt(0).toUpperCase() + interval.slice(1)} subscription - ₹${price}/${interval}`}
      />
    </>
  );
}