import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'wouter'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from './NotificationProvider'
import { formatRelativeTime } from '@/lib/utils'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  
  const handleNotificationClick = (id: number, actionUrl?: string) => {
    markAsRead(id)
    
    if (actionUrl) {
      setOpen(false)
    }
  }
  
  // Return empty div if no notifications to avoid layout shifts
  if (notifications.length === 0) {
    return <div className="w-10"></div>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto text-xs px-2 py-1"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <p>No notifications</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[300px]">
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${!notification.read ? 'bg-primary-50' : ''}`}
                  >
                    {notification.actionUrl ? (
                      <Link 
                        href={notification.actionUrl}
                        onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                      >
                        <NotificationItem notification={notification} />
                      </Link>
                    ) : (
                      <div onClick={() => handleNotificationClick(notification.id)}>
                        <NotificationItem notification={notification} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center text-xs"
                asChild
              >
                <Link href="/notifications">
                  View all notifications
                </Link>
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface NotificationItemProps {
  notification: {
    id: number
    title: string
    message: string
    type: string
    createdAt: string
    read: boolean
  }
}

function NotificationItem({ notification }: NotificationItemProps) {
  // Get icon and color based on notification type
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-amber-100 text-amber-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="cursor-pointer">
      <div className="flex items-start gap-3">
        <div className={`mt-1 rounded-full p-1 ${getTypeStyles(notification.type)}`}>
          <svg className="h-3 w-3" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="currentColor" opacity="0.2" />
            <circle cx="12" cy="12" r="4" fill="currentColor" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium">{notification.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
          <p className="text-xs text-slate-400 mt-1">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )
}