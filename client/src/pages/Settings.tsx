import DashboardLayout from "@/layouts/DashboardLayout";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { toast } = useToast();
  
  // Create a mockup user if auth context is not available
  // This handles development and testing scenarios
  const defaultUser = {
    id: 1,
    uid: 'demo123',
    username: 'demo_user',
    email: 'demo@lexidraft.com',
    fullName: 'Demo User',
    role: 'user',
    avatar: '/assets/images/avatar.png',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  let user = defaultUser;
  let logout = () => {
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };
  
  // Try to use auth context if available
  try {
    const auth = useAuth();
    if (auth && auth.user) {
      user = auth.user;
      logout = auth.logout;
    }
  } catch (error) {
    console.log("Auth provider not available, using default user");
  }
  
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    company: "",
    role: "Legal Team"
  });
  
  const [legalForm, setLegalForm] = useState({
    panNumber: "",
    gstNumber: "",
    address: ""
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    contractUpdates: true,
    clientMessages: true,
    aiSuggestions: true,
    marketplaceUpdates: false
  });
  
  const [aiSettings, setAiSettings] = useState({
    autoSuggestions: true,
    dataCollection: true,
    simplifiedLanguage: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLegalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLegalForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationChange = (key: string, checked: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: checked }));
  };
  
  const handleAISettingChange = (key: string, checked: boolean) => {
    setAiSettings(prev => ({ ...prev, [key]: checked }));
  };
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call API to save profile settings
      await apiRequest("PATCH", "/api/user/profile", profileForm);
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully"
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call API to save legal settings
      await apiRequest("PATCH", "/api/user/legal", legalForm);
      
      toast({
        title: "Legal information updated",
        description: "Your legal information has been updated successfully"
      });
    } catch (error) {
      console.error("Error updating legal information:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your legal information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call API to save notification settings
      await apiRequest("PATCH", "/api/user/notifications", notificationSettings);
      
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been updated successfully"
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your notification settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call API to save AI settings
      await apiRequest("PATCH", "/api/user/ai-settings", aiSettings);
      
      toast({
        title: "AI settings updated",
        description: "Your AI preferences have been updated successfully"
      });
    } catch (error) {
      console.error("Error updating AI settings:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your AI settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 md:px-8">
        <div className="mb-8">
          <h1 className="font-urbanist text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your account settings and preferences</p>
        </div>
        
        <Tabs defaultValue="profile" className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="legal">Legal Identity</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="ai">AI Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal and professional details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20">
                      <img 
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileForm.fullName)}&background=7F56D9&color=fff`} 
                        alt="Profile" 
                        className="h-20 w-20 rounded-full object-cover" 
                      />
                      <button 
                        type="button"
                        className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700"
                      >
                        <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                    <div>
                      <h3 className="font-urbanist text-lg font-semibold">{profileForm.fullName}</h3>
                      <p className="text-sm text-gray-500">{profileForm.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 pt-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={profileForm.fullName}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        disabled={!!user?.email}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input
                        id="company"
                        name="company"
                        value={profileForm.company}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        name="role"
                        value={profileForm.role}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      className="bg-primary-600 hover:bg-primary-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="legal" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Legal Identity</CardTitle>
                <CardDescription>Add your legal identity details for contracts and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveLegal} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="panNumber">PAN Number</Label>
                      <Input
                        id="panNumber"
                        name="panNumber"
                        value={legalForm.panNumber}
                        onChange={handleLegalChange}
                        placeholder="ABCDE1234F"
                      />
                      <p className="text-xs text-gray-500">Personal Account Number for tax purposes</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                      <Input
                        id="gstNumber"
                        name="gstNumber"
                        value={legalForm.gstNumber}
                        onChange={handleLegalChange}
                        placeholder="22AAAAA0000A1Z5"
                      />
                      <p className="text-xs text-gray-500">For business users only</p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Legal Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={legalForm.address}
                        onChange={handleLegalChange}
                        placeholder="Enter your legal address"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start">
                      <svg className="mt-0.5 mr-3 h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Why we need this information</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Your legal identity details are used only for contract generation purposes and tax compliance. 
                          This information will never be shared with third parties except as required by law.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      className="bg-primary-600 hover:bg-primary-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how and when LexiDraft notifies you</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveNotifications} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive email notifications</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                      />
                    </div>
                    
                    <div className="ml-6 space-y-4 border-l border-gray-200 pl-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Contract Updates</Label>
                          <p className="text-xs text-gray-500">When contracts are signed, commented, or modified</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.contractUpdates}
                          onCheckedChange={(checked) => handleNotificationChange("contractUpdates", checked)}
                          disabled={!notificationSettings.emailNotifications}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Client Messages</Label>
                          <p className="text-xs text-gray-500">When clients send you messages</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.clientMessages}
                          onCheckedChange={(checked) => handleNotificationChange("clientMessages", checked)}
                          disabled={!notificationSettings.emailNotifications}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">AI Suggestions</Label>
                          <p className="text-xs text-gray-500">When Lexi AI has suggestions for your contracts</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.aiSuggestions}
                          onCheckedChange={(checked) => handleNotificationChange("aiSuggestions", checked)}
                          disabled={!notificationSettings.emailNotifications}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Marketplace Updates</Label>
                          <p className="text-xs text-gray-500">New lawyers and special offers in the marketplace</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.marketplaceUpdates}
                          onCheckedChange={(checked) => handleNotificationChange("marketplaceUpdates", checked)}
                          disabled={!notificationSettings.emailNotifications}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      className="bg-primary-600 hover:bg-primary-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ai" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Preferences</CardTitle>
                <CardDescription>Customize how Lexi AI interacts with you</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveAISettings} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Auto-suggestions</Label>
                        <p className="text-sm text-gray-500">Automatically suggest improvements to contracts</p>
                      </div>
                      <Switch 
                        checked={aiSettings.autoSuggestions}
                        onCheckedChange={(checked) => handleAISettingChange("autoSuggestions", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">AI Data Collection</Label>
                        <p className="text-sm text-gray-500">Allow Lexi to learn from your usage (anonymized data only)</p>
                      </div>
                      <Switch 
                        checked={aiSettings.dataCollection}
                        onCheckedChange={(checked) => handleAISettingChange("dataCollection", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Simplified Language</Label>
                        <p className="text-sm text-gray-500">Lexi will explain legal terms in simple language</p>
                      </div>
                      <Switch 
                        checked={aiSettings.simplifiedLanguage}
                        onCheckedChange={(checked) => handleAISettingChange("simplifiedLanguage", checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start">
                      <svg className="mt-0.5 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">About AI data collection</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          When enabled, Lexi AI learns from your interactions to provide better suggestions.
                          Your personal information and contract details are never stored or shared.
                          Disabling this may reduce the quality of AI suggestions over time.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      className="bg-primary-600 hover:bg-primary-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card className="border border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription className="text-red-500">Actions that cannot be undone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Log out from all devices</h3>
                <p className="text-sm text-gray-600">This will sign you out from all devices except the current one</p>
              </div>
              <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700">
                Log Out All
              </Button>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Log out</h3>
                <p className="text-sm text-gray-600">Sign out from your account on this device</p>
              </div>
              <Button 
                variant="outline" 
                className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={logout}
              >
                Log Out
              </Button>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-600">Permanently delete your account and all associated data</p>
              </div>
              <Button variant="destructive">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
