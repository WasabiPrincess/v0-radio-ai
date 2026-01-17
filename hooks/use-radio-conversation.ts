"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useAIChat } from "./use-ai-chat"
import { useTextToSpeech } from "./use-text-to-speech"
import { useSpeechRecognition } from "./use-speech-recognition"

export function useRadioConversation() {
  const [isOnAir, setIsOnAir] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [conversationMode, setConversationMode] = useState<"manual" | "auto">("manual")
  const [autoListenDelay, setAutoListenDelay] = useState(2000) // 2秒後に自動で音声認識開始

  const {
    messages,
    isLoading: isAILoading,
    error: aiError,
    sendMessage,
    initialMessageSpoken,
    setInitialMessageSpoken,
    userName,
    setUserName,
  } = useAIChat()
  const { speak, isSpeaking, stop: stopSpeaking, unlockAudio, isUnlocked } = useTextToSpeech()
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition()

  const autoListenTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const conversationStateRef = useRef<"idle" | "listening" | "processing" | "speaking">("idle")

  // 会話状態の更新
  useEffect(() => {
    if (isListening) {
      conversationStateRef.current = "listening"
    } else if (isAILoading) {
      conversationStateRef.current = "processing"
    } else if (isSpeaking) {
      conversationStateRef.current = "speaking"
    } else {
      conversationStateRef.current = "idle"
    }
  }, [isListening, isAILoading, isSpeaking])

  // 自動モードでの音声認識開始
  const scheduleAutoListen = useCallback(() => {
    if (conversationMode === "auto" && isActive && !isListening && !isAILoading && !isSpeaking) {
      autoListenTimeoutRef.current = setTimeout(() => {
        if (conversationStateRef.current === "idle") {
          startListening()
        }
      }, autoListenDelay)
    }
  }, [conversationMode, isActive, isListening, isAILoading, isSpeaking, startListening, autoListenDelay])

  // 音声合成完了後の自動音声認識開始
  useEffect(() => {
    if (!isSpeaking && conversationMode === "auto" && isActive) {
      scheduleAutoListen()
    }

    return () => {
      if (autoListenTimeoutRef.current) {
        clearTimeout(autoListenTimeoutRef.current)
        autoListenTimeoutRef.current = null
      }
    }
  }, [isSpeaking, scheduleAutoListen, conversationMode, isActive])

  const toggleListening = useCallback(() => {
    console.log("[v0] toggleListening呼び出し - isListening:", isListening)

    if (isListening) {
      console.log("[v0] 音声認識を停止します")
      stopListening()
      // 自動送信を削除 - ユーザーが送信ボタンを押すまで待つ
    } else if (!isSpeaking && !isAILoading) {
      console.log("[v0] 音声認識を開始します")
      resetTranscript()
      startListening()
    } else {
      console.log("[v0] 音声認識を開始できません - isSpeaking:", isSpeaking, "isAILoading:", isAILoading)
    }
  }, [isListening, stopListening, isSpeaking, isAILoading, startListening, resetTranscript])

  const sendTranscript = useCallback(async () => {
    if (!transcript.trim()) {
      console.log("[v0] 送信する内容がありません")
      return
    }

    console.log("[v0] transcriptを送信します:", transcript)
    const textToSend = transcript
    resetTranscript()

    const aiResponse = await sendMessage(textToSend)

    if (aiResponse) {
      console.log("[v0] AI応答を音声で読み上げます:", aiResponse.substring(0, 50) + "...")
      speak(aiResponse)
    } else {
      console.log("[v0] AI応答の取得に失敗しました")
    }
  }, [transcript, resetTranscript, sendMessage, speak])

  const clearTranscript = useCallback(() => {
    console.log("[v0] トランスクリプトをクリアします")
    resetTranscript()
  }, [resetTranscript])

  // 会話の開始/停止
  const toggleConversation = useCallback(() => {
    setIsActive(!isActive)
    if (isActive) {
      // 会話停止
      stopListening()
      stopSpeaking()
      if (autoListenTimeoutRef.current) {
        clearTimeout(autoListenTimeoutRef.current)
        autoListenTimeoutRef.current = null
      }
    } else {
      // 会話開始
      if (conversationMode === "auto") {
        scheduleAutoListen()
      }
    }
  }, [isActive, stopListening, stopSpeaking, conversationMode, scheduleAutoListen])

  const playInitialMessage = useCallback(() => {
    console.log("[v0] playInitialMessage呼び出し - messages数:", messages.length)

    if (messages.length > 0 && messages[0].role === "assistant" && !initialMessageSpoken) {
      const initialMessage = messages[0].content
      console.log("[v0] 初期メッセージを音声合成に渡します:", initialMessage.substring(0, 50) + "...")

      speak(initialMessage)
      setInitialMessageSpoken(true)
    } else {
      console.log("[v0] 初期メッセージ再生条件が満たされていません", {
        messagesLength: messages.length,
        firstMessageRole: messages[0]?.role,
        initialMessageSpoken,
      })
    }
  }, [messages, speak, setInitialMessageSpoken, initialMessageSpoken])

  const toggleOnAir = useCallback(() => {
    const newOnAirState = !isOnAir
    setIsOnAir(newOnAirState)
    console.log("[v0] ON AIR状態変更:", newOnAirState)

    if (!newOnAirState) {
      // 番組終了 - 全て停止
      setIsActive(false)
      stopListening()
      stopSpeaking()
      if (autoListenTimeoutRef.current) {
        clearTimeout(autoListenTimeoutRef.current)
        autoListenTimeoutRef.current = null
      }
    }
  }, [isOnAir, stopListening, stopSpeaking])

  // 緊急停止
  const emergencyStop = useCallback(() => {
    setIsActive(false)
    setIsOnAir(false)
    stopListening()
    stopSpeaking()
    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current)
      autoListenTimeoutRef.current = null
    }
  }, [stopListening, stopSpeaking])

  // 会話モードの切り替え
  const setMode = useCallback(
    (mode: "manual" | "auto") => {
      setConversationMode(mode)
      if (mode === "auto" && isActive && conversationStateRef.current === "idle") {
        scheduleAutoListen()
      } else if (mode === "manual" && autoListenTimeoutRef.current) {
        clearTimeout(autoListenTimeoutRef.current)
        autoListenTimeoutRef.current = null
      }
    },
    [isActive, scheduleAutoListen],
  )

  const startConversation = useCallback(
    async (name: string) => {
      console.log("[v0] startConversation呼び出し - ユーザー名:", name)

      setUserName(name)

      const aiResponse = await sendMessage("", name)

      if (aiResponse) {
        console.log("[v0] AIの1回目の応答を取得しました:", aiResponse.substring(0, 50) + "...")

        setTimeout(() => {
          console.log("[v0] AIの1回目の応答を音声で読み上げます")
          speak(aiResponse)
        }, 500)
      } else {
        console.log("[v0] AIの1回目の応答の取得に失敗しました")
      }
    },
    [sendMessage, speak, setUserName],
  )

  return {
    // 状態
    isOnAir,
    isActive,
    conversationMode,
    conversationState: conversationStateRef.current,
    autoListenDelay,

    // 音声認識関連
    isListening,
    transcript,
    interimTranscript,
    speechError,
    isSpeechSupported,

    // AI関連
    messages,
    isAILoading,
    aiError,

    // 音声合成関連
    isSpeaking,
    isUnlocked,

    // 操作
    toggleOnAir,
    toggleConversation,
    toggleListening,
    emergencyStop,
    setMode,
    setAutoListenDelay,
    sendTranscript,
    clearTranscript, // 新しい関数をエクスポート
    playInitialMessage,
    setUserName,
    userName,
    startConversation, // 新しく追加した関数をエクスポート
    unlockAudio, // 音声アンロック関数をエクスポート
  }
}
