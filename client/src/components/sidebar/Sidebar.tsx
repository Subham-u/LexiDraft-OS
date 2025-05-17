"use client"

import { useState } from "react"
import { Link, useLocation } from "wouter"
import {
  Home,
  FileText,
  FileBox,
  Sparkles,
  Users,
  Scale,
  CreditCard,
  Settings,
  ChevronDown,
  LogOut,
  Bell,
  HelpCircle,
  Zap,
  Star,
  Bookmark,
  ChevronRight,
} from "lucide-react"

// Temporary auth context for development
const mockAuthContext = {
  user: { id: 1, fullName: "Demo User", displayName: "Demo User", photoURL: null },
  isAuthenticated: true,
  loading: false,
}

// Mock useAuth hook until the real one is fixed
const useAuth = () => mockAuthContext

export default function Sidebar() {
  const [location] = useLocation()
  const { user } = useAuth()
  const [expandedSection, setExpandedSection] = useState<string | null>("main")

  const displayName = user?.displayName || "LexiDraft User"
  const photoURL = user?.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName)

  const navSections = [
    {
      id: "main",
      title: "Main",
      items: [
        { path: "/", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
        { path: "/contracts", label: "My Contracts", icon: <FileText className="h-5 w-5" /> },
        { path: "/templates", label: "Templates", icon: <FileBox className="h-5 w-5" /> },
        { path: "/lexi-ai", label: "Lexi AI", icon: <Sparkles className="h-5 w-5" /> },
      ],
    },
    {
      id: "services",
      title: "Services",
      items: [
        { path: "/clients", label: "Client Portal", icon: <Users className="h-5 w-5" /> },
        { path: "/lawyers", label: "Lawyer Marketplace", icon: <Scale className="h-5 w-5" /> },
      ],
    },
    {
      id: "account",
      title: "Account",
      items: [
        { path: "/billing", label: "Billing & Subscription", icon: <CreditCard className="h-5 w-5" /> },
        { path: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
      ],
    },
  ]

  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null)
    } else {
      setExpandedSection(sectionId)
    }
  }

  // Check if a path is active or if any of its children are active
  const isActive = (path: string) => {
    return location === path
  }

  return (
    <aside className="hidden border-r border-gray-200 bg-white shadow-sm md:flex md:w-64 md:flex-col h-screen">
      {/* Logo and branding */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="ml-3 font-urbanist text-xl font-bold text-gray-900">
            Lexi<span className="text-primary-600">Draft</span>
          </h1>
        </div>
      </div>

      {/* Premium badge */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 px-3 py-2 border border-amber-200">
          <div className="flex items-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200 text-amber-700">
              <Zap className="h-4 w-4" />
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium text-amber-800">Premium Plan</p>
              <p className="text-xs text-amber-700">Valid until Jun 2023</p>
            </div>
          </div>
          <button className="text-amber-700 hover:text-amber-800">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.id} className="space-y-1">
            <div
              className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => toggleSection(section.id)}
            >
              <span>{section.title}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  expandedSection === section.id ? "transform rotate-180" : ""
                }`}
              />
            </div>

            {expandedSection === section.id && (
              <div className="mt-1 space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.path)
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-primary-50 text-primary-700 shadow-sm"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <div
                        className={`mr-3 transition-colors duration-200 ${
                          active ? "text-primary-600" : "text-gray-400 group-hover:text-gray-500"
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                      {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500"></div>}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {/* Favorites section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>Favorites</span>
            <Star className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <div className="mt-1 space-y-1">
            <Link
              href="/templates/nda"
              className="group flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <Bookmark className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
              <span>NDA Template</span>
            </Link>
            <Link
              href="/templates/employment"
              className="group flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <Bookmark className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
              <span>Employment Contract</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* User profile */}
      {/* <div className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <img
                src={photoURL || "/placeholder.svg"}
                alt="User profile"
                className="h-9 w-9 rounded-full border-2 border-white shadow-sm"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">Legal Team</p>
            </div>
          </div>
          <div className="flex space-x-1">
            <button className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700">
              <Bell className="h-4 w-4" />
            </button>
            <button className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700">
              <HelpCircle className="h-4 w-4" />
            </button>
            <button className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div> */}
    </aside>
  )
}
