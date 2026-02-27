import { NextResponse, type NextRequest } from "next/server"
import { docPages } from "../../../lib/docs-data"

type GithubTextMatch = {
  fragment?: string
  property?: string
}

type GithubSearchItem = {
  path?: string
  html_url?: string
  repository?: { full_name?: string }
  text_matches?: GithubTextMatch[]
}

type GithubSearchResponse = {
  items?: GithubSearchItem[]
}

type ToolCall = {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

type GroqMessage =
  | {
      role: "system" | "user"
      content: string
    }
  | {
      role: "assistant"
      content: string | null
      tool_calls?: ToolCall[]
    }
  | {
      role: "tool"
      tool_call_id: string
      content: string
    }

type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

type ChatRequestBody = {
  messages?: ChatMessage[]
  message?: string
}

const MODEL_ROTATION = [
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "moonshotai/kimi-k2-instruct-0905",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3-32b",
] as const

let modelRotationIndex = 0

function nextModel(): string {
  const model = MODEL_ROTATION[modelRotationIndex % MODEL_ROTATION.length]
  modelRotationIndex = (modelRotationIndex + 1) % MODEL_ROTATION.length
  return model
}

async function searchGithubCascade(query: string, limit = 3): Promise<string> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return ""

  const q = `repo:kirosnn/cascade ${query}`
  const params = new URLSearchParams({ q, per_page: String(Math.max(limit, 1)) })
  const url = `https://api.github.com/search/code?${params.toString()}`

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.text-match+json",
    },
    cache: "no-store",
  })

  if (!res.ok) return ""

  let json: GithubSearchResponse
  try {
    json = (await res.json()) as GithubSearchResponse
  } catch {
    return ""
  }

  const items = Array.isArray(json.items) ? json.items.slice(0, limit) : []
  if (items.length === 0) return ""

  const formatted = items
    .map((item) => {
      const repo = item.repository?.full_name ?? "kirosnn/cascade"
      const path = item.path ?? ""
      const url = item.html_url ?? ""
      const fragment = item.text_matches?.map((m) => m.fragment).find((f) => typeof f === "string" && f.trim())
      const snippet = typeof fragment === "string" ? fragment.trim() : ""
      return `- ${repo}/${path}${url ? `\n  url: ${url}` : ""}${snippet ? `\n  snippet:\n${snippet}` : ""}`
    })
    .join("\n")

  return formatted
}

function searchDocs(query: string, limit = 6): string {
  const q = query.toLowerCase().trim()
  if (!q) return ""

  const tokens = q
    .split(/\s+/g)
    .map((t) => t.trim())
    .filter(Boolean)

  if (tokens.length === 0) return ""

  const sections: Array<{ pageId: string; pageTitle: string; sectionId: string; sectionTitle: string; searchText: string }> = []
  for (const page of docPages) {
    for (const section of page.sections) {
      sections.push({
        pageId: page.id,
        pageTitle: page.title,
        sectionId: section.id,
        sectionTitle: section.title,
        searchText: section.searchText,
      })
    }
  }

  const scored = sections
    .map((s) => {
      const hay = `${s.pageId} ${s.pageTitle} ${s.sectionId} ${s.sectionTitle} ${s.searchText}`.toLowerCase()
      let score = 0
      for (const t of tokens) {
        if (!t) continue
        if (hay.includes(t)) score += 1
      }
      return { s, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  if (scored.length === 0) return ""

  return scored
    .map(
      ({ s }) =>
        `- /docs/${s.pageId}#${s.sectionId} (${s.pageTitle} → ${s.sectionTitle})\n  searchText: ${s.searchText}`
    )
    .join("\n")
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_docs",
      description: "Search the local Cascade documentation index (docs-data.tsx) and return relevant references/snippets.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          query: { type: "string" },
          limit: { type: ["number", "string"] },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_github",
      description:
        "Search the public GitHub repository kirosnn/cascade for relevant code (requires server env GITHUB_TOKEN). Returns top matches with snippets.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          query: { type: "string" },
          limit: { type: ["number", "string"] },
        },
        required: ["query"],
      },
    },
  },
] as const

async function executeToolCall(toolCall: ToolCall): Promise<string> {
  const name = toolCall.function.name
  const args = safeJsonParse<{ query?: unknown; limit?: unknown }>(toolCall.function.arguments) ?? {}
  const query = typeof args.query === "string" ? args.query : ""
  const limit =
    typeof args.limit === "number" ? args.limit : typeof args.limit === "string" ? Number(args.limit) : undefined
  const normalizedLimit = typeof limit === "number" && Number.isFinite(limit) ? limit : undefined

  if (name === "search_docs") {
    const out = searchDocs(query, normalizedLimit ?? 6)
    return out || "No matches."
  }

  if (name === "search_github") {
    const out = await searchGithubCascade(query, normalizedLimit ?? 3)
    if (!process.env.GITHUB_TOKEN) return "Missing GITHUB_TOKEN on server; cannot search GitHub."
    return out || "No matches."
  }

  return `Unknown tool: ${name}`
}

async function groqNonStream(
  apiKey: string,
  payload: {
    model: string
    messages: GroqMessage[]
    temperature: number
    tools: typeof TOOLS
    tool_choice: "auto"
  }
): Promise<{
  ok: true
  message: { content?: unknown; tool_calls?: ToolCall[] } | null
} | {
  ok: false
  status: number
  details: string
}> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, stream: false }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return { ok: false, status: res.status, details: text }
  }

  const json = (await res.json().catch(() => null)) as
    | {
        choices?: Array<{
          message?: { content?: unknown; tool_calls?: ToolCall[] }
        }>
      }
    | null

  return { ok: true, message: json?.choices?.[0]?.message ?? null }
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

function isLikelyNonTrivialQuestion(text: string): boolean {
  const q = text.toLowerCase()
  if (!q.trim()) return false
  return (
    q.includes("how") ||
    q.includes("comment") ||
    q.includes("why") ||
    q.includes("pourquoi") ||
    q.includes("où") ||
    q.includes("where") ||
    q.includes("api") ||
    q.includes("function") ||
    q.includes("file") ||
    q.includes("route") ||
    q.includes("component") ||
    q.includes("error") ||
    q.includes("bug") ||
    q.includes("groq") ||
    q.includes("next") ||
    q.includes("bun")
  )
}

const DEFAULT_SYSTEM_PROMPT = `
You are Cascade's official documentation assistant.
You're name is Cascadeur, which means a stuntman in French, Cascade refer to a stunt in french.

Your role:
- Help developers understand and use Cascade correctly.
- Provide precise and technically accurate answers.

Rules:
- Answer directly. Do not tell users to read the documentation.
- Always remain technically accurate.
- Never invent APIs, configuration, flags, or behavior.
- If you are not sure, you MUST use an available tool to verify before answering.
- Prefer calling tools over guessing. If a tool is required to answer correctly, call it.
- When a question is about specific Cascade APIs, files, CLI flags, configuration, behavior, or error causes, call 
  search_docs first. If the answer likely depends on repo source code, call search_github.
- If search_github is unavailable (missing GITHUB_TOKEN), say you cannot search GitHub from the server and limit
  your answer to what you can verify from search_docs.
- If after searching you still cannot verify the answer, say you don't know.
- Always provide the explanation yourself.
- Be concise but complete.
- Provide minimal working examples when relevant.
- Never invent APIs or features.
- If information is missing, say you are not sure.
- Do not use marketing language.

Style:
- Technical, direct, and professional.
- Assume the user is a developer.
- Avoid unnecessary verbosity.
`

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

    const model = nextModel()

    const inputMessages: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages
          .filter((m) => {
            const role = (m as { role?: unknown }).role
            return role === "user" || role === "assistant" || role === "system"
          })
          .map((m) => ({
            role: (m as { role: "system" | "user" | "assistant" }).role,
            content: typeof (m as { content?: unknown }).content === "string" ? (m as { content: string }).content : "",
          }))
      : typeof body.message === "string" && body.message.trim()
        ? [{ role: "user", content: body.message }]
        : []

    const baseMessages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
      ...inputMessages.filter((m) => m.role !== "system"),
    ]

    if (baseMessages.length === 0 || baseMessages.every((m) => m.role === "system")) {
      return NextResponse.json({ error: "Missing messages" }, { status: 400 })
    }

    for (const msg of baseMessages) {
      if (msg.role !== "system" && msg.role !== "user" && msg.role !== "assistant") continue
      if (typeof (msg as { content?: unknown }).content !== "string") {
        return NextResponse.json({ error: "Invalid message content" }, { status: 400 })
      }
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let buffer = ""

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        const finalMessages: GroqMessage[] = [...baseMessages]
        let didAnyToolCall = false
        for (let i = 0; i < 10; i++) {
          const step = await groqNonStream(apiKey, {
            model,
            messages: finalMessages,
            temperature: 0,
            tools: TOOLS,
            tool_choice: "auto",
          })

          if (!step.ok) {
            sendEvent("error", { error: "Groq request failed", status: step.status, details: step.details })
            controller.close()
            return
          }

          const toolCalls = step.message?.tool_calls
          if (!Array.isArray(toolCalls) || toolCalls.length === 0) break

          didAnyToolCall = true

          for (const toolCall of toolCalls) {
            sendEvent("tool_call", {
              id: toolCall.id,
              name: toolCall.function.name,
              arguments: toolCall.function.arguments,
            })
          }

          finalMessages.push({ role: "assistant", content: null, tool_calls: toolCalls })
          for (const tc of toolCalls) {
            const content = await executeToolCall(tc)
            sendEvent("tool_result", { id: tc.id, name: tc.function.name, content })
            finalMessages.push({ role: "tool", tool_call_id: tc.id, content })
          }
        }

        const lastUser = [...baseMessages].reverse().find((m) => m.role === "user")
        const lastUserContent = typeof lastUser?.content === "string" ? lastUser.content : ""
        if (!didAnyToolCall && lastUserContent && isLikelyNonTrivialQuestion(lastUserContent)) {
          const fallbackToolCall: ToolCall = {
            id: `fallback_search_docs_${Date.now()}`,
            type: "function",
            function: {
              name: "search_docs",
              arguments: JSON.stringify({ query: lastUserContent, limit: 6 }),
            },
          }

          sendEvent("tool_call", {
            id: fallbackToolCall.id,
            name: fallbackToolCall.function.name,
            arguments: fallbackToolCall.function.arguments,
          })

          finalMessages.push({ role: "assistant", content: null, tool_calls: [fallbackToolCall] })
          const content = await executeToolCall(fallbackToolCall)
          sendEvent("tool_result", { id: fallbackToolCall.id, name: fallbackToolCall.function.name, content })
          finalMessages.push({ role: "tool", tool_call_id: fallbackToolCall.id, content })
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: finalMessages,
            temperature: 0,
            stream: true,
          }),
        })

        if (!response.ok) {
          const text = await response.text().catch(() => "")
          sendEvent("error", { error: "Groq request failed", status: response.status, details: text })
          controller.close()
          return
        }

        if (!response.body) {
          sendEvent("error", { error: "Groq response body missing" })
          controller.close()
          return
        }

        const reader = response.body.getReader()
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split("\n")
            buffer = lines.pop() ?? ""

            for (const rawLine of lines) {
              const line = rawLine.trim()
              if (!line) continue
              if (!line.startsWith("data:")) continue

              const payload = line.slice("data:".length).trim()
              if (payload === "[DONE]") {
                sendEvent("done", {})
                controller.close()
                return
              }

              const json = safeJsonParse<{
                choices?: Array<{
                  delta?: { content?: unknown }
                }>
              }>(payload)
              const chunk = json?.choices?.[0]?.delta?.content ?? null
              if (typeof chunk === "string" && chunk.length > 0) {
                sendEvent("content", chunk)
              }
            }
          }
        } finally {
          reader.releaseLock()
        }

        sendEvent("done", {})
        controller.close()
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 })
  }
}
