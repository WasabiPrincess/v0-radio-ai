"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { RadioPlayer } from "@/components/radio-player"
import { useRadioConversation } from "@/hooks/use-radio-conversation"
import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"

export default function RadioPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userName = searchParams.get("name") || "ゲスト"

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState("00:00")
  const [hasStartedConversation, setHasStartedConversation] = useState(false)
  const [showUnlockOverlay, setShowUnlockOverlay] = useState(true)
  const [isUnlocking, setIsUnlocking] = useState(false)

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
    isUnlocked,

    // 操作
    toggleOnAir,
    toggleConversation,
    toggleListening,
    emergencyStop,
    setMode,
    setAutoListenDelay,
    startConversation,
    sendTranscript,
    clearTranscript,
    unlockAudio,
  } = useRadioConversation()

  // iOS/Safariの検出
  const isIOSSafari =
    typeof window !== "undefined" &&
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    /Safari/.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent)

  // デスクトップやAndroidでは自動的にオーバーレイを非表示
  useEffect(() => {
    if (!isIOSSafari) {
      setShowUnlockOverlay(false)
    }
  }, [isIOSSafari])

  // 音声アンロック & 会話開始ハンドラー
  const handleStartWithAudio = async () => {
    setIsUnlocking(true)
    console.log("[v0-Radio] 音声アンロック & 会話開始を実行します")

    try {
      // 音声をアンロック
      const unlocked = await unlockAudio()

      if (unlocked) {
        console.log("[v0-Radio] ✅ 音声アンロック成功")
        setShowUnlockOverlay(false)

        // ON AIRにする
        if (!isOnAir) {
          toggleOnAir()
        }

        // 会話を開始
        if (!hasStartedConversation && userName) {
          setHasStartedConversation(true)
          console.log("[v0-Radio] 会話を開始します - ユーザー名:", userName)
          // 少し待ってから会話開始
          setTimeout(() => {
            startConversation(userName)
          }, 300)
        }
      } else {
        console.error("[v0-Radio] ❌ 音声アンロック失敗")
        alert("音声の初期化に失敗しました。もう一度お試しください。")
      }
    } catch (error) {
      console.error("[v0-Radio] 音声アンロックエラー:", error)
      alert("音声の初期化でエラーが発生しました。")
    } finally {
      setIsUnlocking(false)
    }
  }

  // デスクトップ/Androidでは自動開始（従来の挙動）
  useEffect(() => {
    if (!isIOSSafari && !hasStartedConversation && userName) {
      console.log("[v0-Radio] 非iOS - 自動で会話を開始します")
      setHasStartedConversation(true)

      if (!isOnAir) {
        toggleOnAir()
      }

      setTimeout(() => {
        startConversation(userName)
      }, 1000)
    }
  }, [isIOSSafari, hasStartedConversation, userName, isOnAir, toggleOnAir, startConversation])

  useEffect(() => {
    if (!isOnAir && !showUnlockOverlay) {
      toggleOnAir()
    }
  }, [isOnAir, showUnlockOverlay, toggleOnAir])

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
    <>
      {/* iOS Safari用の音声アンロックオーバーレイ */}
      {showUnlockOverlay && isIOSSafari && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#eef4f4] px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#22a790" }}
              >
                <Volume2 className="w-12 h-12 text-white" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold" style={{ color: "#1a3a36" }}>
                音声を有効にしてください
              </h2>
              <p className="text-sm text-gray-600 text-balance">
                iPhoneでは音声を再生する前に、
                <br />
                ユーザー操作が必要です。
                <br />
                下のボタンを押して番組を開始してください。
              </p>
            </div>

            <Button
              onClick={handleStartWithAudio}
              disabled={isUnlocking}
              size="lg"
              className="text-white text-xl px-12 py-6 rounded-full font-bold shadow-2xl transition-all hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: "#22a790" }}
            >
              {isUnlocking ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  準備中...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Volume2 className="w-6 h-6" />
                  番組を開始
                </span>
              )}
            </Button>

            <p className="text-xs text-gray-500">
              ※ マイクとスピーカーの使用を許可してください
            </p>
          </div>
        </div>
      )}

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
        onClearTranscript={clearTranscript}
      />
    </>
  )
}
