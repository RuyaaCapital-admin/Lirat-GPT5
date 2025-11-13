import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY")
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      )
    }

    if (!process.env.CHATKIT_WORKFLOW_ID) {
      console.error("Missing CHATKIT_WORKFLOW_ID")
      return NextResponse.json(
        { error: "Missing CHATKIT_WORKFLOW_ID" },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const session = await (openai as any).chatkit.sessions.create({
      workflow: { id: process.env.CHATKIT_WORKFLOW_ID },
    })

    return NextResponse.json(
      { client_secret: session.client_secret },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (err) {
    console.error("ChatKit session error", err)
    return NextResponse.json(
      { error: "Failed to create ChatKit session" },
      { status: 500 }
    )
  }
}
