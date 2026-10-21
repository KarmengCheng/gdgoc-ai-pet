"use client"

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react"

type Mood = "happy" | "hungry" | "sleepy" | "excited" | "calm"

type Pet = {
  name: string
  personality: string
  happiness: number
  hunger: number
  energy: number
}

type Message = {
  role: "user" | "model"
  text: string
}

const INITIAL_PET: Pet = {
  name: "Mochi",
  personality: "A playful little cat who loves snacks and coding",
  happiness: 70,
  hunger: 40,
  energy: 80,
}

const STORAGE_KEY = "gdgoc-ai-pet-v1"
const subscribe = () => () => {}

function loadPet(): Pet {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return INITIAL_PET

    const saved = JSON.parse(stored) as Partial<Pet>
    const stats = [saved.happiness, saved.hunger, saved.energy]

    if (
      typeof saved.name === "string" &&
      saved.name.trim().length > 0 &&
      saved.name.length <= 30 &&
      typeof saved.personality === "string" &&
      saved.personality.trim().length > 0 &&
      saved.personality.length <= 200 &&
      stats.every(
        (value) =>
          typeof value === "number" &&
          Number.isFinite(value) &&
          value >= 0 &&
          value <= 100
      )
    ) {
      return { ...INITIAL_PET, ...saved }
    }
  } catch {
    return INITIAL_PET
  }

  return INITIAL_PET
}

function Stat({ label, value }: { label: string, value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-slate-700"
      >
        <div
          className="h-full rounded-full bg-violet-400 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function PetApp() {
  const [pet, setPet] = useState<Pet>(loadPet)
  const [mood, setMood] = useState<Mood>("happy")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("Your new friend is ready to meet you.")
  const chatRef = useRef<HTMLDivElement>(null)
  const busy = useRef(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pet))
    } catch {
      // The pet remains usable if browser storage is unavailable.
    }
  }, [pet])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, loading])

  function care(action: "feed" | "play" | "rest") {
    if (busy.current) return

    const clamp = (value: number) => Math.max(0, Math.min(100, value))
    const changes = {
      feed: { happiness: 5, hunger: -25, energy: 5 },
      play: { happiness: 20, hunger: 15, energy: -20 },
      rest: { happiness: 5, hunger: 10, energy: 30 },
    }[action]

    const next = {
      ...pet,
      happiness: clamp(pet.happiness + changes.happiness),
      hunger: clamp(pet.hunger + changes.hunger),
      energy: clamp(pet.energy + changes.energy),
    }

    setPet(next)
    setMood(
      next.energy < 25
        ? "sleepy"
        : next.hunger > 70
          ? "hungry"
          : action === "play"
            ? "excited"
            : "happy"
    )
    setNotice(
      action === "feed"
        ? `${pet.name || "Your pet"} enjoyed a snack.`
        : action === "play"
          ? `${pet.name || "Your pet"} chased a favourite toy.`
          : `${pet.name || "Your pet"} took a refreshing nap.`
    )
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = input.trim()

    if (!message || busy.current) return

    if (!pet.name.trim() || !pet.personality.trim()) {
      setError("Give your pet a name and personality first.")
      return
    }

    busy.current = true
    setLoading(true)
    setError("")
    setInput("")
    setMessages((previous) => [
      ...previous,
      { role: "user", text: message },
    ])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          pet,
          history: messages.slice(-10),
        }),
        signal: AbortSignal.timeout(45000),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Your pet could not reply.")
      }

      const moods: Mood[] = ["happy", "hungry", "sleepy", "excited", "calm"]

      if (
        typeof data.reply !== "string" ||
        !data.reply.trim() ||
        !moods.includes(data.mood)
      ) {
        throw new Error("Your pet sent an unexpected response. Try again.")
      }

      setMessages((previous) => [
        ...previous,
        { role: "model", text: data.reply.slice(0, 1000) },
      ])
      setMood(data.mood)
    } catch (cause) {
      setMessages((previous) => previous.slice(0, -1))
      setInput(message)
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong. Please try again."
      )
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-[0.25em] text-violet-300">
            Beyond the Chatbot: Building AI Agents with Google Genkit
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Pocket Pal</h1>
          <p className="mt-3 text-slate-400">
            A little friend with a personality of its own.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-[360px_1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{pet.name || "Your pet"}</h2>
              <span className="rounded-full bg-violet-400/15 px-3 py-1 text-sm capitalize text-violet-200">
                {mood}
              </span>
            </div>

            <div className="my-8 flex h-48 items-center justify-center">
              <svg
                viewBox="0 0 220 220"
                role="img"
                aria-label={`${pet.name || "Your pet"} looks ${mood}`}
                className="h-44 w-44 drop-shadow-xl motion-safe:animate-bounce"
              >
                <path
                  d="M45 95 L38 30 L92 65 M128 65 L182 30 L175 95"
                  fill="#a78bfa"
                  stroke="#c4b5fd"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <ellipse cx="110" cy="155" rx="57" ry="45" fill="#8b5cf6" />
                <ellipse cx="110" cy="108" rx="78" ry="65" fill="#c4b5fd" />
                <ellipse cx="65" cy="124" rx="14" ry="8" fill="#f9a8d4" />
                <ellipse cx="155" cy="124" rx="14" ry="8" fill="#f9a8d4" />
                {mood === "sleepy" ? (
                  <path
                    d="M66 103 L86 103 M134 103 L154 103"
                    stroke="#312e81"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                ) : (
                  <g fill="#312e81">
                    <ellipse cx="77" cy="101" rx="7" ry="10" />
                    <ellipse cx="143" cy="101" rx="7" ry="10" />
                  </g>
                )}
                <path d="M104 119 L116 119 L110 126 Z" fill="#7c3aed" />
                <path
                  d={mood === "hungry" ? "M100 143 Q110 130 120 143" : "M95 133 Q110 151 125 133"}
                  fill="none"
                  stroke="#312e81"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <ellipse cx="86" cy="190" rx="19" ry="10" fill="#c4b5fd" />
                <ellipse cx="134" cy="190" rx="19" ry="10" fill="#c4b5fd" />
              </svg>
            </div>

            <p aria-live="polite" className="mb-6 min-h-10 text-center text-sm text-violet-200">
              {notice}
            </p>

            <div className="space-y-4">
              <Stat label="Happiness" value={pet.happiness} />
              <Stat label="Hunger" value={pet.hunger} />
              <Stat label="Energy" value={pet.energy} />
            </div>
            <p className="mt-3 text-xs text-slate-400">Higher hunger means a hungrier pet.</p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {(["feed", "play", "rest"] as const).map((action) => (
                <button
                  key={action}
                  onClick={() => care(action)}
                  disabled={loading}
                  className="rounded-xl bg-violet-500 px-3 py-3 capitalize transition hover:bg-violet-400 disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>

            <div className="mt-7 space-y-4 border-t border-slate-800 pt-6">
              <label className="block text-sm text-slate-300">
                Pet name
                <input
                  value={pet.name}
                  maxLength={30}
                  disabled={loading}
                  onChange={(event) => setPet({ ...pet, name: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-violet-400"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Personality
                <textarea
                  value={pet.personality}
                  maxLength={200}
                  rows={3}
                  disabled={loading}
                  onChange={(event) => setPet({ ...pet, personality: event.target.value })}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-violet-400"
                />
              </label>
              <p className="text-xs text-slate-400">
                Pet settings and stats are saved in this browser. Chat resets on refresh.
              </p>
            </div>
          </section>

          <section className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 p-6">
              <h2 className="text-xl font-semibold">Talk to your pal</h2>
              <p className="mt-1 text-sm text-slate-400">
                Try asking how your pet feels after playing or resting.
              </p>
            </div>

            <div
              ref={chatRef}
              role="log"
              aria-label="Conversation with your pet"
              aria-live="polite"
              className="h-[440px] flex-1 space-y-4 overflow-y-auto p-6"
            >
              {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-slate-400">
                  Say hello, ask for a joke, or tell your pet about your day.
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "ml-auto bg-violet-600 text-white"
                      : "bg-slate-800 text-slate-100"
                  }`}
                >
                  <p className="mb-1 text-xs opacity-60">
                    {message.role === "user" ? "You" : pet.name || "Your pet"}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.text}
                  </p>
                </div>
              ))}
              {loading && (
                <p className="text-sm text-violet-300">Your pet is thinking...</p>
              )}
            </div>

            <div className="border-t border-slate-800 p-5">
              {error && (
                <p role="alert" className="mb-3 text-sm text-rose-300">{error}</p>
              )}
              <form onSubmit={sendMessage} className="flex gap-3">
                <input
                  aria-label="Message your pet"
                  value={input}
                  maxLength={500}
                  disabled={loading}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Say something to your pet..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-violet-500 px-5 py-3 transition hover:bg-violet-400 disabled:opacity-40"
                >
                  {loading ? "Wait..." : "Send"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  const ready = useSyncExternalStore(subscribe, () => true, () => false)

  return ready ? (
    <PetApp />
  ) : (
    <main className="min-h-screen bg-slate-950 p-10 text-violet-200">
      Loading your pet...
    </main>
  )
}
