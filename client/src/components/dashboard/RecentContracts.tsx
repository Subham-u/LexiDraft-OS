"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "wouter"
import type { ContractSummary } from "@/types"
import { formatDistanceToNow } from "date-fns"
import {
  Sparkles,
  BarChart3,
  Users,
  FilePlus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight,
  Shield,
  Zap,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

export default function RecentContracts() {
  const [selectedContract, setSelectedContract] = useState<ContractSummary | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Fetch recent contracts
  const { data: contracts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/contracts/recent"],
    staleTime: 60000, // 1 minute
  })

  // Filter contracts based on search query and status
  const filteredContracts = contracts.filter((contract: ContractSummary) => {
    const matchesSearch = contract.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || contract.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Define types for contract analysis
  interface ContractAnalysis {
    riskScore: number;
    completeness: number;
    issues: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    compliantWithIndianLaw: boolean;
    success: boolean;
  }
  
  // Fetch contract analysis from API when a contract is selected
  const { data: contractAnalysis, isLoading: isAnalysisLoading } = useQuery<ContractAnalysis>({
    queryKey: ['/api/contracts/analysis', selectedContract?.id],
    staleTime: 60000, // 1 minute
    enabled: !!selectedContract?.id && selectedContract.id !== undefined && !isNaN(parseInt(selectedContract.id.toString(), 10)),
    retry: false, // Don't retry if we get an error
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  })

  // Auto-select first contract if none selected
  useEffect(() => {
    if (contracts.length > 0 && !selectedContract) {
      setSelectedContract(contracts[0])
    }
  }, [contracts, selectedContract])

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "signed":
        return "bg-[#D1FADF] text-[#12B76A]"
      case "pending":
        return "bg-[#FEF0C7] text-[#F79009]"
      case "draft":
        return "bg-primary-100 text-primary-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
        return <CheckCircle className="h-3 w-3 mr-1" />
      case "pending":
        return <Clock className="h-3 w-3 mr-1" />
      case "draft":
        return <FileText className="h-3 w-3 mr-1" />
      default:
        return <FileText className="h-3 w-3 mr-1" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return `Updated ${formatDistanceToNow(new Date(dateString), { addSuffix: true })}`
    } catch (error) {
      return "Recently updated"
    }
  }

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-green-600"
    if (score < 70) return "text-amber-600"
    return "text-red-600"
  }

  const getRiskLevel = (score: number) => {
    if (score < 30) return "Low Risk"
    if (score < 70) return "Medium Risk"
    return "High Risk"
  }

  return (
    <div className="lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-urbanist text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary-600" />
          Recent Contracts
        </h2>
        <Link
          href="/contracts"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center"
        >
          View all <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card className="overflow-hidden border-gray-200">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center">
                  Your Documents
                  <Badge variant="outline" className="ml-2 bg-primary-50 text-primary-700 border-primary-200">
                    {contracts.length}
                  </Badge>
                </CardTitle>
                <Button variant="default" size="sm" className="gap-1">
                  <FilePlus className="h-4 w-4" />
                  New Contract
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search contracts..."
                    className="pl-9 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? "bg-gray-100" : ""}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {showFilters && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={`cursor-pointer hover:bg-gray-100 ${
                      filterStatus === "all" ? "bg-gray-100 border-gray-300" : "bg-white"
                    }`}
                    onClick={() => setFilterStatus("all")}
                  >
                    All
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`cursor-pointer hover:bg-primary-50 ${
                      filterStatus === "draft" ? "bg-primary-50 border-primary-200" : "bg-white"
                    }`}
                    onClick={() => setFilterStatus("draft")}
                  >
                    <FileText className="h-3 w-3 mr-1" /> Drafts
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`cursor-pointer hover:bg-amber-50 ${
                      filterStatus === "pending" ? "bg-amber-50 border-amber-200" : "bg-white"
                    }`}
                    onClick={() => setFilterStatus("pending")}
                  >
                    <Clock className="h-3 w-3 mr-1" /> Pending
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`cursor-pointer hover:bg-green-50 ${
                      filterStatus === "signed" ? "bg-green-50 border-green-200" : "bg-white"
                    }`}
                    onClick={() => setFilterStatus("signed")}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> Signed
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
                        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200"></div>
                      </div>
                      <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
                    </div>
                  ))}
                </div>
              ) : filteredContracts.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {filteredContracts.map((contract: ContractSummary) => (
                    <li
                      key={contract.id}
                      className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                        selectedContract?.id === contract.id
                          ? "bg-primary-50/50 border-l-4 border-primary-500"
                          : "border-l-4 border-transparent"
                      }`}
                      onClick={() => setSelectedContract(contract)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                selectedContract?.id === contract.id
                                  ? "bg-primary-100 text-primary-600"
                                  : "bg-indigo-50 text-indigo-500"
                              }`}
                            >
                              <FileText className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-900">{contract.title}</h3>
                            <div className="mt-1 flex items-center">
                              <Badge
                                variant="outline"
                                className={`flex items-center ${getStatusBadgeClasses(contract.status || "draft")}`}
                              >
                                {getStatusIcon(contract.status || "draft")}
                                {contract.status
                                  ? contract.status.charAt(0).toUpperCase() + contract.status.slice(1)
                                  : "Draft"}
                              </Badge>
                              <span className="ml-2 text-xs text-gray-500">{formatDate(contract.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-primary-600"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Contract</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-primary-600"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Analysis</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {searchQuery || filterStatus !== "all"
                      ? "No contracts match your search criteria."
                      : "No contracts found. Create your first contract to get started."}
                  </p>
                  <Button variant="outline" className="mt-4 gap-1">
                    <FilePlus className="h-4 w-4" />
                    Create Contract
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedContract ? (
            <Card className="border-gray-200 overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50/50 to-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-primary-500" />
                    AI Analysis
                  </CardTitle>
                  <Badge variant="outline" className="rounded-lg bg-indigo-50 text-indigo-700 border-indigo-200">
                    Beta
                  </Badge>
                </div>
                <CardDescription>
                  Smart analysis of{" "}
                  <span className="font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">
                    {selectedContract.title}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="issues">Issues</TabsTrigger>
                    <TabsTrigger value="parties">Parties</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {isAnalysisLoading ? (
                        <div className="col-span-3 py-8 flex justify-center items-center">
                          <div className="animate-spin w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full mr-3"></div>
                          <p className="text-sm text-gray-500">Loading contract analysis...</p>
                        </div>
                      ) : (
                        <>
                          <div className="rounded-lg bg-gray-50 p-3 text-center relative overflow-hidden group hover:shadow-md transition-all duration-200">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                            <p className="text-xs font-medium text-gray-500 flex items-center justify-center">
                              <Shield className="h-3 w-3 mr-1" /> Risk Score
                            </p>
                            <p className={`text-xl font-bold ${getRiskColor(contractAnalysis?.riskScore || 0)}`}>
                              {contractAnalysis?.riskScore || '0'}%
                            </p>
                            <p className="text-xs mt-1">{getRiskLevel(contractAnalysis?.riskScore || 0)}</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-3 text-center relative overflow-hidden group hover:shadow-md transition-all duration-200">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                            <p className="text-xs font-medium text-gray-500 flex items-center justify-center">
                              <Zap className="h-3 w-3 mr-1" /> Completeness
                            </p>
                            <p className="text-xl font-bold text-primary-600">{contractAnalysis?.completeness || '0'}%</p>
                            <Progress
                              value={contractAnalysis?.completeness || 0}
                              className="h-1.5 mt-1"
                            />
                          </div>
                          <div className="rounded-lg bg-gray-50 p-3 text-center relative overflow-hidden group hover:shadow-md transition-all duration-200">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                            <p className="text-xs font-medium text-gray-500 flex items-center justify-center">
                              <AlertCircle className="h-3 w-3 mr-1" /> Issues
                            </p>
                            <p className="text-xl font-bold text-amber-600">{contractAnalysis?.issues || '0'}</p>
                            <p className="text-xs mt-1">
                              {!contractAnalysis?.issues
                                ? "No issues found"
                                : contractAnalysis?.issues === 1
                                  ? "1 issue found"
                                  : `${contractAnalysis?.issues} issues found`}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-primary-50/50 to-white p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary-500" />
                        AI Recommendations
                      </h4>
                      
                      {isAnalysisLoading ? (
                        <div className="flex justify-center py-2">
                          <div className="animate-spin w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full"></div>
                        </div>
                      ) : contractAnalysis?.recommendations?.length ? (
                        <ul className="space-y-2">
                          {contractAnalysis.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="flex text-sm group">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-600 mr-2 group-hover:bg-primary-200 transition-colors">
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No recommendations available for this contract.</p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button className="w-full gap-1">
                        View Full Analysis
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="issues">
                    <div className="space-y-3">
                      <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 mr-2">
                            <AlertTriangle className="h-3 w-3" />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-amber-800">Missing Confidentiality Term</p>
                            <p className="text-xs text-amber-700 mt-1">
                              Contract lacks explicit confidentiality obligations. Consider adding a clause.
                            </p>
                            <Button variant="link" className="h-6 p-0 text-xs text-amber-800 mt-1">
                              Fix Issue
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-red-100 bg-red-50 p-3 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 mr-2">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                          <div>
                            <p className="text-sm font-medium text-red-800">Invalid Jurisdiction Reference</p>
                            <p className="text-xs text-red-700 mt-1">
                              Clause 8.2 references incorrect judicial authority for{" "}
                              {selectedContract.jurisdiction || "this jurisdiction"}.
                            </p>
                            <Button variant="link" className="h-6 p-0 text-xs text-red-800 mt-1">
                              Fix Issue
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-green-100 bg-green-50 p-3 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 mr-2">
                            <CheckCircle className="h-3 w-3" />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-green-800">Payment Terms Well Defined</p>
                            <p className="text-xs text-green-700 mt-1">
                              Payment terms are clearly defined and include all necessary details.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="parties">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                            {selectedContract.title?.charAt(0) || "A"}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">Acme Corp</p>
                            <p className="text-xs text-gray-500">Party 1 (Service Provider)</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>

                      <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-colors">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium">
                            C
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">Client Ltd</p>
                            <p className="text-xs text-gray-500">Party 2 (Client)</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>

                      <Button variant="outline" className="w-full mt-3 gap-1">
                        <Users className="h-4 w-4" />
                        Add Party
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col justify-center items-center p-6 border-gray-200">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Contract Analysis</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Select a contract to view its AI-powered analysis and recommendations.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
