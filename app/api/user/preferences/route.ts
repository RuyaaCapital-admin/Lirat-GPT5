import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

type PreferencesPayload = {
  locale?: "en" | "ar"
  theme?: "light" | "dark" | "system"
  notificationSettings?: {
    email?: boolean
    push?: boolean
  }
}

async function resolveUser(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing bearer token" }
  }
  const token = authHeader.replace("Bearer ", "")
  const supabase = createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  if (error || !user) {
    return { error: "Unable to verify user" }
  }
  return { supabase, user }
}

const DEFAULT_PREFS = {
  locale: "en",
  theme: "light",
  notification_settings: {
    email: true,
    push: true,
  },
}

export async function GET(req: Request) {
  const resolved = await resolveUser(req)
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 401 })
  }

  const { supabase, user } = resolved
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("[preferences] fetch failed", error)
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json(DEFAULT_PREFS)
  }

  return NextResponse.json({
    locale: data.locale ?? "en",
    theme: data.theme ?? "light",
    notification_settings: data.notification_settings ?? DEFAULT_PREFS.notification_settings,
  })
}

export async function PUT(req: Request) {
  const resolved = await resolveUser(req)
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 401 })
  }

  const { supabase, user } = resolved
  let body: PreferencesPayload = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  const localeUpdate =
    body.locale && ["en", "ar"].includes(body.locale) ? body.locale : existing?.locale ?? "en"
  const themeUpdate =
    body.theme && ["light", "dark", "system"].includes(body.theme) ? body.theme : existing?.theme ?? "light"

  const notificationUpdate = {
    email:
      body.notificationSettings?.email ??
      existing?.notification_settings?.email ??
      DEFAULT_PREFS.notification_settings.email,
    push:
      body.notificationSettings?.push ??
      existing?.notification_settings?.push ??
      DEFAULT_PREFS.notification_settings.push,
  }

  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: user.id,
        locale: localeUpdate,
        theme: themeUpdate,
        notification_settings: notificationUpdate,
      },
      { onConflict: "user_id" },
    )

  if (error) {
    console.error("[preferences] update failed", error)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
