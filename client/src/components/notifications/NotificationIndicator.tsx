"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BellIcon, CheckIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from '@/hooks/use-toast'

// Define notification types
interface Notification {
  id: number
  userId: number
  title: string
  message: string
  type: string
  link?: string
  read: boolean
  createdAt: string
}

export default function NotificationIndicator() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  
  // Fetch notifications
  const { data: notificationsData, isLoading: isLoadingNotifications, refetch } = useQuery<{
    success: boolean
    data: Notification[]
    unreadCount: number
  }>({
    queryKey: ['/api/notifications'],
    enabled: true,
    staleTime: 60000,  // 1 minute
    refetchInterval: 300000, // 5 minutes
  })
  
  // Get unread count
  const { data: unreadCountData, isLoading: isLoadingCount } = useQuery<{
    success: boolean
    data: { count: number }
  }>({
    queryKey: ['/api/notifications/unread'],
    enabled: true,
    staleTime: 60000,  // 1 minute
    refetchInterval: 60000, // 1 minute
  })
  
  // Extract values from query results
  const notifications = notificationsData?.data || []
  const unreadCount = unreadCountData?.data?.count || 0
  
  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      })
      
      // Refetch data
      refetch()
      
      toast({
        title: "Notification marked as read",
        description: "The notification has been marked as read",
        variant: "default",
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }
  
  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      })
      
      // Refetch data
      refetch()
      
      toast({
        title: "All notifications marked as read",
        description: "All notifications have been marked as read",
        variant: "default",
      })
      
      setOpen(false)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }
  
  const formatNotificationDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return 'recently'
    }
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 px-1.5 min-w-5 h-5 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckIcon className="h-4 w-4 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        
        {isLoadingNotifications ? (
          <div className="p-4 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="max-h-96 overflow-auto">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-primary-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatNotificationDate(notification.createdAt)}</p>
                  </div>
                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No notifications found</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}