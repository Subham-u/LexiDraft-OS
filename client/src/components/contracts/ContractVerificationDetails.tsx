import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  Check, 
  X, 
  FileText, 
  CalendarClock, 
  UserRound, 
  Lock, 
  AlertCircle, 
  ExternalLink,
  MoreHorizontal,
  Signature,
  QrCode,
  Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ContractVerificationDetailsProps {
  contractId: number;
  contractTitle: string;
  createdAt: string;
  status: "draft" | "certified" | "signed" | "expired";
  parties: Array<{
    name: string;
    email: string;
    status: "pending" | "signed" | "rejected";
  }>;
}

export default function ContractVerificationDetails({
  contractId,
  contractTitle,
  createdAt,
  status,
  parties
}: ContractVerificationDetailsProps) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<"aadhaar" | "dsc" | "otp">("otp");
  
  const lexiCertId = `LEXI-${810000 + contractId}`;
  const signedCount = parties.filter(p => p.status === "signed").length;
  const totalParties = parties.length;
  const percentComplete = (signedCount / totalParties) * 100;
  
  // Format verification status
  const getStatusDetails = () => {
    switch(status) {
      case "draft":
        return {
          label: "Draft",
          color: "bg-amber-100 text-amber-800",
          icon: AlertCircle,
          message: "This contract is still in draft mode and not yet verified."
        };
      case "certified":
        return {
          label: "Certified",
          color: "bg-blue-100 text-blue-800",
          icon: Shield,
          message: "This contract has been certified by LexiDraft but is awaiting signatures."
        };
      case "signed":
        return {
          label: "Signed",
          color: "bg-green-100 text-green-800",
          icon: Check,
          message: "This contract has been signed by all parties and is legally binding."
        };
      case "expired":
        return {
          label: "Expired",
          color: "bg-red-100 text-red-800",
          icon: X,
          message: "This contract has expired or been voided."
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-800",
          icon: AlertCircle,
          message: "Status unknown."
        };
    }
  };
  
  const statusInfo = getStatusDetails();
  const StatusIcon = statusInfo.icon;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Contract Authentication Details</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Download Certificate</DropdownMenuItem>
                <DropdownMenuItem>Verify Authenticity</DropdownMenuItem>
                <DropdownMenuItem>View Audit Log</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${statusInfo.color}`}>
                <StatusIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{statusInfo.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={statusInfo.color.replace('bg-', 'border-').replace('text-', 'text-')}>
                    {statusInfo.label}
                  </Badge>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">LexiCert ID: {lexiCertId}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Created On</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5 text-gray-400" />
                  {createdAt}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Signature Status</p>
                <div className="flex items-center gap-1">
                  <Progress value={percentComplete} className="h-2 w-16" />
                  <p className="text-sm font-medium">{signedCount}/{totalParties}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Verification Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={verificationMethod} onValueChange={(value) => setVerificationMethod(value as any)}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="otp">OTP</TabsTrigger>
              <TabsTrigger value="aadhaar">Aadhaar</TabsTrigger>
              <TabsTrigger value="dsc">DSC</TabsTrigger>
            </TabsList>
            
            <TabsContent value="otp" className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-1">OTP Verification</h4>
                <p className="text-xs text-blue-700">
                  A simple verification method using a one-time password sent to your registered mobile or email.
                </p>
              </div>
              
              <Button className="w-full">Verify with OTP</Button>
            </TabsContent>
            
            <TabsContent value="aadhaar" className="space-y-4">
              <div className="bg-green-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-green-800 mb-1">Aadhaar Verification</h4>
                <p className="text-xs text-green-700">
                  Government-issued ID verification for strong proof of identity in India.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1">Link Aadhaar</Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowQrModal(true)}
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="dsc" className="space-y-4">
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-purple-800 mb-1">Digital Signature Certificate</h4>
                <p className="text-xs text-purple-700">
                  The highest level of verification using government-issued Digital Signature Certificates.
                </p>
              </div>
              
              <Button variant="default" className="w-full">Upload DSC</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Signatory Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {parties.map((party, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserRound className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{party.name}</p>
                    <p className="text-xs text-gray-500">{party.email}</p>
                  </div>
                </div>
                <Badge variant={
                  party.status === "signed" ? "success" : 
                  party.status === "rejected" ? "destructive" : 
                  "outline"
                }>
                  {party.status === "signed" ? "Signed" : 
                   party.status === "rejected" ? "Rejected" : 
                   "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* QR Code Modal */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code for Aadhaar Verification</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            <div className="h-48 w-48 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
              <QrCode className="h-16 w-16 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Scan this QR code with the mAadhaar app to verify your identity.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}