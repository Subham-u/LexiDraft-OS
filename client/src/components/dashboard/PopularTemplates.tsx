"use client"

import { useQuery } from "@tanstack/react-query"
import { Link } from "wouter"
import type { TemplateItem } from "@/types"
import { FileText, ChevronRight, Star, Download, Clock } from "lucide-react"

export default function PopularTemplates() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/templates/popular"],
    staleTime: 60000, // 1 minute
  })

  // Function to get a random color for template categories (for demo purposes)
  const getTemplateColor = (id: string) => {
    const colors = [
      "bg-blue-100 text-blue-600",
      "bg-purple-100 text-purple-600",
      "bg-amber-100 text-amber-600",
      "bg-green-100 text-green-600",
      "bg-rose-100 text-rose-600",
      "bg-indigo-100 text-indigo-600",
    ]

    // Use the id to deterministically select a color
    const colorIndex = Number.parseInt(id, 10) % colors.length
    return colors[colorIndex] || colors[0]
  }

  // Function to get a random badge for templates (for demo purposes)
  const getTemplateBadge = (id: string) => {
    const badges = [
      { text: "Popular", className: "bg-amber-100 text-amber-800 border-amber-200" },
      { text: "New", className: "bg-green-100 text-green-800 border-green-200" },
      { text: "Premium", className: "bg-purple-100 text-purple-800 border-purple-200" },
    ]

    // Only show badges on some templates
    if (Number.parseInt(id, 10) % 3 === 0) {
      const badgeIndex = Number.parseInt(id, 10) % badges.length
      return badges[badgeIndex]
    }

    return null
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-urbanist text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary-600" />
          Popular Templates
        </h2>
        <Link
          href="/templates"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center"
        >
          View all
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200"></div>
                <div className="ml-3 flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200"></div>
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200"></div>
              </div>
            ))}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="space-y-3">
          {templates.map((template: TemplateItem) => {
            const colorClass = getTemplateColor(template.id)
            const badge = getTemplateBadge(template.id)

            return (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group flex items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden"
              >
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Left accent border on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClass}`}>
                  <FileText className="h-5 w-5" />
                </div>

                <div className="ml-3 flex-1 z-10">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-700 transition-colors duration-200">
                      {template.title}
                    </h3>

                    {badge && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${badge.className}`}>
                        {badge.text}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">{template.description}</p>

                  {/* Add some mock metadata for visual interest */}
                  <div className="mt-1 flex items-center text-xs text-gray-400">
                    <span className="flex items-center mr-3">
                      <Download className="h-3 w-3 mr-1" />
                      {Math.floor(Math.random() * 5000) + 100}
                    </span>
                    <span className="flex items-center mr-3">
                      <Star className="h-3 w-3 mr-1 text-amber-400" />
                      {(Math.random() * 2 + 3).toFixed(1)}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.floor(Math.random() * 10) + 2} min
                    </span>
                  </div>
                </div>

                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="rounded-full bg-primary-50 text-primary-600 p-1">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No templates available yet</p>
          <p className="text-xs text-gray-400 mt-1">Check back later for new templates</p>
        </div>
      )}
    </div>
  )
}
