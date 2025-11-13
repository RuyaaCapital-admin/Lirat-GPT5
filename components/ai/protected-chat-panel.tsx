"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, LogIn } from "lucide-react"
import { LiiratChatPanel } from "./chat-panel"

export function ProtectedChatPanel() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <CardContent className="text-center space-y-4 p-6">
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please sign in to access the AI chat assistant
          </CardDescription>
          <Button onClick={() => router.push("/auth/login")}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  return <LiiratChatPanel />
}

