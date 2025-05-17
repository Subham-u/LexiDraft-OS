import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MessageSquare, Phone, Video, Paperclip, Send, User, Download } from "lucide-react";
import { format } from "date-fns";
import VideoChat from "@/components/consultation/VideoChat";
import ChatMessages from "@/components/consultation/ChatMessages";

interface Consultation {
  id: number;
  lawyerId: number;
  userId: number;
  title: string;
  description?: string;
  date: string;
  duration: number;
  mode: "video" | "call" | "chat";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  documents: Document[];
  price: number;
  paymentStatus: string;
  lexiAssistEnabled: boolean;
  meetingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  name: string;
  fileUrl: string;
  uploadedBy: number;
  type: string;
  size: number;
}

interface Lawyer {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  imageUrl: string;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
  type: "text" | "file";
  fileUrl?: string;
  fileName?: string;
}

export default function ConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const consultationId = parseInt(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch consultation details
  const { data: consultation, isLoading, error } = useQuery<Consultation>({
    queryKey: [`/api/consultations/${consultationId}`],
    enabled: !isNaN(consultationId),
    staleTime: 10000, // 10 seconds
  });
  
  // Fetch lawyer details
  const { data: lawyer } = useQuery<Lawyer>({
    queryKey: [`/api/lawyers/${consultation?.lawyerId}`],
    enabled: !!consultation?.lawyerId,
  });
  
  // Scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Load initial messages (would connect to a WebSocket in a real implementation)
  useEffect(() => {
    if (consultation?.mode === "chat") {
      // Mock messages for demonstration
      const mockMessages: Message[] = [
        {
          id: 1,
          senderId: consultation.lawyerId,
          content: `Hello! I'm reviewing your query about ${consultation.title}. How can I assist you today?`,
          timestamp: new Date(new Date().getTime() - 30 * 60000).toISOString(),
          type: "text"
        },
        {
          id: 2,
          senderId: consultation.userId,
          content: "Thank you for accepting my consultation request. I have a few questions about the legal implications of my situation.",
          timestamp: new Date(new Date().getTime() - 25 * 60000).toISOString(),
          type: "text"
        },
        {
          id: 3,
          senderId: consultation.lawyerId,
          content: "Of course. I've reviewed the details you provided. Before we proceed, would you like me to explain the general process first?",
          timestamp: new Date(new Date().getTime() - 20 * 60000).toISOString(),
          type: "text"
        }
      ];
      
      setMessages(mockMessages);
    }
  }, [consultation]);
  
  const formatConsultationTime = (date: string, duration: number) => {
    try {
      const consultationDate = new Date(date);
      const endTime = new Date(consultationDate.getTime() + duration * 60000);
      
      const startFormatted = format(consultationDate, "h:mm a");
      const endFormatted = format(endTime, "h:mm a");
      const dateFormatted = format(consultationDate, "EEEE, MMMM d, yyyy");
      
      return {
        time: `${startFormatted} - ${endFormatted}`,
        date: dateFormatted
      };
    } catch (error) {
      return { time: "Invalid time", date: "Invalid date" };
    }
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // In a real implementation, this would send the message to the server
    const newMsg: Message = {
      id: messages.length + 1,
      senderId: consultation?.userId || 1,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text"
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage("");
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadDialogOpen(true);
    }
  };
  
  const handleFileUpload = () => {
    if (!selectedFile) return;
    
    // In a real implementation, this would upload the file to the server
    const newMsg: Message = {
      id: messages.length + 1,
      senderId: consultation?.userId || 1,
      content: `Shared a file: ${selectedFile.name}`,
      timestamp: new Date().toISOString(),
      type: "file",
      fileName: selectedFile.name,
      fileUrl: URL.createObjectURL(selectedFile) // This would be a real URL in production
    };
    
    setMessages([...messages, newMsg]);
    setUploadDialogOpen(false);
    setSelectedFile(null);
    
    toast({
      title: "File uploaded",
      description: `${selectedFile.name} has been shared successfully.`
    });
  };
  
  const joinVideoCall = () => {
    if (consultation?.meetingUrl) {
      window.open(consultation.meetingUrl, "_blank");
    } else {
      toast({
        title: "Cannot join meeting",
        description: "Meeting URL is not available",
        variant: "destructive"
      });
    }
  };
  
  const makePhoneCall = () => {
    toast({
      description: "Initiating phone call... Please wait for the lawyer to connect.",
    });
    
    // In a real implementation, this would initiate a phone call
    setTimeout(() => {
      toast({
        title: "Call connected",
        description: `You are now connected with ${lawyer?.name}.`,
      });
    }, 3000);
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[80vh] w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !consultation) {
    return (
      <DashboardLayout>
        <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Consultation not found</h2>
          <p className="mt-2 text-gray-600">The consultation you're looking for doesn't exist or you don't have access to it.</p>
          <Button 
            className="mt-4" 
            onClick={() => setLocation("/lawyers")}
          >
            Back to Lawyer Marketplace
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  const { time, date } = formatConsultationTime(consultation.date, consultation.duration);
  
  return (
    <DashboardLayout>
      <div className="container max-w-6xl py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {consultation.title}
            </h1>
            <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{time}</span>
              </div>
              <div className="flex items-center gap-1">
                {consultation.mode === "video" && <Video className="h-4 w-4" />}
                {consultation.mode === "call" && <Phone className="h-4 w-4" />}
                {consultation.mode === "chat" && <MessageSquare className="h-4 w-4" />}
                <span className="capitalize">{consultation.mode} Consultation</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
              Status: {consultation.status.replace("_", " ").charAt(0).toUpperCase() + consultation.status.replace("_", " ").slice(1)}
            </div>
          </div>
        </div>
        
        {/* Lawyer information card */}
        {lawyer && (
          <Card className="mb-6">
            <CardContent className="flex items-center gap-4 p-4">
              <img
                src={lawyer.imageUrl}
                alt={lawyer.name}
                className="h-16 w-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{lawyer.name}</h3>
                <p className="text-sm text-gray-600">{lawyer.specialization} • {lawyer.experience} years experience</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="consultation" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="consultation">Consultation</TabsTrigger>
            <TabsTrigger value="documents">Shared Documents</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="consultation" className="mt-0">
            {consultation.mode === "video" && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  {(consultation.status === "scheduled" || consultation.status === "in_progress") ? (
                    <>
                      <div className="mb-4 flex flex-col items-center justify-center text-center">
                        <Video className="mb-3 h-12 w-12 text-blue-500" />
                        <h3 className="mb-2 text-xl font-semibold text-gray-900">Video Consultation</h3>
                        <p className="mb-4 text-gray-600">
                          {consultation.status === "scheduled" 
                            ? "Your video consultation is scheduled. Start the video call below at the scheduled time."
                            : "Your consultation is in progress. Connect with the lawyer using the video interface below."}
                        </p>
                      </div>
                      <VideoChat 
                        consultationId={consultation.id}
                        userId={consultation.userId}
                        lawyerId={consultation.lawyerId}
                        mode="video"
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Video className="mb-3 h-12 w-12 text-blue-500" />
                      <h3 className="mb-2 text-xl font-semibold text-gray-900">Video Consultation</h3>
                      <p className="text-gray-600">This video consultation has ended.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {consultation.mode === "call" && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  {(consultation.status === "scheduled" || consultation.status === "in_progress") ? (
                    <>
                      <div className="mb-4 flex flex-col items-center justify-center text-center">
                        <Phone className="mb-3 h-12 w-12 text-blue-500" />
                        <h3 className="mb-2 text-xl font-semibold text-gray-900">Phone Consultation</h3>
                        <p className="mb-4 text-gray-600">
                          {consultation.status === "scheduled" 
                            ? "Your phone consultation is scheduled. Start the call below at the scheduled time."
                            : "Your consultation is in progress. Connect with the lawyer using the call interface below."}
                        </p>
                      </div>
                      <VideoChat 
                        consultationId={consultation.id}
                        userId={consultation.userId}
                        lawyerId={consultation.lawyerId}
                        mode="call"
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Phone className="mb-3 h-12 w-12 text-blue-500" />
                      <h3 className="mb-2 text-xl font-semibold text-gray-900">Phone Consultation</h3>
                      <p className="text-gray-600">This phone consultation has ended.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {consultation.mode === "chat" && (
              <Card className="mb-6 h-[60vh] overflow-hidden">
                <CardContent className="p-0">
                  {consultation.status === "completed" ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <MessageSquare className="mb-3 h-12 w-12 text-blue-500" />
                      <h3 className="mb-2 text-xl font-semibold text-gray-900">Chat Consultation</h3>
                      <p className="text-gray-600">This chat consultation has ended.</p>
                    </div>
                  ) : (
                    <ChatMessages 
                      consultationId={consultation.id}
                      userId={consultation.userId}
                      lawyerId={consultation.lawyerId}
                      initialMessages={messages}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="documents" className="mt-0">
            <Card>
              <CardContent className="p-6">
                {consultation.documents && consultation.documents.length > 0 ? (
                  <div className="divide-y">
                    {consultation.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-50 p-2">
                            <Paperclip className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{doc.name}</h4>
                            <p className="text-sm text-gray-500">
                              {doc.type} • {(doc.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Paperclip className="mb-3 h-12 w-12 text-gray-300" />
                    <h3 className="mb-1 text-lg font-medium text-gray-900">No documents shared yet</h3>
                    <p className="text-gray-500">
                      Documents shared during your consultation will appear here.
                    </p>
                  </div>
                )}
                
                <div className="mt-6">
                  <input
                    type="file"
                    id="doc-upload"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="doc-upload">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Paperclip className="mr-2 h-4 w-4" />
                        Share a Document
                      </span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details" className="mt-0">
            <Card>
              <CardContent className="space-y-6 p-6">
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Consultation Details</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-gray-900">{date}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Time</p>
                      <p className="text-gray-900">{time}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Duration</p>
                      <p className="text-gray-900">{consultation.duration} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Mode</p>
                      <p className="capitalize text-gray-900">{consultation.mode}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="capitalize text-gray-900">{consultation.status.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Price</p>
                      <p className="text-gray-900">₹{consultation.price}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Status</p>
                      <p className="capitalize text-gray-900">{consultation.paymentStatus}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Lexi AI Assistant</p>
                      <p className="text-gray-900">{consultation.lexiAssistEnabled ? "Enabled" : "Disabled"}</p>
                    </div>
                  </div>
                </div>
                
                {consultation.description && (
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">Your Query</h3>
                    <p className="text-gray-700">{consultation.description}</p>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <Button 
                    variant="outline" 
                    className="mr-2"
                    onClick={() => setLocation("/lawyers")}
                  >
                    Back to Lawyer Marketplace
                  </Button>
                  {consultation.status === "scheduled" && (
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        toast({
                          title: "Consultation cancelled",
                          description: "Your consultation has been cancelled. You will receive a refund according to our cancellation policy.",
                        });
                        // In a real implementation, this would cancel the consultation
                      }}
                    >
                      Cancel Consultation
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* File upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              {selectedFile?.name}{" "}
              <span className="text-sm text-gray-500">
                ({(selectedFile?.size ? (selectedFile.size / 1024).toFixed(2) : 0)} KB)
              </span>
            </p>
            <p className="text-sm text-gray-600">
              This document will be shared with the lawyer and will become part of your consultation records.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload}>Upload & Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}