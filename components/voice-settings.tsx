"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Settings, VolumeX, Volume2, Heart, Smile, Zap, Briefcase, User } from "lucide-react"
import { useState } from "react"

interface VoiceSettingsProps {
  voices: SpeechSynthesisVoice[]
  selectedVoice: SpeechSynthesisVoice | null
  onVoiceChange: (voice: SpeechSynthesisVoice) => void
  rate: number
  onRateChange: (rate: number) => void
  pitch: number
  onPitchChange: (pitch: number) => void
  volume: number
  onVolumeChange: (volume: number) => void
  emotion: string
  onEmotionChange: (emotion: string) => void
  isSpeaking: boolean
  onStop: () => void
}

const emotionOptions = [
  { value: "neutral", label: "ニュートラル", icon: User },
  { value: "friendly", label: "フレンドリー", icon: Smile },
  { value: "excited", label: "エキサイト", icon: Zap },
  { value: "calm", label: "落ち着いた", icon: Heart },
  { value: "professional", label: "プロフェッショナル", icon: Briefcase },
]

export function VoiceSettings({
  voices,
  selectedVoice,
  onVoiceChange,
  rate,
  onRateChange,
  pitch,
  onPitchChange,
  volume,
  onVolumeChange,
  emotion,
  onEmotionChange,
  isSpeaking,
  onStop,
}: VoiceSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const japaneseVoices = voices.filter((voice) => voice.lang.startsWith("ja"))
  const otherVoices = voices.filter((voice) => !voice.lang.startsWith("ja"))

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20 rounded-full"
      >
        <Settings className="w-4 h-4" />
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 bg-white/10 backdrop-blur-md border-white/20 p-4 w-80 z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">音声設定</h3>
              {isSpeaking && (
                <Button onClick={onStop} size="sm" variant="destructive" className="rounded-full">
                  <VolumeX className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm">感情表現</label>
              <div className="grid grid-cols-2 gap-2">
                {emotionOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <Button
                      key={option.value}
                      onClick={() => onEmotionChange(option.value)}
                      variant={emotion === option.value ? "default" : "ghost"}
                      size="sm"
                      className={`text-xs ${
                        emotion === option.value
                          ? "bg-white text-black hover:bg-white/90"
                          : "text-white hover:bg-white/20"
                      }`}
                    >
                      <IconComponent className="w-3 h-3 mr-1" />
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm">音声</label>
              <Select
                value={selectedVoice?.name || ""}
                onValueChange={(value) => {
                  const voice = voices.find((v) => v.name === value)
                  if (voice) onVoiceChange(voice)
                }}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="音声を選択" />
                </SelectTrigger>
                <SelectContent>
                  {japaneseVoices.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground">日本語</div>
                      {japaneseVoices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {otherVoices.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground">その他</div>
                      {otherVoices.slice(0, 10).map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm">速度: {rate.toFixed(1)}x</label>
              <Slider
                value={[rate]}
                onValueChange={([value]) => onRateChange(value)}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm">ピッチ: {pitch.toFixed(1)}</label>
              <Slider
                value={[pitch]}
                onValueChange={([value]) => onPitchChange(value)}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                音量: {Math.round(volume * 100)}%
              </label>
              <Slider
                value={[volume]}
                onValueChange={([value]) => onVolumeChange(value)}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
