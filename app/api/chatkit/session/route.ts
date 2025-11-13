import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    const workflowId = process.env.CHATKIT_WORKFLOW_ID

    if (!apiKey) {
      console.error("[ChatKit] OPENAI_API_KEY is missing")
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 })
    }

    if (!workflowId) {
      console.error("[ChatKit] CHATKIT_WORKFLOW_ID is missing")
      return NextResponse.json({ error: "CHATKIT_WORKFLOW_ID is not configured" }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey,
    })

    const session = await openai.chatkit.sessions.create({
      workflow: { id: workflowId },
    })

    return NextResponse.json({ client_secret: session.client_secret })
  } catch (error) {
    console.error("[ChatKit] Failed to create session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create ChatKit session" },
      { status: 500 }
    )
  }
}

