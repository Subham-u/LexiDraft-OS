import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { 
  User,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  LogOut
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "../notifications/NotificationBell"

// For simplicity, we're using a direct localStorage check
// In a real app, you'd use a proper auth management system
const isUserLoggedIn = () => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('lexidraft-auth-token')
}

export function HeaderActions() {
  const [loggedIn, setLoggedIn] = useState(false)
  
  // Check login status
  useEffect(() => {
    setLoggedIn(isUserLoggedIn())
    
    // Listen for storage changes (login/logout)
    const handleStorageChange = () => {
      setLoggedIn(isUserLoggedIn())
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('lexidraft-auth-token')
    localStorage.removeItem('lexidraft-user')
    setLoggedIn(false)
    
    // Trigger storage event for other components to react
    window.dispatchEvent(new Event('storage'))
  }
  
  if (!loggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-2">
      <NotificationBell />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-avatar.jpg" alt="User avatar" />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">User</p>
              <p className="text-xs leading-none text-muted-foreground">
                user@example.com
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/contracts">
                <FileText className="mr-2 h-4 w-4" />
                <span>Contracts</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Messages</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}