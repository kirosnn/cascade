import { NextResponse, type NextRequest } from "next/server"

type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

type ChatRequestBody = {
  messages?: ChatMessage[]
  message?: string
  model?: string
}

const DEFAULT_SYSTEM_PROMPT =
  "You are Cascade's documentation assistant. Answer concisely and accurately. When uncertain, say you are not sure."

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 })
    }

    const systemPrompt = DEFAULT_SYSTEM_PROMPT

    let body: ChatRequestBody
    try {
      body = (await request.json()) as ChatRequestBody
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const model = body.model ?? process.env.GROQ_MODEL ?? "llama-3.1-8b-instant"

    const inputMessages: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages
      : typeof body.message === "string" && body.message.trim()
        ? [{ role: "user", content: body.message }]
        : []

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...inputMessages.filter((m) => m.role !== "system"),
    ]

    if (messages.length === 0 || messages.every((m) => m.role === "system")) {
      return NextResponse.json({ error: "Missing messages" }, { status: 400 })
    }

    for (const msg of messages) {
      if (msg.role !== "system" && msg.role !== "user" && msg.role !== "assistant") {
        return NextResponse.json({ error: "Invalid message role" }, { status: 400 })
      }
      if (typeof msg.content !== "string") {
        return NextResponse.json({ error: "Invalid message content" }, { status: 400 })
      }
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
    })

    const text = await response.text().catch(() => "")

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Groq request failed",
          status: response.status,
          details: text,
        },
        { status: 502 }
      )
    }

    let data: unknown
    try {
      data = text ? (JSON.parse(text) as unknown) : null
    } catch {
      return NextResponse.json({ error: "Invalid Groq response" }, { status: 502 })
    }

    const content = (data as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message?.content
    if (typeof content !== "string") {
      return NextResponse.json({ error: "Invalid Groq response" }, { status: 502 })
    }

    return NextResponse.json({ content })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 })
  }
}
