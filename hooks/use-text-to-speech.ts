"use client"

import { useState, useCallback, useRef, useEffect } from "react"

type SpeakOptions = {
  prompt?: string
}

type QueueItem = {
  text: string
  prompt?: string
}

class UnlockRequiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnlockRequiredError"
  }
}

const createSilentWavUrl = () => {
  const sampleRate = 8000
  const durationMs = 50
  const numSamples = Math.max(1, Math.floor((durationMs / 1000) * sampleRate))
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }

  writeString(0, "RIFF")
  view.setUint32(4, 36 + numSamples * 2, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, "data")
  view.setUint32(40, numSamples * 2, true)

  const blob = new Blob([buffer], { type: "audio/wav" })
  return URL.createObjectURL(blob)
}

export function useTextToSpeech() {
  const [isSupported, setIsSupported] = useState(
    () => typeof window !== "undefined" && typeof Audio !== "undefined",
  )
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [needsUnlock, setNeedsUnlock] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentUrlRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const queueRef = useRef<QueueItem[]>([])
  const isProcessingRef = useRef(false)
  const silentUrlRef = useRef<string | null>(null)

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = "auto"
    }
    return audioRef.current
  }, [])

  const resetAudioHandlers = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.onerror = null
    }
  }, [])

  const cleanupObjectUrl = useCallback(() => {
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    console.log("[v0-TTS] stop: 音声再生を停止")
    queueRef.current = []
    isProcessingRef.current = false
    abortControllerRef.current?.abort()
    abortControllerRef.current = null

    const audio = audioRef.current
    if (audio) {
      resetAudioHandlers()
      audio.pause()
      audio.currentTime = 0
    }

    cleanupObjectUrl()
    setIsSpeaking(false)
  }, [cleanupObjectUrl, resetAudioHandlers])

  const playQueueItem = useCallback(
    async (item: QueueItem) => {
      const audio = ensureAudio()
      resetAudioHandlers()
      setNeedsUnlock(false)

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: item.text,
          prompt: item.prompt,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errorMessage = "音声合成に失敗しました"
        try {
          const errorData = await response.json()
          if (errorData?.error) {
            errorMessage = errorData.error
          }
        } catch {
          // JSON以外はそのまま
        }
        throw new Error(errorMessage)
      }

      const audioBlob = await response.blob()
      cleanupObjectUrl()
      const objectUrl = URL.createObjectURL(audioBlob)
      currentUrlRef.current = objectUrl
      audio.src = objectUrl

      await new Promise<void>((resolve, reject) => {
        const handleEnded = () => {
          audio.onended = null
          audio.onerror = null
          setIsSpeaking(false)
          cleanupObjectUrl()
          resolve()
        }

        const handleError = () => {
          audio.onended = null
          audio.onerror = null
          setIsSpeaking(false)
          reject(new Error("音声再生エラー"))
        }

        audio.onended = handleEnded
        audio.onerror = handleError

        setIsSpeaking(true)
        const playPromise = audio.play()
        if (playPromise) {
          playPromise
            .then(() => {
              setIsUnlocked(true)
            })
            .catch((error) => {
            audio.onended = null
            audio.onerror = null
            if (error?.name === "NotAllowedError") {
              setNeedsUnlock(true)
              setIsSpeaking(false)
              reject(new UnlockRequiredError("ユーザー操作が必要です"))
              return
            }
            setIsSpeaking(false)
            reject(error)
          })
        } else {
          setIsUnlocked(true)
        }
      })
    },
    [cleanupObjectUrl, ensureAudio, resetAudioHandlers],
  )

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) {
      return
    }

    isProcessingRef.current = true
    while (queueRef.current.length > 0) {
      const item = queueRef.current.shift()
      if (!item) break

      try {
        await playQueueItem(item)
      } catch (error) {
        if (error instanceof UnlockRequiredError) {
          queueRef.current.unshift(item)
          isProcessingRef.current = false
          return
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          isProcessingRef.current = false
          return
        }

        console.error("[v0-TTS] 再生エラー:", error)
        isProcessingRef.current = false
        return
      }
    }

    isProcessingRef.current = false
  }, [playQueueItem])

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!isSupported) {
        console.error("[v0-TTS] speak: Audio要素が利用できません")
        return
      }

      const trimmedText = text?.trim()
      if (!trimmedText) {
        return
      }

      console.log(`[v0-TTS] speak: 音声再生開始 - テキスト: "${trimmedText.slice(0, 30)}..." (${trimmedText.length}文字)`)
      queueRef.current.push({
        text: trimmedText,
        prompt: options?.prompt,
      })
      void processQueue()
    },
    [isSupported, processQueue],
  )

  const unlockAudio = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.error("[v0-TTS] unlockAudio: Audio要素が利用できません")
      return false
    }

    if (isUnlocked) {
      console.log("[v0-TTS] unlockAudio: 既にアンロック済み")
      void processQueue()
      return true
    }

    try {
      const audio = ensureAudio()
      if (!silentUrlRef.current) {
        silentUrlRef.current = createSilentWavUrl()
      }

      audio.muted = true
      audio.src = silentUrlRef.current

      const playPromise = audio.play()
      if (playPromise) {
        await playPromise
      }

      audio.pause()
      audio.currentTime = 0
      audio.muted = false

      setIsUnlocked(true)
      setNeedsUnlock(false)
      void processQueue()
      console.log("[v0-TTS] unlockAudio: ✅ アンロック成功")
      return true
    } catch (error) {
      console.error("[v0-TTS] unlockAudio: エラー", error)
      return false
    }
  }, [ensureAudio, isSupported, isUnlocked, processQueue])

  useEffect(() => {
    if (typeof window !== "undefined" && typeof Audio !== "undefined") {
      setIsSupported(true)
      ensureAudio()
    }

    return () => {
      stop()
      if (silentUrlRef.current) {
        URL.revokeObjectURL(silentUrlRef.current)
        silentUrlRef.current = null
      }
    }
  }, [ensureAudio, stop])

  return {
    isSupported,
    isSpeaking,
    isUnlocked,
    needsUnlock,
    speak,
    stop,
    unlockAudio,
  }
}
