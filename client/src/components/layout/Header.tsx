import { Link } from 'wouter'
import { FileText } from 'lucide-react'
import { HeaderActions } from './HeaderActions'
import { cn } from '@/lib/utils'

export function Header({ className }: { className?: string }) {
  return (
    <header className={cn('w-full border-b bg-background', className)}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-md bg-primary/10 p-1">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <span className="hidden text-xl font-bold text-foreground sm:inline-block">
              LexiDraft
            </span>
          </Link>
          
          {/* Main Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link 
              href="/contracts" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Contracts
            </Link>
            <Link 
              href="/templates" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Templates
            </Link>
            <Link 
              href="/lawyers" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Find Lawyers
            </Link>
            <Link 
              href="/pricing" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Pricing
            </Link>
          </nav>
        </div>
        
        {/* Header Actions - Including Notification Bell */}
        <HeaderActions />
      </div>
    </header>
  )
}