"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCheck, Loader2, Shield } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useLocale as useLocaleContext } from "@/hooks/use-locale"

type Preferences = {
  locale: "en" | "ar"
  theme: "light" | "dark" | "system"
  notification_settings: {
    email: boolean
    push: boolean
  }
}

const DEFAULT_PREFS: Preferences = {
  locale: "en",
  theme: "light",
  notification_settings: {
    email: true,
    push: true,
  },
}

export default function ProfilePage() {
  const { user, session, loading: authLoading, signOut } = useAuth()
  const { notifications, unreadCount, loading: notificationsLoading, markAsRead, refetch } = useNotifications(user?.id)
  const { setTheme } = useTheme()
  const { setLocale } = useLocaleContext()
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFS)
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadPreferences = async () => {
      if (!session?.access_token) {
        setPrefsLoading(false)
        return
      }
      try {
        setPrefsLoading(true)
        const response = await fetch("/api/user/preferences", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
        if (!response.ok) {
          throw new Error("Failed to load preferences")
        }
        const data = await response.json()
        const nextPrefs: Preferences = {
          locale: data.locale ?? "en",
          theme: data.theme ?? "light",
          notification_settings: {
            email: data.notification_settings?.email ?? true,
            push: data.notification_settings?.push ?? true,
          },
        }
        setPreferences(nextPrefs)
        setTheme(nextPrefs.theme)
        setLocale(nextPrefs.locale)
      } catch (error) {
        console.error("[profile] preferences fetch failed", error)
      } finally {
        setPrefsLoading(false)
      }
    }

    loadPreferences()
  }, [session?.access_token])

  const handleSavePreferences = async () => {
    if (!session?.access_token) return
    setSaving(true)
    setSaveMessage(null)
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          locale: preferences.locale,
          theme: preferences.theme,
          notificationSettings: preferences.notification_settings,
        }),
      })
      if (!response.ok) {
        throw new Error("Unable to save preferences")
      }
      setSaveMessage("Preferences saved")
    } catch (error) {
      console.error("[profile] save prefs failed", error)
      setSaveMessage("Could not save preferences, please try again.")
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(null), 3500)
    }
  }

  const unreadLabel = useMemo(() => {
    if (notificationsLoading) return "Syncing alerts…"
    if (unreadCount === 0) return "All caught up"
    return `${unreadCount} new alert${unreadCount > 1 ? "s" : ""}`
  }, [notificationsLoading, unreadCount])

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold">You need to sign in to manage your profile.</p>
        <Link href="/auth/login">
          <Button>Go to login</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-border/60 bg-card/80 p-6 shadow-lg dark:border-white/10 dark:bg-card/40">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Profile</p>
            <h1 className="text-3xl font-semibold text-foreground">Account overview</h1>
            <p className="text-sm text-muted-foreground">Manage your preferences and notification center.</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.5fr_0.5fr]">
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-md dark:border-white/10 dark:bg-card/40">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Preferences</p>
            <h2 className="text-xl font-semibold">Workspace</h2>
          </div>
          {prefsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading preferences…
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Locale</p>
                <Select
                  value={preferences.locale}
                  onValueChange={(value: "en" | "ar") => {
                    setPreferences((prev) => ({ ...prev, locale: value }))
                    setLocale(value)
                  }}
                >
                  <SelectTrigger className="w-full justify-between">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Theme</p>
                <Select
                  value={preferences.theme}
                  onValueChange={(value: "light" | "dark" | "system") => {
                    setTheme(value)
                    setPreferences((prev) => ({ ...prev, theme: value }))
                  }}
                >
                  <SelectTrigger className="w-full justify-between">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Alerts</p>
                <div className="grid gap-2">
                  <button
                    type="button"
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition",
                      preferences.notification_settings.email
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                    onClick={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        notification_settings: {
                          ...prev.notification_settings,
                          email: !prev.notification_settings.email,
                        },
                      }))
                    }
                  >
                    <span>Email updates</span>
                    <span className="text-xs uppercase tracking-[0.3em]">
                      {preferences.notification_settings.email ? "ON" : "OFF"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition",
                      preferences.notification_settings.push
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                    onClick={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        notification_settings: {
                          ...prev.notification_settings,
                          push: !prev.notification_settings.push,
                        },
                      }))
                    }
                  >
                    <span>Push alerts</span>
                    <span className="text-xs uppercase tracking-[0.3em]">
                      {preferences.notification_settings.push ? "ON" : "OFF"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSavePreferences} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
                {saveMessage && <span className="text-xs text-muted-foreground">{saveMessage}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-md dark:border-white/10 dark:bg-card/40">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Notifications</p>
              <h2 className="text-xl font-semibold">Agent alerts</h2>
            </div>
            <div className="text-right text-xs text-muted-foreground">{unreadLabel}</div>
          </div>
          {notificationsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Syncing notifications…
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts from the agent yet.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-sm transition",
                    note.is_read
                      ? "border-transparent bg-muted/40 text-muted-foreground"
                      : "border-primary/20 bg-primary/5 text-foreground",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{note.title}</p>
                      <p className="text-xs text-muted-foreground">{note.body}</p>
                    </div>
                    {!note.is_read && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead(note.id)}>
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await Promise.all(
                      notifications.filter((note) => !note.is_read).map((note) => markAsRead(note.id)),
                    )
                    refetch()
                  }}
                  className="w-full"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-md dark:border-white/10 dark:bg-card/40">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary dark:bg-primary/15">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Account security</h3>
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-semibold text-foreground">{user.email}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
