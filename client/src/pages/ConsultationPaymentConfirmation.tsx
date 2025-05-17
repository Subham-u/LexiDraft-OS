import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ConsultationPaymentConfirmation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed' | 'unknown'>('loading');
  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  // Get URL query parameters
  useEffect(() => {
    const verifyPayment = async () => {
      // Parse query parameters
      const queryParams = new URLSearchParams(window.location.search);
      const orderId = queryParams.get('orderId');
      const txStatus = queryParams.get('txStatus');
      const referenceId = queryParams.get('referenceId');
      
      if (!orderId) {
        setPaymentStatus('unknown');
        setError('Missing order information');
        return;
      }

      try {
        // Verify payment status with the server
        const response = await apiRequest('GET', `/api/payments/order/${orderId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Extract consultation ID from order metadata
          if (data.metadata && data.metadata.consultationId) {
            setConsultationId(parseInt(data.metadata.consultationId));
          }
          
          // Check payment status
          if (txStatus === 'SUCCESS' || data.orderStatus === 'PAID') {
            setPaymentStatus('success');
            
            // Update consultation status if we have the ID
            if (data.metadata && data.metadata.consultationId) {
              try {
                await apiRequest('PATCH', `/api/consultations/${data.metadata.consultationId}`, {
                  status: 'scheduled',
                  paymentStatus: 'paid'
                });
              } catch (updateError) {
                console.error('Failed to update consultation status:', updateError);
              }
            }
          } else {
            setPaymentStatus('failed');
            setError(`Payment failed: ${data.orderStatus || txStatus}`);
          }
        } else {
          setPaymentStatus('unknown');
          setError('Could not verify payment status');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setPaymentStatus('unknown');
        setError('Error verifying payment');
      }
    };

    verifyPayment();
  }, []);

  const handleViewDetails = () => {
    if (consultationId) {
      setLocation(`/consultations/${consultationId}`);
    } else {
      setLocation('/consultations');
    }
  };

  const renderContent = () => {
    switch (paymentStatus) {
      case 'loading':
        return (
          <div className="flex flex-col items-center text-center p-8">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <h2 className="text-2xl font-semibold">Verifying Payment</h2>
            <p className="text-gray-600 mt-2">Please wait while we confirm your payment...</p>
          </div>
        );
        
      case 'success':
        return (
          <div className="flex flex-col items-center text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold text-green-700">Payment Successful!</h2>
            <p className="text-gray-600 mt-2">
              Your consultation has been confirmed. You can now access your consultation details.
            </p>
            <Button className="mt-6" onClick={handleViewDetails}>
              View Consultation Details
            </Button>
          </div>
        );
        
      case 'failed':
        return (
          <div className="flex flex-col items-center text-center p-8">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-semibold text-red-700">Payment Failed</h2>
            <p className="text-gray-600 mt-2">
              {error || 'We couldn\'t process your payment. Please try again.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button variant="outline" onClick={() => setLocation('/consultations')}>
                View My Consultations
              </Button>
              <Button variant="default" onClick={() => setLocation('/lawyers')}>
                Try Again
              </Button>
            </div>
          </div>
        );
        
      case 'unknown':
      default:
        return (
          <div className="flex flex-col items-center text-center p-8">
            <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
            <h2 className="text-2xl font-semibold text-amber-700">Payment Status Unknown</h2>
            <p className="text-gray-600 mt-2">
              {error || 'We couldn\'t determine the status of your payment. If you completed the payment, it may take some time to reflect in our system.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button variant="outline" onClick={() => setLocation('/consultations')}>
                View My Consultations
              </Button>
              <Button variant="default" onClick={() => setLocation('/lawyers')}>
                Return to Lawyer Marketplace
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Consultation Payment</CardTitle>
            <CardDescription>
              Verification of your lawyer consultation payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            <p>
              Having issues? Contact our support team at support@lexidraft.com
            </p>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}