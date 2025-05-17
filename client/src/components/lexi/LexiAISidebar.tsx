"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  ChevronRight,
  Search,
  BookOpen,
  FileText,
  Copy,
  Mic,
  AlertCircle,
  Check,
  Lightbulb,
  PanelRight,
  Shield,
  FileEdit,
  Zap,
  Brain,
  Scale,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  Minimize2,
  BarChart,
  Bookmark,
  Share2,
  HelpCircle,
  Paperclip,
  ImageIcon,
  Loader2,
  Plus,
} from "lucide-react"
import type { AIMessage } from "@shared/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useLexiAI } from "@/context/LexiAIContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Define types for the Lexi AI Sidebar
interface LexiAISidebarProps {
  isOpen: boolean
  onClose: () => void
  highlightedText?: string
  currentClause?: string
  contractTitle?: string
  contractType?: string
}

interface LexiSuggestion {
  id: string
  type: "tip" | "warning" | "insight" | "recommendation"
  content: string
  action?: string
}

interface ClauseLibraryItem {
  id: string
  title: string
  category: string
  tags: string[]
  preview: string
}

export default function LexiAISidebar({
  isOpen,
  onClose,
  highlightedText,
  currentClause,
  contractTitle,
  contractType = "Service Agreement",
}: LexiAISidebarProps) {
  const { aiBrain, userHistory, addToUserHistory } = useLexiAI()
  const [activeTab, setActiveTab] = useState("suggestions")
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "assistant",
      content:
        "How can I assist with your contract today? As Lexi AI, I can help with clauses, explain legal terms, or suggest improvements.",
      timestamp: new Date().toISOString(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showClauseLibrary, setShowClauseLibrary] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [showAttachOptions, setShowAttachOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Mock data for suggestions (based on the screenshot)
  const [suggestions, setSuggestions] = useState<LexiSuggestion[]>([
    {
      id: "1",
      type: "insight",
      content: "Contract Basics",
      action: "Learn More",
    },
    {
      id: "2",
      type: "insight",
      content: "What makes a contract legally binding in India?",
      action: "Learn More",
    },
    {
      id: "3",
      type: "insight",
      content: "Essential elements of a valid contract",
      action: "Learn More",
    },
    {
      id: "4",
      type: "insight",
      content: "Contract termination clauses",
      action: "Learn More",
    },
    {
      id: "5",
      type: "insight",
      content: "Employment Law",
      action: "Learn More",
    },
    {
      id: "6",
      type: "insight",
      content: "Standard notice period in India",
      action: "Learn More",
    },
    {
      id: "7",
      type: "insight",
      content: "Non-compete clauses enforceability",
      action: "Learn More",
    },
    {
      id: "8",
      type: "insight",
      content: "Mandatory employment benefits",
      action: "Learn More",
    },
  ])

  // Mock data for clause library
  const [clauseLibrary, setClauseLibrary] = useState<ClauseLibraryItem[]>([
    {
      id: "cl1",
      title: "Force Majeure",
      category: "Standard",
      tags: ["risk mitigation", "compliance"],
      preview:
        "Neither party shall be liable for any failure of or delay in performance of its obligations under this Agreement to the extent such failure or delay is due to circumstances beyond its reasonable control, including, without limitation, acts of God, acts of a public enemy, fires, floods, power outages, wars, civil disturbances, epidemics, pandemics, or quarantines.",
    },
    {
      id: "cl2",
      title: "Confidentiality",
      category: "Standard",
      tags: ["protection", "disclosure"],
      preview:
        "Each party agrees to maintain the confidentiality of all proprietary information received from the other party. 'Confidential Information' means any information disclosed by one party to the other, either directly or indirectly, in writing, orally or by inspection of tangible objects, which is designated as 'Confidential,' 'Proprietary' or some similar designation.",
    },
    {
      id: "cl3",
      title: "Stamp Duty (India)",
      category: "Indian Law",
      tags: ["tax", "compliance"],
      preview:
        "This Agreement shall be duly stamped as per the applicable Stamp Act of the relevant state in India where this Agreement is executed. The parties agree that the stamp duty payable on this Agreement shall be borne by [PARTY NAME].",
    },
    {
      id: "cl4",
      title: "Arbitration (India)",
      category: "Indian Law",
      tags: ["dispute", "resolution"],
      preview:
        "All disputes arising out of or in connection with this Agreement shall be finally settled by arbitration in accordance with the Arbitration and Conciliation Act, 1996 of India. The arbitration shall be conducted by a sole arbitrator appointed by mutual consent of the parties. The seat of arbitration shall be [CITY], India. The language of arbitration shall be English.",
    },
    {
      id: "cl5",
      title: "GST Compliance",
      category: "Indian Law",
      tags: ["tax", "compliance"],
      preview:
        "The parties agree to comply with all applicable GST laws and regulations in India. The recipient of any taxable supply under this Agreement agrees to pay to the supplier an amount equal to the GST payable on the taxable supply at the same time as the consideration for the taxable supply is to be provided.",
    },
  ])

  // Filtered clause library based on search
  const filteredLibrary =
    query.trim() === ""
      ? clauseLibrary
      : clauseLibrary.filter(
          (clause) =>
            clause.title.toLowerCase().includes(query.toLowerCase()) ||
            clause.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())) ||
            clause.category.toLowerCase().includes(query.toLowerCase()),
        )

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Update suggestions based on highlighted text
  useEffect(() => {
    if (highlightedText) {
      setActiveTab("ask")
      setQuery(highlightedText)
    }
  }, [highlightedText])

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copiedIndex !== null) {
      const timer = setTimeout(() => {
        setCopiedIndex(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedIndex])

  // Handle sending a message
  const handleSendMessage = () => {
    if (!query.trim()) return

    // Store the query for processing
    const userQueryText = query

    // Add user message
    const userMessage: AIMessage = {
      role: "user",
      content: userQueryText,
      timestamp: new Date().toISOString(),
    }

    // Save to user history if it might contain useful data
    if (userQueryText.toLowerCase().includes("clause") || userQueryText.toLowerCase().includes("contract")) {
      if (contractType) {
        addToUserHistory({
          frequentContractTypes: [contractType],
        })
      }

      // If this is a query about a specific type of clause, store it
      if (
        userQueryText.toLowerCase().includes("payment") ||
        userQueryText.toLowerCase().includes("confidentiality") ||
        userQueryText.toLowerCase().includes("termination") ||
        userQueryText.toLowerCase().includes("intellectual property")
      ) {
        addToUserHistory({
          recentClauseFormats: [userQueryText],
        })
      }
    }

    setMessages((prev) => [...prev, userMessage])
    setQuery("")
    setIsTyping(true)
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      let response = ""

      // Apply the AI brain's knowledge based on the tone and personality rules
      if (
        userQueryText.toLowerCase().includes("jurisdiction") ||
        userQueryText.toLowerCase().includes("governing law")
      ) {
        response = `For contracts in India, a jurisdiction clause should specify both the governing law (typically Indian law) and the specific courts that have jurisdiction (e.g., 'Courts in Mumbai'). This is critical for enforcement under the Indian Contract Act, 1872.`
      } else if (userQueryText.toLowerCase().includes("confidential") || userQueryText.toLowerCase().includes("nda")) {
        response = `Your confidentiality clause should define what constitutes confidential information, specify permitted disclosures, include standard exceptions, and set a reasonable survival period (typically 3-5 years for business information in India).`
      } else if (currentClause && currentClause.toLowerCase().includes("payment")) {
        response = `I notice you're working on a payment clause. Consider adding specific details about:\n\n1) Payment timeline (net 30/15)\n2) Accepted payment methods\n3) Late payment penalties (as allowed under Indian law)\n4) Currency specifications\n\nThis ensures clarity and enforceability under Section 73 of the Indian Contract Act.`
      } else if (
        userQueryText.toLowerCase().includes("medical") ||
        userQueryText.toLowerCase().includes("religious") ||
        userQueryText.toLowerCase().includes("political")
      ) {
        response = `${aiBrain.restrictions[0]} As Lexi AI, I'm designed to assist specifically with legal and contract-related questions for Indian law. Please let me know how I can help with your contract needs.`
      } else {
        // Default module: Contract Builder / Clause Generator
        response = `Based on your ${
          contractType || "contract"
        } and context, I recommend reviewing the clause for compliance with Indian Contract Act requirements. Ensure there is clear consensus ad idem (meeting of minds) on all material terms, and that obligations are precisely defined to avoid ambiguity.`
      }

      const assistantMessage: AIMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
      setIsLoading(false)
    }, 1500)
  }

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle voice input
  const handleVoiceInput = () => {
    setIsRecording(true)
    // Simulate voice recording and conversion
    setTimeout(() => {
      setQuery("Add a dispute resolution clause for Indian jurisdiction")
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

  // Insert clause into document
  const handleInsertClause = (clause: ClauseLibraryItem) => {
    // In a real app, this would insert the clause into the document
    // For now, we'll just add it to the chat
    setQuery(`Insert the following clause: ${clause.title}`)
    setShowClauseLibrary(false)
    setActiveTab("ask")
  }

  // UI for different suggestion types
  const getSuggestionIcon = (type: string): { icon: typeof AlertCircle; color: string } => {
    switch (type) {
      case "warning":
        return { icon: AlertCircle, color: "text-amber-500" }
      case "insight":
        return { icon: Lightbulb, color: "text-blue-500" }
      case "tip":
        return { icon: Sparkles, color: "text-indigo-500" }
      case "recommendation":
        return { icon: Check, color: "text-emerald-500" }
      default:
        return { icon: MessageSquare, color: "text-gray-500" }
    }
  }

  // Get the document summary
  const getDocumentSummary = () => {
    return {
      title: contractTitle || "Service Agreement",
      partyCount: 2,
      clauses: 8,
      missingClauses: ["Jurisdiction", "Force Majeure"],
      riskLevel: "Medium",
      completeness: 75,
      keyPoints: [
        "Payment terms: 30 days from invoice",
        "IP ownership defined for deliverables",
        "Termination requires 30 days notice",
      ],
    }
  }

  const summary = getDocumentSummary()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop overlay with blur effect */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Fix 2: Ensure the sidebar has proper z-index and scrolling */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full bg-white shadow-lg border-l border-gray-200 z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out transform",
          isExpanded ? "w-[450px]" : "w-[400px]",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-3 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5">
              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Lexi AI</h3>
                <div className="flex items-center">
                  <Badge
                    variant="outline"
                    className="px-1 py-0 text-[10px] h-4 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    BETA
                  </Badge>
                  <span className="ml-1 text-[10px] text-gray-500">v1.2.0</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:bg-gray-100 h-7 w-7"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{isExpanded ? "Collapse" : "Expand"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100 h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-white flex-shrink-0">
            <div className="relative">
              <div
                className={cn(
                  "flex items-center border rounded-md transition-all",
                  isSearchFocused ? "border-blue-300 ring-2 ring-blue-100 bg-white" : "border-blue-100 bg-blue-50",
                )}
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={aiBrain.placeholder_convention}
                  className="border-0 focus:ring-0 bg-transparent flex-1"
                  onKeyDown={handleKeyPress}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />

                <div className="flex items-center pr-2">
                  {query.trim() && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                      onClick={() => setQuery("")}
                      disabled={isTyping}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                          onClick={() => setShowAttachOptions(!showAttachOptions)}
                          disabled={isTyping}
                        >
                          <Paperclip className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Attach file</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "h-6 w-6 hover:bg-blue-100",
                            isRecording ? "text-red-500 animate-pulse" : "text-blue-600 hover:text-blue-700",
                          )}
                          onClick={handleVoiceInput}
                          disabled={isTyping}
                        >
                          <Mic className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{isRecording ? "Recording..." : "Voice input"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-6 w-6 text-blue-600 hover:bg-blue-100 hover:text-blue-700",
                      isLoading && "animate-pulse",
                    )}
                    onClick={handleSendMessage}
                    disabled={!query.trim() || isTyping}
                  >
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Attachment options dropdown */}
              {showAttachOptions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-10">
                  <div className="p-2 space-y-1">
                    <button className="flex items-center w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-gray-100">
                      <FileText className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Document</span>
                    </button>
                    <button className="flex items-center w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-gray-100">
                      <ImageIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Image</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 flex items-center mt-1">
              <Shield className="h-3 w-3 mr-1 inline-block" />
              <span>{aiBrain.legal_behavior.behaveAs}</span>
            </div>
          </div>

          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value)
              setShowClauseLibrary(false)
            }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="w-full px-3 pt-2 border-b border-gray-200 rounded-none bg-white p-0 h-auto justify-start flex-shrink-0">
              <TabsTrigger
                value="suggestions"
                className="px-3 py-1.5 text-sm rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:font-medium"
              >
                <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                Suggested Topics
              </TabsTrigger>
              <TabsTrigger
                value="ask"
                className="px-3 py-1.5 text-sm rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:font-medium"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                Lexi AI
              </TabsTrigger>
              <TabsTrigger
                value="document"
                className="px-3 py-1.5 text-sm rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:font-medium"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Document
              </TabsTrigger>
            </TabsList>

            {/* Suggestions Tab */}
            <TabsContent
              value="suggestions"
              className="flex-1 p-0 data-[state=active]:flex flex-col h-full overflow-hidden"
            >
              <div className="p-3 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Popular Topics</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-blue-600"
                    onClick={() => setShowClauseLibrary(true)}
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                    Clause Library
                  </Button>
                </div>
              </div>

              {showClauseLibrary ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 bg-blue-50 border-b border-blue-100 flex-shrink-0">
                    <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                      <BookOpen className="h-4 w-4 mr-1.5 text-blue-600" />
                      Clause Library
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search clauses..."
                        className="pl-9 bg-white border-blue-200"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Fix 6: Ensure ScrollArea takes remaining height */}
                  <ScrollArea className="flex-1 h-full">
                    <div className="p-3 space-y-3">
                      {filteredLibrary.length > 0 ? (
                        filteredLibrary.map((clause) => (
                          <Card key={clause.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="p-3 pb-2 bg-gradient-to-r from-gray-50 to-white">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">{clause.title}</CardTitle>
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {clause.category}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {clause.tags.map((tag, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-[10px] px-1 py-0 h-4 bg-gray-50 text-gray-700 border-gray-200"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-2 text-xs text-gray-600 bg-white">
                              <div className="max-h-20 overflow-hidden relative">
                                <p>{clause.preview}</p>
                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
                              </div>
                            </CardContent>
                            <CardFooter className="p-2 border-t border-gray-100 bg-gray-50 flex justify-between">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-blue-600"
                                onClick={() => handleCopyMessage(0)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                onClick={() => handleInsertClause(clause)}
                              >
                                <FileEdit className="h-3 w-3 mr-1" />
                                Insert
                              </Button>
                            </CardFooter>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <Search className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500">No clauses found</p>
                          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <ScrollArea className="flex-1 h-full">
                  <div className="p-3 space-y-3">
                    {suggestions.map((suggestion) => {
                      const { icon: Icon, color } = getSuggestionIcon(suggestion.type)
                      return (
                        <Card
                          key={suggestion.id}
                          className="shadow-sm hover:shadow-md transition-shadow border-gray-200 overflow-hidden"
                        >
                          <CardContent className="p-0">
                            <div className="flex items-start">
                              <div
                                className={cn(
                                  "p-3 flex items-center justify-center",
                                  suggestion.type === "warning"
                                    ? "bg-amber-50"
                                    : suggestion.type === "insight"
                                      ? "bg-blue-50"
                                      : suggestion.type === "tip"
                                        ? "bg-indigo-50"
                                        : "bg-emerald-50",
                                )}
                              >
                                <Icon className={cn("h-4 w-4", color)} />
                              </div>
                              <div className="p-3 flex-1">
                                <p className="text-sm">{suggestion.content}</p>
                                {suggestion.action && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 text-xs h-7 w-full justify-between border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    onClick={() => {
                                      setQuery(suggestion.content)
                                      setActiveTab("ask")
                                    }}
                                  >
                                    {suggestion.action}
                                    <ChevronRight className="h-3 w-3 ml-1" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Ask Lexi Tab - Chat Interface */}
            <TabsContent value="ask" className="flex-1 p-0 data-[state=active]:flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-4 bg-gray-50 h-full">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      onMouseEnter={() => setSelectedMessage(index)}
                      onMouseLeave={() => setSelectedMessage(null)}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 mr-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/ai-assistant-concept.png" />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              <Sparkles className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}

                      <div
                        className={`relative max-w-[85%] rounded-lg p-3 group ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-200 shadow-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs opacity-70">
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
                                        <Check className="h-3 w-3 text-green-500" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
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
                                      <ThumbsUp className="h-3 w-3" />
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
                                      <ThumbsDown className="h-3 w-3" />
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
                        <div className="flex-shrink-0 ml-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/user-profile-illustration.png" />
                            <AvatarFallback className="bg-blue-600 text-white">U</AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex-shrink-0 mr-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/ai-assistant-concept.png" />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            <Sparkles className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[85%] shadow-sm">
                        <div className="flex space-x-1">
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

                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
                {/* Quick question suggestions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    className="text-xs px-2 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-700 transition-colors flex items-center"
                    onClick={() => setQuery(aiBrain.core_modules.clauseExplainer.capabilities[0])}
                    disabled={isTyping}
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    Explain clause
                  </button>
                  <button
                    className="text-xs px-2 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-700 transition-colors flex items-center"
                    onClick={() => setQuery("Is this clause enforceable in Indian law?")}
                    disabled={isTyping}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Check compliance
                  </button>
                  <button
                    className="text-xs px-2 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-700 transition-colors flex items-center"
                    onClick={() => setQuery("Suggest improvements to this clause based on Indian contract law")}
                    disabled={isTyping}
                  >
                    <FileEdit className="h-3 w-3 mr-1" />
                    Enhance clause
                  </button>
                  <button
                    className="text-xs px-2 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-700 transition-colors flex items-center"
                    onClick={() => setQuery("Draft a force majeure clause for Indian jurisdiction")}
                    disabled={isTyping}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Draft clause
                  </button>
                </div>
                {contractType && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <FileText className="h-3 w-3 mr-1 text-gray-400" />
                    Contract type: <span className="text-blue-600 font-medium ml-1">{contractType}</span>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Document Tab */}
            <TabsContent value="document" className="flex-1 p-0 data-[state=active]:flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 h-full">
                <div className="p-4 space-y-4">
                  <Card className="border-gray-200 overflow-hidden">
                    <CardHeader className="p-4 pb-3 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-md flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-600" />
                          Document Analysis
                        </CardTitle>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {summary.riskLevel} Risk
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {summary.title} • {summary.clauses} clauses
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-700">Completeness</h4>
                          <span className="text-sm text-blue-600">{summary.completeness}%</span>
                        </div>
                        <Progress
                          value={summary.completeness}
                          className="h-2"
                          indicatorClassName={cn(
                            summary.completeness < 50
                              ? "bg-red-500"
                              : summary.completeness < 80
                                ? "bg-amber-500"
                                : "bg-green-500",
                          )}
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Missing Clauses</h4>
                        <div className="space-y-1">
                          {summary.missingClauses.map((clause, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 bg-amber-50 border border-amber-100 rounded-md"
                            >
                              <div className="flex items-center">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-2" />
                                <span className="text-sm text-amber-800">{clause}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-amber-700 hover:bg-amber-100"
                                onClick={() => {
                                  setQuery(`Draft a ${clause.toLowerCase()} clause for ${contractType}`)
                                  setActiveTab("ask")
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Key Points</h4>
                        <ul className="space-y-1">
                          {summary.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start text-sm">
                              <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-2">
                                <Check className="h-3 w-3" />
                              </div>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full mt-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onClick={() => {
                          setQuery("Provide a comprehensive analysis of this contract")
                          setActiveTab("ask")
                        }}
                      >
                        <BarChart className="h-4 w-4 mr-2" />
                        Full Analysis
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200">
                    <CardHeader className="p-4 pb-3 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100">
                      <CardTitle className="text-md flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-indigo-600" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start p-3 bg-indigo-50 border border-indigo-100 rounded-md">
                          <div className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-2">
                            <Scale className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-indigo-900 font-medium">Strengthen Liability Clause</p>
                            <p className="text-xs text-indigo-700 mt-1">
                              Your liability clause lacks specific monetary caps. Consider adding clear financial
                              limits.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 h-7 text-xs border-indigo-200 bg-indigo-100/50 text-indigo-700 hover:bg-indigo-100"
                              onClick={() => {
                                setQuery("Suggest a stronger liability clause with monetary caps")
                                setActiveTab("ask")
                              }}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Improve Clause
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-start p-3 bg-green-50 border border-green-100 rounded-md">
                          <div className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-2">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-green-900 font-medium">Well-Defined Payment Terms</p>
                            <p className="text-xs text-green-700 mt-1">
                              Your payment terms are clearly defined and include all necessary details.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
          <div className="flex items-center">
            <span>Powered by Lexi AI</span>
            <span className="mx-2">•</span>
            <button className="text-blue-600 hover:underline flex items-center">
              <HelpCircle className="h-3 w-3 mr-1" />
              Help
            </button>
          </div>
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Share</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
                    <Bookmark className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Save</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
                    <PanelRight className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Dock sidebar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </>
  )
}
