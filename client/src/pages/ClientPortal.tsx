"use client"

import type React from "react"

import DashboardLayout from "@/layouts/DashboardLayout"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  MessageSquare,
  Mail,
  Send,
  Download,
  Share2,
  Search,
  Plus,
  User,
  Building,
  Phone,
  AtSign,
  Calendar,
  Clock,
  Filter,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  FileSignature,
  Users,
  Bell,
  Paperclip,
  ExternalLink,
  Trash2,
  Edit,
  Eye,
  Shield,
  RefreshCw,
} from "lucide-react"
import type { Client } from "@shared/schema"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { queryClient } from "@/lib/queryClient"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Mock data for client activity
const clientActivities = [
  {
    id: 1,
    clientId: 1,
    type: "contract_signed",
    title: "Contract Signed",
    description: "Signed the NDA agreement",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 2,
    clientId: 2,
    type: "message_sent",
    title: "Message Sent",
    description: "Replied to your inquiry about the contract terms",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: 3,
    clientId: 3,
    type: "document_viewed",
    title: "Document Viewed",
    description: "Viewed the service agreement",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: 4,
    clientId: 1,
    type: "payment_received",
    title: "Payment Received",
    description: "Paid the invoice #INV-2023-042",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 5,
    clientId: 4,
    type: "contract_viewed",
    title: "Contract Viewed",
    description: "Viewed the consulting agreement",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26),
  },
]

// Helper function to format relative time
function formatRelativeTime(date: Date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "just now"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  return date.toLocaleDateString()
}

// Helper function to get activity icon
function getActivityIcon(type: string) {
  switch (type) {
    case "contract_signed":
      return <FileSignature className="h-4 w-4 text-emerald-500" />
    case "message_sent":
      return <MessageSquare className="h-4 w-4 text-blue-500" />
    case "document_viewed":
      return <Eye className="h-4 w-4 text-purple-500" />
    case "payment_received":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "contract_viewed":
      return <FileText className="h-4 w-4 text-amber-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

// Helper function to get contract status badge
function getContractStatusBadge(status: string) {
  switch (status) {
    case "signed":
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Signed
        </Badge>
      )
    case "certified":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
          <Shield className="h-3 w-3 mr-1" />
          Certified
        </Badge>
      )
    case "draft":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">
          <Edit className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
          <AlertCircle className="h-3 w-3 mr-1" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
  }
}

export default function ClientPortal() {
  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ["/api/clients"],
    staleTime: 60000, // 1 minute
  })

  // Fetch contracts to display them
  const { data: contracts = [], isLoading: contractsLoading } = useQuery<any[]>({
    queryKey: ["/api/contracts/recent"],
    staleTime: 60000, // 1 minute
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [messageText, setMessageText] = useState("")
  const [messageSubject, setMessageSubject] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const { toast } = useToast()

  // Filter clients based on search term
  const filteredClients = clients.filter((client: Client) => {
    if (!searchTerm) return true

    const search = searchTerm.toLowerCase()
    return (
      client.name.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search) ||
      (client.company && client.company.toLowerCase().includes(search))
    )
  })

  // Set selected client when clients load
  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0])
    }
  }, [clients, selectedClient])

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientName || !clientEmail) {
      toast({
        title: "Missing information",
        description: "Please provide at least name and email for the client",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await apiRequest("POST", "/api/clients", {
        name: clientName,
        email: clientEmail,
        company: clientCompany,
        phone: clientPhone,
      })

      // Reset form
      setClientName("")
      setClientEmail("")
      setClientCompany("")
      setClientPhone("")

      // Close modal
      setIsModalOpen(false)

      // Show success message
      toast({
        title: "Client added",
        description: "The client has been added successfully",
      })

      // Refresh client list
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] })
    } catch (error) {
      console.error("Error adding client:", error)
      toast({
        title: "Failed to add client",
        description: "There was an error adding the client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendMessage = () => {
    if (!selectedClient || !messageSubject || !messageText) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // In a real app, this would send the message via API
    toast({
      title: "Message sent",
      description: `Your message has been sent to ${selectedClient.name}`,
    })

    // Reset form
    setMessageSubject("")
    setMessageText("")
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 md:px-8">
        {/* Header with background */}
        <div className="relative mb-8 rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dv98v8ht5/image/upload/v1746872141/fbshymceaf7nnscrdvxb.png')] opacity-90"></div>
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="800" height="800" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-urbanist text-3xl font-bold">Client Portal</h1>
              <p className="mt-1 text-primary-100">Manage your clients and their contracts in one place</p>
            </div>

            <div className="mt-4 flex space-x-3 md:mt-0">
              <Button
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/20"
                onClick={() => (window.location.href = "/contracts/create")}
              >
                <FileText className="mr-2 h-4 w-4" />
                New Contract
              </Button>

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 text-primary-700 hover:bg-white/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-urbanist text-xl">Add New Client</DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleAddClient} className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-name" className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-500" />
                        Name
                      </Label>
                      <Input
                        id="client-name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Enter client name"
                        required
                        className="border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client-email" className="flex items-center">
                        <AtSign className="mr-2 h-4 w-4 text-gray-500" />
                        Email
                      </Label>
                      <Input
                        id="client-email"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="client@example.com"
                        required
                        className="border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client-company" className="flex items-center">
                        <Building className="mr-2 h-4 w-4 text-gray-500" />
                        Company (Optional)
                      </Label>
                      <Input
                        id="client-company"
                        value={clientCompany}
                        onChange={(e) => setClientCompany(e.target.value)}
                        placeholder="Company name"
                        className="border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client-phone" className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-500" />
                        Phone (Optional)
                      </Label>
                      <Input
                        id="client-phone"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="border-gray-300"
                      />
                    </div>

                    <DialogFooter className="mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-primary-600 hover:bg-primary-700" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </span>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Client
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="rounded-full bg-white/20 p-2">
                  <Users className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-primary-100">Total Clients</p>
                  <p className="text-2xl font-bold">{clients.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="rounded-full bg-white/20 p-2">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-primary-100">Active Contracts</p>
                  <p className="text-2xl font-bold">{contracts.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="rounded-full bg-white/20 p-2">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-primary-100">Unread Messages</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="rounded-full bg-white/20 p-2">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-primary-100">Pending Actions</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and filter bar */}
        <div className="mb-6 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search clients by name, email or company..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className={viewMode === "grid" ? "bg-gray-100" : ""}
              onClick={() => setViewMode("grid")}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <path
                  d="M1.5 1H6.5V6H1.5V1ZM8.5 1H13.5V6H8.5V1ZM1.5 8H6.5V13H1.5V8ZM8.5 8H13.5V13H8.5V8Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={viewMode === "list" ? "bg-gray-100" : ""}
              onClick={() => setViewMode("list")}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <path d="M1.5 3H13.5M1.5 7.5H13.5M1.5 12H13.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </Button>

            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-3.5 w-3.5" />
              Filter
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 h-3.5 w-3.5"
                  >
                    <path d="M1.5 3.5H13.5M4.5 7.5H13.5M7.5 11.5H13.5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                <DropdownMenuItem>Name (Z-A)</DropdownMenuItem>
                <DropdownMenuItem>Company (A-Z)</DropdownMenuItem>
                <DropdownMenuItem>Recently Added</DropdownMenuItem>
                <DropdownMenuItem>Most Active</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="contracts" className="w-full">
            <TabsList className="mb-6 w-full justify-start rounded-lg bg-gray-100 p-1">
              <TabsTrigger
                value="contracts"
                className="flex items-center gap-1 rounded-md data-[state=active]:bg-white"
              >
                <FileText className="h-4 w-4" />
                <span>Contracts</span>
              </TabsTrigger>
              <TabsTrigger
                value="communications"
                className="flex items-center gap-1 rounded-md data-[state=active]:bg-white"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Communications</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-1 rounded-md data-[state=active]:bg-white">
                <Bell className="h-4 w-4" />
                <span>Activity</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contracts" className="mt-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Contracts</h2>
                <Button variant="outline" size="sm" onClick={() => (window.location.href = "/contracts")}>
                  View All Contracts
                </Button>
              </div>

              {contractsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="h-40 animate-pulse rounded-lg bg-gray-200"></div>
                    ))}
                </div>
              ) : contracts && contracts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {contracts.map((contract: any) => (
                    <Card key={contract.id} className="group overflow-hidden transition-all hover:shadow-md">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="font-urbanist text-lg truncate">{contract.title}</CardTitle>
                          {getContractStatusBadge(contract.status)}
                        </div>
                        <CardDescription className="flex items-center text-sm text-gray-500">
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          Created on {new Date(contract.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pb-2">
                        <div className="flex items-center space-x-2 mb-3">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
                              {contract.clientName ? contract.clientName.charAt(0).toUpperCase() : "C"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{contract.clientName || "Client Name"}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {contract.tags &&
                            contract.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="bg-gray-50">
                                {tag}
                              </Badge>
                            ))}
                          {!contract.tags && (
                            <>
                              <Badge variant="outline" className="bg-gray-50">
                                Legal
                              </Badge>
                              <Badge variant="outline" className="bg-gray-50">
                                Agreement
                              </Badge>
                            </>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="border-t bg-gray-50 p-3">
                        <div className="flex w-full justify-between">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-gray-600 hover:text-primary-600"
                            onClick={() => window.open(`/contracts/edit/${contract.id}`, "_blank")}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                          </Button>

                          <div className="flex space-x-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-600">
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Download</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-600">
                                    <Share2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Share</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-600">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileSignature className="mr-2 h-4 w-4" />
                                  <span>Sign</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Shield className="mr-2 h-4 w-4" />
                                  <span>Verify</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mt-4 font-urbanist text-lg font-medium text-gray-900">No contracts found</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                    Get started by creating your first contract. You can create contracts for your clients and track
                    their status.
                  </p>
                  <Button
                    onClick={() => (window.location.href = "/contracts")}
                    className="mt-4 bg-primary-600 text-white hover:bg-primary-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Contract
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="communications" className="mt-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Client Communications</h2>
                <Button variant="outline" size="sm" onClick={() => (window.location.href = "/messages")}>
                  View All Messages
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Messages Column */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5 text-primary-500" />
                      Recent Messages
                    </CardTitle>
                    <CardDescription>Your latest conversations with clients</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[320px]">
                      <div className="px-6">
                        {clients && clients.length > 0 ? (
                          clients.slice(0, 5).map((client: Client, index) => (
                            <div key={index} className={`py-4 ${index !== 0 ? "border-t border-gray-100" : ""}`}>
                              <div className="flex items-start gap-3 mb-2">
                                <Avatar className="h-10 w-10 border border-gray-200">
                                  <AvatarFallback className="bg-primary-100 text-primary-700">
                                    {client.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{client.name}</h4>
                                    <span className="text-xs text-gray-500">2h ago</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-1">{client.company || "Individual Client"}</p>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    Thank you for sending the contract. I've reviewed the terms and have a few questions
                                    about the payment schedule and deliverables...
                                  </p>
                                </div>
                              </div>
                              <div className="flex justify-end mt-2">
                                <Button size="sm" variant="outline" className="h-8 text-xs">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12">
                            <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                            <h3 className="text-gray-500 font-medium mb-1">No messages</h3>
                            <p className="text-gray-400 text-sm text-center max-w-xs">
                              Start a conversation with a client to see messages here
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Message Interface Column */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Send className="mr-2 h-5 w-5 text-primary-500" />
                      Send New Message
                    </CardTitle>
                    <CardDescription>Communicate directly with your clients</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient" className="flex items-center text-sm">
                          <User className="mr-2 h-4 w-4 text-gray-500" />
                          Recipient
                        </Label>
                        <select
                          id="recipient"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                          value={selectedClient?.id || ""}
                          onChange={(e) => {
                            const client = clients.find((c: Client) => c.id === e.target.value)
                            setSelectedClient(client || null)
                          }}
                        >
                          <option value="">Select a client</option>
                          {clients &&
                            clients.map((client: Client) => (
                              <option key={client.id} value={client.id}>
                                {client.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="flex items-center text-sm">
                          <FileText className="mr-2 h-4 w-4 text-gray-500" />
                          Subject
                        </Label>
                        <Input
                          id="subject"
                          placeholder="Enter message subject"
                          value={messageSubject}
                          onChange={(e) => setMessageSubject(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="flex items-center text-sm">
                          <MessageSquare className="mr-2 h-4 w-4 text-gray-500" />
                          Message
                        </Label>
                        <textarea
                          id="message"
                          className="min-h-[120px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="Type your message here..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                        ></textarea>
                      </div>

                      <div className="flex space-x-2">
                        <Button className="flex-1" variant="outline">
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attach Files
                        </Button>
                        <Button
                          className="flex-1 bg-primary-600 hover:bg-primary-700"
                          onClick={handleSendMessage}
                          disabled={!selectedClient || !messageSubject || !messageText}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <Button variant="outline" size="sm">
                  View All Activity
                </Button>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Bell className="mr-2 h-5 w-5 text-primary-500" />
                    Client Activity Timeline
                  </CardTitle>
                  <CardDescription>Track all client interactions and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-gray-200">
                    {clientActivities.map((activity, index) => (
                      <div key={activity.id} className="mb-6 last:mb-0">
                        <div className="absolute -left-[5px] top-0 h-3 w-3 rounded-full bg-primary-500 ring-2 ring-white" />
                        <div className="flex items-start">
                          <div className="mr-3 rounded-full bg-primary-50 p-1.5">{getActivityIcon(activity.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{activity.title}</h4>
                              <span className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)}</span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{activity.description}</p>

                            {/* Client info */}
                            <div className="mt-2 flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                  {clients
                                    .find((c: Client) => c.id === activity.clientId)
                                    ?.name.charAt(0)
                                    .toUpperCase() || "C"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-500">
                                {clients.find((c: Client) => c.id === activity.clientId)?.name || "Client"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Clients Section */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Clients</h2>
          <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        {clientsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-lg bg-gray-200"></div>
              ))}
          </div>
        ) : filteredClients && filteredClients.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client: Client) => (
                <Card key={client.id} className="group overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent h-24" />
                      <div className="p-6">
                        <div className="mb-4 flex items-center">
                          <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-primary-100 text-primary-700 text-lg">
                              {client.name ? client.name.charAt(0).toUpperCase() : "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <h3 className="font-urbanist text-lg font-semibold">{client.name}</h3>
                            {client.company && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Building className="mr-1 h-3.5 w-3.5" />
                                <span>{client.company}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Mail className="mr-2 h-4 w-4 text-gray-400" />
                            <span>{client.email}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center text-gray-600">
                              <Phone className="mr-2 h-4 w-4 text-gray-400" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <FileText className="mr-1 h-3 w-3" />3 Contracts
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="border-t bg-gray-50 p-3">
                      <div className="flex justify-between">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-gray-600 hover:text-primary-600"
                          onClick={() => (window.location.href = `/clients/${client.id}`)}
                        >
                          <User className="mr-1 h-3.5 w-3.5" />
                          View Profile
                        </Button>

                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-600"
                            onClick={() => {
                              setSelectedClient(client)
                              document.querySelector('[data-state="inactive"][value="communications"]')?.click()
                            }}
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-600">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>New Contract</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit Client</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredClients.map((client: Client, index) => (
                    <div key={client.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary-100 text-primary-700">
                            {client.name ? client.name.charAt(0).toUpperCase() : "C"}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <h3 className="font-medium">{client.name}</h3>
                          {client.company && <p className="text-sm text-gray-500">{client.company}</p>}
                        </div>
                      </div>

                      <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="mr-1.5 h-4 w-4 text-gray-400" />
                          <span>{client.email}</span>
                        </div>

                        {client.phone && (
                          <div className="flex items-center">
                            <Phone className="mr-1.5 h-4 w-4 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs"
                          onClick={() => (window.location.href = `/clients/${client.id}`)}
                        >
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              <span>New Contract</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              <span>Message</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 font-urbanist text-lg font-medium text-gray-900">No clients found</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              {searchTerm
                ? `No clients match your search for "${searchTerm}". Try a different search term or clear the search.`
                : "Get started by adding your first client. You can manage their contracts and communications in one place."}
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 bg-primary-600 text-white hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
