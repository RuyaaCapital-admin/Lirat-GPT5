import { createServerClient } from "@/lib/supabase"

type NotificationInput = {
  userId: string
  title: string
  body: string
  metadata?: Record<string, unknown>
}

export async function insertNotification({ userId, title, body, metadata }: NotificationInput) {
  const supabase = createServerClient()
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    body,
    metadata: metadata ?? null,
  })

  if (error) {
    console.error("[notifications] failed to insert", error)
    throw error
  }
}

