import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge for optimal Tailwind usage
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date as a relative time string (e.g., "5 minutes ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = typeof date === 'string' ? new Date(date) : date
  
  // Calculate difference in seconds
  const diffSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  
  if (diffSeconds < 60) {
    return 'just now'
  }
  
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  }
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  }
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  }
  
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
  }
  
  const diffYears = Math.floor(diffMonths / 12)
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`
}

/**
 * Truncates text to a specified length and adds an ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Formats a currency amount
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(amount)
}

/**
 * Debounces a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return function(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

/**
 * Extracts the initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return ''
  
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Generates a random color based on a string (useful for avatars)
 */
export function stringToColor(str: string): string {
  if (!str) return '#6366F1' // Default color
  
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = [
    '#F87171', // Red
    '#FB923C', // Orange
    '#FBBF24', // Amber
    '#34D399', // Emerald
    '#60A5FA', // Blue
    '#818CF8', // Indigo
    '#A78BFA', // Violet
    '#F472B6', // Pink
  ]
  
  return colors[Math.abs(hash) % colors.length]
}