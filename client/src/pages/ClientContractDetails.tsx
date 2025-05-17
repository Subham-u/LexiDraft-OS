import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  Download, 
  Share2, 
  Eye, 
  FileText, 
  MessageSquare, 
  Clock, 
  BarChart, 
  Shield
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ContractVerificationDetails from "@/components/contracts/ContractVerificationDetails";
import ContractCompletionModal from "@/components/contracts/ContractCompletionModal";

export default function ClientContractDetails() {
  const { id } = useParams<{ id: string }>();
  const contractId = id ? parseInt(id) : 0;
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // Define contract interface
  interface Party {
    name: string;
    role: string;
    email?: string;
    address?: string;
  }
  
  interface Clause {
    id: string;
    title: string;
    content: string;
    explanation?: string;
  }
  
  interface Contract {
    id: number;
    title: string;
    type: string;
    status: string;
    content: string;
    parties: Party[];
    clauses: Clause[];
    createdAt: string | Date;
    updatedAt: string | Date;
    lexiCertId?: string;
    jurisdiction?: string;
    signatures?: string[];
  }
  
  // Fetch contract details with proper type
  const { data: contract, isLoading } = useQuery<Contract>({
    queryKey: ["/api/contracts", contractId],
    staleTime: 30000,
    enabled: contractId > 0 && !isNaN(contractId),
    retry: false,
    refetchOnWindowFocus: false
  });
  
  // Create a safe wrapper for contract data
  const safeContract = {
    id: contract?.id ?? contractId,
    title: contract?.title ?? "Contract",
    type: contract?.type ?? "contract",
    status: contract?.status ?? "draft",
    createdAt: contract?.createdAt ?? new Date().toLocaleDateString(),
    lexiCertId: contract?.lexiCertId ?? `LEXI-${810000 + contractId}`,
    parties: contract?.parties ?? [],
  };
  
  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 md:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Link href="/contracts">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{safeContract.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs font-medium capitalize">
                  {safeContract.type.replace("_", " ")}
                </Badge>
                <Badge variant={
                  safeContract.status === "signed" ? "success" :
                  safeContract.status === "certified" ? "secondary" :
                  safeContract.status === "draft" ? "outline" : "destructive"
                } className="text-xs">
                  {safeContract.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-8/12">
            <Tabs defaultValue="verification">
              <TabsList className="mb-4">
                <TabsTrigger value="verification" className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>Verification</span>
                </TabsTrigger>
                <TabsTrigger value="document" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Document</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Activity</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-1">
                  <BarChart className="h-4 w-4" />
                  <span>Analytics</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="verification" className="space-y-6">
                <ContractVerificationDetails 
                  contractId={safeContract.id}
                  contractTitle={safeContract.title}
                  createdAt={safeContract.createdAt}
                  status={safeContract.status as any}
                  parties={safeContract.parties}
                />
              </TabsContent>
              
              <TabsContent value="document">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Document</CardTitle>
                    <CardDescription>View and manage the contract document</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center justify-center bg-gray-100 p-8 rounded-lg">
                      <FileText className="h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium">{safeContract.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">LexiCert ID: {safeContract.lexiCertId}</p>
                      <div className="flex mt-4 gap-2">
                        <Button 
                          variant="outline" 
                          className="flex items-center gap-1"
                          onClick={() => window.open(`/contracts/${contractId}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>Track all activities related to this contract</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Contract Certified</span> - The contract has been certified by LexiDraft
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{safeContract.createdAt} - 1:12 PM</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Contract Created</span> - A new contract was created and assigned a LexiCert ID
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{safeContract.createdAt} - 1:10 PM</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics & Insights</CardTitle>
                    <CardDescription>Analytics about your contract performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart className="h-12 w-12 text-gray-300 mx-auto" />
                      <h3 className="mt-4 text-lg font-medium">Analytics Coming Soon</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Contract analytics and insights will be available soon.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="w-full lg:w-4/12 space-y-6">
            {/* Actions Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => window.open(`/contracts/${contractId}`, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                  <span>View Contract</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Contract</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Contract</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Ask Lexi AI</span>
                </Button>
              </CardContent>
            </Card>
            
            {/* Contract Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Contract Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Contract Type</span>
                    <span className="text-sm font-medium capitalize">{safeContract.type.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Status</span>
                    <Badge variant={
                      safeContract.status === "signed" ? "success" :
                      safeContract.status === "certified" ? "secondary" :
                      safeContract.status === "draft" ? "outline" : "destructive"
                    } className="text-xs">
                      {safeContract.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Created On</span>
                    <span className="text-sm font-medium">{safeContract.createdAt}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">LexiCert ID</span>
                    <span className="text-sm font-medium">{safeContract.lexiCertId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Parties</span>
                    <span className="text-sm font-medium">{safeContract.parties.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Contract Completion Modal */}
      <ContractCompletionModal 
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        contractId={safeContract.id}
        contractTitle={safeContract.title}
      />
    </DashboardLayout>
  );
}