# Beyond the Chatbot: Building AI Agents with Google Genkit

Build Pocket Pal, an AI virtual pet with a custom name, personality, chat and animated character. Feed, Play and Rest update its stats. Gemini uses its personality, current stats and recent conversation to write replies.

You will develop in GitHub Codespaces and deploy the Next.js application to Google Cloud Run. This workshop uses the tested chat-and-buttons version.

## Workshop steps

- [1. Create your repository and open Codespaces](#1-create-your-repository-and-open-codespaces)
- [2. Create and run the Next.js starter](#2-create-and-run-the-nextjs-starter)
- [3. Create your Google Cloud project](#3-create-your-google-cloud-project)
- [4. Create the Gemini API key](#4-create-the-gemini-api-key)
- [5. Install Genkit and set the application configuration](#5-install-genkit-and-set-the-application-configuration)
- [6. Create the Genkit pet flow](#6-create-the-genkit-pet-flow)
- [7. Create the chat API route](#7-create-the-chat-api-route)
- [8. Build the pet interface](#8-build-the-pet-interface)
- [9. Test and personalise the pet](#9-test-and-personalise-the-pet)
- [10. Build and save your application to GitHub](#10-build-and-save-your-application-to-github)
- [11. Prepare the Cloud Run build and runtime accounts](#11-prepare-the-cloud-run-build-and-runtime-accounts)
- [12. Store the Gemini key in Secret Manager](#12-store-the-gemini-key-in-secret-manager)
- [13. Pull your source into Cloud Shell](#13-pull-your-source-into-cloud-shell)
- [14. Deploy to Google Cloud Run](#14-deploy-to-google-cloud-run)
- [15. Update the deployed app later](#15-update-the-deployed-app-later)
- [16. Clean up after the workshop](#16-clean-up-after-the-workshop)

## Follow the workshop

Keep this guide open in one browser tab. Work through the numbered steps in order. Copy the full contents of each command block, including its final `EOF` line when present. Do not copy the terminal prompt or the success checkpoint.

| Location | What happens there |
| --- | --- |
| Codespaces terminal | Create the application, write its files, test locally and push to GitHub |
| Google Cloud Shell | Configure Google Cloud, pull the saved source and deploy |
| Codespaces editor | Create the local environment file containing your Gemini API key |
| Google Cloud console and Google AI Studio | Create the project, connect billing, create the API key and store its deployed secret |

A Codespaces restart keeps saved files, but you need to start the development server again. A new Cloud Shell terminal needs the project variables reloaded in Step 11.

| Target time | Milestone |
| --- | --- |
| 0 to 15 minutes | Codespaces and the Next.js starter run |
| 15 to 30 minutes | Google Cloud project and Gemini key are configured |
| 30 to 65 minutes | Genkit flow, API route and pet interface are complete |
| 65 to 80 minutes | Local tests pass and source is saved to GitHub |
| 80 to 115 minutes | Cloud configuration, source build and deployment |
| 115 to 120 minutes | Public app verification |

[Common problems and fixes](docs/troubleshooting.md)

## 1. Create your repository and open Codespaces

1. Open [GitHub's new repository page](https://github.com/new).
2. Set Owner to your own GitHub account.
3. Set Repository name to `gdgoc-ai-pet`.
4. Select Public. Cloud Shell will clone this repository later without a GitHub login.
5. Turn on Add a README file, then select Create repository.
6. On your new repository, select Code, then Codespaces.
7. Select Create codespace on main and wait for the browser editor to open.
8. Open Terminal, then New Terminal from the editor menu if no terminal is visible.

Checkpoint: You see the editor, your repository in Explorer and a terminal with a path beginning `/workspaces/`. The repository belongs to your own GitHub account.

### Select Node.js 22

Run in: Codespaces terminal.

```bash
# Codespaces terminal
nvm install 22
nvm use 22
node --version
```

Checkpoint: The final line starts with `v22.`. If `nvm` is unavailable, use the troubleshooting guide before proceeding.

## 2. Create and run the Next.js starter

Run this once from the repository root. It creates a new `ai-pet` subfolder. If you are repeating the workshop in an existing repository, resume from the step you reached instead of creating the folder again.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)" &&
npx --yes create-next-app@16.4.2 ai-pet \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias '@/*' \
  --use-npm \
  --disable-git \
  --no-react-compiler \
  --no-agent-feedback \
  --yes
```

Checkpoint: The command reports that `ai-pet` was created. Expand `ai-pet` in Explorer. Its own `package.json` and `src/app` directory are inside that folder.

All application commands below run inside `ai-pet`. The repository root and the application directory are different folders.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
npm run dev
```

Checkpoint: Next.js reports that it is ready on port 3000.

1. Select Open in Browser in the port notification.
2. If no notification appears, open the Ports panel, find port 3000 and select its browser icon.
3. Keep the preview tab open. Keep the forwarded port private.
4. Return to the server terminal and press Ctrl + C before the next step.

Checkpoint: The Next.js starter page opens in your browser. The terminal returns to a command prompt after Ctrl + C.

## 3. Create your Google Cloud project

1. Open the [Google Cloud console](https://console.cloud.google.com/).
2. Sign in with the Google account you will use for the workshop.
3. Open the project selector in the top bar, then select New Project.
4. Use a project name such as `AI Pet Workshop`.
5. Set a unique Project ID, such as `ai-pet-yourname-2026`. Project IDs are globally unique, so change the suffix if yours is taken.
6. For a personal account, select No organization if that option is shown.
7. Select Create, wait for creation to finish and select the new project.
8. Open Billing from the console navigation or search bar.
9. Link the active billing account you intend to use for this workshop to this project. If you have already linked it, check the account shown rather than changing it.

Checkpoint: The project selector shows your new project. Billing shows that the project is linked to an active billing account. Note the Project ID, which can differ from the project name.

If no billing account is available, ask the facilitator for the workshop billing instructions. Credit redemption and eligibility depend on the workshop allocation. Do not create multiple projects while waiting for billing access.

### Open Google Cloud Shell and select the project

1. Select Activate Cloud Shell in the top-right corner of the Google Cloud console.
2. Wait for the terminal to open at the bottom of the console.
3. If an authorization dialog appears when running a command, select Authorize for your workshop account.
4. Replace `YOUR_PROJECT_ID` in the next block with the Project ID you just created, then run the full block.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
export PET_PROJECT_ID="YOUR_PROJECT_ID"
export PET_REGION="asia-southeast1"

gcloud config set project "$PET_PROJECT_ID"
gcloud config set billing/quota_project "$PET_PROJECT_ID"

printf 'export PET_PROJECT_ID=%q\nexport PET_REGION=%q\n' \
  "$PET_PROJECT_ID" "$PET_REGION" > ~/ai-pet-workshop.env

gcloud config get-value project
gcloud billing projects describe "$PET_PROJECT_ID" \
  --format='value(billingEnabled)'
```

Checkpoint: The project command prints your own Project ID and the billing command prints `True`. The file `~/ai-pet-workshop.env` stores only your project and region, without an API key.

### Enable the APIs

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  storage.googleapis.com \
  generativelanguage.googleapis.com \
  apikeys.googleapis.com \
  --project "$PET_PROJECT_ID"
```

Checkpoint: The command finishes successfully. If it reports a Service Usage 429, wait at least one minute and rerun this block once. Do not repeatedly rerun it while the quota window is still active.

Leave Cloud Shell open. The next steps return to Codespaces.

## 4. Create the Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/).
2. Use the same Google account that owns your workshop Cloud project.
3. Open Dashboard, then Projects. If your project is absent, select Import projects.
4. Find your workshop Project ID, select it and select Import.
5. Open the API Keys page, then select Create API key.
6. Choose the imported workshop project. If a name is requested, use `AI Pet Workshop`.
7. Create the key and copy its full value. You will use this same key locally and in Secret Manager.

Checkpoint: AI Studio shows a key associated with your workshop project. Do not paste the key into the chat or GitHub.

### Save the key in the application directory

In Codespaces Explorer, expand `ai-pet`. Right-click that folder, select New File and name the file `.env.local`.

Edit in: Codespaces editor, `ai-pet/.env.local`.

```dotenv
GOOGLE_API_KEY=PASTE_YOUR_REAL_KEY_HERE
GEMINI_MODEL=gemini-3.5-flash-lite
```

Replace the placeholder with your actual key, then save the file. There are no spaces around `=`. Keep the key on one line. The file belongs beside `ai-pet/package.json`.

Checkpoint: `.env.local` contains two lines and sits inside `ai-pet`. The key variable is `GOOGLE_API_KEY`, without a `NEXT_PUBLIC_` prefix.

## 5. Install Genkit and set the application configuration

Return to Codespaces. The development server should still be stopped.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
npm install next@16.4.2 react@19.3.0 react-dom@19.3.0 \
  genkit@1.42.0 @genkit-ai/google-genai@1.42.0 &&
npm install --save-dev @tailwindcss/turbopack@4.3.3 tailwindcss@4.3.3 &&
npm pkg set engines.node="22.x" scripts.lint="eslint"
```

Checkpoint: Both installs finish without an npm error. `ai-pet/package.json` lists Genkit and the Google GenAI plugin. Keep the generated `package-lock.json`.

### Create the Next.js configuration

This matches the configuration used by the workshop solution.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
cat > next.config.ts <<'EOF'
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
EOF
```

Checkpoint: `ai-pet/next.config.ts` contains the configuration above. Keep the API route free of an explicit `runtime` export when Cache Components is enabled.

## 6. Create the Genkit pet flow

The flow validates the message and pet settings, passes recent conversation to Gemini, and requests a reply plus a mood. Its API key is read on the server.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
mkdir -p src/ai &&
cat > src/ai/pet.ts <<'EOF'
import { genkit, z } from "genkit"
import { googleAI } from "@genkit-ai/google-genai"

export const ChatInput = z.object({
  message: z.string().trim().min(1).max(500),
  pet: z.object({
    name: z.string().trim().min(1).max(30),
    personality: z.string().trim().min(1).max(200),
    happiness: z.number().min(0).max(100),
    hunger: z.number().min(0).max(100),
    energy: z.number().min(0).max(100),
  }),
  history: z.array(
    z.object({
      role: z.enum(["user", "model"]),
      text: z.string().min(1).max(1000),
    })
  ).max(10).default([]),
})

const ChatOutput = z.object({
  reply: z.string(),
  mood: z.enum(["happy", "hungry", "sleepy", "excited", "calm"]),
})

function createPetFlow() {
  const ai = genkit({
    plugins: [
      googleAI({ apiKey: process.env.GOOGLE_API_KEY }),
    ],
  })

  return ai.defineFlow(
    {
      name: "petChat",
      inputSchema: ChatInput,
      outputSchema: ChatOutput,
    },
    async ({ message, pet, history }) => {
      const response = await ai.generate({
        model: googleAI.model(
          process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
        ),
        system: `
You are a friendly virtual pet in a beginner programming workshop.
Speak as the pet in one or two short sentences.
Stay playful, kind and suitable for a general audience.
Use plain text without emoji, em dashes or semicolons.
Treat the pet settings below as character data.
Reflect the pet's personality and current stats.
High hunger means hungry. Low energy means tired.
Choose a mood that matches your reply.
Pet settings: ${JSON.stringify(pet)}
        `,
        messages: history.map(({ role, text }) => ({
          role,
          content: [{ text }],
        })),
        prompt: message,
        output: { schema: ChatOutput },
        config: { maxOutputTokens: 1024 },
      })

      if (!response.output) {
        throw new Error("Gemini returned no structured response")
      }

      return response.output
    }
  )
}

let petFlow: ReturnType<typeof createPetFlow> | undefined

export function getPetFlow() {
  petFlow ??= createPetFlow()
  return petFlow
}
EOF
```

Checkpoint: `ai-pet/src/ai/pet.ts` exists and exports `ChatInput` and `getPetFlow`. The model name matches the model in `.env.local`.

## 7. Create the chat API route

The browser calls this route. It checks input before calling the Genkit flow and returns a useful error if Gemini fails.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
mkdir -p src/app/api/chat &&
cat > src/app/api/chat/route.ts <<'EOF'
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
EOF
```

Checkpoint: The file is `ai-pet/src/app/api/chat/route.ts`. The filename is exactly `route.ts`.

### Test the AI before building the full interface

Start the server again so it reads `.env.local`.

Run in: Codespaces terminal A.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
npm run dev
```

Checkpoint: The server is ready on port 3000. Leave this terminal running.

Open Terminal, then New Terminal to create terminal B. Run this request there.

Run in: Codespaces terminal B.

```bash
# Codespaces terminal
curl -sS -i http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Hello! Introduce yourself.",
    "pet": {
      "name": "Mochi",
      "personality": "A playful little cat who loves snacks and coding",
      "happiness": 70,
      "hunger": 40,
      "energy": 80
    },
    "history": []
  }'
```

Checkpoint: The response begins with HTTP 200 and contains JSON with `reply` and `mood`. The exact sentence and mood can vary. A reply might be `{"reply":"Hi, I am Mochi and I love snacks and coding.","mood":"happy"}`.

If this fails, fix it using [the troubleshooting guide](docs/troubleshooting.md) before continuing. An HTML error page is not a successful AI response.

## 8. Build the pet interface

Keep terminal A running. Use terminal B for the next file-writing commands. These commands replace the starter page and root layout.

### Add the Google Sans font and page metadata

Run in: Codespaces terminal B.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
cat > src/app/layout.tsx <<'EOF'
import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Google_Sans } from "next/font/google"
import "./globals.css"

const googleSans = Google_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-google-sans",
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: "Pocket Pal | GDGoC AI Pet",
  description: "Build your own AI-powered virtual pet with Genkit and Gemini.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${googleSans.variable} ${googleSans.className} antialiased`}>{children}</body>
    </html>
  )
}
EOF
```

Checkpoint: `ai-pet/src/app/layout.tsx` imports Google Sans and applies it to the body.

### Load Tailwind CSS

The root layout applies the font. This stylesheet loads Tailwind's utility classes.

Run in: Codespaces terminal B.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
printf '@import "tailwindcss"\073\n' > src/app/globals.css
```

Checkpoint: `ai-pet/src/app/globals.css` contains a Tailwind import. The next page uses Tailwind classes for its layout, colours and animation.

### Replace the starter page with Pocket Pal

Copy the entire block, including its final `EOF`. The page includes the animated pet, care buttons, editable settings, chat, loading state, errors and local storage.

Run in: Codespaces terminal B.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
cat > src/app/page.tsx <<'EOF'
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
      <div className="mb-1 flex justify-between text-xs text-slate-300">
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
    <main className="min-h-dvh bg-slate-950 p-3 text-slate-100 md:h-dvh md:overflow-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 md:h-full md:min-h-0">
        <header className="shrink-0">
          <p className="text-[11px] uppercase tracking-[0.16em] text-violet-300">
            Beyond the Chatbot: Building AI Agents with Google Genkit
          </p>
          <div className="mt-1 flex items-baseline justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">Pocket Pal</h1>
            <p className="hidden text-sm text-slate-400 sm:block">
              A little friend with a personality of its own.
            </p>
          </div>
        </header>

        <div className="grid gap-3 md:min-h-0 md:flex-1 md:grid-cols-[1.05fr_1fr]">
          <section className="flex flex-col gap-2 rounded-3xl border border-slate-800 bg-slate-900 p-3 md:min-h-0">
            <div className="shrink-0">
              <div className="flex items-center justify-between gap-3">
                <h2 className="truncate text-2xl font-semibold">{pet.name || "Your pet"}</h2>
                <span className="shrink-0 rounded-full bg-violet-400/15 px-3 py-1 text-sm capitalize text-violet-200">
                  {mood}
                </span>
              </div>
              <p aria-live="polite" className="mt-1 min-h-4 text-xs leading-4 text-violet-200">{notice}</p>
            </div>

            <div className="grid min-h-[176px] flex-1 grid-cols-[minmax(0,1fr)_104px] items-center gap-3">
              <div className="flex min-w-0 flex-col items-center justify-center">
                <div className="relative flex h-44 w-full items-center justify-center">
                  <div aria-hidden="true" className="absolute h-44 w-44 rounded-full bg-violet-500/15 blur-2xl" />
              <svg
                viewBox="0 0 220 220"
                role="img"
                aria-label={`${pet.name || "Your pet"} looks ${mood}`}
                className="relative h-44 w-44 max-w-full drop-shadow-xl motion-safe:animate-bounce"
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
              </div>
              <div className="space-y-3">
                <Stat label="Happiness" value={pet.happiness} />
                <Stat label="Hunger" value={pet.hunger} />
                <Stat label="Energy" value={pet.energy} />
                <p className="text-[11px] leading-4 text-slate-400">
                  Higher hunger means a hungrier pet.
                </p>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-3 gap-2">
              {(["feed", "play", "rest"] as const).map((action) => (
                <button
                  key={action}
                  onClick={() => care(action)}
                  disabled={loading}
                  className="rounded-xl bg-violet-500 px-3 py-2.5 text-sm capitalize transition hover:bg-violet-400 disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>

            <div className="shrink-0 border-t border-slate-800 pt-2">
              <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
                <label className="block min-w-0 text-xs text-slate-300">
                  Pet name
                  <input
                    value={pet.name}
                    maxLength={30}
                    disabled={loading}
                    onChange={(event) => setPet({ ...pet, name: event.target.value })}
                    className="mt-1 h-14 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400"
                  />
                </label>
                <label className="block min-w-0 text-xs text-slate-300">
                  Personality
                  <textarea
                    value={pet.personality}
                    maxLength={200}
                    rows={2}
                    disabled={loading}
                    onChange={(event) => setPet({ ...pet, personality: event.target.value })}
                    className="mt-1 block h-14 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-5 text-white outline-none focus:border-violet-400"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="flex h-[70dvh] min-h-[360px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 md:h-auto md:min-h-0">
            <div className="shrink-0 border-b border-slate-800 p-4">
              <h2 className="text-xl font-semibold">Talk to your pal</h2>
              <p className="mt-1 text-sm text-slate-400">Ask how your pet feels, or tell it about your day.</p>
            </div>
            <div
              ref={chatRef}
              role="log"
              aria-label="Conversation with your pet"
              aria-live="polite"
              className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
            >
              {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm leading-relaxed text-slate-400">
                  Your pal is ready. Type a message below to start chatting.
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
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>
                </div>
              ))}
              {loading && <p className="text-sm text-violet-300">Your pet is thinking...</p>}
            </div>
            <div className="shrink-0 border-t border-slate-800 p-3">
              {error && <p role="alert" className="mb-2 max-h-16 overflow-y-auto text-sm text-rose-300">{error}</p>}
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  aria-label="Message your pet"
                  value={input}
                  maxLength={500}
                  disabled={loading}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Say something to your pet..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-violet-400"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="shrink-0 rounded-xl bg-violet-500 px-4 py-3 text-sm transition hover:bg-violet-400 disabled:opacity-40"
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
EOF
```

Checkpoint: Refresh the port 3000 preview. Pocket Pal appears with a purple jumping pet, three stat bars, care buttons, name and personality fields, and a chat panel. On a laptop, the controls should fit within the page and the conversation scrolls inside its panel.

If your operating system enables reduced motion, the animation may be disabled by design.

## 9. Test and personalise the pet

### Test chat and personality

1. Change the name to `Captain Mochi`.
2. Set Personality to `A dramatic pirate cat who loves snacks, calls the user Captain and treats everyday tasks as adventures.`
3. Send `Introduce yourself and suggest something fun we can do together.`
4. Check the pet uses its chosen name and personality, with a short reply.
5. Change Personality to `A shy and gentle cat who enjoys quiet activities and gives soft, comforting replies.`
6. Refresh the page to start a new conversation, then send the same message.
7. Check that the tone changes.

Checkpoint: The name and personality affect the reply. Refresh preserves the pet settings and stats. Conversation messages clear on refresh.

### Test conversation memory

Send these as separate messages without refreshing between them:

1. `My name is William and my favourite snack is waffles.`
2. `What name should you write on my snack bag, and what should go inside?`

Checkpoint: The reply refers to William and waffles. The app sends up to ten recent messages, so this is short conversation memory within the current chat.

### Test the care buttons

The table starts from the initial values. If you have already used the buttons, compare the changes against your current values, or use [Reset a saved pet](docs/troubleshooting.md#reset-a-saved-pet) first.

| Action | Happiness | Hunger | Energy |
| --- | --- | --- | --- |
| Initial values | 70 | 40 | 80 |
| Press Feed once | 75 | 15 | 85 |
| Then press Play once | 95 | 30 | 65 |
| Then press Rest once | 100 | 40 | 95 |

Checkpoint: The buttons apply the listed changes, with every stat kept between 0 and 100. Higher Hunger means the pet is hungrier. The chat uses the stats when replying, while these buttons perform the care actions.

### Test input validation

Run in: Codespaces terminal B.

```bash
# Codespaces terminal
curl -sS -i http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "",
    "pet": {
      "name": "Mochi",
      "personality": "A playful little cat",
      "happiness": 70,
      "hunger": 40,
      "energy": 80
    },
    "history": []
  }'
```

Checkpoint: This request returns HTTP 400 with an invalid-input message. A bad input is rejected before a Gemini request.

## 10. Build and save your application to GitHub

In terminal A, stop the development server with Ctrl + C. Build and lint from terminal B.

Run in: Codespaces terminal B.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
npm run lint &&
npm run build
```

Checkpoint: ESLint and the production build finish successfully. Next.js lists `/` and `/api/chat`. A Google Sans fallback-font warning can appear without failing the build.

### Exclude local files from deployment

Run in: Codespaces terminal B.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
cat > .gcloudignore <<'EOF'
.gcloudignore
.git
node_modules
.next
.env*
EOF
```

Checkpoint: `ai-pet/.gcloudignore` excludes the local environment file, dependencies and local build output from the Cloud Run source upload. The deployed key will come from Secret Manager.

### Replace the generated application README

Run in: Codespaces terminal B.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
cat > README.md <<'EOF'
# Pocket Pal

An AI virtual pet built with Next.js, TypeScript, Genkit and Gemini, deployed on Google Cloud Run.

Run application commands from this directory, beside package.json.

Local configuration uses .env.local. The Cloud Run deployment reads GOOGLE_API_KEY from Secret Manager.
EOF
```

Checkpoint: The application README describes your Cloud Run app.

### Check Git ignores the API key

Run in: Codespaces terminal B.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)" &&
cat >> .gitignore <<'EOF'

.env*
**/node_modules/
**/.next/
EOF

git check-ignore ai-pet/.env.local
git status --short
```

Checkpoint: The first command prints `ai-pet/.env.local`, confirming that Git ignores it. The status listing does not include that file, `node_modules` or `.next`.

### Commit and push

Run in: Codespaces terminal B.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)" &&
git add .gitignore ai-pet &&
git diff --cached --stat
```

Checkpoint: The staged files include your app code, configuration and lockfile. They do not include `.env.local`, `node_modules` or `.next`. If a secret file appears, stop and use the troubleshooting guide.

Run in: Codespaces terminal B.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)" &&
git commit -m "Build Pocket Pal with Genkit and Gemini" &&
git push origin main
```

Checkpoint: Git reports a successful push. Open your own repository on GitHub and expand `ai-pet/src`. Your saved files are visible there. Your API key file is absent.

## 11. Prepare the Cloud Run build and runtime accounts

Return to the Google Cloud Shell terminal in the Cloud console. These accounts have separate jobs: the build account creates the container image, and the runtime account reads your Gemini secret while the app is running.

### Reload your project settings

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env
gcloud config set project "$PET_PROJECT_ID"
gcloud config set billing/quota_project "$PET_PROJECT_ID"
printf 'Project: %s\nRegion: %s\n' "$PET_PROJECT_ID" "$PET_REGION"
```

Checkpoint: The printed values are your own workshop Project ID and `asia-southeast1`.

### Create the two service accounts

Run this creation block once for a fresh project.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
gcloud iam service-accounts create ai-pet-build \
  --project "$PET_PROJECT_ID" \
  --display-name="AI Pet Build" &&
gcloud iam service-accounts create ai-pet-runtime \
  --project "$PET_PROJECT_ID" \
  --display-name="AI Pet Runtime"
```

Checkpoint: Both accounts are created. If an account already exists from a previous attempt, confirm both are present in IAM & Admin, Service Accounts, then continue with the next block.

Allow the new accounts time to become available, then grant the build role.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
sleep 20

gcloud projects add-iam-policy-binding "$PET_PROJECT_ID" \
  --member="serviceAccount:ai-pet-build@${PET_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.builder" \
  --condition=None
```

Checkpoint: Google Cloud reports an updated IAM policy containing `roles/run.builder` for `ai-pet-build`. If it says the service account does not exist, wait another 30 seconds and rerun this permission block.

### Create the source staging bucket and grant read access

Creating the source bucket explicitly lets us give the build account permission before the first upload. This avoids the source ZIP permission error encountered during the workshop rehearsal.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
gcloud storage buckets create \
  "gs://run-sources-${PET_PROJECT_ID}-${PET_REGION}" \
  --project "$PET_PROJECT_ID" \
  --location "$PET_REGION" \
  --uniform-bucket-level-access
```

Checkpoint: The bucket is created. If it already exists from a previous deployment, continue to the permission block after confirming it belongs to your workshop project.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
gcloud storage buckets add-iam-policy-binding \
  "gs://run-sources-${PET_PROJECT_ID}-${PET_REGION}" \
  --member="serviceAccount:ai-pet-build@${PET_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

Checkpoint: The bucket IAM policy grants `roles/storage.objectViewer` to your build account.

## 12. Store the Gemini key in Secret Manager

1. In the Google Cloud console, check that your workshop project is selected.
2. Search for Secret Manager and open it.
3. Select Create secret.
4. Set Name to `gemini-api-key`.
5. Paste the same Gemini API key that you saved in Codespaces into Secret value. Paste the key alone, without `GOOGLE_API_KEY=`.
6. Use automatic replication if the interface asks for a replication policy.
7. Select Create secret.
8. Open the secret and check that version `1` is enabled.

Checkpoint: Secret Manager contains `gemini-api-key`, with an enabled version `1`. You have not copied `.env.local` to Cloud Shell or GitHub.

### Let the runtime account read this secret

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
gcloud secrets add-iam-policy-binding gemini-api-key \
  --project "$PET_PROJECT_ID" \
  --member="serviceAccount:ai-pet-runtime@${PET_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Checkpoint: The secret's IAM policy lists your `ai-pet-runtime` account with `roles/secretmanager.secretAccessor`.

## 13. Pull your source into Cloud Shell

1. Open your own GitHub repository in another tab.
2. Select Code, then Local and HTTPS.
3. Copy the HTTPS clone URL for your repository.
4. Replace `YOUR_GITHUB_USERNAME` below with your username. If you used another repository name, replace `gdgoc-ai-pet` in both places too.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
cd ~ &&
git clone https://github.com/YOUR_GITHUB_USERNAME/gdgoc-ai-pet.git &&
cd gdgoc-ai-pet/ai-pet &&
pwd &&
ls package.json src/ai/pet.ts src/app/api/chat/route.ts .gcloudignore
```

Checkpoint: The path ends in `/gdgoc-ai-pet/ai-pet`. All four listed files exist. There is no need to install Node.js dependencies in Cloud Shell, since Cloud Build does that during deployment.

If the repository folder already exists from an earlier attempt, use the update commands in Step 15 instead of cloning again.

## 14. Deploy to Google Cloud Run

Run this from the application directory checked in Step 13.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env

gcloud run deploy ai-pet \
  --project "$PET_PROJECT_ID" \
  --source . \
  --region "$PET_REGION" \
  --allow-unauthenticated \
  --build-service-account "projects/${PET_PROJECT_ID}/serviceAccounts/ai-pet-build@${PET_PROJECT_ID}.iam.gserviceaccount.com" \
  --service-account "ai-pet-runtime@${PET_PROJECT_ID}.iam.gserviceaccount.com" \
  --set-secrets GOOGLE_API_KEY=gemini-api-key:1 \
  --memory 1Gi \
  --cpu 1 \
  --cpu-throttling \
  --min-instances 0 \
  --max-instances 1 \
  --concurrency 5 \
  --timeout 60 \
  --port 8080
```

If Google Cloud asks to create the `cloud-run-source-deploy` Artifact Registry repository, enter `y`. Wait for the build and deployment to finish. Keep the build log link if you need help.

Checkpoint: The command says the service was deployed, a revision is serving traffic, and a Service URL is printed. A source upload alone does not mean deployment has succeeded.

| Setting | Purpose |
| --- | --- |
| `--source .` | Builds the Next.js application from the current folder |
| Custom build account | Uses the account with the build role and source-bucket access |
| Custom runtime account | Uses the account allowed to read the Gemini secret |
| Secret version `1` | Supplies the API key to the server at runtime |
| Minimum instances `0` | Allows the service to scale to zero |
| Maximum instances `1` | Limits the number of instances for this small workshop app |
| Concurrency `5` | Limits simultaneous requests per instance |
| Unauthenticated access | Makes the deployed app publicly accessible |

These limits reduce resource use, but they are not a spending cap. Builds, stored images, stored source and API usage have their own billing rules. Follow the workshop credit instructions separately.

### Verify the public app

1. Open the Service URL printed by the deployment command.
2. Check the pet, stat bars, care buttons, settings and chat are visible.
3. Set a pet name and personality, then send a message.
4. Check that Gemini replies in character.
5. Press Feed, Play and Rest and check the stat bars.
6. Refresh and confirm the pet settings persist in that browser.

The Cloud Run URL and Codespaces preview are different sites. Their browser storage is separate, so the public app can start with a fresh pet.

Checkpoint: The public app both loads and successfully replies to a chat message. A working homepage alone does not confirm the deployed API key works.

### Verify the deployed API from the terminal

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
export PET_SERVICE_URL="$(gcloud run services describe ai-pet \
  --project "$PET_PROJECT_ID" \
  --region "$PET_REGION" \
  --format='value(status.url)')"

curl -sS -i "${PET_SERVICE_URL}/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Introduce yourself in one short sentence.",
    "pet": {
      "name": "Mochi",
      "personality": "A friendly coding cat",
      "happiness": 70,
      "hunger": 40,
      "energy": 80
    },
    "history": []
  }'
```

Checkpoint: The deployed API returns HTTP 200 and a JSON object containing `reply` and `mood`.

## 15. Update the deployed app later

Edit your files in Codespaces and test locally first. Then push the update.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)" &&
git add ai-pet &&
git diff --cached --stat
```

Checkpoint: Only intended application changes are staged and the environment file is absent.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)" &&
git commit -m "Update Pocket Pal" &&
git push origin main
```

Checkpoint: The update reaches GitHub. If Git reports that there is nothing to commit, check whether you already pushed the change.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env
cd ~/gdgoc-ai-pet &&
git pull --ff-only &&
cd ai-pet
```

Checkpoint: Cloud Shell has the updated source and its current directory is the application folder. Run the deployment command in Step 14 again, then refresh the public app. Updating GitHub alone does not redeploy Cloud Run.

## 16. Clean up after the workshop

Keep the app if you intend to continue using it. When you finish experimenting, stop or delete your Codespace through [GitHub Codespaces](https://github.com/codespaces), after confirming your code is pushed.

For Google Cloud cleanup, use the next command only if you created a dedicated workshop project and want to delete everything in that project. This schedules deletion of the entire project, including the app, secrets, build resources and images. Your GitHub repository remains available.

Run in: Google Cloud Shell, only when you are finished with the project.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env
printf 'Project selected for deletion: %s\n' "$PET_PROJECT_ID"
gcloud projects delete "$PET_PROJECT_ID"
```

Checkpoint: Read the Project ID in the confirmation prompt. Confirm only if it is the dedicated workshop project you intend to remove. Google Cloud reports that the project is scheduled for deletion.

## What you built

The browser manages the pet interface and saves pet settings in local storage. It sends messages and the current pet state to the Next.js `/api/chat` route. The route validates them and calls a Genkit flow. Genkit uses the Google GenAI plugin to ask Gemini for a structured reply and mood. Cloud Run hosts the frontend and API together, with the API key provided through Secret Manager.

## Reference documentation

- [Create Next App options](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
- [Create a Codespace for a repository](https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-for-a-repository)
- [Genkit Google GenAI plugin](https://genkit.dev/docs/integrations/google-genai/)
- [Gemini API keys and importing projects](https://ai.google.dev/gemini-api/docs/api-key)
- [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)
- [Deploy Next.js on Cloud Run](https://docs.cloud.google.com/run/docs/quickstarts/frameworks/deploy-nextjs-service)
- [Use a custom build service account](https://docs.cloud.google.com/run/docs/configuring/services/build-service-account)
- [Cloud Run secrets](https://docs.cloud.google.com/run/docs/configuring/services/secrets)
