import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface LexiOptions {
  contractType?: string;
  jurisdiction?: string;
  clauseGoal?: string;
  parties?: string;
  customNotes?: string;
  tone?: "friendly" | "balanced" | "strict";
  userRole?: string;
}

export async function enhanceClause(
  action: string,
  content: string,
  options: LexiOptions = {}
): Promise<{ result: string; explanation?: string }> {
  const jurisdiction = options.jurisdiction || "India";
  const tone = options.tone || "balanced";

  let promptContent = "";
  let systemRole = "";

  switch (action) {
    case "rewrite":
      systemRole = `You are Lexi, a legal drafting assistant specialized in ${jurisdiction} law.
Your role is to improve legal clauses by making them clearer, more effective, and legally sound.`;
      
      promptContent = `Take the following clause and enhance it for clarity, enforceability, and alignment with ${jurisdiction} law.

Clause Input: ${content}  
Intent: Improve clause clarity and enforceability 
Tone: ${tone}  
Audience: Legal professionals and their clients

Your job is to rewrite the clause:
- Keep it enforceable
- Improve phrasing and flow
- Fill in missing but essential legal conditions
- Ensure compliance with ${jurisdiction} law

Output must feel drafted by a legal professional.`;
      break;
      
    case "explain":
      systemRole = `You are Lexi, a legal assistant who specializes in explaining complex legal language in simple terms.`;
      
      promptContent = `Explain the following legal clause in plain, human-friendly English. Avoid jargon. Keep it under 100 words.

Clause: ${content}

Explain:
- What it means
- What it protects or enforces
- When it applies
- One-line TL;DR summary`;
      break;
      
    case "simplify":
      systemRole = `You are Lexi, a legal simplification expert who converts complex legal language into clearer, simpler terms while preserving legal meaning.`;
      
      promptContent = `Simplify the following legal clause to make it more understandable for non-lawyers while maintaining its legal effect under ${jurisdiction} law:

${content}

Your simplification should:
- Use plain language
- Maintain legal meaning and enforceability
- Be shorter if possible
- Include paragraph breaks for readability
- Be suitable for ${jurisdiction} jurisdiction`;
      break;
      
    case "strengthen":
      systemRole = `You are Lexi, a legal drafting specialist who strengthens legal protections in contract clauses for maximum enforceability under ${jurisdiction} law.`;
      
      promptContent = `Strengthen the following legal clause to provide better legal protection under ${jurisdiction} law:

${content}

Your strengthened version should:
- Add appropriate additional protections
- Close potential loopholes
- Add specific remedies where appropriate
- Ensure compatibility with ${jurisdiction} contract law
- Include proper legal terminology for enforceability`;
      break;
      
    case "validate":
      systemRole = `You are Lexi, a legal compliance expert specialized in ${jurisdiction} contract law.`;
      
      promptContent = `Validate the following clause for compliance with ${jurisdiction} law and suggest improvements:

${content}

Provide:
1. An assessment of compliance with ${jurisdiction} law
2. Identification of potential legal issues or vulnerabilities
3. Specific suggestions to improve legal compliance
4. References to relevant ${jurisdiction} statutes or case law if applicable`;
      break;
      
    default:
      throw new Error(`Unknown action: ${action}`);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemRole },
        { role: "user", content: promptContent }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    let result = response.choices[0].message.content || "";
    let explanation: string | undefined;

    // For explain action, separate the result and explanation
    if (action === "explain") {
      const parts = result.split("TL;DR:");
      if (parts.length > 1) {
        result = parts[0].trim();
        explanation = parts[1].trim();
      }
    }

    return { result, explanation };
  } catch (error) {
    console.error(`Error enhancing clause with action ${action}:`, error);
    throw new Error(`Failed to enhance clause: ${error.message}`);
  }
}

export async function composeClause(options: {
  goal: string;
  context?: string;
  contractType?: string;
  jurisdiction?: string;
  tone?: "friendly" | "balanced" | "strict";
  userRole?: string;
}): Promise<{ title: string; content: string; explanation?: string }> {
  const {
    goal,
    context = "",
    contractType = "standard",
    jurisdiction = "India",
    tone = "balanced",
    userRole = ""
  } = options;

  const systemPrompt = `You are Lexi, a legal drafting assistant specialized in ${jurisdiction} law.

Your role is to generate precise, legally-compliant clauses based on user inputs. Always write in human-understandable legal language, and ensure clauses are:
- Valid under ${jurisdiction} Contract Act
- Professionally structured
- Tone-aligned to user preference (${tone})
- Output-ready for real contracts`;

  const userPrompt = `Generate a contract clause with the following parameters:
- Contract Type: ${contractType}
- Purpose: ${goal}
- Additional Context: ${context}
- User Role: ${userRole}
- Jurisdiction: ${jurisdiction}
- Tone: ${tone}

Return:
- Clause Title
- Legally formatted clause content
- (Optional) Brief explanation of why this clause matters`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content || "";
    
    // Parse the response to get title, content, and explanation
    let title = "Custom Clause";
    let clauseContent = content;
    let explanation;
    
    // Simple parsing logic - can be improved based on actual response formats
    const titleMatch = content.match(/^(.*?)\n/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/^#+\s*|\*\*|\*/g, '').trim();
      clauseContent = content.replace(titleMatch[0], '').trim();
    }
    
    // Extract explanation if present
    const explanationMatch = clauseContent.match(/Why this clause matters:([^]*?)$/i);
    if (explanationMatch) {
      explanation = explanationMatch[1].trim();
      clauseContent = clauseContent.replace(explanationMatch[0], '').trim();
    }

    return {
      title,
      content: clauseContent,
      explanation
    };
  } catch (error) {
    console.error("Error composing clause:", error);
    throw new Error(`Failed to compose clause: ${error.message}`);
  }
}

export async function getSuggestedClauses(contractType: string, jurisdiction: string = "India"): Promise<Array<{ title: string; description: string }>> {
  const systemPrompt = `You are Lexi, a legal drafting assistant specialized in ${jurisdiction} contract law.`;

  const userPrompt = `You're drafting a ${contractType} in ${jurisdiction}.

Based on legal best practices and common disputes, suggest the most important clauses to include.

Output Format:
- Clause Title
- One-line description
- Why it's important (brief)

Limit: 6–8 clauses max. Prioritize based on risk & enforceability.
Format response as a clean JSON array of objects with title, description, and importance fields.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const parsedContent = JSON.parse(content);
    
    if (Array.isArray(parsedContent.clauses)) {
      return parsedContent.clauses.map(clause => ({
        title: clause.title,
        description: clause.description || "",
        importance: clause.importance || ""
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Error getting suggested clauses:", error);
    throw new Error(`Failed to get clause suggestions: ${error.message}`);
  }
}

export async function analyzeContract(content: string, jurisdiction: string = "India"): Promise<{
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  compliantWithIndianLaw: boolean;
}> {
  const systemPrompt = `You are Lexi, a legal contract analysis expert specialized in ${jurisdiction} law.`;

  const userPrompt = `Analyze the following contract for its legal strengths, weaknesses, and compliance with ${jurisdiction} law:

${content}

Provide your analysis in JSON format with these fields:
- strengths: Array of strong points in the contract
- weaknesses: Array of weak points or potential issues
- recommendations: Array of specific recommendations to improve the contract
- compliantWithIndianLaw: Boolean indicating if the contract appears to comply with Indian law requirements`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      compliantWithIndianLaw: !!result.compliantWithIndianLaw
    };
  } catch (error) {
    console.error("Error analyzing contract:", error);
    throw new Error(`Failed to analyze contract: ${error.message}`);
  }
}