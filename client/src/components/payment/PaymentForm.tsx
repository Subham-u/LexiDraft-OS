import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PaymentType } from '@/types/payment';

interface PaymentFormProps {
  amount: number;
  productInfo: string;
  paymentType: PaymentType;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
  buttonText?: string;
  isSubscription?: boolean;
  subscriptionInterval?: 'monthly' | 'yearly';
}

export default function PaymentForm({
  amount,
  productInfo,
  paymentType,
  onSuccess,
  onCancel,
  buttonText = "Proceed to Payment",
  isSubscription = false,
  subscriptionInterval = 'monthly'
}: PaymentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [returnUrl, setReturnUrl] = useState('');

  // Set return URL to current location by default
  useEffect(() => {
    setReturnUrl(window.location.href);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let endpoint = '/api/payments/create-order';
      let paymentData: any = {
        amount,
        email,
        phone,
        name,
        productInfo,
        paymentType,
        returnUrl
      };

      // For subscription payments
      if (isSubscription) {
        // Create a subscription plan first
        const planResponse = await apiRequest('POST', '/api/subscriptions/create-plan', {
          planName: productInfo,
          amount,
          interval: subscriptionInterval,
          description: `${subscriptionInterval} subscription for ${productInfo}`
        });

        if (planResponse.ok) {
          const planData = await planResponse.json();
          
          // Then create subscription with the plan
          endpoint = '/api/subscriptions/create';
          paymentData = {
            planId: planData.planId,
            email,
            phone,
            name,
            returnUrl
          };
        } else {
          throw new Error('Failed to create subscription plan');
        }
      }

      const response = await apiRequest('POST', endpoint, paymentData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment initiation failed');
      }

      const data = await response.json();
      
      // If payment link is available, redirect to it
      if (data.paymentLink || data.paymentSessionId) {
        window.location.href = data.paymentLink || data.paymentSessionUrl;
        return;
      }
      
      // Otherwise call the success callback with the data
      if (onSuccess) {
        onSuccess(data);
      }
      
      toast({
        title: "Payment Initiated",
        description: "You will be redirected to complete your payment.",
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          {isSubscription 
            ? `${subscriptionInterval.charAt(0).toUpperCase() + subscriptionInterval.slice(1)} subscription for ${productInfo}`
            : `One-time payment for ${productInfo}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>
          
          {isSubscription && (
            <div className="space-y-2">
              <Label htmlFor="interval">Billing Interval</Label>
              <Select
                defaultValue={subscriptionInterval}
                onValueChange={(value) => setSubscriptionInterval(value as 'monthly' | 'yearly')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select billing interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly (Save 16%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Amount:</span>
              <span className="font-semibold">₹{amount.toFixed(2)}</span>
            </div>
            {isSubscription && (
              <div className="text-xs text-gray-500 mb-4">
                You will be charged ₹{amount.toFixed(2)} {subscriptionInterval === 'monthly' ? 'every month' : 'every year'}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : buttonText}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </CardFooter>
    </Card>
  );
}