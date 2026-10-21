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
