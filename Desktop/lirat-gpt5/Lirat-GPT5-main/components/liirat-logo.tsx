import Image from "next/image"
import { cn } from "@/lib/utils"

interface LiiratLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function LiiratLogo({ className, size = "md", showText = true }: LiiratLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/images/liirat-logo.png"
        alt="LIIRAT"
        width={64}
        height={64}
        className={cn(sizeClasses[size], "object-contain")}
        priority
      />
      {showText && (
        <span className="font-bold text-xl bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
          LIIRAT
        </span>
      )}
    </div>
  )
}
