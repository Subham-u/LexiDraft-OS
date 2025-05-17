import { useState } from 'react'
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard,
  Briefcase,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const { toast } = useToast()
  
  // Sample user data
  const [user, setUser] = useState({
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    company: 'LexiDraft Ltd',
    phone: '+91 98765 43210',
    avatarUrl: ''
  })
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    contractUpdates: true,
    contractReminders: true,
    paymentNotifications: true,
    marketingEmails: false,
    securityAlerts: true
  })
  
  // Handle profile form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    toast({
      title: 'Profile updated',
      description: 'Your profile information has been updated successfully.'
    })
  }
  
  // Handle notification toggle
  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    
    toast({
      title: 'Notification preferences updated',
      description: 'Your notification settings have been saved.'
    })
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences and settings</p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-1/4">
          <Tabs 
            defaultValue="profile" 
            orientation="vertical" 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="flex flex-col h-auto justify-start bg-transparent space-y-1">
              <TabsTrigger 
                value="profile" 
                className="justify-start px-4 w-full data-[state=active]:bg-muted"
              >
                <User className="h-5 w-5 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="justify-start px-4 w-full data-[state=active]:bg-muted"
              >
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="justify-start px-4 w-full data-[state=active]:bg-muted"
              >
                <Shield className="h-5 w-5 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="billing" 
                className="justify-start px-4 w-full data-[state=active]:bg-muted"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Billing
              </TabsTrigger>
              <TabsTrigger 
                value="team" 
                className="justify-start px-4 w-full data-[state=active]:bg-muted"
              >
                <Briefcase className="h-5 w-5 mr-2" />
                Team
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Content area */}
        <div className="flex-1">
          <TabsContent value="profile" className={activeTab === 'profile' ? 'block' : 'hidden'}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account details and personal information
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileSubmit}>
                <CardContent className="space-y-6">
                  {/* Profile picture */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-lg">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                      <Button variant="outline" size="sm" type="button">
                        Change Avatar
                      </Button>
                      <Button variant="outline" size="sm" type="button" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                        Remove
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={user.name} 
                        onChange={e => setUser({...user, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={user.email} 
                        onChange={e => setUser({...user, email: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input 
                        id="company" 
                        value={user.company} 
                        onChange={e => setUser({...user, company: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        value={user.phone} 
                        onChange={e => setUser({...user, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                  <Button type="button" variant="outline">Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className={activeTab === 'notifications' ? 'block' : 'hidden'}>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Email Notifications</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="contractUpdates">Contract Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about changes to your contracts
                        </p>
                      </div>
                      <Switch 
                        id="contractUpdates" 
                        checked={notifications.contractUpdates}
                        onCheckedChange={() => handleNotificationToggle('contractUpdates')}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="contractReminders">Deadline Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Get reminders about upcoming contract deadlines
                        </p>
                      </div>
                      <Switch 
                        id="contractReminders" 
                        checked={notifications.contractReminders}
                        onCheckedChange={() => handleNotificationToggle('contractReminders')}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="paymentNotifications">Payment Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about billing and payments
                        </p>
                      </div>
                      <Switch 
                        id="paymentNotifications" 
                        checked={notifications.paymentNotifications}
                        onCheckedChange={() => handleNotificationToggle('paymentNotifications')}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketingEmails">Marketing Communications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive product updates, tips, and special offers
                        </p>
                      </div>
                      <Switch 
                        id="marketingEmails" 
                        checked={notifications.marketingEmails}
                        onCheckedChange={() => handleNotificationToggle('marketingEmails')}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="securityAlerts">Security Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about important security events
                        </p>
                      </div>
                      <Switch 
                        id="securityAlerts" 
                        checked={notifications.securityAlerts}
                        onCheckedChange={() => handleNotificationToggle('securityAlerts')}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNotifications({
                      contractUpdates: true,
                      contractReminders: true,
                      paymentNotifications: true,
                      marketingEmails: false,
                      securityAlerts: true
                    })
                    
                    toast({
                      title: 'Default settings restored',
                      description: 'Notification preferences have been reset to default.'
                    })
                  }}
                >
                  Reset to Defaults
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className={activeTab === 'security' ? 'block' : 'hidden'}>
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Change Password</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  <Button className="mt-2">Update Password</Button>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all of your content.
                  </p>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing" className={activeTab === 'billing' ? 'block' : 'hidden'}>
            <Card>
              <CardHeader>
                <CardTitle>Billing and Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription plan and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Current Plan</h3>
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-primary">Professional Plan</p>
                        <p className="text-sm text-muted-foreground">Renews on June 15, 2025</p>
                      </div>
                      <Button variant="outline" size="sm">Change Plan</Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Payment Methods</h3>
                  <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-xs text-muted-foreground">Expires 05/2026</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Remove</Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    Add Payment Method
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Billing History</h3>
                  <div className="border rounded-lg divide-y">
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Professional Plan - Monthly</p>
                        <p className="text-xs text-muted-foreground">May 15, 2025</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium">₹2,999.00</p>
                        <Button variant="outline" size="sm">Receipt</Button>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Professional Plan - Monthly</p>
                        <p className="text-xs text-muted-foreground">Apr 15, 2025</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium">₹2,999.00</p>
                        <Button variant="outline" size="sm">Receipt</Button>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Professional Plan - Monthly</p>
                        <p className="text-xs text-muted-foreground">Mar 15, 2025</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium">₹2,999.00</p>
                        <Button variant="outline" size="sm">Receipt</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="team" className={activeTab === 'team' ? 'block' : 'hidden'}>
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Invite team members and manage their permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Team Members</h3>
                  <Button size="sm">Invite Users</Button>
                </div>
                
                <div className="border rounded-lg divide-y">
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>RS</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Rahul Sharma</p>
                        <p className="text-xs text-muted-foreground">rahul@example.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Owner</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>PP</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Priya Patel</p>
                        <p className="text-xs text-muted-foreground">priya@example.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Admin</Badge>
                      <Button variant="ghost" size="sm">Manage</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>AK</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Anil Kumar</p>
                        <p className="text-xs text-muted-foreground">anil@example.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Member</Badge>
                      <Button variant="ghost" size="sm">Manage</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </div>
    </div>
  )
}