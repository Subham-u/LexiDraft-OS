"use client"

import { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Bell } from 'lucide-react'

// Define the notification type
export type Notification = {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  createdAt: string
  read: boolean
  userId: number
  link?: string
}

// Create the notification context
interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  addNotification: (notification: Notification) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()
  
  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`)
    
    socket.onopen = () => {
      console.log('WebSocket connection established')
      
      // Authenticate the WebSocket connection (could be replaced with actual auth)
      const authMessage = {
        type: 'authenticate',
        data: {
          userId: 1, // Mock user ID - should be replaced with actual auth
          token: 'mock-token' // Mock token - should be replaced with actual auth
        }
      }
      
      socket.send(JSON.stringify(authMessage))
    }
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'notification') {
          // Add the new notification
          addNotification(data.notification)
          
          // Show a toast notification
          toast({
            title: data.notification.title,
            description: data.notification.message,
            action: data.notification.link ? (
              <a href={data.notification.link} className="font-medium text-primary">
                View
              </a>
            ) : undefined
          })
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error)
      }
    }
    
    socket.onclose = () => {
      console.log('WebSocket connection closed')
    }
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    // Clean up on unmount
    return () => {
      socket.close()
    }
  }, [toast])
  
  // Fetch initial notifications
  useEffect(() => {
    fetch('/api/notifications')
      .then(response => response.json())
      .then(data => {
        setNotifications(data)
        setUnreadCount(data.filter((notif: Notification) => !notif.read).length)
      })
      .catch(error => {
        console.error('Error fetching notifications:', error)
        // For demo purposes, let's use some mock data if the API fails
        const mockNotifications: Notification[] = [
          {
            id: 1,
            title: 'Contract analyzed',
            message: 'Your contract has been analyzed successfully.',
            type: 'success',
            createdAt: new Date().toISOString(),
            read: false,
            userId: 1,
            link: '/contracts/1'
          },
          {
            id: 2,
            title: 'New message',
            message: 'You have a new message from Lawyer John Doe.',
            type: 'info',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            read: false,
            userId: 1,
            link: '/chat/1'
          },
          {
            id: 3,
            title: 'Payment successful',
            message: 'Your subscription payment was successful.',
            type: 'success',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            read: true,
            userId: 1,
            link: '/billing'
          }
        ]
        setNotifications(mockNotifications)
        setUnreadCount(mockNotifications.filter(n => !n.read).length)
      })
  }, [])
  
  // Function to mark a notification as read
  const markAsRead = (id: number) => {
    fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH'
    })
      .then(response => response.json())
      .then(() => {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      })
      .catch(error => {
        console.error('Error marking notification as read:', error)
        // Update UI optimistically anyway
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      })
  }
  
  // Function to mark all notifications as read
  const markAllAsRead = () => {
    fetch('/api/notifications/read-all', {
      method: 'PATCH'
    })
      .then(response => response.json())
      .then(() => {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        setUnreadCount(0)
      })
      .catch(error => {
        console.error('Error marking all notifications as read:', error)
        // Update UI optimistically anyway
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        setUnreadCount(0)
      })
  }
  
  // Function to add a new notification
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)
  }
  
  // Value for the context provider
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification
  }
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}