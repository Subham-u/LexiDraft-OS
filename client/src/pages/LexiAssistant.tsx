"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  MessageSquare,
  ChevronRight,
  Send,
  Sparkles,
  FileText,
  BookOpen,
  FileEdit,
  Mail,
  Shield,
  ListChecks,
  Zap,
  Brain,
  Lightbulb,
  ArrowRight,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Mic,
  Scale,
  Clock,
  CheckCircle,
  CornerDownLeft,
} from "lucide-react"
import type { AIMessage } from "@shared/schema"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useLexiAI } from "@/context/LexiAIContext"
import DashboardLayout from "@/layouts/DashboardLayout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function LexiAssistant() {
  const { openSidebar, aiBrain, userHistory, addToUserHistory } = useLexiAI()
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm Lexi, your AI legal assistant. I can help you understand legal terms and clauses, and navigate Indian contract law. How may I assist you today?",
      timestamp: new Date().toISOString(),
    },
    {
      role: "user",
      content: "What are the key contractual elements to ensure our service agreement is enforceable?",
      timestamp: new Date().toISOString(),
    },
    {
      role: "assistant",
      content:
        "To ensure a service agreement is enforceable under Indian law, make sure it includes:\n\n1️⃣ **Clear identification of parties** - Full legal names and addresses\n\n2️⃣ **Detailed scope of services** - Specific deliverables and timelines\n\n3️⃣ **Clear payment terms** - Amount, method, and schedule\n\n4️⃣ **Duration and termination provisions** - Contract period and conditions for ending\n\n5️⃣ **Governing law clause** - Specifying Indian jurisdiction\n\n6️⃣ **Signatures of all parties** - Physical or valid digital signatures\n\nThe agreement should be stamped as per applicable state stamp duty laws to be admissible as evidence in court.",
      timestamp: new Date().toISOString(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("capabilities")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copiedIndex !== null) {
      const timer = setTimeout(() => {
        setCopiedIndex(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedIndex])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const userMessage: AIMessage = {
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setQuery("")
    setIsTyping(true)

    // Simulate response
    setTimeout(() => {
      let responseContent = ""

      // Generate different responses based on query content
      if (query.toLowerCase().includes("non-compete")) {
        responseContent =
          "Non-compete clauses in India have limited enforceability. Under Section 27 of the Indian Contract Act, agreements restraining anyone from exercising a lawful profession, trade, or business are void, with exceptions for:\n\n1. Sale of goodwill\n2. Partnership agreements (during the term)\n\nFor employment contracts, non-compete clauses are generally not enforceable after employment ends. Courts may enforce reasonable restrictions during employment, but post-employment restrictions are typically unenforceable unless they protect legitimate business interests like trade secrets.\n\nTo maximize enforceability:\n• Keep restrictions reasonable in duration and geographic scope\n• Limit to protection of confidential information\n• Consider using non-solicitation instead"
      } else if (query.toLowerCase().includes("notice period")) {
        responseContent =
          "Standard notice periods in India vary by employment level and industry:\n\n• Junior/Mid-level: 1-2 months\n• Senior management: 2-3 months\n• C-suite executives: 3-6 months\n\nLegal framework:\n• The Industrial Employment (Standing Orders) Act requires employers to specify notice periods\n• The Model Standing Orders suggest a 1-month notice period for permanent workmen\n• For shops and establishments, state-specific laws apply (typically 14-30 days)\n\nBest practices:\n• Clearly specify the notice period in the employment contract\n• Include provisions for payment in lieu of notice\n• Address garden leave if applicable\n• Ensure compliance with state-specific labor laws"
      } else if (query.toLowerCase().includes("contract basics") || query.toLowerCase().includes("legally binding")) {
        responseContent =
          "For a contract to be legally binding in India under the Indian Contract Act, 1872, it must contain these essential elements:\n\n1. **Offer and Acceptance**: A clear proposal and unequivocal acceptance\n\n2. **Consideration**: Something of value exchanged between parties\n\n3. **Competent Parties**: Parties must be of legal age (18+), of sound mind, and not disqualified by law\n\n4. **Free Consent**: Agreement without coercion, undue influence, fraud, misrepresentation, or mistake\n\n5. **Lawful Object**: Purpose must not be illegal, immoral, or against public policy\n\n6. **Certainty**: Terms must be clear and not vague\n\n7. **Possibility of Performance**: Contract must be capable of being performed\n\nWhile not mandatory for validity, written documentation and proper execution (signatures) are strongly recommended for enforceability."
      } else {
        responseContent =
          "Based on your query, I'd recommend focusing on these key aspects for your contract:\n\n• Clearly define all terms and obligations to avoid ambiguity\n• Ensure compliance with relevant Indian laws and regulations\n• Include appropriate dispute resolution mechanisms\n• Specify governing law and jurisdiction clauses\n• Address confidentiality and data protection requirements\n\nWould you like me to elaborate on any specific aspect of your contract needs?"
      }

      const assistantMessage: AIMessage = {
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  // Handle voice input
  const handleVoiceInput = () => {
    setIsRecording(true)
    // Simulate voice recording and conversion
    setTimeout(() => {
      setQuery("What are the essential elements of a valid contract in India?")
      setIsRecording(false)
    }, 2000)
  }

  // Copy message to clipboard
  const handleCopyMessage = (index: number) => {
    const message = messages[index]
    if (message) {
      navigator.clipboard.writeText(message.content)
      setCopiedIndex(index)
    }
  }

  // List of suggested topics based on the screenshot
  const suggestedTopics = [
    {
      id: "basics",
      heading: "Contract Basics",
      description: "What makes a contract legally binding in India?",
      icon: FileText,
      color: "blue",
    },
    {
      id: "elements",
      heading: "Essential elements of a valid contract",
      description: "Learn about the key elements required for a valid contract",
      icon: ListChecks,
      color: "indigo",
    },
    {
      id: "termination",
      heading: "Contract termination clauses",
      description: "How to properly structure termination provisions",
      icon: FileEdit,
      color: "purple",
    },
    {
      id: "employment",
      heading: "Employment Law",
      description: "Standard notice period in India",
      icon: Clock,
      color: "amber",
    },
    {
      id: "non-compete",
      heading: "Non-compete clauses enforceability",
      description: "Legal requirements for enforceable non-compete provisions",
      icon: Shield,
      color: "green",
    },
  ]

  // Format user samples based on user history and preferences
  const formatUserSamples = () => {
    const userSamples = []

    // Add some samples based on user history if available
    if (userHistory.frequentContractTypes.length > 0) {
      userSamples.push(`Create a ${userHistory.frequentContractTypes[0]} contract template`)
    }

    if (userHistory.commonParties.length > 0) {
      userSamples.push(`Draft a follow-up email to ${userHistory.commonParties[0]}`)
    }

    // Add default samples if not enough from history
    if (userSamples.length < 3) {
      userSamples.push("What's the best way to protect IP rights in a freelance contract?")
      userSamples.push("Create a non-compete clause for Delhi jurisdiction")
      userSamples.push("Analyze this payment terms clause for risks")
    }

    return userSamples
  }

  // Get color scheme based on topic color
  const getColorScheme = (color: string) => {
    const colorSchemes = {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-100",
        text: "text-blue-600",
        hover: "hover:bg-blue-100",
        icon: "bg-blue-100 text-blue-600",
        button: "border-blue-200 text-blue-700 hover:bg-blue-50",
      },
      indigo: {
        bg: "bg-indigo-50",
        border: "border-indigo-100",
        text: "text-indigo-600",
        hover: "hover:bg-indigo-100",
        icon: "bg-indigo-100 text-indigo-600",
        button: "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
      },
      purple: {
        bg: "bg-purple-50",
        border: "border-purple-100",
        text: "text-purple-600",
        hover: "hover:bg-purple-100",
        icon: "bg-purple-100 text-purple-600",
        button: "border-purple-200 text-purple-700 hover:bg-purple-50",
      },
      amber: {
        bg: "bg-amber-50",
        border: "border-amber-100",
        text: "text-amber-600",
        hover: "hover:bg-amber-100",
        icon: "bg-amber-100 text-amber-600",
        button: "border-amber-200 text-amber-700 hover:bg-amber-50",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-100",
        text: "text-green-600",
        hover: "hover:bg-green-100",
        icon: "bg-green-100 text-green-600",
        button: "border-green-200 text-green-700 hover:bg-green-50",
      },
    }

    return colorSchemes[color as keyof typeof colorSchemes] || colorSchemes.blue
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col space-y-6">
          {/* Lexi AI Brain Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white p-8 shadow-lg">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mt-20 -mr-20 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -mb-10 -ml-10 blur-xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start">
                <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-6 shadow-inner">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center">
                    <h1 className="text-3xl font-bold">{aiBrain.identity}</h1>
                    <Badge className="ml-3 bg-white/20 text-white border-transparent">Beta</Badge>
                  </div>
                  <p className="text-blue-100 mt-2 max-w-2xl">
                    Your legal co-pilot trained on Indian contract law, clause drafting, and contract lifecycle
                    management
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-50 shadow-md"
                  onClick={() => openSidebar()}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Open Lexi Sidebar
                </Button>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-transparent backdrop-blur-sm"
              >
                <Scale className="h-3.5 w-3.5 mr-1.5" />
                Indian Contract Law Expert
              </Badge>
              <Badge
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-transparent backdrop-blur-sm"
              >
                <FileEdit className="h-3.5 w-3.5 mr-1.5" />
                Clause Generation
              </Badge>
              <Badge
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-transparent backdrop-blur-sm"
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Legal Explainer
              </Badge>
              <Badge
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-transparent backdrop-blur-sm"
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" />
                Email Assistant
              </Badge>
              <Badge
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-transparent backdrop-blur-sm"
              >
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Risk Detection
              </Badge>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left side - Chat */}
            <div className="w-full lg:w-7/12 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-indigo-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 shadow-sm">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Lexi AI Chat</h2>
                      <p className="text-sm text-gray-600">
                        Ask any legal question about Indian contracts and get expert guidance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Brain className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">AI Capabilities</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Suggested Topics</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              {/* Chat area */}
              <ScrollArea className="h-[450px] p-4">
                <div className="flex flex-col space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      onMouseEnter={() => setSelectedMessage(index)}
                      onMouseLeave={() => setSelectedMessage(null)}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-9 w-9 mr-3 mt-1">
                          <AvatarImage src="/ai-assistant-avatar.png" />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            <Sparkles className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`relative max-w-[85%] rounded-xl p-4 group ${
                          message.role === "user"
                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                            : "bg-gray-100 text-gray-800 border border-gray-200"
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                        <div className="mt-2 flex items-center justify-between text-xs opacity-70">
                          <span>
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          {message.role === "assistant" && selectedMessage === index && (
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-gray-500 hover:text-blue-600"
                                      onClick={() => handleCopyMessage(index)}
                                    >
                                      {copiedIndex === index ? (
                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">{copiedIndex === index ? "Copied!" : "Copy to clipboard"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-gray-500 hover:text-green-600"
                                    >
                                      <ThumbsUp className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Helpful</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-gray-500 hover:text-red-600"
                                    >
                                      <ThumbsDown className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Not helpful</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                      </div>

                      {message.role === "user" && (
                        <Avatar className="h-9 w-9 ml-3 mt-1">
                          <AvatarImage src="/user-avatar.png" />
                          <AvatarFallback className="bg-blue-600 text-white">U</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <Avatar className="h-9 w-9 mr-3 mt-1">
                        <AvatarImage src="/ai-assistant-avatar.png" />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <Sparkles className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-xl p-4 max-w-[85%] border border-gray-200">
                        <div className="flex space-x-2">
                          <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div
                            className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input area */}
              <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="relative flex items-end">
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      placeholder={aiBrain.placeholder_convention}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pr-24 pl-10 py-6 bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200 rounded-xl shadow-sm"
                    />
                    <div className="absolute left-3 bottom-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-blue-600"
                              onClick={() => {}}
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Attach file</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="absolute right-3 bottom-2.5 flex items-center space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${
                                isRecording ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-blue-600"
                              }`}
                              onClick={handleVoiceInput}
                              disabled={isTyping}
                            >
                              <Mic className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">{isRecording ? "Recording..." : "Voice input"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 h-9 w-9 rounded-lg p-0 shadow-sm"
                        disabled={!query.trim() || isTyping}
                      >
                        {isTyping ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Send className="h-4 w-4 text-white" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-gray-500 italic flex items-center">
                    <Shield className="h-3 w-3 mr-1 inline-block" />
                    <span>{aiBrain.restrictions[0]}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-1">Press</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd>
                    <span className="mx-1">to send</span>
                  </div>
                </div>
              </form>
            </div>

            {/* Right side - Lexi AI Modules */}
            <div className="w-full lg:w-5/12">
              <Tabs
                defaultValue={activeTab}
                value={activeTab}
                onValueChange={setActiveTab}
                className="bg-white rounded-xl shadow-md border border-gray-200 h-full flex flex-col"
              >
                <TabsList className="w-full grid grid-cols-3 rounded-none border-b p-0 h-auto">
                  <TabsTrigger
                    value="capabilities"
                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 py-3"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Capabilities
                  </TabsTrigger>
                  <TabsTrigger
                    value="examples"
                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 py-3"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Examples
                  </TabsTrigger>
                  <TabsTrigger
                    value="topics"
                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 py-3"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Topics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="capabilities" className="flex-1 p-0 data-[state=active]:flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CapabilityCard
                        icon={FileText}
                        title="Contract Builder"
                        description={aiBrain.core_modules.contractBuilder.capabilities[0]}
                        color="blue"
                      />

                      <CapabilityCard
                        icon={FileEdit}
                        title="Clause Generator"
                        description={aiBrain.core_modules.clauseGenerator.capabilities[0]}
                        color="indigo"
                      />

                      <CapabilityCard
                        icon={BookOpen}
                        title="Clause Explainer"
                        description={aiBrain.core_modules.clauseExplainer.capabilities[0]}
                        color="purple"
                      />

                      <CapabilityCard
                        icon={Mail}
                        title="Email Assistant"
                        description={aiBrain.core_modules.emailAssistant.capabilities[0]}
                        color="amber"
                      />

                      <CapabilityCard
                        icon={Shield}
                        title="Risk Detection"
                        description={aiBrain.core_modules.riskTrustLayer.capabilities[0]}
                        color="green"
                      />

                      <CapabilityCard
                        icon={Scale}
                        title="Legal Research"
                        description="Access information on Indian statutes, case law, and legal precedents relevant to your contracts."
                        color="blue"
                      />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="examples" className="flex-1 p-0 data-[state=active]:flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <h3 className="font-medium text-blue-800 flex items-center mb-2">
                          <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                          Try these example commands with Lexi AI
                        </h3>
                        <p className="text-sm text-blue-700 mb-2">Click on any example to add it to your chat input</p>
                      </div>

                      {formatUserSamples().map((sample, index) => (
                        <button
                          key={index}
                          className="w-full text-left p-4 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg text-sm flex justify-between items-center transition-all duration-200 group"
                          onClick={() => {
                            setQuery(sample)
                            inputRef.current?.focus()
                          }}
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
                              <CornerDownLeft className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <span className="text-gray-800">{sample}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors transform group-hover:translate-x-1 duration-200" />
                        </button>
                      ))}

                      <div className="mt-4 text-xs text-gray-500 italic p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="flex items-center">
                          <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                          {aiBrain.tone_personality.rules[0]}
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="topics" className="flex-1 p-0 data-[state=active]:flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {suggestedTopics.map((topic) => {
                        const Icon = topic.icon
                        const colorScheme = getColorScheme(topic.color)

                        return (
                          <div
                            key={topic.id}
                            className={`bg-white border rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${colorScheme.border}`}
                          >
                            <div className="p-4">
                              <div className="flex items-start space-x-4">
                                <div
                                  className={`mt-0.5 rounded-full p-2.5 flex-shrink-0 ${colorScheme.icon} transition-colors`}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900">{topic.heading}</h3>
                                  <p className="text-sm text-gray-500 mt-1">{topic.description}</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`mt-3 text-xs h-8 px-3 py-1 ${colorScheme.button} transition-all duration-200 group`}
                                    onClick={() => {
                                      setQuery(topic.heading)
                                      setActiveTab("examples")
                                      inputRef.current?.focus()
                                    }}
                                  >
                                    <span>Learn More</span>
                                    <ArrowRight className="h-3.5 w-3.5 ml-1.5 transform group-hover:translate-x-0.5 transition-transform" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Capability Card Component
interface CapabilityCardProps {
  icon: React.ElementType
  title: string
  description: string
  color: "blue" | "indigo" | "purple" | "amber" | "green"
}

function CapabilityCard({ icon: Icon, title, description, color }: CapabilityCardProps) {
  const colorSchemes = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      hover: "group-hover:bg-blue-100",
    },
    indigo: {
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      iconBg: "bg-indigo-100",
      iconText: "text-indigo-600",
      hover: "group-hover:bg-indigo-100",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-100",
      iconBg: "bg-purple-100",
      iconText: "text-purple-600",
      hover: "group-hover:bg-purple-100",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      hover: "group-hover:bg-amber-100",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-100",
      iconBg: "bg-green-100",
      iconText: "text-green-600",
      hover: "group-hover:bg-green-100",
    },
  }

  const scheme = colorSchemes[color]

  return (
    <Card className={`border ${scheme.border} overflow-hidden transition-all duration-200 hover:shadow-md group`}>
      <CardHeader className={`pb-2 ${scheme.bg} transition-colors duration-200 ${scheme.hover}`}>
        <div className="flex items-center space-x-3">
          <div className={`h-10 w-10 rounded-full ${scheme.iconBg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${scheme.iconText}`} />
          </div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 text-sm text-gray-600">{description}</CardContent>
    </Card>
  )
}
