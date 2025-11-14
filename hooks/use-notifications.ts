"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClientSupabase } from "@/lib/supabase-client"

export type NotificationRecord = {
  id: string
  title: string
  body: string
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export function useNotifications(userId?: string) {
  const supabase = createClientSupabase()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
    if (error) {
      console.error("[notifications] fetch failed", error)
    } else if (data) {
      setNotifications(data as NotificationRecord[])
    }
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNotifications, supabase, userId])

  const markAsRead = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)
      if (error) {
        console.error("[notifications] markAsRead failed", error)
      } else {
        setNotifications((prev) => prev.map((record) => (record.id === id ? { ...record, is_read: true } : record)))
      }
    },
    [supabase],
  )

  const unreadCount = useMemo(() => notifications.filter((note) => !note.is_read).length, [notifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refetch: fetchNotifications,
  }
}

