"use client"

import { useQuery } from "@tanstack/react-query"
import { FileText, Edit3, CheckCircle, Clock, TrendingUp, TrendingDown, ArrowRight, BarChart3 } from 'lucide-react'
import { useState } from "react"
import { DashboardStats } from "@/types"

export default function Stats() {
  const [timeframe, setTimeframe] = useState("week")

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats", timeframe],
    staleTime: 60000, // 1 minute
  })

  const defaultStats = {
    totalContracts: 0,
    drafts: 0,
    signed: 0,
    pending: 0
  }

  // Create a safe version of the stats that includes our trends
  const displayStats = stats || defaultStats

  // Mock trends data - separate from the actual stats data to avoid the error
  const mockTrends = {
    totalContracts: { change: 12, direction: "up" },
    drafts: { change: 5, direction: "up" },
    signed: { change: 18, direction: "up" },
    pending: { change: 3, direction: "down" },
  }

  // Mini sparkline data (mock data for visualization)
  const sparklines = {
    totalContracts: [3, 7, 5, 9, 6, 8, 10],
    drafts: [2, 3, 1, 4, 2, 5, 3],
    signed: [1, 2, 4, 3, 5, 4, 6],
    pending: [2, 3, 2, 1, 2, 1, 0],
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-urbanist text-xl font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary-600" />
          Your Activity
        </h2>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 text-sm">
          <button
            className={`px-3 py-1 rounded-md transition-all ${timeframe === "week" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:bg-gray-200"}`}
            onClick={() => setTimeframe("week")}
          >
            Week
          </button>
          <button
            className={`px-3 py-1 rounded-md transition-all ${timeframe === "month" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:bg-gray-200"}`}
            onClick={() => setTimeframe("month")}
          >
            Month
          </button>
          <button
            className={`px-3 py-1 rounded-md transition-all ${timeframe === "year" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:bg-gray-200"}`}
            onClick={() => setTimeframe("year")}
          >
            Year
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Enhanced skeleton loader
          Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm overflow-hidden relative"
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                    <div className="mt-2 h-7 w-16 animate-pulse rounded bg-gray-200"></div>
                  </div>
                </div>
                <div className="mt-4 h-10 w-full animate-pulse rounded bg-gray-100"></div>
                <div className="absolute top-0 right-0 h-2 w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent animate-pulse"></div>
              </div>
            ))
        ) : (
          <>
            <StatCard
              title="Total Contracts"
              value={displayStats.totalContracts}
              icon={<FileText className="h-5 w-5" />}
              color="primary"
              trend={mockTrends.totalContracts}
              sparklineData={sparklines.totalContracts}
            />

            <StatCard
              title="Drafts"
              value={displayStats.drafts}
              icon={<Edit3 className="h-5 w-5" />}
              color="indigo"
              trend={mockTrends.drafts}
              sparklineData={sparklines.drafts}
            />

            <StatCard
              title="Signed"
              value={displayStats.signed}
              icon={<CheckCircle className="h-5 w-5" />}
              color="green"
              trend={mockTrends.signed}
              sparklineData={sparklines.signed}
            />

            <StatCard
              title="Pending"
              value={displayStats.pending}
              icon={<Clock className="h-5 w-5" />}
              color="amber"
              trend={mockTrends.pending}
              sparklineData={sparklines.pending}
            />
          </>
        )}
      </div>
    </div>
  )
}

const StatCard = ({ title, value, icon, color, trend, sparklineData }) => {
  // Color schemes for different stat types
  const colorSchemes = {
    primary: {
      bg: "bg-primary-50",
      text: "text-primary-600",
      border: "border-primary-100",
      hover: "group-hover:bg-primary-100",
      sparkline: "#4f46e5",
    },
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-100",
      hover: "group-hover:bg-indigo-100",
      sparkline: "#6366f1",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      border: "border-green-100",
      hover: "group-hover:bg-green-100",
      sparkline: "#10b981",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
      hover: "group-hover:bg-amber-100",
      sparkline: "#f59e0b",
    },
  }

  const scheme = colorSchemes[color]

  // Calculate sparkline points
  const maxValue = Math.max(...sparklineData)
  const points = sparklineData
    .map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * 100
      const y = 100 - (value / maxValue) * 80 // Keep within 80% of height for better visibility
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div
      className={`group rounded-xl border ${scheme.border} bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden`}
    >
      {/* Top accent line with animation */}
      <div
        className={`absolute top-0 left-0 h-1 w-full ${scheme.bg} ${scheme.hover} transition-colors duration-300`}
      ></div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${scheme.bg} ${scheme.hover} transition-colors duration-300`}
          >
            <div className={scheme.text}>{icon}</div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <div className="flex items-baseline">
              <p className="font-urbanist text-2xl font-semibold text-gray-900">{value}</p>

              {/* Trend indicator */}
              {trend && (
                <div
                  className={`ml-2 flex items-center text-xs font-medium ${trend.direction === "up" ? "text-green-600" : "text-red-600"}`}
                >
                  {trend.direction === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {trend.change}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mini sparkline chart */}
      <div className="mt-4 h-12 w-full relative">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
          {/* Gradient for the area under the line */}
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={scheme.sparkline} stopOpacity="0.3" />
              <stop offset="100%" stopColor={scheme.sparkline} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area under the sparkline */}
          <polygon points={`0,100 ${points} 100,100`} fill={`url(#gradient-${color})`} />

          {/* The sparkline itself */}
          <polyline
            points={points}
            fill="none"
            stroke={scheme.sparkline}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* Highlight the last point */}
          <circle
            cx={100}
            cy={points.split(" ").pop().split(",")[1]}
            r="2"
            fill="white"
            stroke={scheme.sparkline}
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* View details link */}
      <div
        className={`mt-2 flex items-center justify-end text-xs font-medium ${scheme.text} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      >
        View details <ArrowRight className="h-3 w-3 ml-1" />
      </div>
    </div>
  )
}

