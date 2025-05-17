"use client"

import { type ReactNode, useState, useEffect } from "react"
import Sidebar from "@/components/sidebar/Sidebar"
import MobileNav from "@/components/sidebar/MobileNav"
import {
  Bell,
  MessageSquare,
  Search,
  User,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  HelpCircle,
  Star,
} from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Import the real auth context
import { useAuth } from "@/context/AuthContext"

// Import the real contract context
import { useContract } from "@/context/ContractContext"

// Import Lexi AI components
import { LexiAIProvider, useLexiAI } from "@/context/LexiAIContext"
import LexiAISidebar from "@/components/lexi/LexiAISidebar"
import LexiAIButton from "@/components/lexi/LexiAIButton"

// Sample notifications for the UI
const sampleNotifications = [
  {
    id: 1,
    title: "Contract Signed",
    message: "Employment Agreement was signed by all parties",
    time: "5 minutes ago",
    read: false,
    type: "success",
  },
  {
    id: 2,
    title: "Review Request",
    message: "John Doe requested your review on NDA contract",
    time: "2 hours ago",
    read: false,
    type: "info",
  },
  {
    id: 3,
    title: "Contract Expiring",
    message: "Vendor Agreement expires in 3 days",
    time: "1 day ago",
    read: true,
    type: "warning",
  },
]

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Define default values
  let user = {
    id: 1,
    fullName: "Demo User",
    avatar: null,
    username: "",
    email: "",
    role: null,
    uid: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  let isContractModalOpen = false

  // Use the real auth context
  const authContext = useAuth()
  if (authContext && authContext.user) {
    user = authContext.user
  }

  // Try to use the real contexts, but fall back to defaults if unavailable
  try {
    const contractContext = useContract()
    if (contractContext) {
      isContractModalOpen = contractContext.isContractModalOpen
    }
  } catch (error) {
    console.error("Context error:", error)
  }

  const [notifications, setNotifications] = useState(sampleNotifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  // Wrap the dashboard with LexiAIProvider
  return (
    <LexiAIProvider>
      <DashboardContent
        user={user}
        notifications={notifications}
        unreadCount={unreadCount}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
      >
        {children}
      </DashboardContent>
    </LexiAIProvider>
  )
}

// Inner component that has access to the LexiAI context
function DashboardContent({
  children,
  user,
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
}: {
  children: ReactNode
  user: {
    id: number
    fullName: string
    avatar: string | null
    username: string
    email: string
    role: string | null
    uid: string
    createdAt: Date
    updatedAt: Date
  }
  notifications: { id: number; title: string; message: string; time: string; read: boolean; type: string }[]
  unreadCount: number
  markAsRead: (id: number) => void
  markAllAsRead: () => void
}) {
  const { isSidebarOpen, closeSidebar, openSidebar, highlightedText, currentClause, contractTitle, contractType } =
    useLexiAI()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Track scroll position to add shadow to header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Format current time
  const formattedTime = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const formattedDate = currentTime.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "info":
        return <FileText className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navigation */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 sm:px-6 md:px-8 transition-shadow duration-200 ${
            isScrolled ? "shadow-md" : ""
          }`}
        >
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <h1 className="ml-3 font-urbanist text-xl font-semibold text-gray-900">
              Lexi<span className="text-primary-600">Draft</span>
            </h1>
          </div>

          {/* Date and time display - hidden on mobile */}
          <div className="hidden md:flex items-center space-x-2 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{formattedDate}</span>
            <span className="text-gray-300">|</span>
            <Clock className="h-4 w-4" />
            <span className="text-sm">{formattedTime}</span>
          </div>

          <div className="ml-auto flex items-center space-x-2">
            {/* Quick Actions Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:flex items-center gap-1 border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New</span>
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Create new document</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Lexi AI Button */}
            <div className="flex items-center h-9 rounded-md bg-blue-50 border border-blue-100 px-3 hover:bg-blue-100 transition-colors">
              <LexiAIButton variant="text" size="sm" />
            </div>

            {/* Search */}
            <div className="relative hidden md:block">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-64 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Search contracts, templates..."
              />
            </div>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b border-gray-100 p-3 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-sm font-semibold flex items-center">
                    <Bell className="h-4 w-4 mr-2 text-primary-500" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                        {unreadCount}
                      </Badge>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
                      Mark all as read
                    </Button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <li
                          key={notification.id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start">
                            <div
                              className={`mt-0.5 mr-3 p-1.5 rounded-full ${
                                notification.type === "success"
                                  ? "bg-green-100"
                                  : notification.type === "warning"
                                    ? "bg-amber-100"
                                    : "bg-blue-100"
                              }`}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 ml-2"></div>}
                              </div>
                              <p className="text-xs text-gray-600">{notification.message}</p>
                              <p className="mt-1 text-xs text-gray-400">{notification.time}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Bell className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No notifications</p>
                      <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-100 p-2 bg-gray-50">
                  <Button variant="ghost" size="sm" className="w-full justify-center text-xs h-7 text-primary-600">
                    View all notifications
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Messages */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-sm font-semibold flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-primary-500" />
                    Messages
                  </h3>
                </div>
                <div className="p-8 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <MessageSquare className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No new messages</p>
                  <p className="text-xs text-gray-400 mt-1">Your inbox is empty</p>
                </div>
                <div className="border-t border-gray-100 p-2 bg-gray-50">
                  <Button variant="ghost" size="sm" className="w-full justify-center text-xs h-7 text-primary-600">
                    View all messages
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Help */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Help & Resources</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9 overflow-hidden border-2 border-gray-200 hover:border-primary-200"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={user?.fullName} />
                    <AvatarFallback className="bg-primary-100 text-primary-700">
                      {user?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3 border-2 border-white shadow-sm">
                      <AvatarImage src="/placeholder-avatar.jpg" alt={user?.fullName} />
                      <AvatarFallback className="bg-primary-100 text-primary-700">
                        {user?.fullName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user?.fullName}</p>
                      <div className="flex items-center mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1.5 bg-amber-50 text-amber-700 border-amber-200 rounded-sm"
                        >
                          Free Plan
                        </Badge>
                        <button className="text-[10px] text-primary-600 ml-1 hover:underline">Upgrade</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <div className="rounded-md bg-gray-50 p-2 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-700">Plan Usage</p>
                      <p className="text-xs text-primary-600">3/5 documents</p>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: "60%" }}></div>
                    </div>
                  </div>

                  <DropdownMenuItem className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer flex items-center">
                    <Star className="mr-2 h-4 w-4" />
                    <span>Saved Templates</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer flex items-center text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-16 md:pb-0">
          {/* Page header with breadcrumbs could go here */}
          <div className="hidden md:block bg-white border-b border-gray-200 px-8 py-2.5">
            <div className="flex items-center text-sm text-gray-500">
              <a href="/" className="hover:text-primary-600">
                Home
              </a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">Dashboard</span>
            </div>
          </div>

          {/* Main content area */}
          <div className="px-4 py-6 sm:px-6 md:px-8">{children}</div>
        </main>
      </div>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-white" onClick={(e) => e.stopPropagation()}>
            <MobileNav onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Lexi AI Sidebar */}
      <LexiAISidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        highlightedText={highlightedText}
        currentClause={currentClause}
        contractTitle={contractTitle}
        contractType={contractType}
      />
    </div>
  )
}
