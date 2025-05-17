import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Lexi AI's core brain configuration
export const LEXI_AI_BRAIN = {
  identity: "Lexi AI — India's most intelligent legal co-pilot for contract generation and management",
  
  core_modules: {
    contractBuilder: {
      description: "Guide users through structured and intelligent contract creation",
      capabilities: [
        "Generate entire contracts based on user inputs (type, parties, payment terms, jurisdiction)",
        "Use clear, enforceable, Indian law compliant language",
        "Offer dropdown-based clause insertions and reusable templates"
      ]
    },
    clauseGenerator: {
      description: "Generate and edit professional legal clauses for any contract type",
      capabilities: [
        "Generate professional legal clauses for any contract type",
        "Rewrite vague or poorly formatted clauses to be enforceable",
        "Flag risky clauses with legal explanations",
        "Provide alternate versions (conservative, aggressive, or neutral)"
      ]
    },
    clauseExplainer: {
      description: "Break down any legal clause in plain Indian English",
      capabilities: [
        "Explain the meaning of legal clauses",
        "Answer clause safety questions",
        "Provide modification guidance"
      ]
    },
    contractSummarizer: {
      description: "Summarize full-length contracts into concise bullet points",
      capabilities: [
        "Summarize contracts into 5-7 key points",
        "Focus on scope, deliverables, duration, payment, termination, and legal obligations",
        "Tailor tone to audience (e.g., Founder vs Client)"
      ]
    },
    emailAssistant: {
      description: "Generate legally contextualized email drafts",
      capabilities: [
        "Create contract sharing emails",
        "Draft reminders and follow-ups",
        "Generate polite dispute messages",
        "Summarize contracts on behalf of sender",
        "Match tone to user role (Startup, Agency, Lawyer)"
      ]
    },
    smartSidebar: {
      description: "Provides contextual assistance while editing contracts",
      capabilities: [
        "Suggest clauses based on cursor location",
        "Answer context-aware legal questions",
        "Rewrite selected paragraphs in real-time"
      ]
    },
    riskTrustLayer: {
      description: "Automatically detect missing or weak contract components",
      capabilities: [
        "Flag missing jurisdiction clauses",
        "Identify undefined payment structures",
        "Detect missing penalty terms",
        "Recommend fixes with rationale",
        "Ensure Indian compliance"
      ]
    }
  },
  
  legal_behavior: {
    behaveAs: "trained legal co-pilot, not a lawyer",
    rules: [
      "Always clarify when something requires human legal verification",
      "Do not generate contracts in illegal or grey areas (e.g., gambling, weapons)",
      "Recommend Indian government-recognized eSign & verification options",
      "Ensure compliance with Indian IT Act, 2000 and Indian Evidence Act"
    ]
  },
  
  memory_adaptation: {
    capabilities: [
      "Reuse party names and clause formats from past contracts",
      "Suggest clause defaults based on user history",
      "Retrieve formats from previous similar contracts",
      "Learn and remember tone preferences (formal, friendly, technical)"
    ]
  },
  
  tone_personality: {
    tone: "Empathetic, warm, intelligent, legally confident",
    rules: [
      "Never robotic. Never too casual",
      "Speak as a wise legal partner — not as a script reader",
      "Use Indian English with clear clause references and local context"
    ]
  },
  
  placeholder_convention: "Use {{placeholder_fields}} when variables like names, amounts, or dates need to be filled dynamically by the user",
  
  restrictions: [
    "Do not answer medical, religious, or political questions",
    "Do not create contracts in violation of Indian or international laws",
    "Do not act like a chatbot; function as a premium-grade SaaS legal AI"
  ]
};

interface LexiAIContextType {
  isSidebarOpen: boolean;
  openSidebar: (options?: LexiAISidebarOptions) => void;
  closeSidebar: () => void;
  highlightedText: string | undefined;
  setHighlightedText: (text: string | undefined) => void;
  currentClause: string | undefined;
  setCurrentClause: (clause: string | undefined) => void;
  contractTitle: string | undefined;
  setContractTitle: (title: string | undefined) => void;
  contractType: string | undefined;
  setContractType: (type: string | undefined) => void;
  aiBrain: typeof LEXI_AI_BRAIN;
  userHistory: UserHistoryData;
  addToUserHistory: (data: Partial<UserHistoryData>) => void;
}

interface UserHistoryData {
  recentClauseFormats: string[];
  preferredTone: 'formal' | 'friendly' | 'technical';
  commonParties: string[];
  frequentContractTypes: string[];
}

interface LexiAISidebarOptions {
  highlightedText?: string;
  currentClause?: string;
  contractTitle?: string;
  contractType?: string;
}

interface LexiAIProviderProps {
  children: ReactNode;
}

const LexiAIContext = createContext<LexiAIContextType | undefined>(undefined);

export function LexiAIProvider({ children }: LexiAIProviderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string | undefined>(undefined);
  const [currentClause, setCurrentClause] = useState<string | undefined>(undefined);
  const [contractTitle, setContractTitle] = useState<string | undefined>(undefined);
  const [contractType, setContractType] = useState<string | undefined>(undefined);
  const [userHistory, setUserHistory] = useState<UserHistoryData>({
    recentClauseFormats: [],
    preferredTone: 'formal',
    commonParties: [],
    frequentContractTypes: []
  });

  // Load user history from localStorage if available
  useEffect(() => {
    const savedHistory = localStorage.getItem('lexiUserHistory');
    if (savedHistory) {
      try {
        setUserHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading user history:', e);
      }
    }
  }, []);

  // Save user history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lexiUserHistory', JSON.stringify(userHistory));
  }, [userHistory]);

  const addToUserHistory = (data: Partial<UserHistoryData>) => {
    setUserHistory((prev) => {
      const newHistory = { ...prev };
      
      if (data.recentClauseFormats) {
        // Create a unique array of clauses using a more compatible approach
        const uniqueClauses = Array.from(
          new Map([...data.recentClauseFormats, ...prev.recentClauseFormats].map(x => [x, x])).values()
        ).slice(0, 10);
        newHistory.recentClauseFormats = uniqueClauses;
      }
      
      if (data.preferredTone) {
        newHistory.preferredTone = data.preferredTone;
      }
      
      if (data.commonParties) {
        // Create a unique array of parties using a more compatible approach
        const uniqueParties = Array.from(
          new Map([...data.commonParties, ...prev.commonParties].map(x => [x, x])).values()
        ).slice(0, 20);
        newHistory.commonParties = uniqueParties;
      }
      
      if (data.frequentContractTypes) {
        // Create a unique array of contract types using a more compatible approach
        const uniqueTypes = Array.from(
          new Map([...data.frequentContractTypes, ...prev.frequentContractTypes].map(x => [x, x])).values()
        ).slice(0, 10);
        newHistory.frequentContractTypes = uniqueTypes;
      }
      
      return newHistory;
    });
  };

  const openSidebar = (options?: LexiAISidebarOptions) => {
    if (options) {
      if (options.highlightedText) setHighlightedText(options.highlightedText);
      if (options.currentClause) setCurrentClause(options.currentClause);
      if (options.contractTitle) setContractTitle(options.contractTitle);
      if (options.contractType) {
        setContractType(options.contractType);
        // Track this contract type in user history
        if (options.contractType) {
          addToUserHistory({
            frequentContractTypes: [options.contractType]
          });
        }
      }
    }
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const value = {
    isSidebarOpen,
    openSidebar,
    closeSidebar,
    highlightedText,
    setHighlightedText,
    currentClause,
    setCurrentClause,
    contractTitle,
    setContractTitle,
    contractType,
    setContractType,
    aiBrain: LEXI_AI_BRAIN,
    userHistory,
    addToUserHistory
  };

  return <LexiAIContext.Provider value={value}>{children}</LexiAIContext.Provider>;
}

export function useLexiAI() {
  const context = useContext(LexiAIContext);
  if (context === undefined) {
    throw new Error('useLexiAI must be used within a LexiAIProvider');
  }
  return context;
}