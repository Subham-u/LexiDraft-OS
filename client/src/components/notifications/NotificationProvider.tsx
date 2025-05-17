"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import wsClient from '../../lib/websocket'
import { useToast } from '@/hooks/use-toast'

// Define notification type
export interface Notification {
  id: number
  userId: number
  title: string
  message: string
  type: string
  link?: string
  read: boolean
  createdAt: string
}

// Define context type
interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  isLoading: boolean
  refetch: () => void
}

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  isLoading: false,
  refetch: () => {}
})

// Custom hook to use the notification context
export const useNotifications = () => useContext(NotificationContext)

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  
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
  const isLoading = isLoadingNotifications || isLoadingCount
  
  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      })
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] })
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] })
      
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast({
        title: "Error",
        description: "Could not mark notification as read",
        variant: "destructive",
      })
    }
  }
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      })
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] })
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] })
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast({
        title: "Error",
        description: "Could not mark all notifications as read",
        variant: "destructive",
      })
    }
  }
  
  // Initialize WebSocket connection
  useEffect(() => {
    // Get user info from localStorage or auth context
    const userString = localStorage.getItem('user')
    const authToken = localStorage.getItem('authToken')
    
    if (userString && authToken) {
      try {
        const user = JSON.parse(userString)
        
        // Connect to WebSocket server
        wsClient.connect(user.id, authToken)
        setIsWebSocketConnected(true)
        
        // Listen for new notifications
        wsClient.on('notification', (data) => {
          // Add notification to state
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] })
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] })
          
          // Show toast
          toast({
            title: data.title,
            description: data.message,
            variant: "default",
          })
        })
        
        // Listen for connection status changes
        wsClient.on('connection_status', (data) => {
          setIsWebSocketConnected(data.status === 'connected')
        })
      } catch (error) {
        console.error('Error connecting to WebSocket:', error)
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (isWebSocketConnected) {
        wsClient.disconnect()
      }
    }
  }, [queryClient, toast])
  
  // Create value object
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading,
    refetch
  }
  
  // Provide context to children
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}