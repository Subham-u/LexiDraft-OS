import { createContext, useContext, useState, ReactNode } from 'react';
import { Contract } from '@shared/schema';
import CreateContractModal from '@/components/contracts/CreateContractModal';

interface ContractContextType {
  currentContract: Contract | null;
  setCurrentContract: (contract: Contract | null) => void;
  isContractModalOpen: boolean;
  openContractModal: () => void;
  closeContractModal: () => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export function ContractProvider({ children }: { children: ReactNode }) {
  const [currentContract, setCurrentContract] = useState<Contract | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  const openContractModal = () => setIsContractModalOpen(true);
  const closeContractModal = () => setIsContractModalOpen(false);

  return (
    <ContractContext.Provider
      value={{
        currentContract,
        setCurrentContract,
        isContractModalOpen,
        openContractModal,
        closeContractModal,
      }}
    >
      {children}
      <CreateContractModal 
        isOpen={isContractModalOpen} 
        onClose={closeContractModal} 
      />
    </ContractContext.Provider>
  );
}

// Default fallback contract context data
const fallbackContractContext: ContractContextType = {
  currentContract: null,
  setCurrentContract: () => {},
  isContractModalOpen: false,
  openContractModal: () => {},
  closeContractModal: () => {},
};

export const useContract = () => {
  try {
    const context = useContext(ContractContext);
    if (context === undefined) {
      console.warn('useContract used outside ContractProvider - using fallback data');
      return fallbackContractContext;
    }
    return context;
  } catch (error) {
    console.error('Error in useContract:', error);
    return fallbackContractContext;
  }
};