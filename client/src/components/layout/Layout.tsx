"use client"

import { ReactNode } from 'react'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 w-full">
        {children}
      </main>
      <footer className="py-4 text-center text-gray-500 text-sm border-t">
        <p>© {new Date().getFullYear()} LexiDraft. All rights reserved.</p>
      </footer>
    </div>
  )
}