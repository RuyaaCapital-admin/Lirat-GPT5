import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface ModernPanelProps {
  children: ReactNode
  className?: string
  gradient?: boolean
}

export function ModernPanel({ children, className, gradient = false }: ModernPanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm",
        "backdrop-blur-sm",
        gradient && "bg-gradient-to-br from-card to-card/50",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ModernPanelHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}>{children}</div>
}

export function ModernPanelTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h3>
}

export function ModernPanelContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>
}
