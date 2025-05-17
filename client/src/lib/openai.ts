import { AIMessage } from "@shared/schema";

interface ChatResponse {
  messages: AIMessage[];
  contractSuggestion?: string;
}

export async function getChatResponse(
  prompt: string, 
  messages: AIMessage[] = [], 
  contractContext?: string
): Promise<ChatResponse> {
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        messages,
        contractContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting AI response:", error);
    throw error;
  }
}

export async function generateContractDraft(
  type: string,
  parties: { name: string; role: string }[],
  jurisdiction: string,
  requirements: string
): Promise<string> {
  try {
    const response = await fetch("/api/ai/generate-contract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        parties,
        jurisdiction,
        requirements,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.contract;
  } catch (error) {
    console.error("Error generating contract:", error);
    throw error;
  }
}

export async function analyzeClause(clause: string): Promise<{
  explanation: string;
  suggestions: string[];
  legalContext: string;
}> {
  try {
    const response = await fetch("/api/ai/analyze-clause", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clause }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error analyzing clause:", error);
    throw error;
  }
}
