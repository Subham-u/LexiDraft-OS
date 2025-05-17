"use client"

import type React from "react"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "wouter"
import DashboardLayout from "@/layouts/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  Search,
  Plus,
  Star,
  Download,
  Clock,
  Filter,
  Bookmark,
  TrendingUp,
  CheckCircle,
  Tag,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import type { Template } from "@shared/schema"

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  const { data: templateResponse, isLoading } = useQuery({
    queryKey: ["/api/templates"],
    staleTime: 60000, // 1 minute
  })
  
  // Extract templates array from the response structure
  const templates = templateResponse?.data || []

  // Categories with icons
  const categories = [
    { id: "all", name: "All Templates", icon: <FileText className="h-4 w-4" /> },
    { id: "nda", name: "NDA", icon: <CheckCircle className="h-4 w-4" /> },
    { id: "freelance", name: "Freelance", icon: <Sparkles className="h-4 w-4" /> },
    { id: "employment", name: "Employment", icon: <Bookmark className="h-4 w-4" /> },
    { id: "startup", name: "Startup", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "real-estate", name: "Real Estate", icon: <Tag className="h-4 w-4" /> },
  ]

  // Filter templates based on search query and selected category
  const filteredTemplates = templates
    ? templates.filter((template: Template) => {
        const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
        return matchesSearch && matchesCategory
      })
    : []

  // Function to get a random color for template categories (for demo purposes)
  const getTemplateColor = (id: string) => {
    const colors = [
      "bg-blue-100 text-blue-600 border-blue-200",
      "bg-purple-100 text-purple-600 border-purple-200",
      "bg-amber-100 text-amber-600 border-amber-200",
      "bg-green-100 text-green-600 border-green-200",
      "bg-rose-100 text-rose-600 border-rose-200",
      "bg-indigo-100 text-indigo-600 border-indigo-200",
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
    <DashboardLayout>
      {/* Hero section with background */}
      <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-primary-900 to-primary-700 p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('https://img.freepik.com/free-photo/wall-wallpaper-concrete-colored-painted-textured-concept_53876-31799.jpg?t=st=1746722702~exp=1746726302~hmac=abfc631003866c7ab8e5858c0428d6a82e33d9cf4162d61ea48c45ecb3f6982d&w=2000')] opacity-70"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-6 md:mb-0">
            <h1 className="font-urbanist text-3xl font-bold">Document Templates</h1>
            <p className="mt-2 max-w-2xl text-primary-100">
              Browse our collection of professionally crafted templates to streamline your document creation process.
              Save time and ensure legal compliance with our ready-to-use templates.
            </p>
          </div>
          <div className="flex flex-shrink-0 space-x-3">
            <Button className="bg-indigo-600 text-primary-700 hover:bg-primary-50" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Template
            </Button>
            <Button
              variant="outline"
              className="border-primary-300 bg-primary-800/30 text-white hover:bg-primary-800/50"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Import
            </Button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-6 -left-6 h-12 w-12 rounded-full bg-primary-500/30"></div>
        <div className="absolute -top-6 -right-6 h-12 w-12 rounded-full bg-primary-500/30"></div>
      </div>

      {/* Search and filters */}      
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search templates..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
              <Badge variant="secondary" className="ml-1 bg-gray-100">
                {selectedCategory !== "all" ? "1" : "0"}
              </Badge>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Recent
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500" />
              Popular
            </Button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700">Categories</h3>
            <Tabs
              defaultValue={selectedCategory}
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 md:grid-cols-6">
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1.5">
                    {category.icon}
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      {/* Featured template (only show if there are templates) */}
      {!isLoading && templates && templates.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-8">
              <Badge className="mb-2 bg-blue-100 text-blue-700">Featured Template</Badge>
              <h2 className="font-urbanist text-2xl font-bold text-gray-900">Non-Disclosure Agreement</h2>
              <p className="mt-2 text-gray-600">
                A comprehensive NDA template that protects your confidential information when sharing with third
                parties. Customizable for various business relationships and compliant with Indian law.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white">
                  Legal
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Business
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Confidentiality
                </Badge>
              </div>
              <div className="mt-6 flex items-center space-x-4">
                <Button className="gap-1 bg-blue-600 hover:bg-blue-700">
                  <FileText className="h-4 w-4" />
                  Use Template
                </Button>
                <Button variant="outline" className="gap-1">
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              </div>
            </div>
            <div className="hidden md:block md:w-1/3 bg-[url('/placeholder.svg?key=7ik9r')] bg-cover bg-center"></div>
          </div>
        </div>
      )}

      {/* Templates grid */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-urbanist text-xl font-semibold text-gray-900">All Templates</h2>
          <p className="text-sm text-gray-500">
            {filteredTemplates.length} {filteredTemplates.length === 1 ? "template" : "templates"} found
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="p-6">
                    <div className="mb-4 h-6 w-3/4 animate-pulse rounded-md bg-gray-200"></div>
                    <div className="mb-6 h-4 w-1/2 animate-pulse rounded-md bg-gray-200"></div>
                    <div className="flex space-x-2">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200"></div>
                      <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200"></div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-1/3 animate-pulse rounded-md bg-gray-200"></div>
                      <div className="h-8 w-24 animate-pulse rounded-md bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template: Template) => {
              const colorClass = getTemplateColor(template.id)
              const badge = getTemplateBadge(template.id)

              return (
                <Card key={template.id} className="group overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className={`h-2 w-full ${colorClass.split(" ")[0]}`}></div>
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <CardTitle className="font-urbanist text-lg">{template.title}</CardTitle>
                          {badge && (
                            <Badge variant="outline" className={badge.className}>
                              {badge.text}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                      </div>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          colorClass.split(" ")[0]
                        } ${colorClass.split(" ")[1]}`}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {template.tags?.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Download className="mr-1 h-3.5 w-3.5" />
                          <span>{Math.floor(Math.random() * 500) + 50}</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="mr-1 h-3.5 w-3.5 text-amber-400" />
                          <span>{(Math.random() * 2 + 3).toFixed(1)}</span>
                        </div>
                      </div>
                      <Link href={`/templates/${template.id}`}>
                        <Button
                          variant="ghost"
                          className="group-hover:bg-primary-50 group-hover:text-primary-600"
                          size="sm"
                        >
                          Use Template
                          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-urbanist text-lg font-medium text-gray-900">No templates found</h3>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              {searchQuery
                ? `No templates match your search for "${searchQuery}". Try a different search term or category.`
                : "No templates available in this category. Create your first template or select a different category."}
            </p>
            <Button className="mt-4 gap-1">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>
        )}
      </div>

      {/* Template categories section */}
      {!isLoading && templates && templates.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-urbanist text-xl font-semibold text-gray-900">Browse by Category</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {categories
              .filter((cat) => cat.id !== "all")
              .map((category) => (
                <button
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:bg-primary-50/30"
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setShowFilters(true)
                  }}
                >
                  <div className="flex items-center">
                    <div className="mr-3 rounded-full bg-gray-100 p-2">{category.icon}</div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">{Math.floor(Math.random() * 10) + 5} templates</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

// Eye component for the preview button
function Eye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
