import { useState } from 'react'
import { useParams, Link } from 'wouter'
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Share2, 
  UserCircle2, 
  CalendarDays,
  Clock,
  Tag,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { formatRelativeTime } from '@/lib/utils'

// Sample contract data
const getContractById = (id: string) => {
  return {
    id: Number(id),
    title: 'Service Agreement with ABC Corp',
    type: 'service_agreement',
    status: 'active',
    createdAt: new Date(2025, 4, 10),
    updatedAt: new Date(2025, 4, 15),
    parties: [
      { name: 'ABC Corporation', role: 'service provider', email: 'contracts@abccorp.com' },
      { name: 'LexiDraft Ltd', role: 'client', email: 'legal@lexidraft.com' }
    ],
    description: 'Agreement for professional services related to software development project',
    content: "This Service Agreement (the \"Agreement\") is entered into by and between ABC Corporation, a company registered under the laws of India, with its principal place of business at Tech Park, Bengaluru (\"Service Provider\") and LexiDraft Ltd, a company registered under the laws of India, with its principal place of business at Business Bay, Mumbai (\"Client\").\n\nWHEREAS, Service Provider is in the business of providing software development services;\n\nWHEREAS, Client wishes to engage Service Provider to provide certain services as described in this Agreement;\n\nNOW, THEREFORE, in consideration of the mutual covenants and promises made by the parties hereto, the Service Provider and Client agree as follows:\n\n1. SERVICES\nService Provider hereby agrees to provide Client with software development services (\"Services\") as described in Exhibit A attached hereto.\n\n2. TERM\nThis Agreement shall commence on the Effective Date and shall continue for a period of twelve (12) months, unless earlier terminated as provided herein.\n\n3. COMPENSATION\nClient shall pay Service Provider for the Services at the rates specified in Exhibit B attached hereto. Service Provider shall invoice Client monthly for Services performed, and Client shall pay each invoice within thirty (30) days of receipt.\n\n4. INTELLECTUAL PROPERTY\nAll intellectual property rights in any materials created by Service Provider in the provision of the Services (\"Deliverables\") shall vest in Client upon payment of the applicable fees. Service Provider hereby assigns all such intellectual property rights to Client.\n\n5. CONFIDENTIALITY\nEach party shall maintain the confidentiality of all confidential information disclosed by the other party and shall not release, disclose or divulge any such confidential information without the prior written consent of the other party.\n\n6. WARRANTIES\nService Provider warrants that the Services will be performed in a professional and workmanlike manner in accordance with generally accepted industry standards.\n\n7. LIMITATION OF LIABILITY\nNeither party shall be liable to the other for any indirect, incidental, consequential, special or exemplary damages arising out of or related to this Agreement.\n\n8. TERMINATION\nEither party may terminate this Agreement upon thirty (30) days written notice to the other party.\n\n9. GOVERNING LAW\nThis Agreement shall be governed by and construed in accordance with the laws of India, without giving effect to any choice of law or conflict of law provisions.\n\n10. DISPUTE RESOLUTION\nAny dispute arising out of or in connection with this Agreement shall be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 1996 of India.\n\nIN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.",
    riskScore: 'low',
    aiAnalyzed: true,
    analyses: [
      {
        id: 1,
        type: 'full',
        createdAt: new Date(2025, 4, 15),
        summary: 'This contract has a low risk profile with good protections for both parties.',
        riskAreas: [
          { 
            name: 'Intellectual Property',
            risk: 'low',
            description: 'Good IP transfer clauses, but could benefit from more detailed specification of what constitutes "Deliverables".'
          },
          { 
            name: 'Liability Protection',
            risk: 'low',
            description: 'Adequate limitation of liability clause that protects both parties.'
          },
          { 
            name: 'Termination Provisions',
            risk: 'medium',
            description: 'The termination clause is basic and could benefit from more detailed terms regarding transition and final payments.'
          }
        ],
        missingClauses: [
          'Force Majeure clause is missing',
          'No specific data protection/privacy provisions',
          'No non-solicitation provisions'
        ],
        suggestions: [
          'Add a Force Majeure clause to address unforeseen circumstances',
          'Include data protection provisions to comply with Indian data privacy laws',
          'Consider adding a non-solicitation clause to prevent either party from hiring the other\'s employees during and after the term'
        ]
      }
    ],
    activities: [
      {
        id: 1,
        type: 'created',
        user: 'Rahul Sharma',
        timestamp: new Date(2025, 4, 10, 14, 25)
      },
      {
        id: 2,
        type: 'edited',
        user: 'Priya Patel',
        timestamp: new Date(2025, 4, 12, 10, 15)
      },
      {
        id: 3,
        type: 'ai_analyzed',
        user: 'System',
        timestamp: new Date(2025, 4, 15, 9, 32)
      },
      {
        id: 4,
        type: 'shared',
        user: 'Rahul Sharma',
        target: 'contracts@abccorp.com',
        timestamp: new Date(2025, 4, 15, 11, 45)
      }
    ]
  }
}

// Format contract type for display
const formatContractType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// Get status color for the badge
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'pending': return 'bg-amber-100 text-amber-800'
    case 'draft': return 'bg-blue-100 text-blue-800'
    case 'expired': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Get risk color
const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'low': return 'text-green-600'
    case 'medium': return 'text-amber-600'
    case 'high': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

// Get icon for activity type
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'created': return FileText
    case 'edited': return FileText
    case 'signed': return CheckCircle2
    case 'shared': return Share2
    case 'ai_analyzed': return Sparkles
    default: return Info
  }
}

export default function ContractDetail() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('document')
  
  // In a real app, we would fetch this data from an API
  const contract = getContractById(id || '1')
  
  if (!contract) {
    return <div className="container py-20 text-center">Contract not found</div>
  }

  return (
    <div className="container py-8">
      {/* Header with navigation and actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/contracts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{contract.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getStatusColor(contract.status)}>
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatContractType(contract.type)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Analysis
          </Button>
        </div>
      </div>
      
      {/* Main content area with tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document and analysis tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="document" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full md:w-auto mb-6">
              <TabsTrigger value="document">Document</TabsTrigger>
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="document" className="mt-0">
              <Card>
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none">
                    {contract.content.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analysis" className="mt-0">
              {contract.aiAnalyzed ? (
                <>
                  {contract.analyses.map(analysis => (
                    <div key={analysis.id} className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-start gap-2">
                            <Sparkles className="h-5 w-5 text-primary mt-1" />
                            AI Analysis Summary
                          </CardTitle>
                          <CardDescription>
                            Analysis performed on {format(analysis.createdAt, 'MMMM d, yyyy')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-6">{analysis.summary}</p>
                          
                          <h3 className="font-medium text-gray-900 mb-3">Risk Assessment</h3>
                          <div className="space-y-4">
                            {analysis.riskAreas.map((area, index) => (
                              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-medium">{area.name}</h4>
                                  <span className={`text-sm font-medium capitalize ${getRiskColor(area.risk)}`}>
                                    {area.risk} risk
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{area.description}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                              Missing Clauses
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {analysis.missingClauses.map((clause, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <span className="text-amber-500 mt-0.5">•</span>
                                  <span>{clause}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              Improvement Suggestions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {analysis.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <span className="text-primary mt-0.5">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-primary-50 p-3 mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Generate AI Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    Analyze this contract for risks, compliance issues, and get improvement suggestions.
                  </p>
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Analysis
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar with details */}
        <div className="space-y-6">
          {/* Contract details card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[20px_1fr] gap-x-2 items-start">
                <CalendarDays className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">{format(contract.createdAt, 'MMMM d, yyyy')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[20px_1fr] gap-x-2 items-start">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-xs text-muted-foreground">{format(contract.updatedAt, 'MMMM d, yyyy')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[20px_1fr] gap-x-2 items-start">
                <Tag className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-xs text-muted-foreground">{formatContractType(contract.type)}</p>
                </div>
              </div>
              
              {contract.riskScore && (
                <div className="grid grid-cols-[20px_1fr] gap-x-2 items-start">
                  <AlertTriangle className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Risk Score</p>
                    <p className={`text-xs font-medium capitalize ${getRiskColor(contract.riskScore)}`}>
                      {contract.riskScore}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Parties card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.parties.map((party, index) => (
                <div key={index} className="border-b last:border-b-0 last:pb-0 pb-4 mb-4 last:mb-0">
                  <div className="flex items-start gap-2">
                    <UserCircle2 className="h-6 w-6 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{party.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{party.role}</p>
                      {party.email && (
                        <p className="text-xs text-muted-foreground mt-1">{party.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Activity log card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contract.activities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="mt-0.5">
                        <ActivityIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium">
                            {activity.type === 'created' && 'Contract created'}
                            {activity.type === 'edited' && 'Contract edited'}
                            {activity.type === 'signed' && 'Contract signed'}
                            {activity.type === 'shared' && `Shared with ${activity.target}`}
                            {activity.type === 'ai_analyzed' && 'AI Analysis completed'}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activity.type !== 'ai_analyzed' && `by ${activity.user}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}