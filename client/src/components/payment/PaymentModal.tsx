import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PaymentType } from '@/types/payment';
import PaymentForm from './PaymentForm';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  productInfo?: string;
  paymentType: PaymentType;
  onSuccess?: (data: any) => void;
  isSubscription?: boolean;
  subscriptionInterval?: 'monthly' | 'yearly';
  title?: string;
  description?: string;
  buttonText?: string;
  details?: Record<string, any>;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  productInfo = 'LexiDraft Services',
  paymentType,
  onSuccess,
  isSubscription = false,
  subscriptionInterval = 'monthly',
  title = 'Payment',
  description = 'Complete your payment to continue',
  buttonText,
  details
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuccess = (data: any) => {
    if (onSuccess) {
      onSuccess(data);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={isProcessing ? undefined : onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PaymentForm
            amount={amount}
            productInfo={productInfo || 'LexiDraft Services'}
            paymentType={paymentType}
            onSuccess={handleSuccess}
            onCancel={onClose}
            buttonText={buttonText}
            isSubscription={isSubscription}
            subscriptionInterval={subscriptionInterval}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}