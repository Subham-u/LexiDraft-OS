import { useState } from "react";
import { Shield, Eye, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useLocation } from "wouter";

interface ContractSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: number;
  contractTitle: string;
}

export default function ContractSuccessModal({
  isOpen,
  onClose,
  contractId,
  contractTitle
}: ContractSuccessModalProps) {
  const [_, navigate] = useLocation();
  const lexiCertId = `LEXI-${810000 + contractId}`;
  const currentDate = new Date().toLocaleDateString();
  
  const handleDownload = () => {
    // In a real implementation, this would download the contract PDF
    console.log(`Downloading contract ${contractId}`);
  };
  
  const handleShare = () => {
    // In a real implementation, this would trigger a share dialog
    console.log(`Sharing contract ${contractId}`);
  };

  const handleViewDetails = () => {
    // Navigate to the contract details page in the client portal
    navigate(`/client/contract/${contractId}`);
  };
  
  const handleReturnToDashboard = () => {
    // Close the modal and navigate to the dashboard
    onClose();
    navigate("/");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold">Contract Created!</DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6 py-4">
          <p className="text-gray-600">Your contract has been certified and is ready</p>
          
          <div className="flex justify-center">
            <div className="w-16 h-16 flex items-center justify-center">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-gray-700 font-medium">LexiCert ID</h3>
            <p className="text-xl font-semibold">{lexiCertId}</p>
            <p className="text-xs text-gray-500">This unique ID verifies the authenticity of your contract</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="flex flex-col items-start">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-green-600">Certified</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-gray-500">Created On</span>
              <span className="font-medium">{currentDate}</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-gray-500">Parties</span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-gray-500">Signed</span>
              <span className="font-medium">0/1</span>
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={() => window.open(`/contracts/${contractId}`, '_blank')}
            >
              <Eye size={16} />
              <span>View</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleDownload}
            >
              <Download size={16} />
              <span>Download</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleShare}
            >
              <Share2 size={16} />
              <span>Share Contract</span>
            </Button>

            <Button 
              variant="default"
              className="w-full"
              onClick={handleViewDetails}
            >
              View Authentication Details
            </Button>
          </div>
          
          <Button 
            variant="link" 
            className="text-primary hover:text-primary/80"
            onClick={handleReturnToDashboard}
          >
            Return to Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}