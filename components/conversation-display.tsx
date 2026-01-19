"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import type { ChatMessage } from "@/types/chat"

interface ConversationDisplayProps {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

export function ConversationDisplay({ messages, isLoading, error }: ConversationDisplayProps) {
  if (messages.length === 0 && !isLoading && !error) {
    return (
      <Card className="bg-white border-[#a8d5cf] p-4 sm:p-6 h-full">
        <div className="text-center text-gray-600">
          <p className="text-xl sm:text-2xl mb-2">ふわりと対話を始めましょう</p>
          <p className="text-base sm:text-lg">マイクボタンを押して話しかけてください</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-[#a8d5cf] p-4 sm:p-6 h-full">
      <ScrollArea className="h-60 sm:h-80 w-full">
        <div className="space-y-4 sm:space-y-6">
          {messages.map((message, index) => (
            <div key={index} className="w-full">
              <div
                className={`w-full px-3 sm:px-5 py-2 sm:py-3 rounded-lg ${
                  message.role === "user" ? "bg-[#d4e8e5] text-gray-700" : "bg-[#22a790] text-white"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-medium mb-1">
                      {message.role === "user" ? "あなた" : "ふわり"}
                    </p>
                    <p className="text-sm sm:text-[16px] leading-relaxed">{message.content}</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="w-full">
              <div className="bg-[#22a790] text-white px-3 sm:px-5 py-2 sm:py-3 rounded-lg w-full flex items-center gap-2">
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="text-base sm:text-lg">ふわりが考え中...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="w-full">
              <div className="bg-red-500 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-lg w-full text-sm sm:text-base">
                エラー: {error}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
