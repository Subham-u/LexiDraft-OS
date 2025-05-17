import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Clause } from '@shared/schema';

interface ClauseComposerOptions {
  contractId?: number;
  jurisdiction?: string;
  contractType?: string;
  tone?: 'friendly' | 'balanced' | 'strict';
  onSuccess?: (result: Clause) => void;
}

interface ClauseEnhanceOptions {
  jurisdiction?: string;
  contractType?: string;
  tone?: 'friendly' | 'balanced' | 'strict';
  userRole?: string;
  customNotes?: string;
  contractId?: number;
}

export function useClauseComposer(options?: ClauseComposerOptions) {
  const { toast } = useToast();
  const [isComposing, setIsComposing] = useState(false);
  const [generatedClause, setGeneratedClause] = useState<Clause | null>(null);
  
  const enhanceClauseMutation = useMutation({
    mutationFn: async ({ 
      action, 
      content, 
      clauseId,
      title,
      options: enhanceOptions = {}
    }: { 
      action: string; 
      content: string; 
      clauseId?: string;
      title?: string;
      options?: ClauseEnhanceOptions
    }) => {
      // Get the contract ID from either the enhanceOptions or the hook options
      const contractId = enhanceOptions.contractId || options?.contractId;
      
      // If we have a contract ID, use the contract-specific enhance endpoint
      if (contractId) {
        const response = await apiRequest("POST", `/api/contracts/${contractId}/enhance`, {
          action,
          content,
          clauseId,
          title: title || 'New Clause',
          options: enhanceOptions
        });
        return response.json();
      } else {
        // Otherwise use the general enhance clause endpoint
        const response = await apiRequest("POST", `/api/ai/enhance-clause`, {
          action,
          content,
          clauseId,
          title: title || 'New Clause',
          options: enhanceOptions
        });
        return response.json();
      }
    },
    onSuccess: (data) => {
      if (data?.clause) {
        setGeneratedClause(data.clause);
        
        // If a success callback was provided, call it with the result
        if (options?.onSuccess) {
          options.onSuccess(data.clause);
        }
        
        toast({
          title: "Success",
          description: `The clause has been ${data.action || 'enhanced'} successfully.`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: "The operation completed, but the clause content may be incomplete.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Error in clause composer:", error);
      toast({
        title: "Error",
        description: "Failed to process clause. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsComposing(false);
    }
  });
  
  const composeClauseMutation = useMutation({
    mutationFn: async (params: {
      goal: string;
      context?: string;
      options?: ClauseEnhanceOptions
    }) => {
      // Merge in the default options
      const mergedOptions = {
        jurisdiction: options?.jurisdiction || 'India',
        contractType: options?.contractType || 'standard',
        tone: options?.tone || 'balanced',
        ...params.options
      };
      
      const response = await apiRequest("POST", `/api/ai/compose-clause`, {
        goal: params.goal,
        context: params.context || '',
        options: mergedOptions
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data?.clause) {
        setGeneratedClause(data.clause);
        
        // If a success callback was provided, call it with the result
        if (options?.onSuccess) {
          options.onSuccess(data.clause);
        }
        
        toast({
          title: "Clause Created",
          description: "A new clause has been composed successfully.",
        });
      } else {
        toast({
          title: "Partial Success",
          description: "The operation completed, but the clause content may be incomplete.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Error composing clause:", error);
      toast({
        title: "Error",
        description: "Failed to compose clause. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsComposing(false);
    }
  });
  
  // Function to enhance an existing clause
  const enhanceClause = (action: string, clause: Clause, customOptions?: ClauseEnhanceOptions) => {
    setIsComposing(true);
    setGeneratedClause(null);
    
    // Merge in the default options with any custom options passed to this call
    const mergedOptions: ClauseEnhanceOptions = {
      jurisdiction: options?.jurisdiction,
      contractType: options?.contractType,
      tone: options?.tone,
      contractId: options?.contractId,
      ...customOptions
    };
    
    enhanceClauseMutation.mutate({
      action,
      content: clause.content,
      clauseId: clause.id,
      title: clause.title,
      options: mergedOptions
    });
  };
  
  // Function to generate a new clause
  const composeClause = (goal: string, context?: string, customOptions?: ClauseEnhanceOptions) => {
    setIsComposing(true);
    setGeneratedClause(null);
    
    // Merge in the default options with any custom options passed to this call
    const mergedOptions: ClauseEnhanceOptions = {
      jurisdiction: options?.jurisdiction,
      contractType: options?.contractType,
      tone: options?.tone,
      contractId: options?.contractId,
      ...customOptions
    };
    
    composeClauseMutation.mutate({
      goal,
      context,
      options: mergedOptions
    });
  };
  
  return {
    enhanceClause,
    composeClause,
    isComposing: isComposing || enhanceClauseMutation.isPending || composeClauseMutation.isPending,
    generatedClause,
    reset: () => setGeneratedClause(null)
  };
}