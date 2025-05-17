import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

// Icons
import { 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  FileText, 
  Send, 
  Download, 
  Users, 
  User, 
  Building, 
  Map, 
  Calendar, 
  Briefcase, 
  Book, 
  MessageSquare, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

// Form handling
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Types and data
import { Party, contractTypeEnum } from '@shared/schema';
import { indianContractTemplates } from './templates/IndianContractTemplates';

// Animation
import { motion, AnimatePresence } from 'framer-motion';

// Contract creation schema
const contractCreationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  type: z.enum(contractTypeEnum.enumValues),
  description: z.string().optional(),
  parties: z.array(
    z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      role: z.string().min(2, 'Role must be at least 2 characters'),
      email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
      address: z.string().optional(),
    })
  ).min(1, 'At least one party is required'),
  jurisdiction: z.string().min(2, 'Jurisdiction is required'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  customClauses: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })).optional(),
  useTemplate: z.boolean().optional(),
  templateId: z.string().optional(),
  useAI: z.boolean().default(true),
});

type ContractCreationFormValues = z.infer<typeof contractCreationSchema>;

// Default form values
const defaultValues: Partial<ContractCreationFormValues> = {
  title: '',
  type: 'nda',
  description: '',
  parties: [{ name: '', role: '', email: '', address: '' }],
  jurisdiction: 'India',
  useTemplate: false,
  useAI: true,
};

// Contract types with their descriptions
const contractTypes = [
  { value: 'nda', label: 'Non-Disclosure Agreement', description: 'Protect sensitive information shared between parties' },
  { value: 'employment', label: 'Employment Contract', description: 'Formal agreement between employer and employee' },
  { value: 'freelance', label: 'Freelance Agreement', description: 'Contract for independent contractors or freelancers' },
  { value: 'founder', label: 'Founder Agreement', description: 'Terms between co-founders of a business' },
  { value: 'lease', label: 'Lease Agreement', description: 'Rental contract for property or equipment' },
  { value: 'sale_of_goods', label: 'Sale of Goods', description: 'Contract for selling or purchasing products' },
  { value: 'partnership', label: 'Partnership Agreement', description: 'Terms for business partnership' },
  { value: 'consulting', label: 'Consulting Agreement', description: 'Contract for providing consulting services' },
  { value: 'service', label: 'Service Agreement', description: 'Contract for providing ongoing services' },
  { value: 'loan', label: 'Loan Agreement', description: 'Terms for lending money or assets' },
];

// Jurisdictions
const jurisdictions = [
  { value: 'India', label: 'India (Federal)' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Mumbai', label: 'Mumbai' },
  { value: 'Bangalore', label: 'Bangalore' },
  { value: 'Chennai', label: 'Chennai' },
  { value: 'Kolkata', label: 'Kolkata' },
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Pune', label: 'Pune' },
];

// Party roles
const partyRoles = [
  { value: 'employer', label: 'Employer' },
  { value: 'employee', label: 'Employee' },
  { value: 'client', label: 'Client' },
  { value: 'provider', label: 'Service Provider' },
  { value: 'lessor', label: 'Lessor' },
  { value: 'lessee', label: 'Lessee' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'customer', label: 'Customer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'partner', label: 'Partner' },
  { value: 'disclosing_party', label: 'Disclosing Party' },
  { value: 'receiving_party', label: 'Receiving Party' },
  { value: 'other', label: 'Other' },
];

export default function CreateContractWizard({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(4);
  const [progress, setProgress] = useState(25);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  // Mock user for development purposes to avoid auth issues
  const user = { id: 1, fullName: 'Demo User' };
  const queryClient = useQueryClient();
  
  // Get clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: getQueryFn(),
  });
  
  // Set up form
  const form = useForm<ContractCreationFormValues>({
    resolver: zodResolver(contractCreationSchema),
    defaultValues,
  });
  
  // Set up form field array for parties
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'parties',
  });
  
  // Update AI questions based on contract type
  useEffect(() => {
    const contractType = form.getValues().type;
    let questions: string[] = [];
    
    // Base questions for all contract types
    questions.push("What is the purpose of this contract?");
    
    // Contract type-specific questions
    switch (contractType) {
      case 'nda':
        questions.push("What type of information will be protected?");
        questions.push("How long should the confidentiality obligations last?");
        questions.push("Are there any exclusions to the confidential information?");
        break;
        
      case 'employment':
        questions.push("What is the job title and primary responsibilities?");
        questions.push("What is the compensation structure (salary, benefits, etc.)?");
        questions.push("Is there a probation period?");
        questions.push("What are the working hours and leave policies?");
        break;
        
      case 'freelance':
        questions.push("What specific services will be provided?");
        questions.push("What is the payment structure (fixed, hourly, milestone-based)?");
        questions.push("Who owns the intellectual property created?");
        questions.push("What are the deliverables and deadlines?");
        break;
        
      case 'founder':
        questions.push("How will equity be divided among founders?");
        questions.push("What are the vesting terms for founder shares?");
        questions.push("How will key decisions be made?");
        questions.push("What happens if a founder leaves the company?");
        break;
        
      case 'lease':
        questions.push("What is being leased (property, equipment, etc.)?");
        questions.push("What is the lease duration and payment schedule?");
        questions.push("Are there any restrictions on use?");
        questions.push("Who is responsible for maintenance and repairs?");
        break;
        
      default:
        questions.push("What are the key terms you want to include?");
        questions.push("What is the duration of this agreement?");
        questions.push("Are there any special conditions or requirements?");
    }
    
    // Add jurisdiction-specific question
    questions.push("Are there any specific legal requirements for your jurisdiction?");
    
    setAiQuestions(questions);
    setTotalSteps(4); // Adjust total steps if needed
    
  }, [form.watch('type')]);
  
  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);
  
  // Update progress when step changes
  useEffect(() => {
    setProgress((step / totalSteps) * 100);
  }, [step, totalSteps]);
  
  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (data: ContractCreationFormValues) => {
      setIsProcessing(true);
      
      // Prepare data for API
      const contractData = {
        title: data.title,
        type: data.type,
        description: data.description || `${data.title} - ${new Date().toLocaleDateString()}`,
        parties: data.parties,
        jurisdiction: data.jurisdiction,
        userId: user?.id,
        status: 'draft',
        content: '',
        clauses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const response = await apiRequest("POST", "/api/contracts", contractData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Contract Created Successfully",
        description: "Your new contract has been created and is ready for editing.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      
      // Navigate to editor with the new route structure
      setLocation(`/contracts/edit/${data.id}`);
    },
    onError: (error) => {
      console.error("Error creating contract:", error);
      toast({
        title: "Error Creating Contract",
        description: "There was a problem creating your contract. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
    onSettled: () => {
      setIsProcessing(false);
      onClose();
    }
  });
  
  // Handle AI response
  const handleAIResponse = async (question: string, answer: string) => {
    setIsAIThinking(true);
    
    try {
      // Add to chat history
      setChatHistory(prev => [...prev, 
        { role: 'user', content: answer },
        { role: 'assistant', content: 'Lexi is analyzing your response...', thinking: true }
      ]);
      
      // In a real implementation, this would call the OpenAI API
      // For now, we'll simulate a response
      setTimeout(() => {
        setChatHistory(prev => {
          const newHistory = [...prev];
          // Replace the "thinking" message with actual response
          if (newHistory.length && newHistory[newHistory.length - 1].thinking) {
            newHistory.pop();
          }
          
          let aiResponse = "";
          
          // Simulate different AI responses based on the question
          if (question.includes("purpose")) {
            aiResponse = `Thanks for sharing the purpose. Based on your ${form.getValues().type.replace('_', ' ')} contract, I suggest focusing on clear terms for all parties involved.`;
          } else if (question.includes("information") && form.getValues().type === 'nda') {
            aiResponse = "I recommend specifying categories of protected information and including examples to prevent ambiguity.";
          } else if (question.includes("compensation") || question.includes("payment")) {
            aiResponse = "Consider including payment milestones, late payment terms, and currency specifications in your contract.";
          } else if (question.includes("intellectual property") || question.includes("ownership")) {
            aiResponse = "I suggest adding explicit IP assignment clauses with work-for-hire provisions to protect ownership rights.";
          } else if (question.includes("jurisdiction")) {
            aiResponse = `For ${form.getValues().jurisdiction}, I recommend including arbitration provisions under the Arbitration and Conciliation Act, 1996 and ensuring proper stamp duty compliance.`;
          } else {
            aiResponse = "Thanks for providing these details. I'll use this information to help draft appropriate clauses for your contract.";
          }
          
          return [...newHistory, { role: 'assistant', content: aiResponse }];
        });
        
        // Move to next question or finish
        if (currentQuestion < aiQuestions.length - 1) {
          setCurrentQuestion(prev => prev + 1);
        } else {
          // All questions answered
          setChatHistory(prev => [...prev, { 
            role: 'assistant', 
            content: "Thank you for all the information! I've gathered everything I need to help draft your contract. You can now proceed to create and edit your document." 
          }]);
          
          // Add some suggestions based on the contract type
          generateAISuggestions();
        }
        
        setUserAnswer('');
        setIsAIThinking(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error getting AI response:", error);
      setChatHistory(prev => {
        const newHistory = [...prev];
        if (newHistory.length && newHistory[newHistory.length - 1].thinking) {
          newHistory.pop();
        }
        return [...newHistory, { role: 'assistant', content: "I'm sorry, I couldn't process your response. Let's continue with the next question." }];
      });
      
      setCurrentQuestion(prev => Math.min(prev + 1, aiQuestions.length - 1));
      setUserAnswer('');
      setIsAIThinking(false);
    }
  };
  
  // Generate AI suggestions for clauses
  const generateAISuggestions = () => {
    const contractType = form.getValues().type;
    const jurisdiction = form.getValues().jurisdiction;
    
    // Get relevant template
    const template = indianContractTemplates.find(t => t.type === contractType);
    
    if (template) {
      // Suggest clauses from template based on contract type
      setAiSuggestions(template.clauses.map((clause) => ({
        type: 'clause',
        title: clause.title,
        content: clause.content,
        id: clause.id
      })));
    } else {
      // Fallback to general suggestions
      setAiSuggestions([
        {
          type: 'clause',
          title: 'Governing Law',
          content: `This Agreement shall be governed by and construed in accordance with the laws of ${jurisdiction}.`,
          id: 'governing-law'
        },
        {
          type: 'clause',
          title: 'Dispute Resolution',
          content: `Any dispute arising out of or in connection with this Agreement shall be referred to arbitration in ${jurisdiction}.`,
          id: 'dispute-resolution'
        },
        {
          type: 'clause',
          title: 'Force Majeure',
          content: 'Neither party shall be liable for any failure to perform its obligations under this Agreement if such failure results from circumstances beyond that party\'s reasonable control.',
          id: 'force-majeure'
        }
      ]);
    }
  };
  
  // Submit form
  const onSubmit = (data: ContractCreationFormValues) => {
    createContractMutation.mutate(data);
  };
  
  // Next step
  const nextStep = () => {
    if (step < totalSteps) {
      // Validate current step
      let canProceed = true;
      
      if (step === 1) {
        form.trigger(['title', 'type']);
        canProceed = !form.getFieldState('title').invalid && !form.getFieldState('type').invalid;
      } else if (step === 2) {
        form.trigger(['parties']);
        canProceed = !form.getFieldState('parties').invalid;
      }
      
      if (canProceed) {
        setStep(step + 1);
        
        // Initialize chat for step 3
        if (step === 2 && chatHistory.length === 0) {
          setChatHistory([
            { role: 'assistant', content: `Hi! I'm Lexi, your legal assistant. Let's create a ${form.getValues().type.replace('_', ' ')} contract together. I'll ask a few questions to help draft the perfect document for you.` },
            { role: 'assistant', content: aiQuestions[0] }
          ]);
        }
      } else {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields correctly before proceeding.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Previous step
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Add party
  const addParty = () => {
    append({ name: '', role: '', email: '', address: '' });
  };
  
  // Submit user's answer to AI
  const submitAnswer = () => {
    if (userAnswer.trim() === '') return;
    
    handleAIResponse(aiQuestions[currentQuestion], userAnswer);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto" onPointerDownOutside={(e) => isProcessing && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
          <DialogDescription>
            Create a new legally binding contract with AI assistance. Complete each step to generate your contract.
          </DialogDescription>
          <Progress value={progress} className="w-full h-2 mt-2" />
        </DialogHeader>
        
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Step 1: Contract Type Selection */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-semibold">Select Contract Type</h2>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Service Agreement with XYZ Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Type</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {contractTypes.map((type) => (
                            <Card 
                              key={type.value}
                              className={`cursor-pointer transition-all ${field.value === type.value ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                              onClick={() => form.setValue('type', type.value as any)}
                            >
                              <CardContent className="p-4 flex items-start space-x-4">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  {type.value === 'nda' && <FileText className="h-5 w-5 text-primary" />}
                                  {type.value === 'employment' && <Briefcase className="h-5 w-5 text-primary" />}
                                  {type.value === 'freelance' && <User className="h-5 w-5 text-primary" />}
                                  {type.value === 'founder' && <Users className="h-5 w-5 text-primary" />}
                                  {type.value === 'lease' && <Building className="h-5 w-5 text-primary" />}
                                  {type.value === 'partnership' && <Users className="h-5 w-5 text-primary" />}
                                  {type.value === 'consulting' && <Book className="h-5 w-5 text-primary" />}
                                  {!['nda', 'employment', 'freelance', 'founder', 'lease', 'partnership', 'consulting'].includes(type.value) && (
                                    <FileText className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium">{type.label}</h3>
                                  <p className="text-sm text-muted-foreground">{type.description}</p>
                                </div>
                                {field.value === type.value && (
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white">
                                    <Check className="h-4 w-4" />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="jurisdiction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jurisdiction</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select jurisdiction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jurisdictions.map((jurisdiction) => (
                              <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                                <div className="flex items-center">
                                  <Map className="mr-2 h-4 w-4" />
                                  <span>{jurisdiction.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the contract purpose..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
              
              {/* Step 2: Add Parties */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-semibold">Add Contract Parties</h2>
                  <p className="text-muted-foreground">Add all parties involved in this contract</p>
                  
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-md relative">
                        <div className="absolute right-2 top-2">
                          {index > 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              type="button"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        
                        <h3 className="font-medium mb-3">Party {index + 1}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`parties.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Full name or company name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`parties.${index}.role`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {partyRoles.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>
                                        {role.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`parties.${index}.email`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email (Optional)</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Email address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`parties.${index}.address`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Physical address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={addParty}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Party
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {/* Step 3: AI-Assisted Contract Details */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-semibold">AI-Assisted Contract Details</h2>
                  <p className="text-muted-foreground">
                    Let Lexi AI guide you through the contract details
                    <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0">
                      Using AI
                    </Badge>
                  </p>
                  
                  <div className="border rounded-md h-[350px] overflow-y-auto p-4 bg-muted/30">
                    <div className="space-y-4">
                      {chatHistory.map((message, index) => (
                        <div 
                          key={index} 
                          className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div 
                            className={`flex ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'} max-w-[80%] items-start gap-2`}
                          >
                            {message.role === 'assistant' && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="/lexi-avatar.png" />
                                <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div 
                              className={`rounded-lg p-3 text-sm ${
                                message.role === 'assistant' 
                                  ? 'bg-muted border border-border' 
                                  : 'bg-primary text-primary-foreground'
                              }`}
                            >
                              {message.thinking ? (
                                <div className="flex items-center space-x-2">
                                  <span>Lexi is thinking</span>
                                  <span className="animate-pulse">...</span>
                                </div>
                              ) : (
                                message.content
                              )}
                            </div>
                            
                            {message.role === 'user' && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-foreground text-background">
                                  {user?.fullName?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </div>
                  
                  {currentQuestion < aiQuestions.length && chatHistory.length > 0 && !chatHistory[chatHistory.length - 1]?.thinking && (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Textarea
                          placeholder="Type your answer here..."
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className="min-h-[80px]"
                          disabled={isAIThinking}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              e.preventDefault();
                              submitAnswer();
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Press Ctrl+Enter to submit
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        onClick={submitAnswer} 
                        disabled={isAIThinking || userAnswer.trim() === ''}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* AI Suggestions */}
                  {aiSuggestions.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Sparkles className="h-4 w-4 mr-1 text-primary" />
                        AI Clause Suggestions
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {aiSuggestions.map((suggestion, i) => (
                          <div 
                            key={i} 
                            className="border rounded-md p-3 hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <div className="font-medium">{suggestion.title}</div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {suggestion.content.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              
              {/* Step 4: Review and Confirm */}
              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold">Review and Confirm</h2>
                  <p className="text-muted-foreground">Review your contract details before creation</p>
                  
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium text-primary mb-2">Contract Information</h3>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Title:</span>
                          <span className="font-medium">{form.getValues().title}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium capitalize">
                            {form.getValues().type.replace('_', ' ')}
                          </span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Jurisdiction:</span>
                          <span className="font-medium">{form.getValues().jurisdiction}</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium text-primary mb-2">Parties</h3>
                      <div className="space-y-3">
                        {form.getValues().parties.map((party, i) => (
                          <div key={i} className="flex flex-col sm:flex-row sm:justify-between">
                            <span className="font-medium">{party.name}</span>
                            <Badge>{party.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-primary">AI Features</h3>
                        <FormField
                          control={form.control}
                          name="useAI"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormLabel className="text-sm">Use AI assistance</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {form.getValues().useAI 
                          ? "Lexi AI will suggest clauses, help with legal language, and assist with drafting."
                          : "AI assistance is disabled. You'll create the contract manually."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-md">
                    <div className="flex items-center">
                      <HelpCircle className="h-5 w-5 text-muted-foreground mr-2" />
                      <p className="text-sm text-muted-foreground">
                        After creating your contract, you'll be taken to the contract editor where you can further customize the document.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1 || isProcessing}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                
                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isProcessing}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="relative"
                  >
                    {isProcessing ? (
                      <>
                        <span className="opacity-0">Create Contract</span>
                        <span className="absolute inset-0 flex items-center justify-center">
                          <div className="h-5 w-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                        </span>
                      </>
                    ) : (
                      <>
                        Create Contract
                        <FileText className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}