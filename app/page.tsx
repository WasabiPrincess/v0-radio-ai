"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Radio } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [userName, setUserName] = useState("")

  const handleStartBroadcast = () => {
    if (userName.trim()) {
      router.push(`/radio?name=${encodeURIComponent(userName.trim())}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-8" style={{ backgroundColor: "#eef4f4" }}>
      <div className="text-center space-y-6 sm:space-y-8 py-8 max-w-2xl w-full">
        {/* ロゴとタイトル */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#22a790" }}
            >
              <Radio className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif tracking-tight" style={{ color: "#1a3a36" }}>
            <br />
            またねcast
          </h1>
        </div>

        {/* 説明文 */}
        <div className="max-w-md mx-auto space-y-3 px-4 sm:px-0" style={{ color: "#4a5d5a" }}>
          <p className="text-balance text-left text-sm sm:text-base">
            亡くなった大切な人との"記憶"や"口癖"が、
            <br />
            あなたの現在や行動にどんな『成分』として残っているのかを、
            <br />
            一緒にゆる〜くお話ししていく時間です。
          </p>
        </div>

        {/* お名前入力 */}
        <div className="max-w-md mx-auto space-y-4 px-4 sm:px-0">
          <div className="space-y-2">
            <label htmlFor="userName" className="text-sm font-medium block text-left" style={{ color: "#1a3a36" }}>
              ラジオネーム
            </label>
            <Input
              id="userName"
              type="text"
              placeholder="例: たんぽぽ"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="bg-white text-gray-900 placeholder:text-gray-500 text-base sm:text-lg py-4 sm:py-6"
              style={{ borderColor: "#22a790" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && userName.trim()) {
                  handleStartBroadcast()
                }
              }}
            />
          </div>
        </div>

        {/* ON AIRボタン */}
        <div className="pt-4">
          <Button
            onClick={handleStartBroadcast}
            size="lg"
            disabled={!userName.trim()}
            className="text-white text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-full font-bold shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ backgroundColor: "#22a790" }}
          >
            <span className="flex items-center gap-2 sm:gap-3">
              <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
              ON AIR
            </span>
          </Button>
        </div>

        {/* 注意事項 */}
        <p className="text-xs sm:text-sm max-w-sm mx-auto text-pretty px-4 sm:px-0" style={{ color: "#6b7d7a" }}>
          ※ この番組では音声認識と音声合成を使用します。
          <br />
          マイクとスピーカーの使用を許可してください。
        </p>
      </div>
    </div>
  )
}
