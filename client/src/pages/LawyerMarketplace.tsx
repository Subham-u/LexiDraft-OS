"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useLocation } from "wouter"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Icons
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  Filter,
  Video,
  Phone,
  MessageSquare,
  Calendar,
  Check,
  ChevronDown,
  Globe,
  Languages,
  Sparkles,
  Zap,
  Award,
  Users,
  BookOpen,
  FileText,
  Shield,
  Gavel,
  Building,
  Home,
  Scale,
  Heart,
  ChevronRight,
  CalendarClock,
  X,
  Sliders,
  CheckCircle,
} from "lucide-react"

// Layout and other components
import DashboardLayout from "@/layouts/DashboardLayout"

// Mock data for Indian states and cities
const indianStates = [
  { value: "all", label: "All India" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "karnataka", label: "Karnataka" },
  { value: "delhi", label: "Delhi" },
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "gujarat", label: "Gujarat" },
  { value: "telangana", label: "Telangana" },
  { value: "uttar_pradesh", label: "Uttar Pradesh" },
  { value: "west_bengal", label: "West Bengal" },
]

// Maps states to cities
const stateCityMap: Record<string, Array<{ value: string; label: string }>> = {
  maharashtra: [
    { value: "all", label: "All Cities" },
    { value: "mumbai", label: "Mumbai" },
    { value: "pune", label: "Pune" },
    { value: "nagpur", label: "Nagpur" },
  ],
  karnataka: [
    { value: "all", label: "All Cities" },
    { value: "bangalore", label: "Bangalore" },
    { value: "mysore", label: "Mysore" },
    { value: "hubli", label: "Hubli-Dharwad" },
  ],
  delhi: [
    { value: "all", label: "All Delhi" },
    { value: "new_delhi", label: "New Delhi" },
    { value: "south_delhi", label: "South Delhi" },
    { value: "north_delhi", label: "North Delhi" },
  ],
  // Add more states and cities as needed
}

// Practice areas
const practiceAreas = [
  { value: "all", label: "All Practice Areas", icon: Scale },
  { value: "contract_law", label: "Contract Law", icon: FileText },
  { value: "property_law", label: "Property Law", icon: Home },
  { value: "criminal_law", label: "Criminal Law", icon: Gavel },
  { value: "corporate_law", label: "Corporate Law", icon: Building },
  { value: "family_law", label: "Family Law", icon: Heart },
  { value: "intellectual_property", label: "Intellectual Property", icon: Shield },
  { value: "startup_law", label: "Startup Law", icon: Zap },
  { value: "real_estate", label: "Real Estate Law", icon: Home },
]

// Languages
const languages = [
  { value: "all", label: "All Languages" },
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "marathi", label: "Marathi" },
  { value: "kannada", label: "Kannada" },
  { value: "tamil", label: "Tamil" },
  { value: "telugu", label: "Telugu" },
  { value: "bengali", label: "Bengali" },
  { value: "gujarati", label: "Gujarati" },
]

// Experience levels
const experienceLevels = [
  { value: "all", label: "Any Experience" },
  { value: "2+", label: "2+ Years" },
  { value: "5+", label: "5+ Years" },
  { value: "10+", label: "10+ Years" },
  { value: "15+", label: "15+ Years" },
]

// Consultation modes
const consultationModes = [
  { value: "all", label: "All Modes", icon: Globe },
  { value: "video", label: "Video Call", icon: Video },
  { value: "call", label: "Phone Call", icon: Phone },
  { value: "chat", label: "In-app Chat", icon: MessageSquare },
]

// Mock lawyer data for development
const mockLawyers = [
  {
    id: 1,
    name: "Priya Sharma",
    imageUrl: "https://randomuser.me/api/portraits/women/45.jpg",
    specialization: "Startup Law",
    location: { state: "Maharashtra", city: "Mumbai" },
    experience: 8,
    languages: ["English", "Hindi", "Marathi"],
    rating: 4.8,
    reviewCount: 56,
    hourlyRate: 2500,
    practiceAreas: ["Startup Law", "Corporate Law", "Intellectual Property"],
    badges: ["Top Rated", "Quick Responder"],
    tags: ["Funding", "Term Sheets", "IP Rights"],
    consultationModes: ["video", "call", "chat"],
    isVerified: true,
    available: true,
    bio: "Specializing in startup law with expertise in funding, term sheets, and IP rights. I've helped over 50 startups navigate legal challenges and secure funding.",
  },
  {
    id: 2,
    name: "Vikram Singh",
    imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    specialization: "Corporate Law",
    location: { state: "Delhi", city: "New Delhi" },
    experience: 12,
    languages: ["English", "Hindi", "Punjabi"],
    rating: 4.9,
    reviewCount: 87,
    hourlyRate: 3500,
    practiceAreas: ["Corporate Law", "Mergers & Acquisitions", "Banking & Finance"],
    badges: ["Top Rated", "Featured"],
    tags: ["M&A", "Due Diligence", "Corporate Restructuring"],
    consultationModes: ["video", "call"],
    isVerified: true,
    available: true,
    bio: "Corporate law specialist with 12+ years of experience in M&A, due diligence, and corporate restructuring. Former partner at a top-tier law firm.",
  },
  {
    id: 3,
    name: "Ananya Patel",
    imageUrl: "https://randomuser.me/api/portraits/women/22.jpg",
    specialization: "Family Law",
    location: { state: "Gujarat", city: "Ahmedabad" },
    experience: 6,
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.7,
    reviewCount: 42,
    hourlyRate: 2000,
    practiceAreas: ["Family Law", "Divorce Law", "Child Custody"],
    badges: ["Rising Star"],
    tags: ["Divorce", "Alimony", "Custody"],
    consultationModes: ["video", "call", "chat"],
    isVerified: true,
    available: false,
    bio: "Compassionate family law attorney focusing on divorce, alimony, and child custody cases. I strive to make difficult family situations easier for my clients.",
  },
  {
    id: 4,
    name: "Rajiv Malhotra",
    imageUrl: "https://randomuser.me/api/portraits/men/46.jpg",
    specialization: "Real Estate Law",
    location: { state: "Karnataka", city: "Bangalore" },
    experience: 15,
    languages: ["English", "Hindi", "Kannada"],
    rating: 4.6,
    reviewCount: 103,
    hourlyRate: 3000,
    practiceAreas: ["Real Estate", "Property Law", "Land Acquisition"],
    badges: ["Expert", "10+ Years"],
    tags: ["Property Disputes", "Registration", "Agreements"],
    consultationModes: ["video", "call"],
    isVerified: true,
    available: true,
    bio: "Real estate law expert with 15 years of experience handling property disputes, registrations, and agreements. I've worked with major developers across Karnataka.",
  },
  {
    id: 5,
    name: "Sanjana Reddy",
    imageUrl: "https://randomuser.me/api/portraits/women/68.jpg",
    specialization: "IPR & Patents",
    location: { state: "Telangana", city: "Hyderabad" },
    experience: 9,
    languages: ["English", "Hindi", "Telugu"],
    rating: 4.9,
    reviewCount: 47,
    hourlyRate: 2800,
    practiceAreas: ["Intellectual Property", "Patent Law", "Trademark Law"],
    badges: ["IPR Specialist", "Quick Responder"],
    tags: ["Patents", "Trademarks", "Copyright"],
    consultationModes: ["video", "call", "chat"],
    isVerified: true,
    available: true,
    bio: "Intellectual property specialist with expertise in patents, trademarks, and copyright law. Former patent examiner with a background in technology and law.",
  },
  {
    id: 6,
    name: "Arjun Nair",
    imageUrl: "https://randomuser.me/api/portraits/men/75.jpg",
    specialization: "Tax Law",
    location: { state: "Tamil Nadu", city: "Chennai" },
    experience: 11,
    languages: ["English", "Hindi", "Tamil"],
    rating: 4.8,
    reviewCount: 64,
    hourlyRate: 2600,
    practiceAreas: ["Tax Law", "GST", "Income Tax"],
    badges: ["Tax Expert", "CA & Lawyer"],
    tags: ["Tax Planning", "GST", "Compliance"],
    consultationModes: ["video", "call"],
    isVerified: true,
    available: true,
    bio: "Dual-qualified as a Chartered Accountant and Lawyer specializing in tax law. I help businesses and individuals with tax planning, GST, and compliance matters.",
  },
]

interface LawyerSearchFilters {
  state: string
  city: string
  practiceArea: string
  language: string
  experience: string
  mode: string
  searchTerm: string
  aiAssist: boolean
}

export default function LawyerMarketplace() {
  // State for filters
  const [filters, setFilters] = useState<LawyerSearchFilters>({
    state: "all",
    city: "all",
    practiceArea: "all",
    language: "all",
    experience: "all",
    mode: "all",
    searchTerm: "",
    aiAssist: false,
  })

  const [availableCities, setAvailableCities] = useState<Array<{ value: string; label: string }>>([
    { value: "all", label: "All Cities" },
  ])

  const [showFilters, setShowFilters] = useState(false)
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Booking dialog state
  const [selectedConsultationMode, setSelectedConsultationMode] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [consultationDuration, setConsultationDuration] = useState<string>("60")
  const [consultationQuery, setConsultationQuery] = useState<string>("")
  const [lexiAIEnabled, setLexiAIEnabled] = useState<boolean>(true)
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false)
  const [bookingDialogOpen, setBookingDialogOpen] = useState<boolean>(false)
  const [lawyerProfileOpen, setLawyerProfileOpen] = useState<boolean>(false)

  // Time slots for consultation booking
  const availableTimeSlots = useMemo(() => {
    const slots = []
    // Generate time slots from 9 AM to 6 PM
    for (let hour = 9; hour <= 18; hour++) {
      const hourStr = hour > 12 ? hour - 12 : hour
      const amPm = hour >= 12 ? "PM" : "AM"
      slots.push(`${hourStr}:00 ${amPm}`)
      if (hour < 18) {
        slots.push(`${hourStr}:30 ${amPm}`)
      }
    }
    return slots
  }, [])

  // Check if booking form can be submitted
  const canSubmitBooking = useMemo(() => {
    return (
      selectedConsultationMode &&
      selectedDate &&
      selectedTime &&
      consultationDuration &&
      consultationQuery.length >= 10 &&
      !bookingInProgress
    )
  }, [selectedConsultationMode, selectedDate, selectedTime, consultationDuration, consultationQuery, bookingInProgress])

  // Handle booking consultation
  const handleBookConsultation = async (lawyerId: number) => {
    if (!canSubmitBooking) return

    setBookingInProgress(true)

    try {
      // Get user information (in a real app, this would come from the auth context)
      const userEmail = "user@example.com" // This would come from auth context
      const userName = "John Doe" // This would come from auth context
      const userPhone = "9876543210" // This would come from auth context

      // Construct the return URL
      const returnUrl = `${window.location.origin}/consultations/payment-confirmation`

      // Prepare consultation data with payment information
      const consultationData = {
        lawyerId,
        mode: selectedConsultationMode,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        duration: Number.parseInt(consultationDuration),
        query: consultationQuery,
        useAI: lexiAIEnabled,
        customerEmail: userEmail,
        customerPhone: userPhone,
        customerName: userName,
        returnUrl: returnUrl,
      }

      // Simulate API request
      setTimeout(() => {
        toast({
          title: "Consultation Booked",
          description: "Your consultation has been successfully scheduled.",
          variant: "default",
        })

        // Reset form
        setSelectedConsultationMode("")
        setSelectedDate("")
        setSelectedTime("")
        setConsultationDuration("60")
        setConsultationQuery("")
        setLexiAIEnabled(true)
        setBookingDialogOpen(false)
        setBookingInProgress(false)
      }, 1500)
    } catch (error) {
      console.error("Booking error:", error)
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Unable to book consultation. Please try again.",
        variant: "destructive",
      })
      setBookingInProgress(false)
    }
  }

  // Update available cities when state changes
  useEffect(() => {
    if (filters.state !== "all" && stateCityMap[filters.state]) {
      setAvailableCities(stateCityMap[filters.state])
    } else {
      setAvailableCities([{ value: "all", label: "All Cities" }])
    }
  }, [filters.state])

  // Interface for lawyer data
  interface LawyerData {
    id: number
    name: string
    specialization: string
    imageUrl: string
    location: {
      state: string
      city: string
    }
    experience: number
    rating: number
    reviewCount: number
    practiceAreas: string[]
    languages: string[]
    hourlyRate: number
    badges: string[]
    tags: string[]
    consultationModes: string[]
    isVerified: boolean
    available?: boolean // Optional property for availability status
    bio?: string // Optional property for lawyer bio
  }

  // Fetch lawyers data
  const {
    data: apiLawyers,
    isLoading,
    error,
  } = useQuery<any[]>({
    queryKey: ["/api/lawyers", filters],
    queryFn: async ({ queryKey }) => {
      // Simulate API request with mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockLawyers)
        }, 1000)
      })
    },
    enabled: true,
  })

  // Transform API data to match component expectations
  const lawyers = useMemo(() => {
    if (!apiLawyers) return []

    const enhancedLawyers = apiLawyers.map((lawyer) => {
      // Using default values for missing properties
      const enhancedLawyer: LawyerData = {
        id: lawyer.id,
        name: lawyer.name,
        specialization: lawyer.specialization || "",
        imageUrl: lawyer.imageUrl || "https://randomuser.me/api/portraits/lego/0.jpg",
        location: lawyer.location || { state: "Unknown", city: "Unknown" },
        experience: lawyer.experience || 0,
        rating: lawyer.rating || 4.0,
        reviewCount: lawyer.reviewCount || 0,
        hourlyRate: lawyer.hourlyRate || 0,
        practiceAreas: lawyer.practiceAreas || [lawyer.specialization || "General Practice"],
        languages: lawyer.languages || ["English"],
        badges: lawyer.badges || [],
        tags: lawyer.tags || [],
        consultationModes: lawyer.consultationModes || ["video", "call", "chat"],
        isVerified: lawyer.isVerified !== undefined ? lawyer.isVerified : true,
        available: lawyer.available !== undefined ? lawyer.available : true,
        bio: lawyer.bio || "",
      }

      return enhancedLawyer
    })

    return enhancedLawyers
  }, [apiLawyers])

  // Apply filters to lawyers data
  const filteredLawyers = useMemo(() => {
    if (!lawyers || lawyers.length === 0) return []

    return lawyers.filter((lawyer) => {
      // Filter by experience level
      if (filters.experience !== "all") {
        const minimumYears = Number.parseInt(filters.experience.replace("+", ""))
        if (lawyer.experience < minimumYears) {
          return false
        }
      }

      // Filter by search term
      if (filters.searchTerm) {
        const searchTermLower = filters.searchTerm.toLowerCase()
        const nameMatch = lawyer.name.toLowerCase().includes(searchTermLower)
        const specializationMatch = lawyer.specialization.toLowerCase().includes(searchTermLower)
        const practiceAreasMatch = lawyer.practiceAreas.some((area) => area.toLowerCase().includes(searchTermLower))

        if (!(nameMatch || specializationMatch || practiceAreasMatch)) {
          return false
        }
      }

      // Filter by practice area
      if (filters.practiceArea !== "all") {
        if (!lawyer.practiceAreas.some((area) => area.toLowerCase().includes(filters.practiceArea.toLowerCase()))) {
          return false
        }
      }

      // Filter by consultation mode
      if (filters.mode !== "all") {
        if (!lawyer.consultationModes.includes(filters.mode)) {
          return false
        }
      }

      // Filter by language
      if (filters.language !== "all") {
        if (!lawyer.languages.some((lang) => lang.toLowerCase() === filters.language.toLowerCase().replace("_", " "))) {
          return false
        }
      }

      // Filter by location (state)
      if (filters.state !== "all") {
        if (lawyer.location.state.toLowerCase() !== filters.state.toLowerCase().replace("_", " ")) {
          return false
        }

        // Filter by location (city)
        if (filters.city !== "all") {
          if (lawyer.location.city.toLowerCase() !== filters.city.toLowerCase().replace("_", " ")) {
            return false
          }
        }
      }

      return true
    })
  }, [lawyers, filters])

  // Handler for AI assist toggle
  const toggleAIAssist = () => {
    setFilters((prev) => ({
      ...prev,
      aiAssist: !prev.aiAssist,
    }))
  }

  // Filter update handler
  const updateFilter = (key: keyof LawyerSearchFilters, value: string | boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Render star rating
  const renderStarRating = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<Star key="half-star" className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />)
    }

    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)
    }

    return <div className="flex">{stars}</div>
  }

  // Get badge color based on badge text
  const getBadgeColor = (badge: string) => {
    const badgeColors: Record<string, string> = {
      "Top Rated": "bg-yellow-100 text-yellow-800 border-yellow-200",
      Featured: "bg-purple-100 text-purple-800 border-purple-200",
      "Rising Star": "bg-blue-100 text-blue-800 border-blue-200",
      Expert: "bg-indigo-100 text-indigo-800 border-indigo-200",
      "10+ Years": "bg-emerald-100 text-emerald-800 border-emerald-200",
      "IPR Specialist": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "Tax Expert": "bg-amber-100 text-amber-800 border-amber-200",
      "CA & Lawyer": "bg-rose-100 text-rose-800 border-rose-200",
      "Quick Responder": "bg-green-100 text-green-800 border-green-200",
    }

    return badgeColors[badge] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Hero section */}
        <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-primary-900 to-primary-700 p-8 text-white shadow-lg">
          <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dv98v8ht5/image/upload/v1746778554/dgxjy3mfxsdnxhwztknx.png')] opacity-90"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mt-20 -mr-20 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -mb-10 -ml-10 blur-xl"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold">Find Your Legal Expert</h1>
                <p className="mt-2 max-w-2xl text-primary-100">
                  Connect with verified lawyers across India for personalized legal consultations, contract reviews, and
                  expert advice.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-transparent backdrop-blur-sm px-3 py-1.5"
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  <span>{lawyers.length} Verified Lawyers</span>
                </Badge>
              </div>
            </div>

            {/* Main search bar in hero section */}
            <div className="mt-6 relative">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search for lawyers by name, expertise, or issue..."
                    value={filters.searchTerm}
                    onChange={(e) => updateFilter("searchTerm", e.target.value)}
                    className="pl-10 h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/70 focus:bg-white/20 focus:border-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-12 border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white"
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    Filters
                    <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                  </Button>
                  <Button
                    variant={filters.aiAssist ? "default" : "outline"}
                    onClick={toggleAIAssist}
                    className={`h-12 ${
                      filters.aiAssist
                        ? "bg-white text-primary-700 hover:bg-white/90"
                        : "border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <Sparkles className={`h-5 w-5 mr-2 ${filters.aiAssist ? "text-primary-600" : "text-white"}`} />
                    AI Assisted
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mb-8 bg-white rounded-xl shadow-md border border-gray-200 p-6 transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Sliders className="h-5 w-5 mr-2 text-primary-600" />
                Advanced Filters
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Location filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Location</label>
                <div className="space-y-2">
                  <Select
                    value={filters.state}
                    onValueChange={(value) => {
                      updateFilter("state", value)
                      updateFilter("city", "all")
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {indianStates.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {filters.state !== "all" && (
                    <Select value={filters.city} onValueChange={(value) => updateFilter("city", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Practice area filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Practice Area</label>
                <Select value={filters.practiceArea} onValueChange={(value) => updateFilter("practiceArea", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {practiceAreas.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Language filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Language</label>
                <Select value={filters.language} onValueChange={(value) => updateFilter("language", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Experience</label>
                <Select value={filters.experience} onValueChange={(value) => updateFilter("experience", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Consultation mode filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Consultation Mode</label>
                <Select value={filters.mode} onValueChange={(value) => updateFilter("mode", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {consultationModes.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        <div className="flex items-center">
                          {mode.value !== "all" && <mode.icon className="h-4 w-4 mr-2 text-primary-600" />}
                          {mode.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price range filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Price Range (₹/hour)</label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Price</SelectItem>
                    <SelectItem value="0-1500">₹0 - ₹1,500</SelectItem>
                    <SelectItem value="1500-2500">₹1,500 - ₹2,500</SelectItem>
                    <SelectItem value="2500-3500">₹2,500 - ₹3,500</SelectItem>
                    <SelectItem value="3500+">₹3,500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Availability filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Availability</label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Availability</SelectItem>
                    <SelectItem value="available_now">Available Now</SelectItem>
                    <SelectItem value="today">Available Today</SelectItem>
                    <SelectItem value="this_week">Available This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rating filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Minimum Rating</label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select minimum rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rating</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.0">4.0+ Stars</SelectItem>
                    <SelectItem value="3.5">3.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset filters */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setFilters({
                      state: "all",
                      city: "all",
                      practiceArea: "all",
                      language: "all",
                      experience: "all",
                      mode: "all",
                      searchTerm: "",
                      aiAssist: false,
                    })
                  }
                >
                  Reset All Filters
                </Button>
              </div>
            </div>

            {/* Applied filters */}
            <div className="mt-6 flex flex-wrap gap-2">
              {filters.state !== "all" && (
                <Badge
                  variant="outline"
                  className="bg-primary-50 text-primary-700 border-primary-200 px-3 py-1.5 flex items-center"
                >
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                  {indianStates.find((s) => s.value === filters.state)?.label}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-primary-100 text-primary-700"
                    onClick={() => updateFilter("state", "all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.city !== "all" && (
                <Badge
                  variant="outline"
                  className="bg-primary-50 text-primary-700 border-primary-200 px-3 py-1.5 flex items-center"
                >
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                  {availableCities.find((c) => c.value === filters.city)?.label}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-primary-100 text-primary-700"
                    onClick={() => updateFilter("city", "all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.practiceArea !== "all" && (
                <Badge
                  variant="outline"
                  className="bg-primary-50 text-primary-700 border-primary-200 px-3 py-1.5 flex items-center"
                >
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  {practiceAreas.find((a) => a.value === filters.practiceArea)?.label}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-primary-100 text-primary-700"
                    onClick={() => updateFilter("practiceArea", "all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.language !== "all" && (
                <Badge
                  variant="outline"
                  className="bg-primary-50 text-primary-700 border-primary-200 px-3 py-1.5 flex items-center"
                >
                  <Globe className="h-3.5 w-3.5 mr-1.5" />
                  {languages.find((l) => l.value === filters.language)?.label}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-primary-100 text-primary-700"
                    onClick={() => updateFilter("language", "all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.experience !== "all" && (
                <Badge
                  variant="outline"
                  className="bg-primary-50 text-primary-700 border-primary-200 px-3 py-1.5 flex items-center"
                >
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  {experienceLevels.find((e) => e.value === filters.experience)?.label}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-primary-100 text-primary-700"
                    onClick={() => updateFilter("experience", "all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.mode !== "all" && (
                <Badge
                  variant="outline"
                  className="bg-primary-50 text-primary-700 border-primary-200 px-3 py-1.5 flex items-center"
                >
                  {filters.mode === "video" && <Video className="h-3.5 w-3.5 mr-1.5" />}
                  {filters.mode === "call" && <Phone className="h-3.5 w-3.5 mr-1.5" />}
                  {filters.mode === "chat" && <MessageSquare className="h-3.5 w-3.5 mr-1.5" />}
                  {consultationModes.find((m) => m.value === filters.mode)?.label}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-primary-100 text-primary-700"
                    onClick={() => updateFilter("mode", "all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* AI Assistant section - shows when AI assist is toggled on */}
        {filters.aiAssist && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="md:w-1/3">
                <div className="flex items-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mr-3 shadow-sm">
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Lexi AI Assistant</h3>
                    <p className="text-sm text-gray-600">Let AI help find the perfect lawyer for your needs</p>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-indigo-100 shadow-sm">
                  <p className="text-sm text-gray-700 italic">
                    "I need help with a contract dispute with my business partner. We're based in Mumbai and need
                    someone who speaks Hindi and English."
                  </p>
                </div>
              </div>

              <div className="md:w-2/3 space-y-4">
                <Textarea
                  placeholder="Describe your legal situation in detail (e.g., 'I need help with my startup's term sheet negotiation')"
                  className="w-full h-24 bg-white/70 backdrop-blur-sm border-indigo-200 focus:border-indigo-300"
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1">
                    <Zap className="h-4 w-4 mr-2" />
                    Find Matching Lawyers
                  </Button>
                  <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start AI Consultation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popular practice areas section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary-600" />
              Popular Practice Areas
            </h2>
            <Button variant="ghost" className="text-primary-600 hover:text-primary-700">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {practiceAreas.slice(1, 7).map((area) => {
              const Icon = area.icon
              return (
                <Card
                  key={area.value}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 group overflow-hidden"
                  onClick={() => updateFilter("practiceArea", area.value)}
                >
                  <div className="absolute inset-x-0 h-1 bg-primary-600 transform -translate-y-1 group-hover:translate-y-0 transition-transform"></div>
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors">
                        <Icon className="h-6 w-6 text-primary-600" />
                      </div>
                      <h3 className="font-medium text-gray-900">{area.label}</h3>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Lawyers listing */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <Scale className="h-5 w-5 mr-2 text-primary-600" />
                Verified Lawyers
                {filteredLawyers.length > 0 && (
                  <Badge className="ml-2 bg-primary-100 text-primary-700 border-primary-200">
                    {filteredLawyers.length}
                  </Badge>
                )}
              </h2>
              {filteredLawyers.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredLawyers.length} lawyers
                  {filters.state !== "all" &&
                    ` in ${indianStates.find((s) => s.value === filters.state)?.label}${
                      filters.city !== "all" ? `, ${availableCities.find((c) => c.value === filters.city)?.label}` : ""
                    }`}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none h-9 px-3 ${
                    viewMode === "grid" ? "bg-primary-50 text-primary-700" : "bg-transparent"
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <rect width="7" height="7" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="14" rx="1" />
                    <rect width="7" height="7" x="3" y="14" rx="1" />
                  </svg>
                  Grid
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none h-9 px-3 ${
                    viewMode === "list" ? "bg-primary-50 text-primary-700" : "bg-transparent"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <line x1="3" x2="21" y1="6" y2="6" />
                    <line x1="3" x2="21" y1="12" y2="12" />
                    <line x1="3" x2="21" y1="18" y2="18" />
                  </svg>
                  List
                </Button>
              </div>

              <Select defaultValue="rating">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="experience">Most Experienced</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            // Loading state
            <div
              className={
                viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col space-y-4"
              }
            >
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className={`${viewMode === "grid" ? "h-64" : "h-32"} animate-pulse rounded-xl bg-gray-200`}
                  ></div>
                ))}
            </div>
          ) : filteredLawyers && filteredLawyers.length > 0 ? (
            // Lawyers grid or list
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLawyers.map((lawyer) => (
                  <LawyerCard
                    key={lawyer.id}
                    lawyer={lawyer}
                    onViewProfile={() => {
                      setSelectedLawyer(lawyer)
                      setLawyerProfileOpen(true)
                    }}
                    onBookConsultation={() => {
                      setSelectedLawyer(lawyer)
                      // Set initial consultation mode if available
                      if (lawyer.consultationModes.length > 0) {
                        setSelectedConsultationMode(lawyer.consultationModes[0])
                      }

                      // Reset form when opening dialog
                      setSelectedDate("")
                      setSelectedTime("")
                      setConsultationDuration("60")
                      setConsultationQuery("")
                      setLexiAIEnabled(true)
                      setBookingDialogOpen(true)
                    }}
                    renderStarRating={renderStarRating}
                    getBadgeColor={getBadgeColor}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {filteredLawyers.map((lawyer) => (
                  <LawyerListItem
                    key={lawyer.id}
                    lawyer={lawyer}
                    onViewProfile={() => {
                      setSelectedLawyer(lawyer)
                      setLawyerProfileOpen(true)
                    }}
                    onBookConsultation={() => {
                      setSelectedLawyer(lawyer)
                      // Set initial consultation mode if available
                      if (lawyer.consultationModes.length > 0) {
                        setSelectedConsultationMode(lawyer.consultationModes[0])
                      }

                      // Reset form when opening dialog
                      setSelectedDate("")
                      setSelectedTime("")
                      setConsultationDuration("60")
                      setConsultationQuery("")
                      setLexiAIEnabled(true)
                      setBookingDialogOpen(true)
                    }}
                    renderStarRating={renderStarRating}
                    getBadgeColor={getBadgeColor}
                  />
                ))}
              </div>
            )
          ) : (
            // No results
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No lawyers found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Try adjusting your search filters or try a different location to find lawyers that match your criteria.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  setFilters({
                    state: "all",
                    city: "all",
                    practiceArea: "all",
                    language: "all",
                    experience: "all",
                    mode: "all",
                    searchTerm: "",
                    aiAssist: false,
                  })
                }
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredLawyers && filteredLawyers.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="flex space-x-1">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-primary-50 text-primary-600">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Featured lawyers section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary-600" />
              Featured Lawyers
            </h2>
            <Button variant="ghost" className="text-primary-600 hover:text-primary-700">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredLawyers
              .filter((lawyer) => lawyer.badges.includes("Featured") || lawyer.badges.includes("Top Rated"))
              .slice(0, 3)
              .map((lawyer) => (
                <Card
                  key={lawyer.id}
                  className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="absolute inset-x-0 h-1 bg-primary-600 transform -translate-y-1 group-hover:translate-y-0 transition-transform"></div>
                  <CardContent className="p-0">
                    {/* Lawyer header with photo and verification badge */}
                    <div className="p-6 flex items-start space-x-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                          <AvatarImage src={lawyer.imageUrl || "/placeholder.svg"} alt={lawyer.name} />
                          <AvatarFallback>{lawyer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {lawyer.isVerified && (
                          <div className="absolute -right-1 -bottom-1 bg-blue-500 rounded-full p-1">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {lawyer.name}
                        </h3>
                        <p className="text-sm text-gray-500">{lawyer.specialization}</p>

                        <div className="flex items-center mt-1 space-x-1">
                          {renderStarRating(lawyer.rating)}
                          <span className="text-sm text-gray-500">
                            ({lawyer.rating}) • {lawyer.reviewCount} reviews
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lawyer details */}
                    <div className="px-6 pb-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {lawyer.location.city}, {lawyer.location.state}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{lawyer.experience} years</span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {lawyer.badges.map((badge, index) => (
                          <Badge key={index} variant="outline" className={getBadgeColor(badge)}>
                            {badge === "Top Rated" && <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />}
                            {badge === "Featured" && <Sparkles className="h-3 w-3 mr-1 text-purple-500" />}
                            {badge === "Rising Star" && <Zap className="h-3 w-3 mr-1 text-blue-500" />}
                            {badge}
                          </Badge>
                        ))}
                      </div>

                      {/* Consultation modes */}
                      <div className="flex items-center space-x-2">
                        {lawyer.consultationModes.includes("video") && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  <Video className="h-4 w-4 text-gray-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Video Call</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {lawyer.consultationModes.includes("call") && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  <Phone className="h-4 w-4 text-gray-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Phone Call</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {lawyer.consultationModes.includes("chat") && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  <MessageSquare className="h-4 w-4 text-gray-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>In-app Chat</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
                      <Button
                        variant="ghost"
                        className="rounded-none h-12 text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                        onClick={() => {
                          setSelectedLawyer(lawyer)
                          setLawyerProfileOpen(true)
                        }}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="ghost"
                        className="rounded-none h-12 text-primary-600 hover:bg-primary-50 font-medium"
                        onClick={() => {
                          setSelectedLawyer(lawyer)
                          // Set initial consultation mode if available
                          if (lawyer.consultationModes.length > 0) {
                            setSelectedConsultationMode(lawyer.consultationModes[0])
                          }

                          // Reset form when opening dialog
                          setSelectedDate("")
                          setSelectedTime("")
                          setConsultationDuration("60")
                          setConsultationQuery("")
                          setLexiAIEnabled(true)
                          setBookingDialogOpen(true)
                        }}
                      >
                        Book Consultation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Lawyer profile dialog */}
        <Dialog open={lawyerProfileOpen} onOpenChange={setLawyerProfileOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            {selectedLawyer && (
              <div className="flex flex-col h-full">
                <DialogHeader className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 border-b">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                      <AvatarImage src={selectedLawyer.imageUrl || "/placeholder.svg"} alt={selectedLawyer.name} />
                      <AvatarFallback>{selectedLawyer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <DialogTitle className="text-2xl font-bold">{selectedLawyer.name}</DialogTitle>
                        {selectedLawyer.isVerified && (
                          <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-200">
                            <Check className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <DialogDescription className="text-base mt-1">{selectedLawyer.specialization}</DialogDescription>
                      <div className="flex items-center mt-2 space-x-1">
                        {renderStarRating(selectedLawyer.rating)}
                        <span className="text-sm text-gray-500">
                          ({selectedLawyer.rating}) • {selectedLawyer.reviewCount} reviews
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Consultation Fee</p>
                      <p className="text-xl font-bold text-primary-700">₹{selectedLawyer.hourlyRate}/hour</p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-2/3 p-6">
                    <Tabs defaultValue="about">
                      <TabsList className="mb-4">
                        <TabsTrigger value="about">About</TabsTrigger>
                        <TabsTrigger value="experience">Experience</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        <TabsTrigger value="availability">Availability</TabsTrigger>
                      </TabsList>

                      <TabsContent value="about" className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">About {selectedLawyer.name}</h3>
                          <p className="text-gray-700">{selectedLawyer.bio}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                            <p className="flex items-center text-gray-900">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              {selectedLawyer.location.city}, {selectedLawyer.location.state}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Experience</h4>
                            <p className="flex items-center text-gray-900">
                              <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                              {selectedLawyer.experience} years
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Languages</h4>
                            <p className="flex items-center text-gray-900">
                              <Globe className="h-4 w-4 mr-1 text-gray-400" />
                              {selectedLawyer.languages.join(", ")}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Consultation Modes</h4>
                            <div className="flex items-center space-x-2">
                              {selectedLawyer.consultationModes.includes("video") && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  <Video className="h-3 w-3 mr-1" />
                                  Video Call
                                </Badge>
                              )}
                              {selectedLawyer.consultationModes.includes("call") && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <Phone className="h-3 w-3 mr-1" />
                                  Phone Call
                                </Badge>
                              )}
                              {selectedLawyer.consultationModes.includes("chat") && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  In-app Chat
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Practice Areas</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedLawyer.practiceAreas.map((area, index) => (
                              <Badge key={index} variant="outline" className="bg-gray-50">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Expertise</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedLawyer.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="bg-primary-50 text-primary-700">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="experience">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Professional Experience</h3>
                            <div className="space-y-4">
                              <div className="border-l-2 border-primary-200 pl-4 py-1">
                                <h4 className="font-medium">Senior Partner</h4>
                                <p className="text-sm text-gray-500">Legal Associates LLP • 2018 - Present</p>
                                <p className="text-sm text-gray-700 mt-1">
                                  Leading the {selectedLawyer.specialization} practice, managing a team of 5 associates,
                                  and handling key client relationships.
                                </p>
                              </div>
                              <div className="border-l-2 border-primary-200 pl-4 py-1">
                                <h4 className="font-medium">Associate</h4>
                                <p className="text-sm text-gray-500">
                                  Premier Law Firm • {2018 - selectedLawyer.experience} - 2018
                                </p>
                                <p className="text-sm text-gray-700 mt-1">
                                  Specialized in {selectedLawyer.practiceAreas[0]} and{" "}
                                  {selectedLawyer.practiceAreas[1] || selectedLawyer.practiceAreas[0]}, handling client
                                  consultations and case management.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-2">Education</h3>
                            <div className="space-y-4">
                              <div className="border-l-2 border-primary-200 pl-4 py-1">
                                <h4 className="font-medium">LL.B.</h4>
                                <p className="text-sm text-gray-500">
                                  National Law University • {2015 - selectedLawyer.experience} -{" "}
                                  {2018 - selectedLawyer.experience}
                                </p>
                              </div>
                              <div className="border-l-2 border-primary-200 pl-4 py-1">
                                <h4 className="font-medium">B.A. in Political Science</h4>
                                <p className="text-sm text-gray-500">
                                  Delhi University • {2012 - selectedLawyer.experience} -{" "}
                                  {2015 - selectedLawyer.experience}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="reviews">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Client Reviews</h3>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Star className="h-3.5 w-3.5 mr-1 fill-yellow-400 text-yellow-400" />
                              {selectedLawyer.rating} ({selectedLawyer.reviewCount} reviews)
                            </Badge>
                          </div>

                          <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>
                                        {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h4 className="font-medium">{["Rahul M.", "Priya S.", "Amit K."][i - 1]}</h4>
                                      <div className="flex items-center mt-0.5">
                                        {Array(5)
                                          .fill(0)
                                          .map((_, j) => (
                                            <Star
                                              key={j}
                                              className={`h-3.5 w-3.5 ${
                                                j < 5 - (i % 2) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                              }`}
                                            />
                                          ))}
                                        <span className="text-xs text-gray-500 ml-1">
                                          {["3 weeks ago", "2 months ago", "4 months ago"][i - 1]}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified Client
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 mt-2">
                                  {
                                    [
                                      `${selectedLawyer.name} provided excellent guidance on my ${selectedLawyer.practiceAreas[0]} issue. Very knowledgeable and professional.`,
                                      `Great experience working with ${selectedLawyer.name}. Helped me understand complex legal terms and provided clear advice.`,
                                      `${selectedLawyer.name} was responsive and thorough. Would definitely recommend for ${selectedLawyer.specialization} matters.`,
                                    ][i - 1]
                                  }
                                </p>
                              </div>
                            ))}
                          </div>

                          <Button variant="outline" className="w-full">
                            View All {selectedLawyer.reviewCount} Reviews
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="availability">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold mb-2">Availability</h3>

                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <CalendarClock className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-green-800">
                                {selectedLawyer.available
                                  ? "Available for immediate consultation"
                                  : "Available from next week"}
                              </h4>
                              <p className="text-sm text-green-700">
                                {selectedLawyer.available
                                  ? "You can book a consultation as soon as today"
                                  : "First available slot is on Monday, June 10"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Weekly Schedule</h4>
                            <div className="grid grid-cols-7 gap-2 text-center">
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                                <div key={day} className="space-y-1">
                                  <div className="font-medium text-sm">{day}</div>
                                  <div
                                    className={`text-xs py-1 rounded ${
                                      i < 5 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-400 line-through"
                                    }`}
                                  >
                                    {i < 5 ? "9 AM - 6 PM" : "Unavailable"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Consultation Modes</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {selectedLawyer.consultationModes.includes("video") && (
                                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                      <Video className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-blue-800">Video Call</h5>
                                      <p className="text-xs text-blue-700">₹{selectedLawyer.hourlyRate}/hour</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {selectedLawyer.consultationModes.includes("call") && (
                                <div className="border border-green-200 rounded-lg p-3 bg-green-50">
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                                      <Phone className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-green-800">Phone Call</h5>
                                      <p className="text-xs text-green-700">₹{selectedLawyer.hourlyRate}/hour</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {selectedLawyer.consultationModes.includes("chat") && (
                                <div className="border border-purple-200 rounded-lg p-3 bg-purple-50">
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                                      <MessageSquare className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-purple-800">In-app Chat</h5>
                                      <p className="text-xs text-purple-700">
                                        ₹{Math.round(selectedLawyer.hourlyRate * 0.8)}/hour
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="md:w-1/3 bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-200">
                    <div className="sticky top-6">
                      <h3 className="text-lg font-semibold mb-4">Book a Consultation</h3>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Consultation Mode</label>
                          <div className="flex flex-wrap gap-2">
                            {selectedLawyer.consultationModes.map((mode) => (
                              <button
                                key={mode}
                                className={`flex items-center justify-center px-3 py-2 rounded-lg border transition-colors ${
                                  selectedConsultationMode === mode
                                    ? "bg-primary-50 border-primary-200 text-primary-700"
                                    : "border-gray-200 hover:border-primary-200 hover:bg-gray-50"
                                }`}
                                onClick={() => setSelectedConsultationMode(mode)}
                                type="button"
                              >
                                {mode === "video" && (
                                  <>
                                    <Video className="h-4 w-4 mr-2" />
                                    <span>Video</span>
                                  </>
                                )}
                                {mode === "call" && (
                                  <>
                                    <Phone className="h-4 w-4 mr-2" />
                                    <span>Call</span>
                                  </>
                                )}
                                {mode === "chat" && (
                                  <>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    <span>Chat</span>
                                  </>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Date</label>
                            <Select value={selectedDate} onValueChange={setSelectedDate}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select date" />
                              </SelectTrigger>
                              <SelectContent>
                                {[...Array(7)].map((_, i) => {
                                  const date = new Date()
                                  date.setDate(date.getDate() + i)
                                  const dateStr = date.toISOString().split("T")[0]
                                  const formattedDate = new Intl.DateTimeFormat("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  }).format(date)

                                  return (
                                    <SelectItem key={dateStr} value={dateStr}>
                                      {formattedDate}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Time</label>
                            <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTimeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Duration</label>
                          <Select value={consultationDuration} onValueChange={setConsultationDuration}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">
                                30 minutes (₹{Math.round(selectedLawyer.hourlyRate / 2)})
                              </SelectItem>
                              <SelectItem value="60">60 minutes (₹{selectedLawyer.hourlyRate})</SelectItem>
                              <SelectItem value="90">
                                90 minutes (₹{Math.round(selectedLawyer.hourlyRate * 1.5)})
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Describe your legal issue</label>
                          <Textarea
                            placeholder="Please provide details about your legal matter..."
                            value={consultationQuery}
                            onChange={(e) => setConsultationQuery(e.target.value)}
                            rows={4}
                            className="resize-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Min. 10 characters ({consultationQuery.length}/10)
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`lexiAI-enable-${selectedLawyer.id}`}
                            checked={lexiAIEnabled}
                            onCheckedChange={(checked) => setLexiAIEnabled(!!checked)}
                          />
                          <label
                            htmlFor={`lexiAI-enable-${selectedLawyer.id}`}
                            className="text-sm cursor-pointer flex items-center"
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary-500" />
                            Enable Lexi AI assistance
                          </label>
                        </div>

                        <div className="bg-gray-100 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Consultation Fee</span>
                            <span className="font-semibold">
                              ₹{Math.round((selectedLawyer.hourlyRate * Number(consultationDuration)) / 60)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
                            <span>Platform Fee</span>
                            <span>₹{Math.round(selectedLawyer.hourlyRate * 0.05)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between items-center font-medium">
                            <span>Total</span>
                            <span className="text-lg">
                              ₹
                              {Math.round(
                                (selectedLawyer.hourlyRate * Number(consultationDuration)) / 60 +
                                  selectedLawyer.hourlyRate * 0.05,
                              )}
                            </span>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          size="lg"
                          onClick={() => handleBookConsultation(selectedLawyer.id)}
                          disabled={!canSubmitBooking}
                        >
                          {bookingInProgress ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Calendar className="h-4 w-4 mr-2" />
                              Book Consultation
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-gray-500 text-center">
                          By booking, you agree to our{" "}
                          <a href="#" className="text-primary-600 hover:underline">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="#" className="text-primary-600 hover:underline">
                            Privacy Policy
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Booking dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="max-w-md">
            {selectedLawyer && (
              <>
                <DialogHeader>
                  <DialogTitle>Book Consultation with {selectedLawyer.name}</DialogTitle>
                  <DialogDescription>Schedule a consultation in your preferred mode</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <div className="flex flex-col space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Consultation Mode</label>
                      <div className="flex space-x-2">
                        {selectedLawyer.consultationModes.map((mode) => (
                          <button
                            key={mode}
                            className={`flex items-center justify-center px-3 py-2 rounded-lg border transition-colors ${
                              selectedConsultationMode === mode
                                ? "bg-primary-50 border-primary-200 text-primary-700"
                                : "border-gray-200 hover:border-primary-200 hover:bg-gray-50"
                            }`}
                            onClick={() => setSelectedConsultationMode(mode)}
                            disabled={!selectedLawyer.consultationModes.includes(mode)}
                            type="button"
                          >
                            {mode === "video" && (
                              <>
                                <Video className="h-4 w-4 mr-2" />
                                <span>Video</span>
                              </>
                            )}
                            {mode === "call" && (
                              <>
                                <Phone className="h-4 w-4 mr-2" />
                                <span>Call</span>
                              </>
                            )}
                            {mode === "chat" && (
                              <>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                <span>Chat</span>
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Preferred Date & Time</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Select value={selectedDate} onValueChange={setSelectedDate}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select date" />
                            </SelectTrigger>
                            <SelectContent>
                              {[...Array(7)].map((_, i) => {
                                const date = new Date()
                                date.setDate(date.getDate() + i)
                                const dateStr = date.toISOString().split("T")[0]
                                const formattedDate = new Intl.DateTimeFormat("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                }).format(date)

                                return (
                                  <SelectItem key={dateStr} value={dateStr}>
                                    {formattedDate}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTimeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration</label>
                      <Select value={consultationDuration} onValueChange={setConsultationDuration}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes (₹{selectedLawyer.hourlyRate / 2})</SelectItem>
                          <SelectItem value="60">60 minutes (₹{selectedLawyer.hourlyRate})</SelectItem>
                          <SelectItem value="90">
                            90 minutes (₹{Math.round(selectedLawyer.hourlyRate * 1.5)})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Describe your legal issue</label>
                      <Textarea
                        placeholder="Please provide details about your legal matter..."
                        value={consultationQuery}
                        onChange={(e) => setConsultationQuery(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`lexiAI-enable-${selectedLawyer.id}`}
                        checked={lexiAIEnabled}
                        onCheckedChange={(checked) => setLexiAIEnabled(!!checked)}
                      />
                      <label htmlFor={`lexiAI-enable-${selectedLawyer.id}`} className="text-sm cursor-pointer">
                        Enable Lexi AI to analyze and provide insights during the consultation
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-gray-500">
                    Total:{" "}
                    <span className="font-medium text-gray-900">
                      ₹{Math.round((selectedLawyer.hourlyRate * Number(consultationDuration)) / 60)}
                    </span>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      handleBookConsultation(selectedLawyer.id)
                    }}
                    disabled={!canSubmitBooking}
                    className="px-4"
                  >
                    {bookingInProgress ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      "Book Now"
                    )}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

// Lawyer Card Component
interface LawyerCardProps {
  lawyer: any
  onViewProfile: () => void
  onBookConsultation: () => void
  renderStarRating: (rating: number) => React.ReactNode
  getBadgeColor: (badge: string) => string
}

function LawyerCard({ lawyer, onViewProfile, onBookConsultation, renderStarRating, getBadgeColor }: LawyerCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group">
      <div className="absolute inset-x-0 h-1 bg-primary-600 transform -translate-y-1 group-hover:translate-y-0 transition-transform"></div>
      <CardContent className="p-0">
        {/* Lawyer header with photo and verification badge */}
        <div className="p-6 flex items-start space-x-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
              <AvatarImage src={lawyer.imageUrl || "/placeholder.svg"} alt={lawyer.name} />
              <AvatarFallback>{lawyer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {lawyer.isVerified && (
              <div className="absolute -right-1 -bottom-1 bg-blue-500 rounded-full p-1">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {lawyer.name}
            </h3>
            <p className="text-sm text-gray-500">{lawyer.specialization}</p>

            <div className="flex items-center mt-1 space-x-1">
              {renderStarRating(lawyer.rating)}
              <span className="text-sm text-gray-500">
                ({lawyer.rating}) • {lawyer.reviewCount} reviews
              </span>
            </div>
          </div>
        </div>

        {/* Lawyer details */}
        <div className="px-6 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {lawyer.location.city}, {lawyer.location.state}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{lawyer.experience} years</span>
            </div>

            <div className="flex items-center space-x-2">
              <Languages className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {lawyer.languages.slice(0, 2).join(", ")}
                {lawyer.languages.length > 2 ? "..." : ""}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">₹{lawyer.hourlyRate}/hour</span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {lawyer.badges.slice(0, 2).map((badge: string, index: number) => (
              <Badge key={index} variant="outline" className={getBadgeColor(badge)}>
                {badge === "Top Rated" && <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />}
                {badge === "Featured" && <Sparkles className="h-3 w-3 mr-1 text-purple-500" />}
                {badge === "Rising Star" && <Zap className="h-3 w-3 mr-1 text-blue-500" />}
                {badge}
              </Badge>
            ))}
            {/* Availability badge */}
            <Badge
              variant="outline"
              className={
                lawyer.available !== undefined && lawyer.available
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }
            >
              {lawyer.available !== undefined && lawyer.available ? "Available Now" : "Available in 3 days"}
            </Badge>
          </div>

          {/* Consultation modes */}
          <div className="flex items-center space-x-2">
            {lawyer.consultationModes.includes("video") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Video className="h-4 w-4 text-gray-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Video Call</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {lawyer.consultationModes.includes("call") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-gray-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Phone Call</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {lawyer.consultationModes.includes("chat") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-gray-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>In-app Chat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
          <Button
            variant="ghost"
            className="rounded-none h-12 text-gray-600 hover:text-primary-600 hover:bg-primary-50"
            onClick={onViewProfile}
          >
            View Profile
          </Button>
          <Button
            variant="ghost"
            className="rounded-none h-12 text-primary-600 hover:bg-primary-50 font-medium"
            onClick={onBookConsultation}
          >
            Book Consultation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Lawyer List Item Component
interface LawyerListItemProps {
  lawyer: any
  onViewProfile: () => void
  onBookConsultation: () => void
  renderStarRating: (rating: number) => React.ReactNode
  getBadgeColor: (badge: string) => string
}

function LawyerListItem({
  lawyer,
  onViewProfile,
  onBookConsultation,
  renderStarRating,
  getBadgeColor,
}: LawyerListItemProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group">
      <div className="absolute left-0 inset-y-0 w-1 bg-primary-600 transform -translate-x-1 group-hover:translate-x-0 transition-transform"></div>
      <CardContent className="p-0">
        <div className="p-4 flex flex-col md:flex-row md:items-center">
          <div className="flex items-start space-x-4 mb-4 md:mb-0 md:w-1/3">
            <div className="relative">
              <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                <AvatarImage src={lawyer.imageUrl || "/placeholder.svg"} alt={lawyer.name} />
                <AvatarFallback>{lawyer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {lawyer.isVerified && (
                <div className="absolute -right-1 -bottom-1 bg-blue-500 rounded-full p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {lawyer.name}
              </h3>
              <p className="text-sm text-gray-500">{lawyer.specialization}</p>
              <div className="flex items-center mt-1 space-x-1">
                {renderStarRating(lawyer.rating)}
                <span className="text-sm text-gray-500">({lawyer.rating})</span>
              </div>
            </div>
          </div>

          <div className="md:w-1/3 mb-4 md:mb-0">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {lawyer.location.city}, {lawyer.location.state}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{lawyer.experience} years</span>
              </div>

              <div className="flex items-center space-x-2">
                <Languages className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {lawyer.languages.slice(0, 2).join(", ")}
                  {lawyer.languages.length > 2 ? "..." : ""}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">₹{lawyer.hourlyRate}/hour</span>
              </div>
            </div>
          </div>

          <div className="md:w-1/3 flex flex-col md:flex-row md:items-center md:justify-end gap-3">
            <div className="flex flex-wrap gap-2 mb-3 md:mb-0">
              {lawyer.consultationModes.includes("video") && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Video className="h-3 w-3 mr-1" />
                  Video
                </Badge>
              )}
              {lawyer.consultationModes.includes("call") && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Badge>
              )}
              {lawyer.consultationModes.includes("chat") && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={onViewProfile}>
                View Profile
              </Button>
              <Button size="sm" className="flex-1 md:flex-none" onClick={onBookConsultation}>
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
