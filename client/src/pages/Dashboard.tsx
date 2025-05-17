import { Link } from 'wouter'
import { useState } from 'react'
import { 
  BarChart3, 
  FileText, 
  Users, 
  ListChecks, 
  AlertTriangle, 
  Bell, 
  FileUp, 
  Menu,
  Calendar,
  Sparkles,
  PlusCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export default function Dashboard() {
  // Sample data - in a real app, this would come from API calls
  const [activeTab, setActiveTab] = useState('overview')
  
  const stats = [
    { label: 'Total Contracts', value: '18', icon: FileText, color: 'bg-blue-100 text-blue-700' },
    { label: 'Contract Parties', value: '32', icon: Users, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Pending Action', value: '5', icon: ListChecks, color: 'bg-amber-100 text-amber-700' },
    { label: 'Issues Identified', value: '7', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  ]
  
  const recentContracts = [
    { id: 1, title: 'Service Agreement with ABC Corp', status: 'active', updatedAt: '2 days ago', type: 'service' },
    { id: 2, title: 'NDA with XYZ Technologies', status: 'pending', updatedAt: '5 days ago', type: 'nda' },
    { id: 3, title: 'Employment Contract - John Doe', status: 'draft', updatedAt: '1 week ago', type: 'employment' },
    { id: 4, title: 'Office Space Lease Agreement', status: 'active', updatedAt: '2 weeks ago', type: 'lease' },
  ]
  
  const upcomingDeadlines = [
    { id: 1, title: 'XYZ Contract Renewal', date: 'May 25, 2025', daysLeft: 8 },
    { id: 2, title: 'ABC Payment Due', date: 'Jun 3, 2025', daysLeft: 17 },
    { id: 3, title: 'Office Lease Expiry', date: 'Jul 15, 2025', daysLeft: 59 },
  ]
  
  const notifications = [
    { id: 1, title: 'Contract Signed', message: 'Service Agreement with ABC Corp has been signed by all parties', time: '1 hour ago', type: 'success' },
    { id: 2, title: 'Payment Reminder', message: 'Payment for XYZ Technologies contract due in 3 days', time: '3 hours ago', type: 'warning' },
    { id: 3, title: 'New Comment', message: 'John Doe commented on Employment Contract draft', time: '1 day ago', type: 'info' },
  ]
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-amber-100 text-amber-800'
      case 'draft': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button size="sm">
            <FileUp className="h-4 w-4 mr-2" />
            Upload Contract
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary" />
                    Recent Contracts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y divide-gray-100">
                    {recentContracts.map(contract => (
                      <li key={contract.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link href={`/contracts/${contract.id}`}>
                              <h4 className="font-medium text-sm hover:text-primary hover:underline">{contract.title}</h4>
                            </Link>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <span>Updated {contract.updatedAt}</span>
                              <span className="mx-2">•</span>
                              <Badge variant="outline" className={`${getStatusColor(contract.status)}`}>
                                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="p-4 border-t">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/contracts">View All Contracts</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      Upcoming Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {upcomingDeadlines.map(deadline => (
                        <li key={deadline.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{deadline.title}</p>
                            <p className="text-xs text-gray-500">{deadline.date}</p>
                          </div>
                          <Badge variant={deadline.daysLeft < 10 ? "destructive" : "outline"}>
                            {deadline.daysLeft} days
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                      Contracts by Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm">Active</p>
                          <p className="text-sm font-medium">42%</p>
                        </div>
                        <Progress value={42} className="h-2 bg-gray-100" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm">Draft</p>
                          <p className="text-sm font-medium">28%</p>
                        </div>
                        <Progress value={28} className="h-2 bg-gray-100" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm">Pending</p>
                          <p className="text-sm font-medium">18%</p>
                        </div>
                        <Progress value={18} className="h-2 bg-gray-100" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm">Expired</p>
                          <p className="text-sm font-medium">12%</p>
                        </div>
                        <Progress value={12} className="h-2 bg-gray-100" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="analysis" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-primary" />
                    AI Contract Analysis
                  </CardTitle>
                  <CardDescription>
                    Select a contract to analyze or view previous analyses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-primary-50 p-3 mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Generate AI Analysis</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-md">
                      Our AI can analyze contracts for risks, compliance issues, and provide improvement suggestions.
                    </p>
                    <Button>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary" />
                    My Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Button asChild>
                      <Link href="/contracts/new">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create New Contract
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar Area */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <li key={notification.id} className="p-4 hover:bg-gray-50">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                  </li>
                ))}
              </ul>
              <div className="p-4 border-t">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}