"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export function useTextToSpeech() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isUnlocked, setIsUnlocked] = useState(false)

  const synthRef = useRef<SpeechSynthesis | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const isProcessingRef = useRef(false)
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null)
  const chunkWatchdogRef = useRef<NodeJS.Timeout | null>(null)

  // ウォッチドッグタイマーをクリア
  const clearWatchdogs = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current)
      watchdogTimerRef.current = null
    }
    if (chunkWatchdogRef.current) {
      clearTimeout(chunkWatchdogRef.current)
      chunkWatchdogRef.current = null
    }
  }, [])

  // 音声アンロック関数（ユーザー操作起点で呼び出す）
  const unlockAudio = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        console.error("[v0-TTS] unlockAudio: speechSynthesis未対応")
        resolve(false)
        return
      }

      if (isUnlocked) {
        console.log("[v0-TTS] unlockAudio: 既にアンロック済み")
        resolve(true)
        return
      }

      console.log("[v0-TTS] unlockAudio: 音声アンロックを開始...")

      // 短いテスト発話でアンロック
      const testUtterance = new SpeechSynthesisUtterance("はい")
      testUtterance.volume = 0.01 // 極小音量
      testUtterance.rate = 2.0 // 高速
      testUtterance.lang = "ja-JP"

      let resolved = false
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true
          console.warn("[v0-TTS] unlockAudio: タイムアウト（2秒）- アンロック失敗")
          resolve(false)
        }
      }, 2000)

      testUtterance.onstart = () => {
        console.log("[v0-TTS] unlockAudio: テスト発話開始")
      }

      testUtterance.onend = () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeoutId)
          setIsUnlocked(true)
          console.log("[v0-TTS] unlockAudio: ✅ アンロック成功")
          resolve(true)
        }
      }

      testUtterance.onerror = (event) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeoutId)
          console.error("[v0-TTS] unlockAudio: エラー", event.error)
          resolve(false)
        }
      }

      synthRef.current.cancel() // 既存のキューをクリア
      synthRef.current.speak(testUtterance)
    })
  }, [isUnlocked])

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis
      setIsSupported(true)

      const loadVoices = () => {
        const allVoices = synthRef.current?.getVoices() || []
        setVoices(allVoices)
        voicesRef.current = allVoices
        console.log(`[v0-TTS] 音声読み込み完了: ${allVoices.length}個`)
      }

      loadVoices()
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices
      }
    }

    return () => {
      clearWatchdogs()
    }
  }, [clearWatchdogs])

  const speak = useCallback((text: string) => {
    if (!synthRef.current) {
      console.error("[v0-TTS] speak: 音声合成エンジンが準備できていません")
      return
    }

    // iOS Safari対策: アンロックされていない場合は警告
    if (!isUnlocked) {
      console.warn("[v0-TTS] speak: 音声がアンロックされていません。iOS/Safariでは再生できない可能性があります")
      console.warn("[v0-TTS] speak: unlockAudio()を先に呼び出してください")
    }

    if (isProcessingRef.current) {
      console.log("[v0-TTS] speak: 既に音声再生中のため、新しいリクエストをスキップします")
      console.log(`[v0-TTS] speak: speechSynthesis.speaking=${synthRef.current.speaking}, pending=${synthRef.current.pending}`)
      return
    }

    if (voicesRef.current.length === 0) {
      console.warn("[v0-TTS] speak: 音声リストが読み込まれていません。再試行...")
      const allVoices = synthRef.current.getVoices()
      if (allVoices.length > 0) {
        voicesRef.current = allVoices
        setVoices(allVoices)
        console.log(`[v0-TTS] speak: 音声リスト再読み込み成功: ${allVoices.length}個`)
      } else {
        console.error("[v0-TTS] speak: 音声リストの取得に失敗")
        return
      }
    }

    console.log(`[v0-TTS] speak: 音声再生開始 - テキスト: "${text.slice(0, 30)}..." (${text.length}文字)`)
    console.log(`[v0-TTS] speak: isUnlocked=${isUnlocked}, 声の数=${voicesRef.current.length}`)

    isProcessingRef.current = true

    // 既存のキューをクリア
    synthRef.current.cancel()

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

    console.log(`[v0-TTS] speak: ${chunks.length}チャンクに分割`)

    let index = 0
    const speakNext = () => {
      if (index >= chunks.length) {
        setIsSpeaking(false)
        isProcessingRef.current = false
        clearWatchdogs()
        console.log("[v0-TTS] speak: ✅ 全チャンク再生完了")
        return
      }

      const chunkText = chunks[index]
      const utterance = new SpeechSynthesisUtterance(chunkText)

      const jpVoice = voicesRef.current.find((v) => v.lang.includes("ja"))
      if (jpVoice) {
        utterance.voice = jpVoice
      }

      utterance.lang = "ja-JP"
      utterance.rate = 1.0
      utterance.pitch = 1.0

      let chunkStarted = false

      // チャンク毎のウォッチドッグ: onstartが5秒来ない場合
      chunkWatchdogRef.current = setTimeout(() => {
        if (!chunkStarted) {
          console.error(`[v0-TTS] speak: ⚠️ チャンク ${index + 1} - onstartが5秒来ない（詰まり検出）`)
          console.error(`[v0-TTS] speak: speechSynthesis.speaking=${synthRef.current?.speaking}, pending=${synthRef.current?.pending}`)
          synthRef.current?.cancel()
          setIsSpeaking(false)
          isProcessingRef.current = false
          clearWatchdogs()
        }
      }, 5000)

      utterance.onstart = () => {
        chunkStarted = true
        if (chunkWatchdogRef.current) {
          clearTimeout(chunkWatchdogRef.current)
          chunkWatchdogRef.current = null
        }
        console.log(`[v0-TTS] speak: チャンク ${index + 1}/${chunks.length} 再生開始`)
        
        // onendが15秒来ない場合のウォッチドッグ
        watchdogTimerRef.current = setTimeout(() => {
          console.error(`[v0-TTS] speak: ⚠️ チャンク ${index + 1} - onendが15秒来ない（詰まり検出）`)
          synthRef.current?.cancel()
          setIsSpeaking(false)
          isProcessingRef.current = false
          clearWatchdogs()
        }, 15000)
      }

      utterance.onend = () => {
        clearWatchdogs()
        console.log(`[v0-TTS] speak: チャンク ${index + 1}/${chunks.length} 完了`)
        index++
        setTimeout(() => speakNext(), 150)
      }

      utterance.onerror = (event) => {
        clearWatchdogs()
        console.error(`[v0-TTS] speak: ❌ チャンク ${index + 1} エラー:`, {
          error: event.error,
          message: event.message || "エラーメッセージなし",
          charIndex: event.charIndex,
          elapsedTime: event.elapsedTime,
        })

        // エラーが発生しても次のチャンクに進む（一部エラーを無視）
        if (event.error === "interrupted" || event.error === "canceled") {
          console.log("[v0-TTS] speak: 割り込みエラー - 次のチャンクに進みます")
          index++
          setTimeout(() => speakNext(), 100)
        } else {
          console.error("[v0-TTS] speak: 致命的エラー - 再生を中断します")
          setIsSpeaking(false)
          isProcessingRef.current = false
        }
      }

      setIsSpeaking(true)
      synthRef.current?.speak(utterance)
    }

    speakNext()
  }, [isUnlocked, clearWatchdogs])

  const stop = useCallback(() => {
    console.log("[v0-TTS] stop: 音声再生を停止")
    synthRef.current?.cancel()
    setIsSpeaking(false)
    isProcessingRef.current = false
    clearWatchdogs()
  }, [clearWatchdogs])

  return {
    isSupported,
    isSpeaking,
    isUnlocked,
    speak,
    stop,
    unlockAudio,
    voices,
  }
}
