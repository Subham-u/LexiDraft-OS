"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import wsClient from '@/lib/websocket'

// Define notification types
export interface Notification {
  id: number
  userId: number
  title: string
  message: string
  type: string
  link?: string
  isRead: boolean
  createdAt: string
}

// Notification context
interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: number) => void
  markAllAsRead: () => void
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
})

export const useNotifications = () => useContext(NotificationContext)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [hasInitialized, setHasInitialized] = useState(false)
  
  // Fetch notifications
  const { data: notificationsData } = useQuery<{
    success: boolean
    data: Notification[]
    unreadCount: number
  }>({
    queryKey: ['/api/notifications'],
    enabled: isAuthenticated && hasInitialized,
    staleTime: 60000,  // 1 minute
    refetchInterval: 300000, // 5 minutes
  })
  
  // Get unread count
  const { data: unreadCountData } = useQuery<{
    success: boolean
    data: { count: number }
  }>({
    queryKey: ['/api/notifications/unread'],
    enabled: isAuthenticated && hasInitialized,
    staleTime: 60000,  // 1 minute
    refetchInterval: 60000, // 1 minute
  })
  
  // Initialize websocket connection
  useEffect(() => {
    if (isAuthenticated) {
      // Connect to WebSocket
      wsClient.connect()
      
      // Set initialization flag
      setHasInitialized(true)
      
      // Clean up on unmount
      return () => {
        wsClient.disconnect()
      }
    }
  }, [isAuthenticated])
  
  // Handle real-time notifications
  useEffect(() => {
    if (!isAuthenticated) return
    
    // Register notification handler
    const unsubscribe = wsClient.onNotification((notification) => {
      // Show toast
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default',
      })
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] })
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] })
    })
    
    return () => {
      unsubscribe()
    }
  }, [isAuthenticated, queryClient, toast])
  
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
    }
  }
  
  // Extract values from query results
  const notifications = notificationsData?.data || []
  const unreadCount = unreadCountData?.data?.count || 0
  
  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}