import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getGeminiTtsEnv } from "@/lib/env.server"

const ttsRequestSchema = z.object({
  text: z.string().min(1),
  prompt: z.string().optional(),
})

const REQUEST_TIMEOUT_MS = 15000
const WAV_SAMPLE_RATE = 24000
const WAV_CHANNELS = 1
const WAV_BITS_PER_SAMPLE = 16

export async function POST(request: NextRequest) {
  try {
    const parsed = ttsRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "テキストが指定されていません" }, { status: 400 })
    }

    const { text, prompt } = parsed.data

    console.log("[v0] TTS API呼び出し - テキスト長:", text?.length)

    const { apiKey, model, voiceName, maxInputBytes } = getGeminiTtsEnv()

    if (Buffer.byteLength(text, "utf8") > maxInputBytes) {
      return NextResponse.json({ error: "テキストが長すぎます。短くしてください。" }, { status: 400 })
    }

    if (typeof prompt === "string" && Buffer.byteLength(prompt, "utf8") > maxInputBytes) {
      return NextResponse.json({ error: "プロンプトが長すぎます。短くしてください。" }, { status: 400 })
    }

    const promptText = typeof prompt === "string" && prompt.trim() ? prompt.trim() : ""
    const combinedText = promptText ? `${promptText}\n\n${text.trim()}` : text.trim()

    if (Buffer.byteLength(combinedText, "utf8") > maxInputBytes) {
      return NextResponse.json({ error: "テキストが長すぎます。短くしてください。" }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    const ttsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: combinedText,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName,
                },
              },
            },
          },
        }),
        signal: controller.signal,
      },
    ).finally(() => {
      clearTimeout(timeoutId)
    })

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text()
      console.error("[v0] TTS APIエラー:", ttsResponse.status, errorText)
      return NextResponse.json({ error: "音声合成に失敗しました" }, { status: 500 })
    }

    const ttsData = await ttsResponse.json()
    console.log("[v0] TTS API成功 - 音声データ取得")

    const inlineData =
      ttsData?.candidates?.[0]?.content?.parts?.[0]?.inlineData ??
      ttsData?.candidates?.[0]?.content?.parts?.[0]?.inline_data
    const pcmBase64 = inlineData?.data

    if (!pcmBase64) {
      console.error("[v0] TTS APIエラー: audio dataが空です")
      return NextResponse.json({ error: "音声データの取得に失敗しました" }, { status: 500 })
    }

    const pcmBytes = Uint8Array.from(Buffer.from(pcmBase64, "base64"))
    const wavBytes = buildWavBytes(pcmBytes, WAV_SAMPLE_RATE, WAV_CHANNELS, WAV_BITS_PER_SAMPLE)

    const wavBuffer = wavBytes.buffer.slice(
      wavBytes.byteOffset,
      wavBytes.byteOffset + wavBytes.byteLength,
    ) as ArrayBuffer

    return new NextResponse(wavBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
        "Content-Length": wavBytes.length.toString(),
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("[v0] TTS API Error: タイムアウト")
      return NextResponse.json({ error: "音声合成がタイムアウトしました" }, { status: 504 })
    }
    if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    console.error("[v0] TTS API Error:", error)
    return NextResponse.json(
      {
        error: "音声合成に失敗しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

function buildWavBytes(
  pcmBytes: Uint8Array,
  sampleRate: number,
  channels: number,
  bitsPerSample: number,
): Uint8Array {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8
  const blockAlign = (channels * bitsPerSample) / 8
  const dataSize = pcmBytes.length
  const headerBuffer = new ArrayBuffer(44)
  const headerView = new DataView(headerBuffer)
  const headerBytes = new Uint8Array(headerBuffer)

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      headerBytes[offset + i] = value.charCodeAt(i)
    }
  }

  writeString(0, "RIFF")
  headerView.setUint32(4, 36 + dataSize, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  headerView.setUint32(16, 16, true)
  headerView.setUint16(20, 1, true)
  headerView.setUint16(22, channels, true)
  headerView.setUint32(24, sampleRate, true)
  headerView.setUint32(28, byteRate, true)
  headerView.setUint16(32, blockAlign, true)
  headerView.setUint16(34, bitsPerSample, true)
  writeString(36, "data")
  headerView.setUint32(40, dataSize, true)

  const wavBytes = new Uint8Array(44 + dataSize)
  wavBytes.set(headerBytes, 0)
  wavBytes.set(pcmBytes, 44)
  return wavBytes
}
