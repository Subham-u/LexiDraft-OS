"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { AIMessage } from "@shared/schema"
import {
  Sparkles,
  SendHorizontal,
  UserIcon,
  MessageSquare,
  Lightbulb,
  Scale,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Loader2,
  PanelRight,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Link } from "wouter"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LexiAI() {
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm Lexi, your AI legal assistant. How can I help you with your contracts today?",
      timestamp: new Date().toISOString(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState("contracts")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestedQuestions = {
    contracts: [
      "What are the key components of an NDA?",
      "Explain arbitration clause in simple terms",
      "What's the standard notice period in India?",
      "How do I draft a force majeure clause?",
    ],
    employment: [
      "What are mandatory benefits in India?",
      "Explain probation period regulations",
      "How to draft a non-compete clause?",
      "Termination notice requirements",
    ],
    intellectual: [
      "Copyright protection in India",
      "Trademark registration process",
      "Patent filing requirements",
      "IP ownership in employment contracts",
    ],
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return

    // Add user message to chat
    const userMessage: AIMessage = {
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setPrompt("")
    setIsLoading(true)

    try {
      // Simulate response for demo purposes
      setTimeout(() => {
        let aiResponse = "I'm analyzing your question. "

        if (messageText.toLowerCase().includes("nda")) {
          aiResponse +=
            "The key components of an NDA typically include: definition of confidential information, scope of confidentiality obligation, exclusions from confidential information, term of the agreement, and remedies for breach. In India, NDAs are governed by the Indian Contract Act, 1872 and can be enforced through specific legal remedies."
        } else if (messageText.toLowerCase().includes("arbitration")) {
          aiResponse +=
            "An arbitration clause is an agreement to resolve disputes outside of courts through a neutral third party (arbitrator). In simple terms, it's a private dispute resolution process that's usually faster and more flexible than going to court. In India, the Arbitration and Conciliation Act, 1996 governs arbitration proceedings."
        } else if (messageText.toLowerCase().includes("notice period")) {
          aiResponse +=
            "The standard notice period in India varies by employment level and company policy. For most positions, it ranges from 1 to 3 months. For senior management roles, it can extend to 3-6 months. The notice period should be clearly specified in the employment contract and complies with the Industrial Employment (Standing Orders) Act where applicable."
        } else if (messageText.toLowerCase().includes("force majeure")) {
          aiResponse +=
            "To draft an effective force majeure clause for Indian contracts, clearly define what constitutes force majeure events (natural disasters, pandemics, etc.), specify the obligations during such events, include notification requirements, and outline the consequences (suspension of performance, termination rights). Ensure it complies with Section 56 of the Indian Contract Act."
        } else {
          aiResponse +=
            "I can provide legal guidance on contract creation, review contract terms, explain legal concepts in simple language, and help draft specific clauses suited to your needs. For specific legal questions regarding Indian law, I'm particularly well-versed in commercial contracts, employment law, and intellectual property regulations."
        }

        const assistantMessage: AIMessage = {
          role: "assistant",
          content: aiResponse,
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
      }, 1500)
    } catch (error) {
      console.error("Error getting AI response:", error)

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I wasn't able to process your request. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ])
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(prompt)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const handleSuggestedQuestion = (question: string) => {
    setPrompt(question)
    // Focus the input after setting the question
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  return (
    <Card className="border-gray-200 shadow-sm overflow-hidden">
      <CardHeader className="p-4 flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium">Lexi AI</CardTitle>
            <p className="text-xs text-gray-500">Your legal assistant</p>
          </div>
          {/* <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
            Beta
          </Badge> */}
        </div>
        <Link href="/lexi-ai">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            <PanelRight className="h-3.5 w-3.5" />
            Full View
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[320px] overflow-y-auto p-4 bg-gray-50">
          {/* Message display */}
          <div className="flex flex-col space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 mr-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                )}

                <div
                  className={`rounded-lg p-3 max-w-[85%] group relative ${
                    message.role === "user"
                      ? "bg-blue-500 text-white ml-auto"
                      : "bg-white border border-gray-200 shadow-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs opacity-70">{formatTimestamp(message.timestamp)}</span>

                    {message.role === "assistant" && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-500 hover:text-blue-600"
                                onClick={() => handleCopyToClipboard(message.content)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Copy to clipboard</p>
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
                            <TooltipContent>
                              <p className="text-xs">Helpful</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-red-600">
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Not helpful</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0 ml-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    <p className="text-sm text-gray-500">Lexi is thinking...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested questions section */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              Suggested Topics
            </h4>
            <Tabs defaultValue="contracts" className="w-full" onValueChange={(value) => setActiveCategory(value)}>
              <TabsList className="grid grid-cols-3 mb-2">
                <TabsTrigger value="contracts" className="text-xs">
                  <Scale className="h-3 w-3 mr-1" />
                  Contracts
                </TabsTrigger>
                <TabsTrigger value="employment" className="text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Employment
                </TabsTrigger>
                <TabsTrigger value="intellectual" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  IP Law
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 flex-wrap">
              {suggestedQuestions[activeCategory as keyof typeof suggestedQuestions].map((question, index) => (
                <button
                  key={index}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 rounded-full text-gray-700 transition-colors"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input section */}
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Ask Lexi about Indian contract law..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Lexi provides general legal information, not legal advice. Consult a qualified lawyer for specific
            situations.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
