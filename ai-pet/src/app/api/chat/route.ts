import { NextResponse } from "next/server"
import { ChatInput, getPetFlow } from "@/ai/pet"


export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GOOGLE_API_KEY. Check .env.local and restart Next.js." },
      { status: 500 }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Request must contain valid JSON." },
      { status: 400 }
    )
  }

  const parsed = ChatInput.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid message, pet settings or chat history." },
      { status: 400 }
    )
  }

  try {
    const result = await getPetFlow()(parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error("Pet chat failed:", detail.replaceAll(apiKey, "[redacted]"))

    const quotaError = /429|RESOURCE_EXHAUSTED|quota/i.test(detail)

    return NextResponse.json(
      {
        error: quotaError
          ? "Gemini quota is unavailable. Check the project's API limits in AI Studio."
          : "Gemini could not reply. Check the Codespaces server terminal.",
      },
      { status: quotaError ? 429 : 502 }
    )
  }
}
