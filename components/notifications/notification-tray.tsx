"use client"

import { Bell, CheckCheck } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NotificationTray({ className }: { className?: string }) {
  const { user } = useAuth()
  const { notifications, unreadCount, loading, markAsRead } = useNotifications(user?.id)

  if (!user) {
    return null
  }

  const topThree = notifications.slice(0, 3)

  return (
    <div
      className={cn(
        "rounded-3xl border border-emerald-100/70 bg-white/90 px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-emerald-500/20 dark:bg-[#0a1510]/80 dark:shadow-[0_24px_70px_rgba(5,10,7,0.7)]",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-muted-foreground">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span>{loading ? "Syncing notifications…" : "Market alerts"}</span>
        </div>
        {unreadCount > 0 && (
          <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
            {unreadCount} NEW
          </span>
        )}
      </div>

      {topThree.length === 0 ? (
        <p className="text-xs text-muted-foreground">No alerts from the agent yet.</p>
      ) : (
        <div className="space-y-2">
          {topThree.map((note) => (
            <div
              key={note.id}
              className={cn(
                "rounded-2xl border px-3 py-2 text-xs",
                note.is_read
                  ? "border-transparent bg-muted/40 text-muted-foreground"
                  : "border-primary/20 bg-primary/5 text-foreground",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{note.title}</p>
                {!note.is_read && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    aria-label="Mark notification as read"
                    onClick={() => markAsRead(note.id)}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{note.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

