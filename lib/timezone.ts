"use client"

import { convertToEnglishNumbers } from "./i18n"

/**
 * Convert UTC time to user's local timezone
 */
export function convertUTCToLocalTime(dateString: string, timeString?: string): string {
  try {
    // Combine date and time strings
    let fullDateTime = dateString
    if (timeString) {
      fullDateTime = `${dateString}T${timeString}:00Z`
    } else {
      fullDateTime = `${dateString}T00:00:00Z`
    }

    const date = new Date(fullDateTime)

    // Get user's timezone offset
    const userLocale = navigator.language || "en-US"

    return convertToEnglishNumbers(
      date.toLocaleString(userLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
      }),
    )
  } catch (error) {
    console.error("[v0] Timezone conversion error:", error)
    return dateString
  }
}

/**
 * Convert UTC time to user's local timezone (Arabic format)
 */
export function convertUTCToLocalTimeArabic(dateString: string, timeString?: string): string {
  try {
    let fullDateTime = dateString
    if (timeString) {
      fullDateTime = `${dateString}T${timeString}:00Z`
    } else {
      fullDateTime = `${dateString}T00:00:00Z`
    }

    const date = new Date(fullDateTime)

    return convertToEnglishNumbers(
      date.toLocaleString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
      }),
    )
  } catch (error) {
    console.error("[v0] Timezone conversion error:", error)
    return dateString
  }
}

/**
 * Get user's timezone abbreviation
 */
export function getUserTimezoneAbbr(): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZoneName: "short",
  })
  const parts = formatter.formatToParts(new Date())
  const tzPart = parts.find((p) => p.type === "timeZoneName")
  return tzPart ? tzPart.value : "UTC"
}
