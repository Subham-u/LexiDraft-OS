import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';

/**
 * Payment Simulator Component
 * 
 * This is a test component that simulates payment processing without actually
 * connecting to the Cashfree API. It's used during development to simulate
 * successful and failed payments.
 */
export default function PaymentSimulator() {
  const [orderId, setOrderId] = useState<string>('');
  const [linkId, setLinkId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [subscriptionId, setSubscriptionId] = useState<string>('');
  const [planId, setPlanId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Parse URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setOrderId(searchParams.get('order_id') || '');
    setLinkId(searchParams.get('link_id') || '');
    setAmount(searchParams.get('amount') || '');
    setSubscriptionId(searchParams.get('subscription_id') || '');
    setPlanId(searchParams.get('plan_id') || '');
  }, [location]);

  const handlePaymentAction = async (success: boolean) => {
    setLoading(true);
    
    try {
      // Determine where to redirect based on the parameters
      let redirectUrl = '';
      const successStatus = success ? 'SUCCESS' : 'FAILED';
      const referenceId = `ref_${Date.now()}`;
      
      if (orderId) {
        // Handle order payment
        redirectUrl = `/payment-result?order_id=${orderId}&txStatus=${successStatus}&referenceId=${referenceId}`;
      } else if (linkId) {
        // Handle payment link
        redirectUrl = `/payment-result?link_id=${linkId}&txStatus=${successStatus}&referenceId=${referenceId}`;
      } else if (subscriptionId) {
        // Handle subscription payment
        redirectUrl = `/subscription-result?subscription_id=${subscriptionId}&plan_id=${planId}&txStatus=${successStatus}&referenceId=${referenceId}`;
      } else {
        // Default fallback
        redirectUrl = '/';
      }
      
      // Add delay to simulate payment processing
      setTimeout(() => {
        setLocation(redirectUrl);
      }, 1500);
      
      toast({
        title: success ? "Payment Simulated Successfully" : "Payment Simulation Failed",
        description: `This is a simulated ${success ? 'successful' : 'failed'} payment for testing purposes.`,
        variant: success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Payment simulation error:', error);
      toast({
        title: "Simulation Error",
        description: "An error occurred while simulating the payment. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Payment Simulator</CardTitle>
          <CardDescription>
            This is a test page to simulate Cashfree payment processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(orderId || linkId || subscriptionId) ? (
            <div className="space-y-4">
              {orderId && (
                <div>
                  <p className="text-sm font-medium">Order ID:</p>
                  <p className="text-sm font-mono bg-slate-100 p-2 rounded">{orderId}</p>
                </div>
              )}
              
              {linkId && (
                <div>
                  <p className="text-sm font-medium">Link ID:</p>
                  <p className="text-sm font-mono bg-slate-100 p-2 rounded">{linkId}</p>
                </div>
              )}
              
              {subscriptionId && (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Subscription ID:</p>
                    <p className="text-sm font-mono bg-slate-100 p-2 rounded">{subscriptionId}</p>
                  </div>
                  {planId && (
                    <div>
                      <p className="text-sm font-medium">Plan ID:</p>
                      <p className="text-sm font-mono bg-slate-100 p-2 rounded">{planId}</p>
                    </div>
                  )}
                </div>
              )}
              
              {amount && (
                <div>
                  <p className="text-sm font-medium">Amount:</p>
                  <p className="text-lg font-bold">₹{amount}</p>
                </div>
              )}
              
              <div className="mt-6 border-t pt-4">
                <p className="text-sm text-slate-500 mb-2">This is a simulation environment. No actual payment will be processed.</p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-red-500">No payment parameters detected.</p>
              <p className="text-sm text-slate-500 mt-2">This page should be accessed from a payment link.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={() => handlePaymentAction(true)} 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading || (!orderId && !linkId && !subscriptionId)}
          >
            {loading ? "Processing..." : "Simulate Successful Payment"}
          </Button>
          
          <Button 
            onClick={() => handlePaymentAction(false)} 
            variant="destructive" 
            className="w-full"
            disabled={loading || (!orderId && !linkId && !subscriptionId)}
          >
            {loading ? "Processing..." : "Simulate Failed Payment"}
          </Button>
          
          <Button 
            onClick={() => setLocation('/')} 
            variant="outline" 
            className="w-full mt-2"
            disabled={loading}
          >
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}