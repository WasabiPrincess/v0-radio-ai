"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Square, Settings2 } from "lucide-react"
import { useState } from "react"
import type { ConversationMode, ConversationState } from "@/types/conversation"

interface ConversationControlsProps {
  isActive: boolean
  conversationMode: ConversationMode
  conversationState: ConversationState
  autoListenDelay: number
  onToggleConversation: () => void
  onEmergencyStop: () => void
  onModeChange: (mode: "manual" | "auto") => void
  onDelayChange: (delay: number) => void
}

export function ConversationControls({
  isActive,
  conversationMode,
  conversationState,
  autoListenDelay,
  onToggleConversation,
  onEmergencyStop,
  onModeChange,
  onDelayChange,
}: ConversationControlsProps) {
  const [showSettings, setShowSettings] = useState(false)

  const getStateText = () => {
    switch (conversationState) {
      case "listening":
        return "音声認識中"
      case "processing":
        return "AI処理中"
      case "speaking":
        return "AI応答中"
      default:
        return "待機中"
    }
  }

  const getStateColor = () => {
    switch (conversationState) {
      case "listening":
        return "text-blue-300"
      case "processing":
        return "text-yellow-300"
      case "speaking":
        return "text-green-300"
      default:
        return "text-white/80"
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={onToggleConversation}
            className={`rounded-full w-12 h-12 ${
              isActive ? "bg-green-500 hover:bg-green-600" : "bg-white/20 hover:bg-white/30"
            }`}
          >
            {isActive ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
          </Button>

          <div className="text-white">
            <p className="font-medium">{isActive ? "会話中" : "停止中"}</p>
            <p className={`text-sm ${getStateColor()}`}>{getStateText()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 rounded-full"
          >
            <Settings2 className="w-4 h-4" />
          </Button>

          <Button
            onClick={onEmergencyStop}
            variant="destructive"
            size="sm"
            className="rounded-full"
            disabled={!isActive}
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showSettings && (
        <div className="space-y-4 pt-4 border-t border-white/20">
          <div className="space-y-2">
            <label className="text-white text-sm">会話モード</label>
            <Select value={conversationMode} onValueChange={onModeChange}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">手動モード</SelectItem>
                <SelectItem value="auto">自動モード</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-white/60 text-xs">
              {conversationMode === "auto"
                ? "AI応答後に自動で音声認識を開始します"
                : "手動でマイクボタンを押して会話します"}
            </p>
          </div>

          {conversationMode === "auto" && (
            <div className="space-y-2">
              <label className="text-white text-sm">自動開始遅延: {autoListenDelay / 1000}秒</label>
              <Slider
                value={[autoListenDelay]}
                onValueChange={([value]) => onDelayChange(value)}
                min={1000}
                max={5000}
                step={500}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
