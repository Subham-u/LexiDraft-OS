"use client"

import type React from "react"

import { useState } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { useQuery } from "@tanstack/react-query"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Contract } from "@shared/schema"
import NewContractWizard from "@/components/contracts/NewContractWizard"
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  FileEdit,
  Calendar,
  Users,
  MapPin,
  ChevronRight,
  ArrowUpDown,
  Star,
  StarOff,
  Eye,
  Download,
  Share2,
  MoreHorizontal,
  Sparkles,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Contracts() {
  const {
    data: contracts,
    isLoading,
    refetch,
  } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    staleTime: 10000, // 10 seconds
  })

  // Add contract wizard state
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [viewMode, setViewMode] = useState("grid")
  const [favoriteContracts, setFavoriteContracts] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Handle refreshing animation
  const handleRefresh = () => {
    setIsRefreshing(true)
    refetch().finally(() => {
      setTimeout(() => setIsRefreshing(false), 500)
    })
  }

  // Toggle favorite status
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFavoriteContracts((prev) => (prev.includes(id) ? prev.filter((contractId) => contractId !== id) : [...prev, id]))
  }

  const openContractModal = () => {
    setIsContractModalOpen(true)
  }

  const closeContractModal = () => {
    setIsContractModalOpen(false)
  }

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "signed":
        return "bg-[#D1FADF] text-[#12B76A] border-green-200"
      case "pending":
        return "bg-[#FEF0C7] text-[#F79009] border-amber-200"
      case "draft":
        return "bg-primary-100 text-primary-800 border-primary-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
        return <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
      case "pending":
        return <Clock className="h-3.5 w-3.5 mr-1.5" />
      case "draft":
        return <FileEdit className="h-3.5 w-3.5 mr-1.5" />
      default:
        return <FileText className="h-3.5 w-3.5 mr-1.5" />
    }
  }

  // Filter and sort contracts
  const filteredContracts = contracts
    ? contracts
        .filter((contract) => {
          // Filter by search query
          const matchesSearch = contract.title.toLowerCase().includes(searchQuery.toLowerCase())

          // Filter by status
          const matchesStatus = statusFilter === "all" || contract.status === statusFilter

          return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
          // Sort by selected option
          if (sortBy === "recent") {
            return (
              new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
            )
          } else if (sortBy === "oldest") {
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          } else if (sortBy === "alphabetical") {
            return a.title.localeCompare(b.title)
          } else if (sortBy === "favorites") {
            const aIsFavorite = favoriteContracts.includes(a.id)
            const bIsFavorite = favoriteContracts.includes(b.id)
            return bIsFavorite ? 1 : aIsFavorite ? -1 : 0
          }
          return 0
        })
    : []

  // Calculate contract completion percentage (mock function)
  const getCompletionPercentage = (contract: Contract) => {
    if (contract.status === "signed") return 100
    if (contract.status === "pending") return 80

    // For drafts, calculate based on filled fields
    const fieldsToCheck = ["title", "jurisdiction", "parties", "clauses", "description"]
    let filledFields = 0

    fieldsToCheck.forEach((field) => {
      if (contract[field as keyof Contract]) {
        filledFields++
      }
    })

    return Math.round((filledFields / fieldsToCheck.length) * 100)
  }

  // Format date in a more readable way
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 1) return "Today"
    if (diffDays <= 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays} days ago`

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 md:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h1 className="font-urbanist text-2xl font-bold text-gray-900">My Contracts</h1>
              <p className="text-sm text-gray-500">Manage and track all your legal documents</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Refresh contracts</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={openContractModal}
              className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Create Contract
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search contracts..."
              className="pl-9 bg-white border-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-white border-gray-200">
                <div className="flex items-center">
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-gray-500" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 rounded-lg ${showFilters ? "bg-gray-100 border-gray-300" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>

            <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 px-3 rounded-none ${viewMode === "grid" ? "bg-gray-100" : "bg-white"}`}
                onClick={() => setViewMode("grid")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 px-3 rounded-none ${viewMode === "list" ? "bg-gray-100" : "bg-white"}`}
                onClick={() => setViewMode("list")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <line x1="3" x2="21" y1="6" y2="6" />
                  <line x1="3" x2="21" y1="12" y2="12" />
                  <line x1="3" x2="21" y1="18" y2="18" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Status filter tabs */}
        {showFilters && (
          <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Status</h3>
                <Tabs defaultValue={statusFilter} onValueChange={setStatusFilter} className="w-full">
                  <TabsList className="grid grid-cols-4 h-9">
                    <TabsTrigger value="all" className="text-xs">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="draft" className="text-xs">
                      <FileEdit className="h-3.5 w-3.5 mr-1.5" />
                      Drafts
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="signed" className="text-xs">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Signed
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Date</h3>
                <Select defaultValue="all-time">
                  <SelectTrigger className="w-full bg-white border-gray-200">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-3.5 w-3.5 text-gray-500" />
                      <SelectValue placeholder="Time period" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="all-time">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className={`animate-pulse rounded-lg bg-gray-200 ${viewMode === "grid" ? "h-64" : "h-24"}`}
                ></div>
              ))}
          </div>
        ) : filteredContracts && filteredContracts.length > 0 ? (
          <>
            {/* Stats summary */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{contracts?.length || 0}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Drafts</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {contracts?.filter((c) => c.status === "draft").length || 0}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <FileEdit className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {contracts?.filter((c) => c.status === "pending").length || 0}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Signed</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {contracts?.filter((c) => c.status === "signed").length || 0}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredContracts.map((contract: Contract) => {
                  const completionPercentage = getCompletionPercentage(contract)
                  const isFavorite = favoriteContracts.includes(contract.id)

                  return (
                    <Link key={contract.id} href={`/contracts/${contract.id}`}>
                      <Card className="h-full border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                        <div className="relative">
                          {/* Status indicator bar */}
                          <div
                            className={`absolute top-0 left-0 right-0 h-1 ${
                              contract.status === "signed"
                                ? "bg-green-500"
                                : contract.status === "pending"
                                  ? "bg-amber-500"
                                  : "bg-primary-500"
                            }`}
                          />

                          <CardContent className="p-6 pt-7">
                            <div className="mb-4 flex items-start justify-between">
                              <div>
                                <div className="flex items-center">
                                  <h3 className="font-urbanist text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                    {contract.title}
                                  </h3>
                                  <button
                                    onClick={(e) => toggleFavorite(contract.id, e)}
                                    className="ml-2 text-gray-400 hover:text-amber-500 transition-colors"
                                  >
                                    {isFavorite ? (
                                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    ) : (
                                      <StarOff className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`mt-2 flex w-fit items-center ${getStatusBadgeClasses(
                                    contract.status || "draft",
                                  )}`}
                                >
                                  {getStatusIcon(contract.status || "draft")}
                                  {contract.status
                                    ? contract.status.charAt(0).toUpperCase() + contract.status.slice(1)
                                    : "Draft"}
                                </Badge>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.preventDefault()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>View</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>Download</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    <span>Share</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      toggleFavorite(contract.id, e)
                                    }}
                                  >
                                    {isFavorite ? (
                                      <>
                                        <StarOff className="mr-2 h-4 w-4" />
                                        <span>Remove from favorites</span>
                                      </>
                                    ) : (
                                      <>
                                        <Star className="mr-2 h-4 w-4" />
                                        <span>Add to favorites</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="mb-4 space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                                <span>Jurisdiction: {contract.jurisdiction || "India"}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="mr-2 h-4 w-4 text-gray-400" />
                                <span>Parties: {Array.isArray(contract.parties) ? contract.parties.length : 0}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                <span>Updated: {formatDate(contract.updatedAt || contract.createdAt)}</span>
                              </div>
                            </div>

                            {/* Completion progress */}
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">Completion</span>
                                <span className="text-xs font-medium text-gray-700">{completionPercentage}%</span>
                              </div>
                              <Progress
                                value={completionPercentage}
                                className="h-1.5"
                                indicatorClassName={
                                  completionPercentage === 100
                                    ? "bg-green-500"
                                    : completionPercentage > 70
                                      ? "bg-primary-500"
                                      : "bg-amber-500"
                                }
                              />
                            </div>
                          </CardContent>

                          <CardFooter className="p-0 border-t border-gray-100">
                            <Button
                              variant="ghost"
                              className="w-full rounded-none h-10 text-primary-600 hover:text-primary-700 hover:bg-primary-50 flex items-center justify-center"
                            >
                              <span>View Details</span>
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </div>
                      </Card>
                    </Link>
                  )
                })}

                {/* Create contract card */}
                <Card
                  className="h-full border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center"
                  onClick={openContractModal}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                      <Plus className="h-6 w-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Create New Contract</h3>
                    <p className="mt-1 text-sm text-gray-500">Start drafting a new legal document</p>
                    {/* <Button className="mt-4 bg-primary-600 text-white hover:bg-primary-700">
                      <Plus className="mr-2 h-4 w-4" />
                      New Contract
                    </Button> */}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContracts.map((contract: Contract) => {
                  const completionPercentage = getCompletionPercentage(contract)
                  const isFavorite = favoriteContracts.includes(contract.id)

                  return (
                    <Link key={contract.id} href={`/contracts/${contract.id}`}>
                      <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div
                                className={`h-10 w-10 rounded-lg flex items-center justify-center
                                ${
                                  contract.status === "signed"
                                    ? "bg-green-100 text-green-600"
                                    : contract.status === "pending"
                                      ? "bg-amber-100 text-amber-600"
                                      : "bg-primary-100 text-primary-600"
                                }`}
                              >
                                {getStatusIcon(contract.status || "draft")}
                              </div>

                              <div>
                                <div className="flex items-center">
                                  <h3 className="font-urbanist text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                    {contract.title}
                                  </h3>
                                  <button
                                    onClick={(e) => toggleFavorite(contract.id, e)}
                                    className="ml-2 text-gray-400 hover:text-amber-500 transition-colors"
                                  >
                                    {isFavorite ? (
                                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    ) : (
                                      <StarOff className="h-4 w-4" />
                                    )}
                                  </button>
                                  <Badge
                                    variant="outline"
                                    className={`ml-3 flex w-fit items-center ${getStatusBadgeClasses(
                                      contract.status || "draft",
                                    )}`}
                                  >
                                    {contract.status
                                      ? contract.status.charAt(0).toUpperCase() + contract.status.slice(1)
                                      : "Draft"}
                                  </Badge>
                                </div>

                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <MapPin className="mr-1 h-3 w-3 text-gray-400" />
                                  <span>{contract.jurisdiction || "India"}</span>
                                  <span className="mx-2">•</span>
                                  <Users className="mr-1 h-3 w-3 text-gray-400" />
                                  <span>{Array.isArray(contract.parties) ? contract.parties.length : 0} parties</span>
                                  <span className="mx-2">•</span>
                                  <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                                  <span>{formatDate(contract.updatedAt || contract.createdAt)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <div className="hidden md:block w-24">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-500">Completion</span>
                                  <span className="text-xs font-medium text-gray-700">{completionPercentage}%</span>
                                </div>
                                <Progress
                                  value={completionPercentage}
                                  className="h-1.5"
                                  indicatorClassName={
                                    completionPercentage === 100
                                      ? "bg-green-500"
                                      : completionPercentage > 70
                                        ? "bg-primary-500"
                                        : "bg-amber-500"
                                  }
                                />
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={(e) => e.preventDefault()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>View</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>Download</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    <span>Share</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      toggleFavorite(contract.id, e)
                                    }}
                                  >
                                    {isFavorite ? (
                                      <>
                                        <StarOff className="mr-2 h-4 w-4" />
                                        <span>Remove from favorites</span>
                                      </>
                                    ) : (
                                      <>
                                        <Star className="mr-2 h-4 w-4" />
                                        <span>Add to favorites</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-primary-600"
                                onClick={(e) => e.preventDefault()}
                              >
                                <ChevronRight className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">No contracts found</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "No contracts match your search criteria. Try adjusting your filters."
                  : "Get started by creating your first contract to manage your legal documents."}
              </p>
              <Button
                onClick={openContractModal}
                className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700 gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Create Contract
              </Button>
            </CardContent>
          </Card>
        )}

        {/* New Contract Wizard */}
        {isContractModalOpen && <NewContractWizard isOpen={isContractModalOpen} onClose={closeContractModal} />}

        {/* AI Assistant Floating Button */}
        <div className="fixed bottom-6 right-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="h-14 w-14 rounded-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  <Sparkles className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-sm">Ask Lexi AI to help with contracts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </DashboardLayout>
  )
}
