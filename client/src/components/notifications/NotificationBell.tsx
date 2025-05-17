"use client"

import { useState } from 'react'
import { BellIcon, CheckIcon, XCircleIcon } from 'lucide-react'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from 'date-fns'
import { useNotifications, type Notification } from './NotificationProvider'

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  
  // Format notification time
  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch (e) {
      return 'recently'
    }
  }
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckIcon className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      default:
        return <BellIcon className="h-4 w-4 text-indigo-500" />
    }
  }
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    
    // Navigate to link if provided
    if (notification.link) {
      window.location.href = notification.link
    }
    
    // Close popover
    setOpen(false)
  }
  
  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 py-1 text-xs text-primary"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex cursor-pointer gap-3 p-4 hover:bg-muted/50 ${
                    !notification.isRead ? 'bg-muted/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <BellIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-medium">No notifications</h3>
              <p className="mb-4 mt-2 text-xs text-muted-foreground">
                When you get notifications, they'll show up here.
              </p>
            </div>
          )}
        </ScrollArea>
        
        <Separator />
        
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => {
              window.location.href = '/notifications'
              setOpen(false)
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}