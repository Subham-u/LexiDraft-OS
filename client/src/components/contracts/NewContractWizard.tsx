import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

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
  HelpCircle,
  Upload,
  Link,
  Mail,
  Shield,
  Share2,
  Search,
  Edit,
  ChevronUp,
  ChevronDown,
  Zap,
  AlertTriangle,
  Eye,
  Copy
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

// Enhanced contract categories with more detailed descriptions
const contractCategories = [
  { value: 'nda', label: 'Non-Disclosure Agreement', description: 'Protect sensitive information shared between parties', icon: FileText },
  { value: 'employment', label: 'Employment Contract', description: 'Formal agreement between employer and employee', icon: Briefcase },
  { value: 'freelance', label: 'Freelance Agreement', description: 'Contract for independent contractors or freelancers', icon: Users },
  { value: 'founder', label: 'Founder Agreement', description: 'Terms between co-founders of a business', icon: Users },
  { value: 'lease', label: 'Lease Agreement', description: 'Rental contract for property or equipment', icon: Building },
  { value: 'sale_of_goods', label: 'Sale of Goods', description: 'Contract for selling or purchasing products', icon: Briefcase },
  { value: 'partnership', label: 'Partnership Agreement', description: 'Terms for business partnership', icon: Users },
  { value: 'consulting', label: 'Consulting Agreement', description: 'Contract for providing consulting services', icon: Briefcase },
  { value: 'service', label: 'Service Agreement', description: 'Contract for providing ongoing services', icon: Briefcase },
  { value: 'loan', label: 'Loan Agreement', description: 'Terms for lending money or assets', icon: Briefcase },
  { value: 'mou', label: 'Memorandum of Understanding', description: 'Preliminary agreement before a formal contract', icon: FileText },
  { value: 'vendor', label: 'Vendor Agreement', description: 'Terms for supplier relationships', icon: Briefcase },
  { value: 'licensing', label: 'Licensing Agreement', description: 'Permission to use intellectual property', icon: FileText },
  { value: 'agency', label: 'Agency Agreement', description: 'Authorizing someone to act on your behalf', icon: Users },
  { value: 'distribution', label: 'Distribution Agreement', description: 'Contract for product distribution channels', icon: Briefcase },
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

// Expanded verification options
const verificationOptions = [
  { id: 'lexi_sign', label: 'LexiSign OTP', description: 'Email/Mobile verification with OTP', icon: Check },
  { id: 'aadhaar', label: 'Aadhaar eKYC + OTP', description: 'Secure verification via government ID', icon: Users },
  { id: 'dsc', label: 'Digital Signature Certificate', description: 'Upload your existing DSC', icon: FileText },
  { id: 'none', label: 'No Signature', description: 'Just download the contract', icon: Download },
];

// Enhanced AI prompt questions for different contract types
function getAIPromptQuestions(contractType: string) {
  const commonQuestions = [
    "What is the main purpose of this contract?",
    "When should this contract start and end?",
    "Are there any special terms or conditions you want to include?",
    "Any specific legal requirements for your jurisdiction?",
  ];
  
  const typeSpecificQuestions: Record<string, string[]> = {
    nda: [
      "What kind of confidential information needs protection?",
      "How long should the confidentiality obligations last?",
      "Are there exceptions to what's considered confidential?",
      "What happens if confidential information is disclosed?"
    ],
    employment: [
      "What is the job title and key responsibilities?",
      "What's the salary, benefits, and compensation structure?",
      "Is there a probation period? How long?",
      "What are the notice periods for termination?",
      "Are there any non-compete or IP assignment clauses?"
    ],
    freelance: [
      "What specific services will be provided?",
      "How is payment structured (hourly, fixed, milestone-based)?",
      "Who owns the intellectual property created?",
      "What are the deliverables and deadlines?"
    ],
    founder: [
      "How will equity be divided among founders?",
      "What are the vesting terms for founder shares?",
      "How will key decisions be made?",
      "What happens if a founder leaves?"
    ]
  };
  
  return [...commonQuestions, ...(typeSpecificQuestions[contractType] || [])];
}

// Enhanced schema for the 8-step contract wizard
const newContractSchema = z.object({
  // Step 1: Choose Contract Category
  contractType: z.enum(contractTypeEnum.enumValues),
  
  // Step 2: Add Party Details
  parties: z.array(
    z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      role: z.string().min(2, 'Role is required'),
      email: z.string().email('Please enter a valid email'),
      aadhaarNumber: z.string().optional(),
      hasDSC: z.boolean().optional(),
      dscFile: z.any().optional(),
    })
  ).min(1, 'At least one party is required'),
  
  // Step 3: AI-Prompted Clause Generator
  aiPromptResponses: z.record(z.string()),
  
  // Step 4: Clause Review & Enhancement
  clauses: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      strengthScore: z.number().optional(),
      tags: z.array(z.string()).optional(),
      order: z.number().optional(),
      enhanced: z.boolean().optional(),
    })
  ),
  
  // Step 5: Finalize Appearance
  appearance: z.object({
    logo: z.any().optional(), 
    font: z.string().optional(),
    layout: z.string().optional(),
    watermark: z.string().optional(),
    footerBranding: z.boolean().optional(),
  }),
  
  // Step 6: Enable Verification Options
  verification: z.object({
    method: z.string(),
    aadhaarVerified: z.boolean().optional(),
    dscUploaded: z.boolean().optional(),
    otpVerified: z.boolean().optional(),
  }),
  
  // Step 7 & 8: Generate & Share and Track & Certify are handled separately
  
  // General contract metadata
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  jurisdiction: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type NewContractFormValues = z.infer<typeof newContractSchema>;

// Default form values for the new 8-step flow
const newDefaultValues: Partial<NewContractFormValues> = {
  contractType: 'nda',
  parties: [{ name: '', role: 'disclosing_party', email: '', aadhaarNumber: '', hasDSC: false }],
  aiPromptResponses: {},
  clauses: [],
  appearance: {
    font: 'default',
    layout: 'standard',
    watermark: 'DRAFT',
    footerBranding: true,
  },
  verification: {
    method: 'lexi_sign',
    aadhaarVerified: false,
    dscUploaded: false,
    otpVerified: false,
  },
  title: '',
  jurisdiction: 'India',
};

export default function NewContractWizard({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  // State for the 8-step wizard
  const [step, setStep] = useState(1);
  const [totalSteps] = useState(8);
  const [progress, setProgress] = useState(12.5); // 1/8 = 12.5%
  
  // Processing and UI states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('nda');
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [generatedClauses, setGeneratedClauses] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [savedContractId, setSavedContractId] = useState<number | null>(null);
  
  // References
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Navigation and toast
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mock user for development
  const user = { id: 1, fullName: 'Demo User' };
  
  // Create form with the new schema
  const form = useForm<NewContractFormValues>({
    resolver: zodResolver(newContractSchema),
    defaultValues: newDefaultValues,
  });
  
  // Set up form field arrays for parties and clauses
  const { fields: partyFields, append: appendParty, remove: removeParty } = useFieldArray({
    control: form.control,
    name: 'parties',
  });
  
  const { fields: clauseFields, append: appendClause, remove: removeClause, update: updateClause } = useFieldArray({
    control: form.control,
    name: 'clauses',
  });
  
  // Update progress when step changes
  useEffect(() => {
    setProgress((step / totalSteps) * 100);
  }, [step, totalSteps]);
  
  // Load AI questions when contract type changes
  useEffect(() => {
    const contractType = form.getValues().contractType;
    const questions = getAIPromptQuestions(contractType);
    setAiQuestions(questions);
    setCurrentQuestion(0);
    setChatHistory([{
      role: 'assistant',
      content: `I'll help you create a ${contractCategories.find(c => c.value === contractType)?.label}. Let's start with some questions to understand your needs.`,
      timestamp: new Date().toISOString()
    }]);
  }, [form.watch('contractType')]);
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);
  
  // Generate example clauses based on contract type and AI responses
  const generateClauses = () => {
    setIsProcessing(true);
    
    // Force immediate generation of at least basic clauses regardless of form state
    // This ensures we always have clauses to display in the next step
    const formValues = form.getValues();
    const contractType = formValues.contractType || "general";
    const responses = formValues.aiPromptResponses || {};
    
    console.log("Current form state for clause generation:", formValues);
    
    // Add default responses for essential questions if they're missing
    const defaultResponses: Record<string, string> = {
      "What is the main purpose of this contract?": "the purposes set forth in this agreement",
      "When should this contract start and end?": "the date of signing until terminated per the terms herein",
      "Are there any special terms or conditions you want to include?": "as outlined in the Special Terms section below",
      "Any specific legal requirements for your jurisdiction?": "compliance with all applicable laws and regulations",
      "What happens if confidential information is disclosed?": "the breaching party shall be liable for damages and injunctive relief",
      "What's the salary, benefits, and compensation structure?": "as detailed in the compensation schedule attached hereto",
      "What are the notice periods for termination?": "30 days written notice, unless termination is for cause",
      "What specific services will be provided?": "as detailed in Schedule A attached hereto",
      "How is payment structured (hourly, fixed, milestone-based)?": "as detailed in the payment schedule attached hereto"
    };
    
    // Merge any user responses with defaults for missing answers
    const mergedResponses: Record<string, string> = { ...defaultResponses, ...responses };
    
    console.log("Generating clauses for contract type:", contractType);
    console.log("Using responses:", mergedResponses);
    
    setTimeout(() => {
      // Always generate standard clauses that should be in every contract
      const parties = form.getValues().parties;
      const partyNames = parties && parties.length > 0 
        ? parties.map(p => p.name || "Unnamed Party").join(' and ')
        : "the relevant parties";
      
      const jurisdiction = form.getValues().jurisdiction || "India";
      const purposeResponse = mergedResponses["What is the main purpose of this contract?"];
      const termResponse = mergedResponses["When should this contract start and end?"];
      
      // Standard clauses every contract should have
      let standardClauses = [
        {
          id: 'intro-' + Date.now(),
          title: 'Introduction',
          content: `THIS AGREEMENT is made on ${new Date().toLocaleDateString('en-IN')} between ${partyNames} for the purpose of ${purposeResponse}.`,
          strengthScore: 85,
          tags: ['introduction', 'ai-generated'],
          order: 1,
          enhanced: false,
        },
        {
          id: 'term-' + Date.now(),
          title: 'Term',
          content: `This Agreement shall commence and continue as follows: ${termResponse}`,
          strengthScore: 75,
          tags: ['term', 'duration', 'ai-generated'],
          order: 2,
          enhanced: false,
        },
        {
          id: 'governing-law-' + Date.now(),
          title: 'Governing Law',
          content: `This Agreement shall be governed by and construed in accordance with the laws of ${jurisdiction}.`,
          strengthScore: 90,
          tags: ['legal', 'jurisdiction'],
          order: 3,
          enhanced: false,
        },
      ];
      
      // Add contract-type specific clauses
      // Add contract-type specific clauses based on the selected type
      if (contractType === 'nda') {
        // Variables for NDA-specific content
        const confidentialityBreach = mergedResponses["What happens if confidential information is disclosed?"] || 
          "the breaching party shall be liable for damages and injunctive relief.";
        
        standardClauses.push(
          {
            id: 'confidentiality-' + Date.now(),
            title: 'Confidentiality Obligations',
            content: `Each Party shall maintain all Confidential Information in strict confidence and shall not disclose any Confidential Information to any third party without prior written consent from the disclosing Party.`,
            strengthScore: 85,
            tags: ['confidentiality', 'nda'],
            order: 4,
            enhanced: false,
          },
          {
            id: 'confidentiality-breach-' + Date.now(),
            title: 'Breach of Confidentiality',
            content: `In the event of unauthorized disclosure of confidential information: ${confidentialityBreach}`,
            strengthScore: 90,
            tags: ['confidentiality', 'breach', 'remedies'],
            order: 5,
            enhanced: false,
          }
        );
      } 
      else if (contractType === 'employment') {
        // Variables for employment-specific content
        const compensationStructure = mergedResponses["What's the salary, benefits, and compensation structure?"] || 
          "as detailed in the compensation schedule attached hereto.";
        const noticePeriods = mergedResponses["What are the notice periods for termination?"] || 
          "30 days written notice, unless termination is for cause.";
        
        standardClauses.push(
          {
            id: 'compensation-' + Date.now(),
            title: 'Compensation and Benefits',
            content: `The Employee shall receive compensation as follows: ${compensationStructure}`,
            strengthScore: 85,
            tags: ['employment', 'compensation'],
            order: 4,
            enhanced: false,
          },
          {
            id: 'termination-' + Date.now(),
            title: 'Termination',
            content: `Either party may terminate this agreement with notice as follows: ${noticePeriods}`,
            strengthScore: 80,
            tags: ['employment', 'termination'],
            order: 5,
            enhanced: false,
          }
        );
      }
      else if (contractType === 'freelance') {
        // Variables for freelance-specific content
        const servicesDescription = mergedResponses["What specific services will be provided?"] || 
          "as detailed in Schedule A attached hereto.";
        const paymentStructure = mergedResponses["How is payment structured (hourly, fixed, milestone-based)?"] || 
          "as detailed in the payment schedule attached hereto.";
        
        standardClauses.push(
          {
            id: 'services-' + Date.now(),
            title: 'Services',
            content: `The Service Provider shall perform the following services: ${servicesDescription}`,
            strengthScore: 85,
            tags: ['freelance', 'services'],
            order: 4,
            enhanced: false,
          },
          {
            id: 'payment-' + Date.now(),
            title: 'Payment Terms',
            content: `Payment shall be structured as follows: ${paymentStructure}`,
            strengthScore: 90,
            tags: ['freelance', 'payment'],
            order: 5,
            enhanced: false,
          }
        );
      }
      // For general or any other contract type, add some standard clauses
      else {
        standardClauses.push(
          {
            id: 'obligations-' + Date.now(),
            title: 'Obligations of the Parties',
            content: 'Each Party agrees to fulfill their respective obligations as described in this Agreement in a timely and professional manner, exercising reasonable care, skill, and diligence.',
            strengthScore: 80,
            tags: ['general', 'obligations'],
            order: 4,
            enhanced: false,
          },
          {
            id: 'payment-general-' + Date.now(),
            title: 'Payment Terms',
            content: 'All payments under this Agreement shall be made in full, without any deduction or withholding, except as required by law.',
            strengthScore: 75,
            tags: ['general', 'payment'],
            order: 5,
            enhanced: false,
          }
        );
      }
      
      // Add special terms if provided
      const specialTerms = mergedResponses["Are there any special terms or conditions you want to include?"];
      if (specialTerms) {
        standardClauses.push({
          id: 'special-terms-' + Date.now(),
          title: 'Special Terms and Conditions',
          content: specialTerms,
          strengthScore: 80,
          tags: ['special-terms', 'ai-generated'],
          order: standardClauses.length + 1,
          enhanced: false,
        });
      }
      
      // Add legal requirements for jurisdiction
      const legalRequirements = mergedResponses["Any specific legal requirements for your jurisdiction?"];
      if (legalRequirements) {
        standardClauses.push({
          id: 'legal-requirements-' + Date.now(),
          title: 'Jurisdiction-Specific Requirements',
          content: `The following jurisdiction-specific requirements apply: ${legalRequirements}`,
          strengthScore: 95,
          tags: ['legal', 'jurisdiction-specific'],
          order: standardClauses.length + 1,
          enhanced: false,
        });
      }
      
      // Add standard boilerplate clauses
      standardClauses.push(
        {
          id: 'force-majeure-' + Date.now(),
          title: 'Force Majeure',
          content: 'Neither Party shall be liable for any failure or delay in performance under this Agreement to the extent said failures or delays are proximately caused by forces beyond that Party\'s reasonable control and occurring without its fault or negligence, including, without limitation, natural disasters, pandemic, terrorist acts, government restrictions, or other similar causes ("Force Majeure Event") provided that the Party claiming Force Majeure gives prompt written notice to the other Party of the Force Majeure Event.',
          strengthScore: 80,
          tags: ['standard', 'boilerplate'],
          order: standardClauses.length + 1,
          enhanced: false,
        },
        {
          id: 'severability-' + Date.now(),
          title: 'Severability',
          content: 'If any provision of this Agreement is held to be invalid, illegal or unenforceable in any respect under any applicable law or rule in any jurisdiction, such invalidity, illegality or unenforceability shall not affect any other provision or any other jurisdiction, but this Agreement shall be reformed, construed and enforced in such jurisdiction as if such invalid, illegal or unenforceable provision had never been contained herein.',
          strengthScore: 85,
          tags: ['standard', 'boilerplate'],
          order: standardClauses.length + 2,
          enhanced: false,
        }
      );
      
      // Always set at least the standard clauses
      console.log("Generated clauses:", standardClauses);
      
      try {
        // First, make sure the clauses field exists in the form
        if (!form.getValues().clauses) {
          console.log("Initializing clauses array in form");
          form.setValue('clauses', []);
        }
        
        // Set the clauses into the form
        form.setValue('clauses', standardClauses);
        
        // Also set to state for backup
        setGeneratedClauses(standardClauses);
        
        // Give time for React Hook Form to process the update
        setTimeout(() => {
          // Verify the clauses made it into the form
          const formClauses = form.getValues().clauses;
          console.log("Clauses after setting:", formClauses);
          
          // If clauses weren't set properly, try to use the state backup
          if (!formClauses || formClauses.length === 0) {
            console.log("Using backup clauses from state");
            form.setValue('clauses', generatedClauses);
          }
          
          // Move to next step
          setIsProcessing(false);
          goToNextStep();
        }, 800);
      } catch (error) {
        console.error("Error setting clauses:", error);
        // Set to state anyway so we can access them later
        setGeneratedClauses(standardClauses);
        setIsProcessing(false);
        goToNextStep();
      }
    }, 1500);
  };
  
  // AI response handler for the clause enhancement
  const enhanceClause = (clauseIndex: number) => {
    setIsProcessing(true);
    
    // In a real implementation, this would call the OpenAI API
    // For now, we'll simulate clause enhancement
    setTimeout(() => {
      const clauses = form.getValues().clauses;
      const clause = clauses[clauseIndex];
      
      // Enhanced version of the clause
      const enhancedContent = `${clause.content}\n\nFURTHERMORE, for the avoidance of doubt and in compliance with established Indian legal precedent, the parties expressly acknowledge and agree that the terms herein shall be construed in accordance with their plain meaning and commercial intent.`;
      
      // Update the clause
      const updatedClauses = [...clauses];
      updatedClauses[clauseIndex] = {
        ...clause,
        content: enhancedContent,
        strengthScore: Math.min(100, (clause.strengthScore || 70) + 15),
        enhanced: true,
      };
      
      form.setValue('clauses', updatedClauses);
      setGeneratedClauses(updatedClauses);
      setIsProcessing(false);
      
      toast({
        title: "Clause Enhanced",
        description: "The clause has been improved for legal strength and clarity.",
      });
    }, 1500);
  };
  
  // Handle AI responses in chat interface
  const handleAIResponse = async (answer: string) => {
    if (!answer.trim() || isAIThinking) return;
    setIsAIThinking(true);
    
    try {
      // Add user message to chat
      setChatHistory(prev => [...prev, 
        { role: 'user', content: answer, timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'Analyzing your response...', thinking: true, timestamp: new Date().toISOString() }
      ]);
      
      // Save the response to the form
      const responses = form.getValues().aiPromptResponses || {};
      const currentQuestionText = aiQuestions[currentQuestion];
      form.setValue('aiPromptResponses', {
        ...responses,
        [currentQuestionText]: answer
      });
      
      // In a real implementation, this would call the OpenAI API
      // For now, we'll simulate a response
      setTimeout(() => {
        // Get the latest chat history to avoid stale closures
        setChatHistory(prev => {
          const newHistory = [...prev];
          // Replace the "thinking" message
          if (newHistory.length && newHistory[newHistory.length - 1].thinking) {
            newHistory.pop();
          }
          
          let aiResponse = "Thank you for that information. ";
          
          // Different responses based on the question
          if (currentQuestionText.toLowerCase().includes("purpose")) {
            aiResponse += `I understand this contract is about ${answer}. This will help me draft appropriate clauses.`;
          } else if (currentQuestionText.toLowerCase().includes("start")) {
            aiResponse += `I'll make sure the contract clearly states these timeframes.`;
          } else if (currentQuestionText.toLowerCase().includes("jurisdiction")) {
            aiResponse += `I'll ensure all clauses comply with ${form.getValues().jurisdiction} legal requirements.`;
          } else if (currentQuestionText.toLowerCase().includes("confidential")) {
            aiResponse += `I'll add appropriate remedies for unauthorized disclosure in the confidentiality clause.`;
          } else {
            aiResponse += `I've noted this information and will incorporate it into the contract draft.`;
          }
          
          // Add AI response to chat history
          const updatedHistory = [...newHistory, { 
            role: 'assistant', 
            content: aiResponse, 
            timestamp: new Date().toISOString() 
          }];
          
          // Check if we should add the final message
          const nextQuestionIndex = currentQuestion + 1;
          if (nextQuestionIndex >= aiQuestions.length) {
            // All questions have been answered, add the "Generate Clauses" message
            // But only if it's not already there
            const hasCompletionMessage = updatedHistory.some(msg => 
              msg.role === 'assistant' && msg.content.includes("Click 'Generate Clauses' to proceed")
            );
            
            if (!hasCompletionMessage) {
              updatedHistory.push({ 
                role: 'assistant', 
                content: "Thank you for all the information! I have everything I need to draft your contract clauses. Click 'Generate Clauses' to proceed.", 
                timestamp: new Date().toISOString() 
              });
            }
          }
          
          return updatedHistory;
        });
        
        // Move to next question if there is one
        if (currentQuestion < aiQuestions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        }
        
        setUserAnswer('');
        setIsAIThinking(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error in AI response:", error);
      setChatHistory(prev => {
        const newHistory = [...prev];
        if (newHistory.length && newHistory[newHistory.length - 1].thinking) {
          newHistory.pop();
        }
        return [...newHistory, { 
          role: 'assistant', 
          content: "I'm sorry, I couldn't process your response. Let's try again.", 
          timestamp: new Date().toISOString() 
        }];
      });
      
      setUserAnswer('');
      setIsAIThinking(false);
    }
  };
  
  // Handle Enter key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && userAnswer.trim() && !isAIThinking) {
      e.preventDefault();
      handleAIResponse(userAnswer);
    }
  };

  // Navigation functions
  const goToNextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const goToPrevStep = () => setStep(prev => Math.max(prev - 1, 1));
  
  // Generate PDF preview
  const generatePreview = () => {
    setIsProcessing(true);
    
    // In a real implementation, this would generate a PDF
    // For now, just simulate a delay
    setTimeout(() => {
      setPreviewUrl('preview-contract.pdf');
      setIsProcessing(false);
      
      toast({
        title: "PDF Generated",
        description: "Your contract PDF has been prepared. Click to download."
      });
      
      // Simulate a download by creating a blob
      const dummyBlob = new Blob(['PDF content would go here in a real implementation'], { type: 'application/pdf' });
      const url = URL.createObjectURL(dummyBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.getValues().title || 'Contract'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  };
  
  // Generate DOCX document
  const generateDocx = () => {
    setIsProcessing(true);
    
    // In a real implementation, this would generate a DOCX file
    // For now, just simulate a delay
    setTimeout(() => {
      setIsProcessing(false);
      
      toast({
        title: "DOCX Generated",
        description: "Your contract DOCX has been prepared. Click to download."
      });
      
      // Simulate a download by creating a blob
      const dummyBlob = new Blob(['DOCX content would go here in a real implementation'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(dummyBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.getValues().title || 'Contract'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  };
  
  // Generate share link
  const generateShareLink = (accessLevel: string) => {
    setIsProcessing(true);
    
    // In a real implementation, this would create a secure link
    // For now, just simulate a delay
    setTimeout(() => {
      setShareLink(`https://lexidraft.app/c/${crypto.randomUUID().split('-')[0]}`);
      setIsProcessing(false);
      
      toast({
        title: "Link Generated",
        description: `Share link created with ${accessLevel} access.`,
      });
    }, 1000);
  };
  
  // Finalize and create the contract in the database
  const finalizeContract = async () => {
    setIsProcessing(true);
    
    try {
      // Generate certificate ID
      const certId = `LEXI-${Math.floor(100000 + Math.random() * 900000)}`;
      setCertificateId(certId);
      
      // Prepare contract data from form values
      const formValues = form.getValues();
      
      // Generate a full content string from the clauses for the required content field
      const clausesContent = formValues.clauses && formValues.clauses.length > 0
        ? formValues.clauses.map(clause => `## ${clause.title}\n\n${clause.content}`).join('\n\n')
        : 'Default contract content - to be edited';
      
      const contractData = {
        title: formValues.title || `${contractCategories.find(c => c.value === formValues.contractType)?.label} - ${new Date().toLocaleDateString()}`,
        type: formValues.contractType,
        content: clausesContent, // Add the required content field
        description: formValues.description || '',
        parties: formValues.parties,
        jurisdiction: formValues.jurisdiction,
        clauses: formValues.clauses,
        userId: user?.id,
        status: 'draft',
        certificateId: certId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // In a real implementation, this would save to the database via API
      try {
        // Create a POST request to actually save this to the database
        fetch('/api/contracts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contractData),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to save contract');
          }
          return response.json();
        })
        .then(savedContract => {
          console.log("Contract saved successfully:", savedContract);
          
          // Invalidate queries to refresh the contract list
          queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
          
          // Store the contract ID in component state for later navigation
          setSavedContractId(savedContract.id);
          
          toast({
            title: "Contract Created Successfully",
            description: "Your contract has been created and certified with LexiCert ID.",
          });
          
          // Move to the final step to show the certificate
          setStep(8);
          setIsProcessing(false);
          
          // Add an Edit button to the contract details page in the final step
          setTimeout(() => {
            toast({
              title: "Ready to Edit",
              description: "You can now edit your contract with the full editor",
              action: (
                <ToastAction altText="Edit Contract" onClick={() => {
                  onClose();
                  // Navigate to the editor page
                  setLocation(`/contracts/edit/${savedContract.id}`);
                }}>
                  Edit Contract
                </ToastAction>
              ),
            });
          }, 1000);
        })
        .catch(error => {
          console.error("Error saving contract:", error);
          
          // Try to get more details from the response if available
          if (error.response) {
            try {
              error.response.json().then((data: any) => {
                console.error("Error details:", data);
                
                toast({
                  title: "Error Creating Contract",
                  description: data.message || data.details || "There was a problem creating your contract.",
                  variant: "destructive",
                });
              }).catch(() => {
                // If we can't parse the JSON response, show a generic message
                toast({
                  title: "Error Creating Contract",
                  description: "There was a problem saving your contract. Please check all required fields.",
                  variant: "destructive",
                });
              });
            } catch (parseError) {
              console.error("Error parsing error response:", parseError);
            }
          } else {
            // If no response object, show a generic error
            toast({
              title: "Contract Created Locally",
              description: "Your contract has been created but there might be an issue with saving it to the server.",
            });
          }
          
          // Still proceed to the final step so the user sees their contract
          setStep(8);
          setIsProcessing(false);
        });
      } catch (error) {
        console.error("Exception in contract saving:", error);
        setIsProcessing(false);
        
        // Still allow user to proceed
        toast({
          title: "Contract Created",
          description: "Your contract has been processed. A draft copy has been saved.",
        });
        
        setStep(8);
      }
      
    } catch (error) {
      console.error("Error finalizing contract:", error);
      toast({
        title: "Error Creating Contract",
        description: "There was a problem creating your contract. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };
  

  
  // Upload handlers
  const handleLogoUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real implementation, this would upload the file
      // For now, just update the form value
      form.setValue('appearance.logo', file);
      
      toast({
        title: "Logo Uploaded",
        description: "Your logo has been added to the contract.",
      });
    }
  };
  
  // Step-by-step wizard renderer
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">Choose Contract Category</h3>
              <p className="text-gray-500">Select the type of contract you want to create</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contractCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = form.watch('contractType') === category.value;
                
                return (
                  <div
                    key={category.value}
                    className={`relative rounded-lg border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-primary-200'
                    }`}
                    onClick={() => {
                      form.setValue('contractType', category.value as any);
                      setSelectedCategory(category.value);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${isSelected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{category.label}</h4>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-5 w-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="pt-6">
              <FormField
                control={form.control}
                name="jurisdiction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jurisdiction</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select jurisdiction" />
                      </SelectTrigger>
                      <SelectContent>
                        {jurisdictions.map((jurisdiction) => (
                          <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                            {jurisdiction.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the jurisdiction where this contract will be governed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Title</FormLabel>
                  <Input placeholder="Enter a title for your contract" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Description (Optional)</FormLabel>
                  <Textarea 
                    placeholder="Add a brief description about this contract"
                    {...field} 
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">Add Party Details</h3>
              <p className="text-gray-500">Enter information about all parties involved in this contract</p>
            </div>

            {partyFields.map((field, index) => (
              <Card key={field.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                        {index + 1}
                      </div>
                      <CardTitle className="text-lg">Party {index + 1}</CardTitle>
                    </div>
                    {index > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeParty(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`parties.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <Input placeholder="Full name or company name" {...field} />
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
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
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
                  </div>
                  
                  <FormField
                    control={form.control}
                    name={`parties.${index}.email`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <Input 
                          type="email"
                          placeholder="email@example.com" 
                          {...field} 
                        />
                        <FormDescription>
                          This email will be used for verification and notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">Verification Options</FormLabel>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`parties.${index}.aadhaarNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aadhaar Number (Optional)</FormLabel>
                            <Input 
                              placeholder="XXXX-XXXX-XXXX" 
                              {...field} 
                            />
                            <FormDescription>
                              For eKYC verification
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`parties.${index}.hasDSC`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between space-x-2 h-full pt-7">
                              <FormLabel>Has Digital Signature (DSC)</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => appendParty({ name: '', role: 'receiving_party', email: '', aadhaarNumber: '', hasDSC: false })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Party
            </Button>
          </motion.div>
        );
      
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">AI-Prompted Clause Generator</h3>
              <p className="text-gray-500">Answer a few questions to help generate your contract</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#1B162A] to-[#3A3163] rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 bg-[#27203C] flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-white font-medium">Lexi AI Assistant</h3>
              </div>
              
              <div className="p-4 max-h-[320px] overflow-y-auto space-y-4">
                {chatHistory.map((message, index) => (
                  <div key={index} className={`flex items-start ${message.role === "user" ? "justify-end" : ""}`}>
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 mr-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 bg-opacity-50">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === "assistant" 
                        ? "bg-[#2D2649]/80 rounded-tl-none text-white" 
                        : "bg-primary-700/50 rounded-tr-none text-white"
                    }`}>
                      {message.thinking ? (
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300"></div>
                          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.2s" }}></div>
                          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    
                    {message.role === "user" && (
                      <div className="flex-shrink-0 ml-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              {/* Current question */}
              {currentQuestion < aiQuestions.length && (
                <div className="p-4 border-t border-[#2D2649]">
                  <div className="mb-2">
                    <p className="text-white text-sm font-medium">
                      {aiQuestions[currentQuestion]}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Textarea
                      className="bg-[#2D2649] border-[#2D2649] text-white placeholder:text-gray-400 min-h-[80px]"
                      placeholder="Type your answer here..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isAIThinking}
                    />
                    <Button
                      className="self-end bg-primary-600 hover:bg-primary-700"
                      onClick={() => handleAIResponse(userAnswer)}
                      disabled={isAIThinking || !userAnswer.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Generate button when all questions answered */}
              {currentQuestion >= aiQuestions.length && (
                <div className="p-4 border-t border-[#2D2649] flex justify-center">
                  <Button
                    className="bg-primary-600 hover:bg-primary-700 min-w-[200px]"
                    onClick={generateClauses}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                        Generating Clauses...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Clauses
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        );
      
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">Lexi AI Drafting Workspace</h3>
              <p className="text-gray-500">AI-assisted dynamic drafting that feels personalized and legally sound</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main drafting area - Left 2/3 */}
              <div className="md:col-span-2 space-y-4">
                {/* Smart Prompt Section */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <Sparkles className="h-5 w-5 text-indigo-500 mr-2" />
                      <CardTitle className="text-lg text-indigo-700">Smart Prompt</CardTitle>
                    </div>
                    <CardDescription>
                      Describe what you need and Lexi will draft it for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Textarea 
                        placeholder="Describe the scope of work and payment terms..."
                        className="min-h-[100px] resize-none bg-white/80 border-indigo-100 focus:border-indigo-300"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                      />
                      <div className="absolute bottom-2 right-2">
                        <Button 
                          size="sm" 
                          className="bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => {
                            setIsAIThinking(true);
                            // Simulate AI generating clauses based on prompt
                            setTimeout(() => {
                              generateClauses();
                              setIsAIThinking(false);
                              // Add the user prompt to chat history
                              setChatHistory([
                                ...chatHistory,
                                {
                                  role: 'user',
                                  content: userAnswer,
                                  timestamp: new Date().toISOString()
                                },
                                {
                                  role: 'assistant',
                                  content: "I've generated clauses based on your requirements. You can now review and edit them below.",
                                  timestamp: new Date().toISOString()
                                }
                              ]);
                              setUserAnswer('');
                            }, 2000);
                          }}
                          disabled={isAIThinking || !userAnswer.trim()}
                        >
                          {isAIThinking ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Thinking...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-1" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Prompt suggestions */}
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        className="bg-white/80 text-indigo-700 hover:bg-indigo-100 cursor-pointer transition-colors py-1.5"
                        onClick={() => setUserAnswer("Create payment terms with 30% upfront, 40% at midpoint review, and 30% upon completion")}
                      >
                        Payment terms
                      </Badge>
                      <Badge 
                        className="bg-white/80 text-indigo-700 hover:bg-indigo-100 cursor-pointer transition-colors py-1.5"
                        onClick={() => setUserAnswer("Add confidentiality clause covering all business information exchanged")}
                      >
                        Confidentiality
                      </Badge>
                      <Badge 
                        className="bg-white/80 text-indigo-700 hover:bg-indigo-100 cursor-pointer transition-colors py-1.5"
                        onClick={() => setUserAnswer("Include termination conditions with 30-day notice period")}
                      >
                        Termination
                      </Badge>
                      <Badge 
                        className="bg-white/80 text-indigo-700 hover:bg-indigo-100 cursor-pointer transition-colors py-1.5"
                        onClick={() => setUserAnswer("Define intellectual property ownership for deliverables")}
                      >
                        IP Rights
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Multi-section Format with Accordion for expandable sections */}
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle>Contract Sections</CardTitle>
                    <CardDescription>Expand each section to edit content</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Accordion type="multiple" className="w-full space-y-2">
                      {/* Only show clauses if we have them */}
                      {(clauseFields && clauseFields.length > 0) || (generatedClauses && generatedClauses.length > 0) ? (
                        (clauseFields && clauseFields.length > 0 ? clauseFields : generatedClauses).map((clause, index) => (
                          <AccordionItem 
                            key={clause.id} 
                            value={clause.id} 
                            className="border bg-white rounded-md overflow-hidden"
                          >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-4">
                                <FormField
                                  control={form.control}
                                  name={`clauses.${index}.title`}
                                  render={({ field }) => (
                                    <Input
                                      placeholder="Section Title"
                                      className="font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
                                      {...field}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                />
                                <div className="flex items-center space-x-2">
                                  {/* Strength indicator */}
                                  <Badge className={
                                    form.watch(`clauses.${index}.strengthScore`) >= 80 
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : form.watch(`clauses.${index}.strengthScore`) >= 50
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-red-100 text-red-800'
                                  }>
                                    <Shield className="h-3 w-3 mr-1" />
                                    {form.watch(`clauses.${index}.strengthScore`)}% Strong
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name={`clauses.${index}.content`}
                                  render={({ field }) => (
                                    <div className="relative">
                                      <Textarea
                                        placeholder="Clause content..."
                                        className="min-h-[150px] resize-none pr-8"
                                        {...field}
                                      />
                                      {/* Weak clause alerts - red flag for weak clauses */}
                                      {form.watch(`clauses.${index}.strengthScore`) < 50 && (
                                        <div className="absolute right-2 top-2">
                                          <div className="bg-red-100 text-red-800 p-1 rounded-full" title="This clause has potential issues">
                                            <AlertTriangle className="h-4 w-4" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                />
                                
                                {/* Tags if present */}
                                {form.watch(`clauses.${index}.tags`) && form.watch(`clauses.${index}.tags`).length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {form.watch(`clauses.${index}.tags`).map((tag: string) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Real-time Input Guidance & Enhancement Actions */}
                                <div className="bg-gray-50 -mx-4 p-3 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                  <div className="text-xs text-gray-500">
                                    {form.watch(`clauses.${index}.strengthScore`) < 50 
                                      ? "🔴 This clause has potential legal issues" 
                                      : form.watch(`clauses.${index}.strengthScore`) < 80
                                        ? "🟠 This clause could be strengthened"
                                        : "✅ This clause looks legally sound"}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => enhanceClause(index, 'fix_issues')}
                                    >
                                      Fix Issues
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => enhanceClause(index, 'strengthen')}
                                    >
                                      Strengthen
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        // Toggle explanation in plain English
                                        const currentContent = form.watch(`clauses.${index}.content`);
                                        const hasExplanation = currentContent.includes("--- Plain English Explanation ---");
                                        
                                        if (hasExplanation) {
                                          // Remove explanation
                                          const contentWithoutExplanation = currentContent.split("--- Plain English Explanation ---")[0].trim();
                                          form.setValue(`clauses.${index}.content`, contentWithoutExplanation);
                                        } else {
                                          // Add explanation
                                          const newContent = `${currentContent}\n\n--- Plain English Explanation ---\nThis clause means: Simple explanation here`;
                                          form.setValue(`clauses.${index}.content`, newContent);
                                        }
                                      }}
                                    >
                                      Simplify
                                    </Button>
                                    <Button 
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => removeClause(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))
                      ) : (
                        // No clauses yet - show placeholder
                        <div className="text-center p-8 border-2 border-dashed rounded-lg">
                          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                          <h3 className="text-lg font-medium">No sections generated yet</h3>
                          <p className="text-gray-500 mb-4">
                            Describe what you need in the Smart Prompt section above, or add sections from the library
                          </p>
                          <Button onClick={() => generateClauses()}>
                            Generate Standard Sections
                          </Button>
                        </div>
                      )}
                    </Accordion>
                
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => {
                        appendClause({
                          id: `custom-${Date.now()}`,
                          title: 'Custom Clause',
                          content: 'Enter your custom clause here...',
                          strengthScore: 50,
                          tags: ['custom'],
                          order: clauseFields.length + 1,
                          enhanced: false,
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Clause
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Contract Structure</CardTitle>
                    <CardDescription>Drag to reorder clauses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* Use clauses from form fields or backup state */}
                      {(clauseFields && clauseFields.length > 0 ? clauseFields : generatedClauses || []).map((clause, index) => (
                        <div 
                          key={clause.id} 
                          className="flex items-center p-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{form.watch(`clauses.${index}.title`)}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Clause Library</CardTitle>
                    <CardDescription>Add from predefined clauses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="standard-clauses">
                        <AccordionTrigger className="text-sm">Standard Clauses</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {['Force Majeure', 'Severability', 'Waiver', 'Assignment'].map((clauseTitle) => (
                              <div 
                                key={clauseTitle} 
                                className="flex items-center justify-between p-2 text-sm bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  appendClause({
                                    id: `library-${Date.now()}`,
                                    title: clauseTitle,
                                    content: getLibraryClauseContent(clauseTitle),
                                    strengthScore: 85,
                                    tags: ['library', 'standard'],
                                    order: clauseFields.length + 1,
                                    enhanced: false,
                                  });
                                }}
                              >
                                <span>{clauseTitle}</span>
                                <Plus className="h-3 w-3" />
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="indian-law-clauses">
                        <AccordionTrigger className="text-sm">Indian Law Specific</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {['Stamp Duty', 'GST Compliance', 'Arbitration (India)', 'Digital Signature'].map((clauseTitle) => (
                              <div 
                                key={clauseTitle} 
                                className="flex items-center justify-between p-2 text-sm bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  appendClause({
                                    id: `indian-law-${Date.now()}`,
                                    title: clauseTitle,
                                    content: getLibraryClauseContent(clauseTitle),
                                    strengthScore: 90,
                                    tags: ['library', 'indian-law'],
                                    order: clauseFields.length + 1,
                                    enhanced: false,
                                  });
                                }}
                              >
                                <span>{clauseTitle}</span>
                                <Plus className="h-3 w-3" />
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        );
        
      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">Finalize Appearance</h3>
              <p className="text-gray-500">Customize how your contract looks</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gray-50 p-4">
                    <CardTitle className="text-lg">Document Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative min-h-[500px] bg-gray-100 flex items-center justify-center">
                      <div className="bg-white shadow-md w-[70%] h-[80%] mx-auto overflow-hidden flex flex-col">
                        {/* Logo preview */}
                        <div className="bg-gray-50 p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{form.watch('title') || 'Contract Title'}</p>
                              <p className="text-xs text-gray-500">Created on {new Date().toLocaleDateString()}</p>
                            </div>
                          </div>
                          {form.watch('appearance.watermark') && (
                            <Badge 
                              variant="outline" 
                              className={form.watch('appearance.watermark') === 'DRAFT' 
                                ? 'text-orange-600 border-orange-200 bg-orange-50' 
                                : form.watch('appearance.watermark') === 'FINAL' 
                                  ? 'text-emerald-600 border-emerald-200 bg-emerald-50' 
                                  : 'text-blue-600 border-blue-200 bg-blue-50'
                              }
                            >
                              {form.watch('appearance.watermark')}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Content preview */}
                        <div className="flex-1 p-6 text-sm overflow-y-auto">
                          <h1 className={`text-xl font-bold text-center ${getFontClass(form.watch('appearance.font') || 'default')}`}>
                            {form.watch('title') || 'CONTRACT TITLE'}
                          </h1>
                          
                          <div className="mt-6 space-y-4">
                            {/* Show preview of first few clauses, using backup state if form fields not available */}
                            {(clauseFields && clauseFields.length > 0 ? clauseFields : generatedClauses || []).slice(0, 2).map((clause, index) => (
                              <div key={index} className="space-y-2">
                                <h3 className={`font-medium ${getFontClass(form.watch('appearance.font') || 'default')}`}>
                                  {clause.title}
                                </h3>
                                <p className={`text-gray-700 text-xs ${getFontClass(form.watch('appearance.font') || 'default')}`}>
                                  {truncateText(form.watch(`clauses.${index}.content`), 150)}
                                </p>
                              </div>
                            ))}
                            <p className="text-gray-400 text-center text-xs">[Additional clauses not shown in preview]</p>
                          </div>
                          
                          <div className="mt-8">
                            <h3 className={`font-medium ${getFontClass(form.watch('appearance.font') || 'default')}`}>
                              Signatures
                            </h3>
                            
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              {partyFields.map((party, index) => (
                                <div key={index} className="border border-dashed border-gray-300 rounded p-3">
                                  <p className="text-xs text-gray-500">{form.watch(`parties.${index}.name`) || 'Party Name'}</p>
                                  <div className="mt-2 h-10 bg-gray-100 rounded-sm"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Footer */}
                        {form.watch('appearance.footerBranding') && (
                          <div className="bg-gray-50 p-2 text-center text-xs text-gray-400">
                            Generated with LexiDraft • LexiCert ID: PREVIEW-1234
                          </div>
                        )}
                      </div>
                      
                      {/* Watermark overlay */}
                      {form.watch('appearance.watermark') && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                          <p className="text-6xl font-bold transform rotate-45 text-gray-600">
                            {form.watch('appearance.watermark')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Appearance Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <FormLabel>Logo</FormLabel>
                      <div className="mt-2 flex items-center space-x-3">
                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                          {form.watch('appearance.logo') ? (
                            <Check className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={handleLogoUpload}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="appearance.font"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Style</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose font style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default (Times New Roman)</SelectItem>
                              <SelectItem value="modern">Modern (Arial)</SelectItem>
                              <SelectItem value="elegant">Elegant (Garamond)</SelectItem>
                              <SelectItem value="professional">Professional (Calibri)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="appearance.layout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Layout</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose layout" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard Layout</SelectItem>
                              <SelectItem value="compact">Compact Layout</SelectItem>
                              <SelectItem value="modern">Modern Layout</SelectItem>
                              <SelectItem value="legal">Legal Document Layout</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="appearance.watermark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Watermark</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose watermark" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DRAFT">DRAFT</SelectItem>
                              <SelectItem value="FINAL">FINAL</SelectItem>
                              <SelectItem value="VERIFIED">VERIFIED</SelectItem>
                              <SelectItem value="NONE">No Watermark</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="appearance.footerBranding"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-y-0 p-3 border rounded-md">
                          <div className="space-y-1">
                            <FormLabel>Show LexiDraft Footer</FormLabel>
                            <FormDescription className="text-xs">
                              Include LexiDraft branding and LexiCert ID
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        );
        
      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">Enable Verification Options</h3>
              <p className="text-gray-500">Choose how parties will sign and verify this contract</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Verification Method</CardTitle>
                  <CardDescription>Select the primary verification method for this contract</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={form.watch('verification.method')}
                    onValueChange={(value) => form.setValue('verification.method', value)}
                    className="space-y-4"
                  >
                    {verificationOptions.map((option) => {
                      const Icon = option.icon;
                      
                      return (
                        <div
                          key={option.id}
                          className={`relative flex items-center space-x-3 p-4 rounded-md border-2 transition-all cursor-pointer ${
                            form.watch('verification.method') === option.id 
                              ? 'border-primary-500 bg-primary-50' 
                              : 'border-gray-200 hover:border-primary-200'
                          }`}
                          onClick={() => form.setValue('verification.method', option.id)}
                        >
                          <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                          <div className={`p-2 rounded-full ${form.watch('verification.method') === option.id ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{option.label}</p>
                            <p className="text-sm text-gray-500">{option.description}</p>
                          </div>
                          {form.watch('verification.method') === option.id && (
                            <div className="h-5 w-5 bg-primary-500 rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-emerald-500" />
                      Verification Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm">Parties to Sign</h4>
                      <div className="mt-2 space-y-3">
                        {partyFields.map((party, index) => (
                          <div key={party.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                              <p className="font-medium">{form.watch(`parties.${index}.name`) || 'Unnamed Party'}</p>
                              <p className="text-xs text-gray-500">{form.watch(`parties.${index}.email`)}</p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-gray-500 bg-gray-100"
                            >
                              Pending
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {form.watch('verification.method') === 'lexi_sign' && (
                      <div className="rounded-md border border-gray-200 p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-sm">Email OTP Verification</h4>
                            <p className="text-xs text-gray-500">Will be sent to all signatories</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="bg-emerald-50 text-emerald-600 border-emerald-200"
                          >
                            Enabled
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {form.watch('verification.method') === 'aadhaar' && (
                      <div className="rounded-md border border-gray-200 p-4 space-y-3">
                        <div>
                          <h4 className="font-medium text-sm">Aadhaar eKYC Verification</h4>
                          <p className="text-xs text-gray-500">Government authorized identity verification</p>
                        </div>
                        
                        <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-amber-800 font-medium">Requires Aadhaar numbers</p>
                              <p className="text-xs text-amber-700 mt-1">
                                Some parties don't have Aadhaar numbers entered. You'll need to collect them during signing.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {form.watch('verification.method') === 'dsc' && (
                      <div className="rounded-md border border-gray-200 p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-sm">Digital Signature Certificate</h4>
                            <p className="text-xs text-gray-500">Upload .pfx files for signing</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload DSC
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="rounded-md border border-gray-200 p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-sm">LexiCert Verification</h4>
                          <p className="text-xs text-gray-500">Tamper-proof contract fingerprinting</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="bg-emerald-50 text-emerald-600 border-emerald-200"
                        >
                          Included
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-2 border rounded-md">
                      <div>
                        <p className="text-sm font-medium">IP Address Tracking</p>
                        <p className="text-xs text-gray-500">Record IP address of all signers</p>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between p-2 border rounded-md">
                      <div>
                        <p className="text-sm font-medium">Audit Log</p>
                        <p className="text-xs text-gray-500">Track all changes and signatures</p>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between p-2 border rounded-md">
                      <div>
                        <p className="text-sm font-medium">Document Fingerprinting</p>
                        <p className="text-xs text-gray-500">Cryptographic seal for tamper protection</p>
                      </div>
                      <Switch checked={true} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        );
        
      case 7:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">Generate & Share Contract</h3>
              <p className="text-gray-500">Download your contract or share it with other parties</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Download Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">PDF Document</p>
                        <p className="text-xs text-gray-500">Download as PDF with certification</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generatePreview}
                      disabled={isProcessing}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Word Document</p>
                        <p className="text-xs text-gray-500">Download as editable DOCX</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateDocx}
                      disabled={isProcessing}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      DOCX
                    </Button>
                  </div>
                  
                  <div className="rounded-md border border-gray-200 p-4">
                    <p className="text-sm font-medium mb-2">Preview</p>
                    <div className="bg-gray-100 rounded-md p-6 flex items-center justify-center min-h-[200px]">
                      {isProcessing ? (
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                          <p className="text-sm text-gray-500 mt-2">Generating preview...</p>
                        </div>
                      ) : previewUrl ? (
                        <div className="flex flex-col items-center">
                          <FileText className="h-16 w-16 text-primary-500 mb-2" />
                          <p className="text-sm font-medium">Contract Preview Generated</p>
                          <Button
                            variant="link"
                            className="text-primary-600"
                          >
                            View Document
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Eye className="h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">Click generate to see preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Share Contract</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Generate Secure Link</h4>
                      <div className="flex space-x-2">
                        <Select defaultValue="view">
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Access Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View Only</SelectItem>
                            <SelectItem value="sign">View & Sign</SelectItem>
                            <SelectItem value="comment">Comment Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => generateShareLink("View Only")}
                          className="flex-1"
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Create Link
                        </Button>
                      </div>
                    </div>
                    
                    {shareLink && (
                      <div className="rounded-md border border-gray-200 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Shareable Link</p>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600">Active</Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Input value={shareLink} readOnly className="bg-gray-50" />
                          <Button variant="outline" onClick={() => navigator.clipboard.writeText(shareLink)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-xs text-gray-500">Expires in 30 days</p>
                          <Button variant="link" size="sm" className="text-xs h-auto p-0">
                            Link Settings
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Email to Parties</h4>
                      <div className="rounded-md border border-gray-200 p-4 space-y-3">
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500">Recipients</p>
                          <div className="flex flex-wrap gap-2">
                            {form.watch('parties').map((party, index) => (
                              <Badge key={index} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                                {party.name}
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 rounded-full hover:bg-gray-200">
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-gray-500">Message</p>
                          <Textarea 
                            className="mt-1"
                            placeholder="Add a personal message to recipients"
                            rows={3}
                          />
                        </div>
                        
                        <Button 
                          className="w-full"
                          onClick={() => {
                            setIsProcessing(true);
                            
                            // In a real implementation, this would use SendGrid API
                            // For now, just simulate a delay
                            setTimeout(() => {
                              setIsProcessing(false);
                              
                              toast({
                                title: "Emails Sent Successfully",
                                description: `Contract has been emailed to ${form.watch('parties').length} parties.`,
                              });
                            }, 1500);
                          }}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Button
                  className="w-full"
                  onClick={finalizeContract}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Finalize Contract
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        );
        
      case 8:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Contract Successfully Created!</h3>
              <p className="text-gray-500 mt-2">Your contract has been certified and is ready</p>
            </div>
            
            <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-6 text-center space-y-4">
                <div className="flex items-center justify-center">
                  <Shield className="h-16 w-16 text-primary-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">LexiCert ID</h3>
                  <p className="text-2xl font-mono font-bold tracking-wider text-primary-600 mt-1">
                    {certificateId || 'LEXI-123456'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This unique ID verifies the authenticity of your contract
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600">
                      Certified
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Created On</p>
                    <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Parties</p>
                    <p className="text-sm font-medium">{form.watch('parties').length}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Signed</p>
                    <p className="text-sm font-medium">0/{form.watch('parties').length}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      onClose();
                      // Navigate to contract editor
                      // Use the saved contract ID from state
                      const contractId = savedContractId;
                      if (contractId) {
                        setLocation(`/contracts/edit/${contractId}`);
                      } else {
                        // Redirect to contracts list if ID unavailable
                        setLocation('/contracts');
                      }
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Edit Contract
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={generatePreview}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    className="col-span-2"
                    onClick={() => {
                      setIsProcessing(true);
                      setTimeout(() => {
                        const shareUrl = `https://lexidraft.app/c/${certificateId}`;
                        navigator.clipboard.writeText(shareUrl);
                        setIsProcessing(false);
                        toast({
                          title: "Link Copied to Clipboard",
                          description: "Share link has been copied to your clipboard."
                        });
                      }, 500);
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Contract
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="max-w-md mx-auto text-center">
              <Button variant="link" onClick={onClose}>
                Return to Dashboard
              </Button>
            </div>
          </motion.div>
        );
    }
  };
  
  // Helper functions
  const getStrengthColorClass = (score: number) => {
    if (score < 30) return 'bg-red-500';
    if (score < 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };
  
  const getFontClass = (font: string) => {
    switch (font) {
      case 'modern': return 'font-sans';
      case 'elegant': return 'font-serif';
      case 'professional': return 'font-sans';
      default: return 'font-serif';
    }
  };
  
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };
  
  const getPlainEnglishExplanation = (clauseTitle: string) => {
    // Simple mock explanations
    const explanations: Record<string, string> = {
      'Introduction': 'This section introduces who is involved in the contract and when it starts.',
      'Definitions': 'This section explains the specific meaning of key terms used in the contract.',
      'Term': 'This section sets how long the contract will last.',
      'Governing Law': 'This section states which country or state\'s laws will be used if there\'s a disagreement.',
      'Force Majeure': 'This section explains what happens if events outside anyone\'s control (like natural disasters) prevent the contract from being fulfilled.',
      'Severability': 'This means that if one part of the contract is found to be invalid, the rest of the contract still applies.',
      'Waiver': 'This means that if someone doesn\'t enforce their rights once, they can still enforce them later.',
      'Assignment': 'This section explains whether the parties can transfer their rights or obligations to someone else.',
    };
    
    return explanations[clauseTitle] || `This clause covers ${clauseTitle.toLowerCase()} and establishes the legal rights and obligations related to it.`;
  };
  
  const getLibraryClauseContent = (clauseTitle: string) => {
    // Sample clauses
    const clauses: Record<string, string> = {
      'Force Majeure': 'Neither Party shall be liable for any failure or delay in performance under this Agreement to the extent said failures or delays are proximately caused by forces beyond that Party\'s reasonable control and occurring without its fault or negligence, including, without limitation, natural disasters, pandemic, terrorist acts, government restrictions, or other similar causes ("Force Majeure Event") provided that the Party claiming Force Majeure gives prompt written notice to the other Party of the Force Majeure Event.',
      'Severability': 'If any provision of this Agreement is held to be invalid, illegal or unenforceable in any respect under any applicable law or rule in any jurisdiction, such invalidity, illegality or unenforceability shall not affect any other provision or any other jurisdiction, but this Agreement shall be reformed, construed and enforced in such jurisdiction as if such invalid, illegal or unenforceable provision had never been contained herein.',
      'Waiver': 'No waiver by any Party of any of the provisions hereof shall be effective unless explicitly set forth in writing and signed by the Party so waiving. No waiver by any Party shall operate or be construed as a waiver in respect of any failure, breach or default not expressly identified by such written waiver, whether of a similar or different character, and whether occurring before or after that waiver.',
      'Assignment': 'Neither Party may assign any of its rights or delegate any of its obligations hereunder without the prior written consent of the other Party. Any purported assignment or delegation in violation of this Section shall be null and void. No assignment or delegation shall relieve the assigning or delegating Party of any of its obligations hereunder.',
      'Stamp Duty': 'The Parties shall bear the stamp duty and registration charges, if applicable under the Indian Stamp Act, 1899, as amended from time to time, or any applicable state stamp acts, in equal proportions between them.',
      'GST Compliance': 'All payments under this Agreement are exclusive of Goods and Services Tax (GST) which shall be charged at the prevailing rate. Each Party shall provide the other with a valid GST invoice where applicable and shall comply with all applicable GST laws and regulations.',
      'Arbitration (India)': 'Any dispute arising out of or in connection with this Agreement, including any question regarding its existence, validity or termination, shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996 of India. The arbitration shall be conducted by a sole arbitrator mutually appointed by the Parties. The seat and venue of arbitration shall be [CITY], India. The language of the arbitration shall be English.',
      'Digital Signature': 'The Parties hereby consent to the execution of this Agreement by digital or electronic signature in accordance with the Information Technology Act, 2000 of India, as amended from time to time, and the parties acknowledge that such digital or electronic execution shall be legally binding upon the Parties.'
    };
    
    return clauses[clauseTitle] || `This is a sample ${clauseTitle} clause. Please customize this text with specific details relevant to your contract.`;
  };
  
  // Main renderer
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {step === 8 ? "Contract Created!" : "Create New Contract"}
              </DialogTitle>
              {step < 8 && (
                <DialogDescription className="mt-1">
                  Step {step} of {totalSteps}: {getStepTitle(step)}
                </DialogDescription>
              )}
            </div>
            {step < 8 && (
              <div className="text-sm font-medium text-gray-500">
                {Math.round(progress)}% Complete
              </div>
            )}
          </div>
          {step < 8 && <Progress value={progress} className="mt-2" />}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(() => {})} className="py-6 space-y-6">
              {renderStepContent()}
            </form>
          </Form>
        </div>
        
        {step < 8 && (
          <DialogFooter className="px-6 py-4 border-t">
            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={goToPrevStep}
                disabled={step === 1 || isProcessing}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <Button
                type="button"
                onClick={step === 3 && currentQuestion >= aiQuestions.length ? generateClauses : goToNextStep}
                disabled={
                  isProcessing || 
                  (step === 3 && currentQuestion < aiQuestions.length - 1) || // Don't proceed until almost all questions answered
                  (step === 7) // Final step needs special handling
                }
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {step === 3 && currentQuestion >= aiQuestions.length - 1 ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Clauses
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get step title
function getStepTitle(step: number): string {
  switch (step) {
    case 1: return "Choose Contract Category";
    case 2: return "Add Party Details";
    case 3: return "AI-Prompted Clause Generator";
    case 4: return "Lexi AI Drafting Workspace";
    case 5: return "Visual Contract Editor";
    case 6: return "Verification & Signature Setup";
    case 7: return "Share & Follow-up Workflow";
    case 8: return "Track & Certify";
    default: return "";
  }
}