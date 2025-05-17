import React, { createContext, useContext, useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { formatRelativeTime } from '@/lib/utils'

type NotificationType = 'info' | 'success' | 'warning' | 'error'

interface Notification {
  id: number
  title: string
  message: string
  type: NotificationType
  createdAt: string
  read: boolean
  actionUrl?: string
}

interface NotificationContext {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  fetchNotifications: () => void
}

const NotificationContext = createContext<NotificationContext>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  fetchNotifications: () => {}
})

export const useNotifications = () => useContext(NotificationContext)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [socketConnected, setSocketConnected] = useState(false)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const { toast } = useToast()

  // Check if user is logged in
  const isLoggedIn = () => {
    return typeof window !== 'undefined' && !!localStorage.getItem('lexidraft-auth-token')
  }

  // Connect to WebSocket
  useEffect(() => {
    if (!isLoggedIn()) return
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    const newSocket = new WebSocket(wsUrl)
    
    newSocket.onopen = () => {
      console.log('WebSocket connected')
      setSocketConnected(true)
      
      // Send authentication message
      const authToken = localStorage.getItem('lexidraft-auth-token')
      if (authToken) {
        newSocket.send(JSON.stringify({
          type: 'authenticate',
          token: authToken
        }))
      }
    }
    
    newSocket.onclose = () => {
      console.log('WebSocket disconnected')
      setSocketConnected(false)
    }
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'notification') {
          // Handle new notification
          const newNotification = data.notification
          
          // Show toast notification for immediate feedback
          if (!newNotification.silent) {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.type === 'error' ? 'destructive' : 'default'
            })
          }
          
          // Update notifications list
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(count => count + 1)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
    
    setSocket(newSocket)
    
    // Fetch initial notifications
    fetchNotifications()
    
    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.close()
      }
    }
  }, [])
  
  // Re-fetch notifications when login state changes
  useEffect(() => {
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  const handleStorageChange = () => {
    if (isLoggedIn()) {
      fetchNotifications()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!isLoggedIn()) return
    
    try {
      const authToken = localStorage.getItem('lexidraft-auth-token')
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch notifications')
      
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // Mark a notification as read
  const markAsRead = async (id: number) => {
    if (!isLoggedIn()) return
    
    try {
      const authToken = localStorage.getItem('lexidraft-auth-token')
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to mark notification as read')
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      )
      
      setUnreadCount(count => Math.max(0, count - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!isLoggedIn()) return
    
    try {
      const authToken = localStorage.getItem('lexidraft-auth-token')
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to mark all notifications as read')
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}