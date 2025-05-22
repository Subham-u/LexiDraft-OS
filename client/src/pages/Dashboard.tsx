import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import QuickActions from "@/components/dashboard/QuickActions";
import Stats from "@/components/dashboard/Stats";
import RecentContracts from "@/components/dashboard/RecentContracts";
import LexiAI from "@/components/dashboard/LexiAI";
import PopularTemplates from "@/components/dashboard/PopularTemplates";
import UpcomingConsultations from "@/components/dashboard/UpcomingConsultations";
import NewContractWizard from "@/components/contracts/NewContractWizard";
import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  
  const openContractModal = () => {
    setIsContractModalOpen(true);
  };
  
  const closeContractModal = () => {
    setIsContractModalOpen(false);
  };
  
  return (
    <DashboardLayout>
      <div className="relative">
        {/* <DashboardHeader /> */}
        <QuickActions />
        <Stats />
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <RecentContracts />
            <UpcomingConsultations />
          </div>
          
          <div className="space-y-8">
            <LexiAI />
            <PopularTemplates />
          </div>
        </div>
        
        {/* Floating action button for creating contracts with improved styling */}
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
          <Button 
            onClick={openContractModal}
            size="lg"
            className="h-14 w-14 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 flex items-center justify-center"
          >
            <FilePlus className="h-6 w-6" />
            <span className="sr-only">Create Contract</span>
          </Button>
          
          {/* Enhanced tooltip with animation */}
          <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-3 whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Create Contract
          </div>
        </div>
        
        {/* New 8-step contract creation wizard */}
        {isContractModalOpen && (
          <NewContractWizard 
            isOpen={isContractModalOpen} 
            onClose={closeContractModal} 
          />
        )}
      </div>
    </DashboardLayout>
  );
}
