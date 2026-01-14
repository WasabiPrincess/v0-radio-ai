import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    console.log("[v0] TTS API呼び出し - テキスト長:", text?.length)

    if (!text) {
      return NextResponse.json({ error: "テキストが指定されていません" }, { status: 400 })
    }

    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS

    if (!credentials) {
      console.error("[v0] GOOGLE_CLOUD_CREDENTIALS が設定されていません")
      return NextResponse.json({ error: "Google Cloud認証情報が設定されていません" }, { status: 500 })
    }

    let credentialsJson
    try {
      credentialsJson = JSON.parse(credentials)
      console.log("[v0] 認証情報パース成功 - project_id:", credentialsJson.project_id)
    } catch (e) {
      console.error("[v0] 認証情報のパースエラー:", e)
      return NextResponse.json({ error: "認証情報の形式が不正です" }, { status: 500 })
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: await createJWT(credentialsJson),
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[v0] トークン取得エラー:", errorText)
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 500 })
    }

    const { access_token } = await tokenResponse.json()
    console.log("[v0] アクセストークン取得成功")

    const ttsResponse = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "ja-JP",
          name: "ja-JP-Wavenet-B",
          ssmlGender: "FEMALE",
        },
        audioConfig: {
          audioEncoding: "MP3",
          pitch: 2.0,
          speakingRate: 1.0,
          volumeGainDb: 2.0,
        },
      }),
    })

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text()
      console.error("[v0] TTS APIエラー:", errorText)
      return NextResponse.json({ error: "音声合成に失敗しました" }, { status: 500 })
    }

    const ttsData = await ttsResponse.json()
    console.log("[v0] TTS API成功 - 音声データ取得")

    return NextResponse.json({
      audioContent: ttsData.audioContent,
    })
  } catch (error) {
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

async function createJWT(credentials: any): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signatureInput = `${encodedHeader}.${encodedPayload}`

  const signature = await signWithRSA(signatureInput, credentials.private_key)

  return `${signatureInput}.${signature}`
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

async function signWithRSA(data: string, privateKey: string): Promise<string> {
  const sign = crypto.createSign("RSA-SHA256")
  sign.update(data)
  sign.end()

  const signature = sign.sign(privateKey)
  return signature.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}
