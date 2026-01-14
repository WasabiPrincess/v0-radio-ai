"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { RadioPlayer } from "@/components/radio-player"
import { useRadioConversation } from "@/hooks/use-radio-conversation"

export default function RadioPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userName = searchParams.get("name") || "ゲスト"

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState("00:00")
  const [hasPlayedInitialMessage, setHasPlayedInitialMessage] = useState(false)
  const [hasStartedConversation, setHasStartedConversation] = useState(false)

  const {
    // 状態
    isOnAir,
    isActive,
    conversationMode,
    conversationState,
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

    // 操作
    toggleOnAir,
    toggleConversation,
    toggleListening,
    emergencyStop,
    setMode,
    setAutoListenDelay,
    playInitialMessage,
    startConversation, // 新しく追加した関数
    sendTranscript, // 送信ボタン用の関数を追加
    clearTranscript, // クリア関数を追加
  } = useRadioConversation()

  useEffect(() => {
    console.log("[v0] ラジオページマウント - messages数:", messages.length)

    if (!isOnAir) {
      console.log("[v0] 番組をON AIRにします")
      toggleOnAir()
    }

    // messagesが初期化され、まだ初期メッセージを再生していない場合
    if (messages.length > 0 && !hasPlayedInitialMessage && !isSpeaking) {
      console.log("[v0] 初期メッセージを再生します:", messages[0].content.substring(0, 50) + "...")
      setHasPlayedInitialMessage(true)

      // 少し遅延を入れて音声合成の準備を待つ
      setTimeout(() => {
        playInitialMessage()
      }, 1500)
    }
  }, [messages, hasPlayedInitialMessage, isSpeaking, isOnAir, toggleOnAir, playInitialMessage])

  useEffect(() => {
    console.log("[v0] ラジオページマウント - hasStartedConversation:", hasStartedConversation)

    if (!hasStartedConversation && userName) {
      console.log("[v0] 会話を開始します - ユーザー名:", userName)
      setHasStartedConversation(true)

      // 少し遅延を入れて音声合成の準備を待つ
      setTimeout(() => {
        startConversation(userName)
      }, 1000)
    }
  }, [hasStartedConversation, userName, startConversation])

  useEffect(() => {
    if (!isOnAir) {
      toggleOnAir()
    }
  }, [isOnAir, toggleOnAir])

  // 時間更新のシミュレーション
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        const now = new Date()
        const minutes = now.getMinutes().toString().padStart(2, "0")
        const seconds = now.getSeconds().toString().padStart(2, "0")
        setCurrentTime(`${minutes}:${seconds}`)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isPlaying])

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying)
  }

  const handleExit = () => {
    // 音声を停止
    emergencyStop()
    // スタート画面に戻る
    router.push("/")
  }

  return (
    <RadioPlayer
      // 番組関連
      isOnAir={isOnAir}
      onToggleOnAir={toggleOnAir}
      // 会話関連
      isActive={isActive}
      conversationMode={conversationMode}
      conversationState={conversationState}
      autoListenDelay={autoListenDelay}
      onToggleConversation={toggleConversation}
      onEmergencyStop={emergencyStop}
      onModeChange={setMode}
      onDelayChange={setAutoListenDelay}
      // 音声認識関連
      isListening={isListening}
      transcript={transcript}
      interimTranscript={interimTranscript}
      speechError={speechError}
      isSpeechSupported={isSpeechSupported}
      onToggleListening={toggleListening}
      // AI関連
      messages={messages}
      isAILoading={isAILoading}
      aiError={aiError}
      // 音声合成関連
      isSpeaking={isSpeaking}
      // プレイヤー関連
      isPlaying={isPlaying}
      onPlayToggle={handlePlayToggle}
      currentTime={currentTime}
      currentTrack="またねcast"
      onExit={handleExit}
      onSendTranscript={sendTranscript}
      onClearTranscript={clearTranscript} // クリア関数を渡す
    />
  )
}
