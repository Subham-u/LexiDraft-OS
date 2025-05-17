"use client"

import { useLocation } from "wouter"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  CalendarClock,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Timer,
} from "lucide-react"
import { format, isPast, isToday, isTomorrow, addHours, differenceInMinutes, differenceInHours } from "date-fns"
import { useState, useEffect } from "react"

interface Consultation {
  id: number
  lawyerId: number
  title: string
  date: string
  duration: number
  mode: "video" | "call" | "chat"
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  lawyerName: string
  lawyerImageUrl: string
}

export default function UpcomingConsultations() {
  const [, setLocation] = useLocation()
  const [filter, setFilter] = useState<"all" | "today" | "upcoming">("all")
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Fetch upcoming consultations
  const { data: consultations, isLoading } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations"],
    staleTime: 60000, // 1 minute
  })

  // Sort consultations by date and filter for upcoming ones
  const upcomingConsultations = consultations
    ?.filter(
      (consultation) =>
        consultation.status !== "completed" &&
        consultation.status !== "cancelled" &&
        !isPast(new Date(new Date(consultation.date).getTime() + consultation.duration * 60000)),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Filter consultations based on tab selection
  const filteredConsultations = upcomingConsultations?.filter((consultation) => {
    const consultationDate = new Date(consultation.date)
    if (filter === "today") return isToday(consultationDate)
    if (filter === "upcoming") return !isToday(consultationDate)
    return true
  })

  // Format time from date string
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "h:mm a")
  }

  // Format date in a more readable way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "EEE, MMM d")
  }

  // Get consultation status text and color
  const getStatusInfo = (consultation: Consultation) => {
    const startDate = new Date(consultation.date)
    const endDate = new Date(startDate.getTime() + consultation.duration * 60000)
    const now = currentTime

    if (consultation.status === "in_progress" || (now >= startDate && now <= endDate)) {
      return {
        text: "In Progress",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <Timer className="h-3 w-3 mr-1" />,
      }
    } else if (isToday(startDate)) {
      const minutesToStart = differenceInMinutes(startDate, now)
      if (minutesToStart < 30) {
        return {
          text: `In ${minutesToStart} min`,
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
        }
      }
      return {
        text: "Today",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      }
    } else if (isTomorrow(startDate)) {
      return {
        text: "Tomorrow",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Calendar className="h-3 w-3 mr-1" />,
      }
    } else {
      return {
        text: format(startDate, "MMM d"),
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <Calendar className="h-3 w-3 mr-1" />,
      }
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "video":
        return <Video className="h-4 w-4 text-blue-500" />
      case "call":
        return <Phone className="h-4 w-4 text-green-500" />
      case "chat":
        return <MessageSquare className="h-4 w-4 text-purple-500" />
      default:
        return null
    }
  }

  const getModeText = (mode: string) => {
    switch (mode) {
      case "video":
        return "Video Call"
      case "call":
        return "Phone Call"
      case "chat":
        return "Chat Session"
      default:
        return "Consultation"
    }
  }

  // For demo purposes, create some sample consultations if none exist
  const demoConsultations: Consultation[] = [
    {
      id: 1,
      lawyerId: 1,
      title: "Initial Legal Consultation",
      date: addHours(new Date(), 2).toISOString(),
      duration: 60,
      mode: "video",
      status: "scheduled",
      lawyerName: "Priya Sharma",
      lawyerImageUrl: "https://randomuser.me/api/portraits/women/45.jpg",
    },
    {
      id: 2,
      lawyerId: 2,
      title: "Contract Review Discussion",
      date: addHours(new Date(), 26).toISOString(),
      duration: 30,
      mode: "call",
      status: "scheduled",
      lawyerName: "Rahul Verma",
      lawyerImageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      id: 3,
      lawyerId: 3,
      title: "Legal Strategy Session",
      date: addHours(new Date(), 50).toISOString(),
      duration: 45,
      mode: "chat",
      status: "scheduled",
      lawyerName: "Aisha Patel",
      lawyerImageUrl: "https://randomuser.me/api/portraits/women/63.jpg",
    },
  ]

  const consultationsToShow = filteredConsultations?.length
    ? filteredConsultations.slice(0, 3)
    : demoConsultations.filter((consultation) => {
        const consultationDate = new Date(consultation.date)
        if (filter === "today") return isToday(consultationDate)
        if (filter === "upcoming") return !isToday(consultationDate)
        return true
      })

  // Calculate time until next consultation
  const getTimeUntilNext = () => {
    if (!consultationsToShow.length) return null

    const nextConsultation = consultationsToShow[0]
    const startDate = new Date(nextConsultation.date)
    const now = currentTime

    if (isPast(startDate)) return null

    const hoursUntil = differenceInHours(startDate, now)
    const minutesUntil = differenceInMinutes(startDate, now) % 60

    if (hoursUntil > 0) {
      return `${hoursUntil}h ${minutesUntil}m until next consultation`
    } else {
      return `${minutesUntil}m until next consultation`
    }
  }

  const timeUntilNext = getTimeUntilNext()

  return (
    <Card className="overflow-hidden border-gray-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <CalendarClock className="h-5 w-5 mr-2 text-blue-600" />
            <span>Upcoming Consultations</span>
            {upcomingConsultations?.length ? (
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                {upcomingConsultations.length}
              </Badge>
            ) : null}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            onClick={() => setLocation("/lawyers")}
          >
            <Plus className="h-3.5 w-3.5" />
            Book New
          </Button>
        </div>

        {timeUntilNext && (
          <div className="mt-2 text-xs text-blue-700 bg-blue-100 py-1 px-2 rounded-md flex items-center w-fit">
            <Clock className="h-3 w-3 mr-1" />
            {timeUntilNext}
          </div>
        )}

        <Tabs defaultValue="all" className="mt-3" onValueChange={(value) => setFilter(value as any)}>
          <TabsList className="bg-white/50 border">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="today" className="text-xs">
              Today
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs">
              Upcoming
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className={isLoading ? "p-6" : "p-0"}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-sm text-gray-500">Loading your consultations...</p>
          </div>
        ) : consultationsToShow.length === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-2 text-gray-900 font-medium">No {filter !== "all" ? filter : ""} consultations</h3>
            <p className="mt-1 text-gray-500 text-sm max-w-xs mx-auto">
              {filter === "today"
                ? "You don't have any consultations scheduled for today."
                : filter === "upcoming"
                  ? "You don't have any upcoming consultations scheduled."
                  : "Book a consultation with a lawyer for legal advice and support."}
            </p>
            <Button className="mt-4" onClick={() => setLocation("/lawyers")}>
              Find a Lawyer
            </Button>
          </div>
        ) : (
          <div>
            {consultationsToShow.map((consultation, index) => {
              const statusInfo = getStatusInfo(consultation)
              const isFirst = index === 0
              const consultationDate = new Date(consultation.date)
              const startTime = formatTime(consultation.date)
              const endTime = formatTime(
                new Date(consultationDate.getTime() + consultation.duration * 60000).toISOString(),
              )

              return (
                <div
                  key={consultation.id}
                  className={`relative ${
                    isFirst ? "border-l-4 border-blue-500" : "border-l-4 border-transparent"
                  } hover:bg-gray-50 transition-all duration-200 group`}
                >
                  {/* Hover indicator */}
                  <div className="absolute inset-y-0 right-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div
                    className="flex p-4 cursor-pointer"
                    onClick={() => setLocation(`/consultation/${consultation.id}`)}
                  >
                    <div className="relative mr-4 flex-shrink-0">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage
                          src={consultation.lawyerImageUrl || "/placeholder.svg"}
                          alt={consultation.lawyerName}
                        />
                        <AvatarFallback>{consultation.lawyerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-white shadow-sm">
                        {getModeIcon(consultation.mode)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 truncate">{consultation.title}</h4>
                        <Badge
                          variant="outline"
                          className={`ml-2 flex items-center whitespace-nowrap ${statusInfo.color}`}
                        >
                          {statusInfo.icon}
                          {statusInfo.text}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">with {consultation.lawyerName}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>
                            {formatDate(consultation.date)}, {startTime} - {endTime}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs bg-gray-50">
                          {getModeText(consultation.mode)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {isFirst && (
                    <div className="px-4 pb-3 -mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onClick={() => setLocation(`/consultation/${consultation.id}`)}
                      >
                        {isToday(consultationDate) && differenceInMinutes(consultationDate, currentTime) < 30
                          ? "Join Now"
                          : "View Details"}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
      {consultationsToShow.length > 0 && (
        <CardFooter className="border-t bg-gray-50 py-2 px-4 flex justify-center">
          <Button
            variant="ghost"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
            onClick={() => setLocation("/consultations")}
          >
            View all consultations
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
