import { useState } from 'react'
import { Link } from 'wouter'
import { 
  FileText,
  Search,
  PlusCircle,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

// Sample data for contracts
const sampleContracts = [
  {
    id: 1,
    title: 'Service Agreement with ABC Corp',
    type: 'service_agreement',
    status: 'active',
    createdAt: new Date(2025, 4, 10),
    updatedAt: new Date(2025, 4, 15),
    parties: ['ABC Corporation', 'LexiDraft Ltd'],
    description: 'Agreement for professional services related to software development project',
    riskScore: 'low',
    aiAnalyzed: true
  },
  {
    id: 2,
    title: 'Non-Disclosure Agreement',
    type: 'nda',
    status: 'active',
    createdAt: new Date(2025, 4, 8),
    updatedAt: new Date(2025, 4, 8),
    parties: ['XYZ Technologies', 'LexiDraft Ltd'],
    description: 'Confidentiality agreement for sharing proprietary information',
    riskScore: 'low',
    aiAnalyzed: true
  },
  {
    id: 3,
    title: 'Employment Contract - John Doe',
    type: 'employment',
    status: 'draft',
    createdAt: new Date(2025, 4, 5),
    updatedAt: new Date(2025, 4, 12),
    parties: ['John Doe', 'LexiDraft Ltd'],
    description: 'Employment terms and conditions for software engineer position',
    riskScore: null,
    aiAnalyzed: false
  },
  {
    id: 4,
    title: 'Office Space Lease Agreement',
    type: 'lease',
    status: 'pending',
    createdAt: new Date(2025, 3, 20),
    updatedAt: new Date(2025, 4, 2),
    parties: ['Premium Properties Ltd', 'LexiDraft Ltd'],
    description: 'Commercial lease for office space at Tech Park, Mumbai',
    riskScore: 'medium',
    aiAnalyzed: true
  },
  {
    id: 5,
    title: 'Software License Agreement',
    type: 'license',
    status: 'expired',
    createdAt: new Date(2024, 9, 15),
    updatedAt: new Date(2025, 3, 15),
    parties: ['Tech Solutions Inc', 'LexiDraft Ltd'],
    description: 'License for enterprise CRM software - expired last month',
    riskScore: null,
    aiAnalyzed: false
  },
  {
    id: 6,
    title: 'Vendor Agreement - Office Supplies',
    type: 'vendor',
    status: 'active',
    createdAt: new Date(2025, 2, 10),
    updatedAt: new Date(2025, 2, 15),
    parties: ['Office Depot Ltd', 'LexiDraft Ltd'],
    description: 'Annual agreement for office supplies procurement',
    riskScore: 'low',
    aiAnalyzed: true
  }
]

// Format contract type for display
const formatContractType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// Get status color for the badge
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 hover:bg-green-200'
    case 'pending': return 'bg-amber-100 text-amber-800 hover:bg-amber-200'
    case 'draft': return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    case 'expired': return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
}

// Get risk score color
const getRiskColor = (risk: string | null) => {
  if (!risk) return 'text-gray-400'
  switch (risk) {
    case 'low': return 'text-green-600'
    case 'medium': return 'text-amber-600'
    case 'high': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

export default function Contracts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  
  // Filter contracts based on search and filters
  const filteredContracts = sampleContracts.filter(contract => {
    // Search filter
    if (searchQuery && !contract.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Status filter
    if (statusFilter && contract.status !== statusFilter) {
      return false
    }
    
    // Type filter
    if (typeFilter && contract.type !== typeFilter) {
      return false
    }
    
    return true
  })
  
  // Get unique contract types for filter
  const contractTypes = Array.from(new Set(sampleContracts.map(c => c.type)))
  
  // Get unique statuses for filter
  const statuses = Array.from(new Set(sampleContracts.map(c => c.status)))

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-muted-foreground mt-1">Manage and analyze your legal documents</p>
        </div>
        <Button asChild>
          <Link href="/contracts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Contract
          </Link>
        </Button>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search contracts..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Status
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                All Statuses
              </DropdownMenuItem>
              {statuses.map(status => (
                <DropdownMenuItem 
                  key={status} 
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Type
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTypeFilter(null)}>
                All Types
              </DropdownMenuItem>
              {contractTypes.map(type => (
                <DropdownMenuItem 
                  key={type} 
                  onClick={() => setTypeFilter(type)}
                >
                  {formatContractType(type)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Contracts grid */}
      {filteredContracts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No contracts found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter || typeFilter 
              ? "Try adjusting your search or filters" 
              : "Create your first contract to get started"}
          </p>
          <Button asChild>
            <Link href="/contracts/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Contract
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map(contract => (
            <Card key={contract.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <Link href={`/contracts/${contract.id}`} className="block text-foreground hover:no-underline focus:outline-none">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className={getStatusColor(contract.status)}>
                      {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                    </Badge>
                    {contract.aiAnalyzed && (
                      <div className="text-primary flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">AI Analyzed</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2 text-lg mt-2">{contract.title}</CardTitle>
                  <CardDescription className="line-clamp-1 text-sm mt-1">
                    {formatContractType(contract.type)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {contract.description}
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parties:</span>
                      <span className="font-medium">{contract.parties.length}</span>
                    </div>
                    {contract.riskScore && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Risk Score:</span>
                        <span className={`font-medium capitalize ${getRiskColor(contract.riskScore)}`}>
                          {contract.riskScore}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-4 text-xs text-muted-foreground">
                  <div className="w-full flex justify-between">
                    <span>Created: {format(contract.createdAt, 'MMM d, yyyy')}</span>
                    <span>Updated: {format(contract.updatedAt, 'MMM d, yyyy')}</span>
                  </div>
                </CardFooter>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}