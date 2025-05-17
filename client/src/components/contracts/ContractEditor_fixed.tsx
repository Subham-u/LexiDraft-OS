import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Contract, Clause } from "@shared/schema";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Icons and utilities
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  FileText,
  Download,
  Clock,
  Send,
  Search,
  HelpCircle,
  ChevronDown,
  X,
  Plus,
  Save,
  Share,
  Image,
  Settings,
  Wand2,
  Sparkles,
  Mail,
  PenTool,
  Trash,
  Edit,
  Shield,
  FileCheck
} from "lucide-react";

export default function ContractEditor() {
  const { id } = useParams();
  const contractId = parseInt(id || "0", 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editorRef = useRef<HTMLDivElement>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState("editor");
  const [showClauseDialog, setShowClauseDialog] = useState(false);
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [enhanceAction, setEnhanceAction] = useState<string>("explain");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<any>(null);
  
  // Contract data state
  const [contractTitle, setContractTitle] = useState("");
  const [contractContent, setContractContent] = useState("");
  const [clauses, setClauses] = useState<Clause[]>([]);
  
  // Editor features
  const [selectedText, setSelectedText] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signatureData, setSignatureData] = useState("");
  
  // Context menu state
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  
  // Fetch contract data
  const { data: contract, isLoading, isError } = useQuery<Contract>({
    queryKey: ['/api/contracts', contractId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!contractId && contractId > 0,
  });
  
  // Set up mutations
  const updateContractMutation = useMutation({
    mutationFn: async (data: Partial<Contract>) => {
      const response = await apiRequest("PATCH", `/api/contracts/${contractId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', contractId] });
      toast({
        title: "Changes saved",
        description: "Your contract has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const enhanceClauseMutation = useMutation({
    mutationFn: async (data: { action: string; content: string; clauseId?: string }) => {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/enhance`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setEnhanceResult(data);
      toast({
        title: "Enhancement complete",
        description: "The clause has been enhanced successfully.",
      });
      // Refresh contract data
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', contractId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to enhance clause. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const generatePdfMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/pdf`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setPdfUrl(data.pdfUrl);
      toast({
        title: "PDF Generated",
        description: "Your contract PDF has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const saveAsTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/save-as-template`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Saved",
        description: "Your contract has been saved as a template successfully.",
      });
      setShowSaveTemplateModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save as template. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { recipients: string[]; subject: string; message: string }) => {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/send-email`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Your contract has been sent successfully.",
      });
      setShowEmailModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const signContractMutation = useMutation({
    mutationFn: async (data: { signerName: string; signerEmail: string; signatureData: string }) => {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/sign`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contract Signed",
        description: "The contract has been signed successfully.",
      });
      setShowSignatureModal(false);
      // Refresh contract data to show updated status
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', contractId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sign contract. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Initialize editor with contract data
  useEffect(() => {
    if (contract) {
      setContractTitle(contract.title);
      setContractContent(contract.content);
      setClauses(contract.clauses || []);
      
      // Set content in the editor if it's empty
      if (editorRef.current && !editorRef.current.innerHTML.trim() && contract.content) {
        editorRef.current.innerHTML = contract.content;
      }
    }
  }, [contract]);
  
  // Listen for selection in editor to enable formatting operations
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        setSelectedText(selection.toString());
      } else {
        setSelectedText("");
      }
    };
    
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);
  
  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);
  
  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Only show context menu when text is selected
    if (selectedText) {
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    }
  };
  
  // Save editor content
  const saveContract = async () => {
    if (!editorRef.current) return;
    
    setIsSaving(true);
    
    try {
      // Get content from editor
      const content = editorRef.current.innerHTML;
      
      // Update contract
      await updateContractMutation.mutateAsync({
        title: contractTitle,
        content: content,
        clauses: clauses
      });
    } catch (error) {
      console.error("Error saving contract:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Save contract title
  const saveTitle = () => {
    if (contractTitle.trim() === "") {
      setContractTitle("Untitled Contract");
    }
    
    updateContractMutation.mutate({
      title: contractTitle
    });
  };
  
  // Format text in editor
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    
    // Focus back to editor after formatting
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  // Handle text color
  const handleTextColor = (color: string) => {
    document.execCommand('foreColor', false, color);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  // Handle background color
  const handleBgColor = (color: string) => {
    document.execCommand('hiliteColor', false, color);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Only image files are allowed.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploadingImage(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result && editorRef.current) {
        // Create a new img element and insert it at the cursor position
        const img = document.createElement('img');
        img.src = event.target.result as string;
        img.style.maxWidth = '100%';
        img.className = 'my-2 rounded-md';
        
        document.execCommand('insertHTML', false, img.outerHTML);
        
        // Auto save after inserting the image
        saveContract();
      }
      setIsUploadingImage(false);
    };
    
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setIsUploadingImage(false);
    };
    
    reader.readAsDataURL(file);
  };
  
  // Add a new clause to the contract
  const addClause = (clause: Clause) => {
    const updatedClauses = [...clauses, clause];
    setClauses(updatedClauses);
    
    // Update the contract with the new clause
    updateContractMutation.mutate({
      clauses: updatedClauses
    });
    
    // Add clause to editor if needed
    if (editorRef.current) {
      // Add clause to the end of editor content
      editorRef.current.innerHTML += `<div class="clause" data-clause-id="${clause.id}">
        <h3>${clause.title}</h3>
        <div>${clause.content}</div>
      </div>`;
    }
  };
  
  // Enhance a clause with AI
  const enhanceClause = async (action: string, content: string, clauseId?: string) => {
    setIsEnhancing(true);
    setEnhanceResult(null);
    
    try {
      await enhanceClauseMutation.mutateAsync({
        action,
        content,
        clauseId
      });
    } catch (error) {
      console.error("Error enhancing clause:", error);
    } finally {
      setIsEnhancing(false);
    }
  };
  
  // Generate PDF
  const generatePdf = async () => {
    setIsPdfGenerating(true);
    
    try {
      await generatePdfMutation.mutateAsync();
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsPdfGenerating(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-500">Loading contract...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="rounded-full bg-red-100 p-4 text-red-600">
            <X className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Contract Not Found</h2>
          <p className="mt-2 text-gray-500">The contract you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col px-6 py-4">
      {/* Context menu for text selection */}
      {showContextMenu && (
        <div
          className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-2 w-64"
          style={{
            left: contextMenuPosition.x + 'px',
            top: contextMenuPosition.y + 'px',
            transform: `translate(${window.innerWidth - contextMenuPosition.x < 270 ? '-100%' : '0'}, 0)`
          }}
        >
          <div className="px-3 py-1 text-sm font-medium text-gray-500">Lexi AI</div>
          <Separator className="my-1" />
          <div className="px-1 py-1 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedClause({
                  id: `temp-${Date.now()}`,
                  title: "Selected Text",
                  content: selectedText,
                  explanation: ""
                });
                setEnhanceAction("rewrite");
                setShowClauseDialog(true);
                setShowContextMenu(false);
              }}
            >
              <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
              Rewrite with Lexi
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedClause({
                  id: `temp-${Date.now()}`,
                  title: "Selected Text",
                  content: selectedText,
                  explanation: ""
                });
                setEnhanceAction("explain");
                setShowClauseDialog(true);
                setShowContextMenu(false);
              }}
            >
              <HelpCircle className="mr-2 h-4 w-4 text-green-500" />
              Explain in Plain English
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedClause({
                  id: `temp-${Date.now()}`,
                  title: "Selected Text",
                  content: selectedText,
                  explanation: ""
                });
                setEnhanceAction("simplify");
                setShowClauseDialog(true);
                setShowContextMenu(false);
              }}
            >
              <Edit className="mr-2 h-4 w-4 text-amber-500" />
              Simplify Language
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedClause({
                  id: `temp-${Date.now()}`,
                  title: "Selected Text",
                  content: selectedText,
                  explanation: ""
                });
                setEnhanceAction("strengthen");
                setShowClauseDialog(true);
                setShowContextMenu(false);
              }}
            >
              <Shield className="mr-2 h-4 w-4 text-red-500" />
              Strengthen Legal Protection
            </Button>
          </div>
        </div>
      )}
      
      {/* Contract Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Input
              value={contractTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContractTitle(e.target.value)}
              className="max-w-md border-none px-0 text-2xl font-bold focus-visible:ring-0"
              onBlur={saveTitle}
            />
            <Badge className={`
              ${contract?.status === 'draft' ? 'bg-blue-100 text-blue-800' : 
                contract?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                contract?.status === 'signed' ? 'bg-green-100 text-green-800' : 
                'bg-gray-100 text-gray-800'}
            `}>
              {contract?.status ? (contract.status.charAt(0).toUpperCase() + contract.status.slice(1)) : 'Draft'}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Last updated: {contract?.updatedAt ? new Date(contract.updatedAt).toLocaleString() : 'Just now'}</span>
            </div>
            <div>
              Type: {contract?.type ? (contract.type.charAt(0).toUpperCase() + contract.type.slice(1)) : 'Standard'}
            </div>
            <div>
              Jurisdiction: {contract?.jurisdiction || 'India'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={generatePdf}
            disabled={isPdfGenerating}
          >
            {isPdfGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </>
            )}
          </Button>
          
          <Button 
            className="flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700"
            onClick={saveContract}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save</span>
              </>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-2">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowEmailModal(true)}>
                <Mail className="mr-2 h-4 w-4" />
                <span>Email Contract</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSignatureModal(true)}>
                <PenTool className="mr-2 h-4 w-4" />
                <span>Add Digital Signature</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSaveTemplateModal(true)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Save as Template</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete Contract</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Main Editor Area with Sidebar */}
      <div className="flex flex-1 gap-4">
        {/* Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold">Contract Tools</h3>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-medium mb-2">Templates</h4>
              <Select onValueChange={value => {
                // Handle template selection
                toast({
                  title: "Template Selected",
                  description: `${value} template will be applied.`,
                });
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                  <SelectItem value="employment">Employment Contract</SelectItem>
                  <SelectItem value="consulting">Consulting Agreement</SelectItem>
                  <SelectItem value="rental">Rental Agreement</SelectItem>
                  <SelectItem value="partnership">Partnership Agreement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Clauses Library</h4>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {[
                    { id: "c1", title: "Confidentiality Clause" },
                    { id: "c2", title: "Termination Clause" },
                    { id: "c3", title: "Intellectual Property" },
                    { id: "c4", title: "Non-Compete Clause" },
                    { id: "c5", title: "Payment Terms" },
                    { id: "c6", title: "Indemnification" },
                    { id: "c7", title: "Force Majeure" },
                    { id: "c8", title: "Governing Law" },
                    { id: "c9", title: "Arbitration Clause" },
                  ].map(clause => (
                    <div 
                      key={clause.id} 
                      className="p-2 text-sm cursor-pointer rounded hover:bg-gray-100"
                      onClick={() => {
                        // Implement clause addition logic
                        const newClause: Clause = {
                          id: clause.id,
                          title: clause.title,
                          content: `This is a placeholder for the ${clause.title.toLowerCase()} content.`
                        };
                        addClause(newClause);
                      }}
                    >
                      {clause.title}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Lexi AI Assistant</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => {
                    // Implement AI suggestion for the entire contract
                    toast({
                      title: "AI Analysis",
                      description: "Analyzing your contract content...",
                    });
                  }}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Analyze Contract</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => {
                    // Implement custom clause generation
                    toast({
                      title: "Custom Clause",
                      description: "Generating custom clause options...",
                    });
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Generate Clause</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Editor */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="editor">
                <FileText className="mr-2 h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Search className="mr-2 h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white">
              {/* Editor Toolbar */}
              <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => formatText('bold')}>
                        <Bold className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bold</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => formatText('italic')}>
                        <Italic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Italic</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => formatText('underline')}>
                        <Underline className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Underline</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Separator orientation="vertical" className="mx-1 h-6" />
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => formatText('justifyLeft')}>
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Left</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => formatText('justifyCenter')}>
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Center</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => formatText('justifyRight')}>
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Right</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => formatText('justifyFull')}>
                        <AlignJustify className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Justify</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Separator orientation="vertical" className="mx-1 h-6" />
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => formatText('formatBlock', '<h2>')}>
                        <Heading1 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Heading 1</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => formatText('formatBlock', '<h3>')}>
                        <Heading2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Heading 2</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => formatText('insertUnorderedList')}>
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bullet List</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => formatText('insertOrderedList')}>
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Numbered List</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Separator orientation="vertical" className="mx-1 h-6" />
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          // Create a hidden file input and trigger it
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            if (e.target) {
                              handleImageUpload({ target: e.target } as React.ChangeEvent<HTMLInputElement>);
                            }
                          };
                          input.click();
                        }}
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        ) : (
                          <Image className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert Image</TooltipContent>
                  </Tooltip>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <div className="h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: '#000000' }}></div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="grid gap-4">
                        <div>
                          <h4 className="mb-2 font-medium">Text Color</h4>
                          <div className="grid grid-cols-8 gap-2">
                            {[
                              '#000000', '#5E5E5E', '#1D4ED8', '#0369A1', 
                              '#15803D', '#A16207', '#B91C1C', '#BE185D',
                              '#FFFFFF', '#A1A1AA', '#93C5FD', '#67E8F9',
                              '#86EFAC', '#FEF08A', '#FECACA', '#F9A8D4'
                            ].map((color) => (
                              <Button 
                                key={color}
                                variant="outline" 
                                className="h-6 w-6 rounded-full p-0" 
                                style={{ backgroundColor: color }}
                                onClick={() => handleTextColor(color)}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 font-medium">Background Color</h4>
                          <div className="grid grid-cols-8 gap-2">
                            {[
                              '#FFFFFF', '#F4F4F5', '#EFF6FF', '#ECFEFF', 
                              '#ESFCEF', '#FEFCE8', '#FEF2F2', '#FDF2F8',
                              '#F8FAFC', '#D4D4D8', '#DBEAFE', '#CFFAFE',
                              '#DCFCE7', '#FEF9C3', '#FEE2E2', '#FCE7F3'
                            ].map((color) => (
                              <Button 
                                key={color}
                                variant="outline" 
                                className="h-6 w-6 rounded-full p-0" 
                                style={{ backgroundColor: color }}
                                onClick={() => handleBgColor(color)}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipProvider>
              </div>
              
              <TabsContent value="editor" className="flex-1 p-0">
                <div 
                  ref={editorRef}
                  className="h-full min-h-[500px] w-full resize-none border-0 p-4 focus:outline-none"
                  contentEditable
                  onBlur={saveContract}
                  onContextMenu={handleContextMenu}
                  style={{ overflow: 'auto' }}
                />
              </TabsContent>
              
              <TabsContent value="preview" className="flex-1 p-0">
                <div 
                  className="h-full min-h-[500px] w-full p-4"
                  dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || "" }}
                  style={{ overflow: 'auto' }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      
      {/* Save as Template Modal */}
      <Dialog open={showSaveTemplateModal} onOpenChange={setShowSaveTemplateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this contract as a template for future use.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateName(e.target.value)}
                placeholder="E.g., Standard NDA Agreement"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-description">Description (Optional)</Label>
              <textarea
                id="template-description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={templateDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTemplateDescription(e.target.value)}
                placeholder="Describe the purpose and use cases for this template..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!templateName.trim()) {
                  toast({
                    title: "Error",
                    description: "Template name is required.",
                    variant: "destructive",
                  });
                  return;
                }
                
                saveAsTemplateMutation.mutate({
                  name: templateName,
                  description: templateDescription
                });
              }}
              disabled={saveAsTemplateMutation.isPending}
            >
              {saveAsTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Email Contract Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Email Contract</DialogTitle>
            <DialogDescription>
              Send this contract via email to recipients.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email-recipients">Recipients (comma separated)</Label>
              <Input
                id="email-recipients"
                placeholder="email1@example.com, email2@example.com"
                value={emailRecipients.join(', ')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailRecipients(e.target.value.split(',').map(email => email.trim()).filter(Boolean))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailSubject(e.target.value)}
                placeholder={`Contract: ${contractTitle || 'New Contract'}`}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-message">Message (Optional)</Label>
              <textarea
                id="email-message"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={emailMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailMessage(e.target.value)}
                placeholder="Add a message to accompany the contract..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (emailRecipients.length === 0) {
                  toast({
                    title: "Error",
                    description: "At least one recipient email is required.",
                    variant: "destructive",
                  });
                  return;
                }
                
                sendEmailMutation.mutate({
                  recipients: emailRecipients,
                  subject: emailSubject || `Contract: ${contractTitle || 'New Contract'}`,
                  message: emailMessage
                });
              }}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Digital Signature Modal */}
      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Digital Signature</DialogTitle>
            <DialogDescription>
              Sign this contract with your digital signature.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="signer-name">Your Name</Label>
              <Input
                id="signer-name"
                value={signerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSignerName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signer-email">Your Email</Label>
              <Input
                id="signer-email"
                type="email"
                value={signerEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSignerEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signature">Signature</Label>
              <div 
                className="h-32 border border-gray-300 rounded-md flex items-center justify-center bg-gray-50 cursor-crosshair"
                onClick={() => {
                  // For simplicity, we're just using a text-based signature
                  // In a real app, you'd implement a canvas for drawing a signature
                  if (!signerName) {
                    toast({
                      title: "Error",
                      description: "Please enter your name first.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // Generate a simple signature based on the name
                  const date = new Date().toISOString();
                  setSignatureData(`${signerName} - ${date}`);
                }}
              >
                {signatureData ? (
                  <p className="font-cursive text-lg">{signatureData}</p>
                ) : (
                  <p className="text-gray-500 text-sm">Click here to create your signature</p>
                )}
              </div>
              {signatureData && (
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setSignatureData("")}
                >
                  Clear Signature
                </Button>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignatureModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!signerName) {
                  toast({
                    title: "Error",
                    description: "Name is required.",
                    variant: "destructive",
                  });
                  return;
                }
                
                if (!signerEmail) {
                  toast({
                    title: "Error",
                    description: "Email is required.",
                    variant: "destructive",
                  });
                  return;
                }
                
                if (!signatureData) {
                  toast({
                    title: "Error",
                    description: "Signature is required.",
                    variant: "destructive",
                  });
                  return;
                }
                
                signContractMutation.mutate({
                  signerName,
                  signerEmail,
                  signatureData
                });
              }}
              disabled={signContractMutation.isPending}
            >
              {signContractMutation.isPending ? 'Signing...' : 'Sign Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}