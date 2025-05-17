import { Button } from '@/components/ui/button';
import NewContractWizard from './NewContractWizard';

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  fullWidth?: boolean;
}

export function CreateContractModal({ 
  isOpen,
  onClose,
  variant = 'default', 
  size = 'default',
  className = '',
  fullWidth = false
}: CreateContractModalProps) {
  return (
    <NewContractWizard isOpen={isOpen} onClose={onClose} />
  );
}

export default CreateContractModal;