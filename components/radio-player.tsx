"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, LogOut, X, Send } from "lucide-react"
import { ConversationDisplay } from "./conversation-display"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"
import Image from "next/image"
import { GoodbyeModal } from "./goodbye-modal"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface RadioPlayerProps {
  // 番組関連
  isOnAir: boolean
  onToggleOnAir: () => void

  // 会話関連
  isActive: boolean
  conversationMode: "manual" | "auto"
  conversationState: "idle" | "listening" | "processing" | "speaking"
  autoListenDelay: number
  onToggleConversation: () => void
  onEmergencyStop: () => void
  onModeChange: (mode: "manual" | "auto") => void
  onDelayChange: (delay: number) => void

  // 音声認識関連
  isListening: boolean
  transcript: string
  interimTranscript: string
  speechError: string | null
  isSpeechSupported: boolean
  onToggleListening: () => void

  // AI関連
  messages: ChatMessage[]
  isAILoading: boolean
  aiError: string | null

  // 音声合成関連
  isSpeaking: boolean

  // プレイヤー関連
  isPlaying: boolean
  onPlayToggle: () => void
  currentTrack?: string
  currentTime?: string

  // 退出ボタン用のコールバック
  onExit?: () => void

  // 送信ボタン用のコールバック
  onSendTranscript: () => void

  onClearTranscript?: () => void
}

export function RadioPlayer({
  isOnAir,
  onToggleOnAir,
  isActive,
  conversationMode,
  conversationState,
  autoListenDelay,
  onToggleConversation,
  onEmergencyStop,
  onModeChange,
  onDelayChange,
  isListening,
  transcript,
  interimTranscript,
  speechError,
  isSpeechSupported,
  onToggleListening,
  messages,
  isAILoading,
  aiError,
  isSpeaking,
  currentTrack = "またねcast - 大切な人との記憶を語る時間",
  onExit,
  onSendTranscript,
  onClearTranscript,
}: RadioPlayerProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showGoodbyeModal, setShowGoodbyeModal] = useState(false)

  const {
    isSupported: isTTSSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume: ttsVolume,
    setVolume: setTTSVolume,
    emotion,
    setEmotion,
    stop: stopSpeaking,
  } = useTextToSpeech()

  const getStateText = () => {
    if (isSpeaking) return "ふわりが話しています..."
    if (isAILoading) return "ふわりが応答中..."
    if (isListening) return "お話を聞いています..."
    if (conversationMode === "auto" && isActive) return "自動モード実行中"
    return "タップしてお話しください"
  }

  const getStateColor = () => {
    if (isSpeaking) return "text-[#22a790]"
    if (isAILoading) return "text-[#3bb8a3]"
    if (isListening) return "text-[#22a790]"
    return "text-gray-600"
  }

  const handleExit = () => {
    setShowGoodbyeModal(true)
  }

  return (
    <div className="min-h-screen bg-[#eef4f4] flex flex-col">
      <header className="flex items-center justify-between p-4 sm:p-6 bg-[#22a790] text-white">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">またねcast</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {onExit && (
            <Button
              onClick={handleExit}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">退出</span>
            </Button>
          )}
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse delay-100"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="text-left my-4 sm:my-6">
          <p className="text-sm sm:text-lg text-gray-600">
            あなたはまたねcastのゲストとして招待されました
            <br />
            ラジオパーソナリティAIふわりと一緒に、大切な人との記憶をお話ししましょう
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full">
          <div className="flex-shrink-0 flex items-start justify-center pt-2 sm:pt-8">
            <div className="relative w-32 h-32 sm:w-48 sm:h-48 lg:w-60 lg:h-60">
              <Image
                src="/images/design-mode/%E3%81%B5%E3%82%8F%E3%82%8A%E3%82%A2%E3%83%8B%E3%83%A1%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3.gif"
                alt="ふわり"
                width={240}
                height={240}
                className={`rounded-full transition-opacity duration-300 ${isSpeaking ? "opacity-100" : "opacity-60"}`}
                unoptimized
              />
              {isSpeaking && (
                <div className="absolute inset-0 rounded-full border-2 sm:border-4 border-[#22a790] animate-pulse"></div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ConversationDisplay messages={messages} isLoading={isAILoading} error={aiError} />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-[#d4e8e5] border-t border-[#a8d5cf]">
        <Card className="bg-white border-[#a8d5cf] p-4 sm:p-6">
          {(transcript || interimTranscript) && (
            <div className="bg-[#eef4f4] rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 flex items-center justify-between">
              <p className="text-gray-700 text-xs sm:text-sm flex-1">
                {transcript}
                <span className="text-gray-400">{interimTranscript}</span>
              </p>
              {onClearTranscript && (
                <Button
                  onClick={onClearTranscript}
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full w-7 h-7 sm:w-8 sm:h-8 p-0 flex-shrink-0"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-3 sm:mb-4">
            <Button
              onClick={onToggleListening}
              disabled={!isSpeechSupported || (conversationMode === "auto" && isActive)}
              className={`rounded-full w-16 h-16 sm:w-20 sm:h-20 ${
                isListening ? "bg-[#22a790] hover:bg-[#1a8a76] animate-pulse" : "bg-[#a8d5cf] hover:bg-[#8cc5bd]"
              } ${
                !isSpeechSupported || (conversationMode === "auto" && isActive) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isListening ? (
                <MicOff className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              ) : (
                <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-[#1a5c52]" />
              )}
            </Button>

            <Button
              onClick={onSendTranscript}
              disabled={!transcript.trim() || isAILoading || isSpeaking}
              className="bg-[#22a790] hover:bg-[#1a8a76] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              送信
            </Button>
          </div>

          <div className="text-center mb-3 sm:mb-4">
            {speechError ? (
              <span className="text-red-500 text-sm sm:text-base">{speechError}</span>
            ) : (
              <span className={`text-sm sm:text-base ${getStateColor()}`}>{getStateText()}</span>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-6 text-gray-500 text-xs sm:text-sm pt-3 sm:pt-4 border-t border-[#a8d5cf]">
            <span className={isSpeechSupported ? "text-[#22a790]" : "text-red-500"}>
              音声認識: {isSpeechSupported ? "対応" : "非対応"}
            </span>
            <span className={isTTSSupported ? "text-[#22a790]" : "text-red-500"}>
              音声合成: {isTTSSupported ? "対応" : "非対応"}
            </span>
          </div>
        </Card>
      </div>

      <GoodbyeModal isOpen={showGoodbyeModal} onClose={() => setShowGoodbyeModal(false)} />
    </div>
  )
}
