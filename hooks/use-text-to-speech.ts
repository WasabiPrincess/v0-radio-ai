"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export function useTextToSpeech() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [ableVoiceOutput, setAbleVoiceOutput] = useState(false)

  const synthRef = useRef<SpeechSynthesis | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const isProcessingRef = useRef(false)

  const enableVoiceOutput = useCallback(() => {
    const speechSynthesis = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance("")
    speechSynthesis.speak(utterance)
    setAbleVoiceOutput(true)
    window.removeEventListener("touchend", enableVoiceOutput)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis
      setIsSupported(true)

      const loadVoices = () => {
        const allVoices = synthRef.current?.getVoices() || []
        setVoices(allVoices)
        voicesRef.current = allVoices
        console.log(`[v0] 音声読み込み完了: ${allVoices.length}個`)
      }

      loadVoices()
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices
      }
    }

    if (!ableVoiceOutput) {
      window.addEventListener("touchend", enableVoiceOutput)
    }

    return () => {
      window.removeEventListener("touchend", enableVoiceOutput)
    }
  }, [ableVoiceOutput, enableVoiceOutput])

  const speak = useCallback((text: string) => {
    if (isProcessingRef.current) {
      console.log("[v0] 既に音声再生中のため、新しいリクエストをスキップします")
      return
    }

    if (!synthRef.current) {
      console.error("[v0] エラー: 音声合成エンジンが準備できていません")
      return
    }

    if (voicesRef.current.length === 0) {
      console.warn("[v0] 警告: 音声リストが読み込まれていません。再試行してください。")
      const allVoices = synthRef.current.getVoices()
      if (allVoices.length > 0) {
        voicesRef.current = allVoices
        setVoices(allVoices)
        console.log(`[v0] 音声リスト再読み込み成功: ${allVoices.length}個`)
      } else {
        return
      }
    }

    console.log(`[v0] 音声再生開始: "${text.slice(0, 20)}..." (声の数: ${voicesRef.current.length})`)

    isProcessingRef.current = true

    synthRef.current.pause()
    synthRef.current.cancel()
    synthRef.current.resume()

    // 文章を短く切って再生する（iOS長文バグ対策）
    const sentences = text.split(/([。、！？\n])/g)
    const chunks: string[] = []

    let currentChunk = ""
    sentences.forEach((str) => {
      if (currentChunk.length + str.length < 50) {
        currentChunk += str
      } else {
        if (currentChunk) chunks.push(currentChunk)
        currentChunk = str
      }
    })
    if (currentChunk) chunks.push(currentChunk)

    let index = 0
    const speakNext = () => {
      if (index >= chunks.length) {
        setIsSpeaking(false)
        isProcessingRef.current = false
        console.log("[v0] 音声再生完了")
        return
      }

      const chunkText = chunks[index]
      const utterance = new SpeechSynthesisUtterance(chunkText)

      const jpVoice = voicesRef.current.find((v) => v.lang.includes("ja"))
      if (jpVoice) {
        utterance.voice = jpVoice
        console.log(`[v0] 使用する声: ${jpVoice.name}`)
      }

      utterance.lang = "ja-JP"
      utterance.rate = 1.0
      utterance.pitch = 1.0

      utterance.onstart = () => {
        console.log(`[v0] チャンク ${index + 1}/${chunks.length} 再生開始`)
      }

      utterance.onend = () => {
        console.log(`[v0] チャンク ${index + 1}/${chunks.length} 完了`)
        index++
        setTimeout(() => speakNext(), 150)
      }

      utterance.onerror = (event) => {
        console.error(`[v0] 音声再生エラー詳細:`, {
          error: event.error,
          message: event.message || "エラーメッセージなし",
          charIndex: event.charIndex,
          elapsedTime: event.elapsedTime,
          name: event.name,
        })

        // エラーが発生しても次のチャンクに進む（一部エラーを無視）
        if (event.error === "interrupted" || event.error === "canceled") {
          console.log("[v0] 割り込みエラー - 次のチャンクに進みます")
          index++
          setTimeout(() => speakNext(), 100)
        } else {
          setIsSpeaking(false)
          isProcessingRef.current = false
        }
      }

      setIsSpeaking(true)

      synthRef.current?.resume()
      synthRef.current?.speak(utterance)
    }

    speakNext()

    // NOTE: iOSでマイク使用時は音声出力が受話口（レシーバー）に切り替わる可能性があります
    // ユーザーにイヤホンの使用を推奨するUI表示を検討してください
    console.log("[v0] iOS注意: マイク使用時はイヤホン推奨（受話口出力を回避）")
  }, [])

  const stop = useCallback(() => {
    console.log("[v0] 音声再生を停止")
    synthRef.current?.cancel()
    setIsSpeaking(false)
    isProcessingRef.current = false
  }, [])

  return {
    isSupported,
    isSpeaking,
    speak,
    stop,
    voices,
  }
}
