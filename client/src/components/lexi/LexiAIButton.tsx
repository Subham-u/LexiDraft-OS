import { Search, Sparkles, Zap, MessageSquare } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useLexiAI } from "@/context/LexiAIContext"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface LexiAIButtonProps {
  variant?: "default" | "subtle" | "outline" | "text" | "gradient"
  size?: "default" | "sm" | "icon" | "lg"
  className?: string
  contextInfo?: {
    highlightedText?: string
    currentClause?: string
    contractTitle?: string
    contractType?: string
  }
  pulseAnimation?: boolean
}

export default function LexiAIButton({
  variant = "default",
  size = "default",
  className,
  contextInfo,
  pulseAnimation = false,
}: LexiAIButtonProps) {
  const { openSidebar } = useLexiAI()
  const [isHovered, setIsHovered] = useState(false)
  const [isPulsing, setIsPulsing] = useState(pulseAnimation)

  // Stop pulsing animation after a few pulses if enabled
  useEffect(() => {
    if (pulseAnimation) {
      const timer = setTimeout(() => {
        setIsPulsing(false)
      }, 10000) // Stop pulsing after 10 seconds
      return () => clearTimeout(timer)
    }
  }, [pulseAnimation])

  const handleClick = () => {
    openSidebar(contextInfo)
    setIsPulsing(false) // Stop pulsing when clicked
  }

  // When used in the main header, we'll show a different style
  if (variant === "text" && size === "sm") {
    return (
      <button
        type="button"
        className={cn(
          "flex items-center text-blue-600 text-sm font-medium group transition-all duration-200",
          className
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span
          className={`relative h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-1.5 group-hover:bg-blue-200 transition-colors duration-200 ${
            isPulsing ? "animate-pulse" : ""
          }`}
        >
          {isHovered ? (
            <Sparkles className="h-3 w-3 text-blue-600" />
          ) : (
            <Search className="h-3 w-3 text-blue-600" />
          )}
          {isPulsing && (
            <span className="absolute inset-0 rounded-full bg-blue-200 animate-ping opacity-75"></span>
          )}
        </span>
        Ask Lexi AI
      </button>
    )
  }

  let buttonStyle
  switch (variant) {
    case "default":
      buttonStyle =
        "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:shadow-inner"
      break
    case "subtle":
      buttonStyle = "bg-blue-100 hover:bg-blue-200 text-blue-700"
      break
    case "outline":
      buttonStyle = "border border-blue-300 hover:bg-blue-50 text-blue-700"
      break
    case "text":
      buttonStyle = "hover:bg-blue-50 text-blue-700"
      break
    case "gradient":
      buttonStyle =
        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md"
      break
    default:
      buttonStyle =
        "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:shadow-inner"
  }

  let buttonSize
  switch (size) {
    case "default":
      buttonSize = "h-10 px-4 py-2"
      break
    case "sm":
      buttonSize = "h-8 px-3 py-1 text-sm"
      break
    case "lg":
      buttonSize = "h-12 px-5 py-3 text-lg"
      break
    case "icon":
      buttonSize = "h-9 w-9 p-0"
      break
    default:
      buttonSize = "h-10 px-4 py-2"
  }

  // Choose icon based on hover state
  const IconComponent = isHovered ? Zap : Sparkles

  const buttonContent = (
    <Button
      type="button"
      className={cn(
        buttonStyle,
        buttonSize,
        "transition-all duration-200 relative overflow-hidden group",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background effect on hover */}
      {variant === "gradient" && (
        <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
      )}

      {/* Pulse animation */}
      {isPulsing && (
        <span className="absolute inset-0 bg-white/20 animate-pulse rounded-md pointer-events-none"></span>
      )}

      <span className="relative flex items-center justify-center">
        <IconComponent
          className={cn(
            "transition-all duration-200",
            size === "icon" ? "h-4 w-4" : "h-4 w-4 mr-2",
            isHovered ? "scale-110 rotate-3" : "scale-100 rotate-0"
          )}
        />
        {size !== "icon" && (
          <span className="flex items-center">
            Ask Lexi AI
            {isHovered && <MessageSquare className="ml-1.5 h-3 w-3 opacity-70" />}
          </span>
        )}
      </span>
    </Button>
  )

  if (size === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Ask Lexi AI</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return buttonContent
}
