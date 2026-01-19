import { z } from "zod"

const geminiEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_CHAT_MODEL: z.string().optional(),
  GEMINI_TTS_MODEL: z.string().optional(),
  GEMINI_TTS_VOICE_NAME: z.string().optional(),
  TTS_MAX_INPUT_BYTES: z.string().optional(),
})

export type GeminiTtsEnv = {
  apiKey: string
  model: string
  voiceName: string
  maxInputBytes: number
}

export type GeminiChatEnv = {
  apiKey: string
  model: string
}

export function getGeminiTtsEnv(): GeminiTtsEnv {
  const parsed = geminiEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error("GEMINI_API_KEYが設定されていません")
  }

  const maxInputBytes = Number(parsed.data.TTS_MAX_INPUT_BYTES ?? "4000")

  return {
    apiKey: parsed.data.GEMINI_API_KEY,
    model: parsed.data.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts",
    voiceName: parsed.data.GEMINI_TTS_VOICE_NAME || "Kore",
    maxInputBytes: Number.isFinite(maxInputBytes) && maxInputBytes > 0 ? maxInputBytes : 4000,
  }
}

export function getGeminiChatEnv(): GeminiChatEnv {
  const parsed = geminiEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error("GEMINI_API_KEYが設定されていません")
  }

  return {
    apiKey: parsed.data.GEMINI_API_KEY,
    model: parsed.data.GEMINI_CHAT_MODEL || "gemini-2.5-flash",
  }
}
