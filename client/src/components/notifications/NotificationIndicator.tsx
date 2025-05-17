"use client"

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { format, formatDistanceToNow } from 'date-fns'
import { useNotifications, Notification } from './NotificationProvider'

export default function NotificationIndicator() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  // Function to format notification time
  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear()
    
    if (isToday) {
      return formatDistanceToNow(date, { addSuffix: true })
    } else {
      return format(date, 'MMM dd, yyyy')
    }
  }
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (notification.link) {
      window.location.href = notification.link
    }
    
    setOpen(false)
  }
  
  // Get notification background color based on read status
  const getNotificationBg = (notification: Notification) => {
    return notification.read ? 'bg-background' : 'bg-muted/30'
  }
  
  // Get notification icon based on type
  const getNotificationIcon = (type: Notification['type']) => {
    switch(type) {
      case 'success':
        return <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-destructive mr-2" />
      case 'warning':
        return <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
      case 'info':
      default:
        return <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs hover:text-primary"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No notifications yet</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[300px]">
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 cursor-pointer hover:bg-muted transition-colors ${getNotificationBg(notification)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-medium text-sm">{notification.title}</h5>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-2 text-center border-t">
              <a href="/notifications" className="text-xs text-primary hover:underline">
                View all notifications
              </a>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}