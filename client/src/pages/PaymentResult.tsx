import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, AlertTriangle, ChevronLeft, Loader2 } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';

export default function PaymentResult() {
  const [status, setStatus] = useState<'success' | 'failure' | 'pending' | 'loading'>('loading');
  const [message, setMessage] = useState<string>('Processing your payment...');
  const [orderId, setOrderId] = useState<string>('');
  const [linkId, setLinkId] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [txStatus, setTxStatus] = useState<string>('');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const orderIdParam = searchParams.get('order_id');
    const linkIdParam = searchParams.get('link_id');
    const referenceIdParam = searchParams.get('referenceId');
    const txStatusParam = searchParams.get('txStatus');

    setOrderId(orderIdParam || '');
    setLinkId(linkIdParam || '');
    setReferenceId(referenceIdParam || '');
    setTxStatus(txStatusParam || '');

    if (txStatusParam === 'SUCCESS') {
      setStatus('success');
      setMessage('Your payment was successful!');
    } else if (txStatusParam === 'FAILED') {
      setStatus('failure');
      setMessage('Your payment failed. Please try again.');
    } else {
      setStatus('pending');
      setMessage('Your payment is being processed...');
    }

    // Verify payment with the server (if this is a real payment callback)
    const verifyPayment = async () => {
      try {
        if (orderIdParam && referenceIdParam && txStatusParam) {
          const response = await apiRequest('POST', '/api/verify-payment', {
            orderId: orderIdParam,
            referenceId: referenceIdParam,
            txStatus: txStatusParam
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setStatus('success');
              setMessage(data.message || 'Your payment was successful!');
            } else {
              setStatus('failure');
              setMessage(data.message || 'Payment verification failed. Please contact support.');
              setProcessingError(data.error || null);
            }
          } else {
            setStatus('failure');
            setMessage('Payment verification failed. Please contact support.');
          }
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('failure');
        setMessage('An error occurred while verifying your payment. Please contact support.');
        setProcessingError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    // Only verify if we have the necessary parameters (in a real scenario)
    if (orderIdParam && referenceIdParam && txStatusParam) {
      verifyPayment();
    }
  }, [location]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <Check className="h-5 w-5 text-green-600" />}
            {status === 'failure' && <X className="h-5 w-5 text-red-600" />}
            {status === 'pending' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
            Payment {status === 'success' ? 'Successful' : status === 'failure' ? 'Failed' : status === 'pending' ? 'Pending' : 'Processing'}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(orderId || linkId) && (
            <div className="space-y-2">
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
              
              {referenceId && (
                <div>
                  <p className="text-sm font-medium">Reference ID:</p>
                  <p className="text-sm font-mono bg-slate-100 p-2 rounded">{referenceId}</p>
                </div>
              )}
            </div>
          )}
          
          {processingError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-700">Error Details:</p>
              <p className="text-sm text-red-600">{processingError}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex items-center justify-center py-6">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
          )}
          
          {status === 'failure' && (
            <div className="flex items-center justify-center py-6">
              <div className="rounded-full bg-red-100 p-3">
                <X className="h-8 w-8 text-red-600" />
              </div>
            </div>
          )}
          
          {status === 'pending' && (
            <div className="flex items-center justify-center py-6">
              <div className="rounded-full bg-amber-100 p-3">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={() => setLocation('/')} 
            className="w-full"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Return to Home
          </Button>
          
          {status === 'failure' && (
            <Button 
              onClick={() => window.history.back()} 
              variant="outline" 
              className="w-full"
            >
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}