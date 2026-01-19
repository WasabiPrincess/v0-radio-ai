"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { ChatMessage } from "@/types/chat"

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [initialMessageSpoken, setInitialMessageSpoken] = useState(false)
  const [userName, setUserName] = useState<string>("")
  const messagesRef = useRef<ChatMessage[]>([])

  useEffect(() => {
    if (!isInitialized) {
      setMessages([])
      setIsInitialized(true)
    }
  }, [isInitialized])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const sendMessage = useCallback(
    async (userMessage: string, userNameOverride?: string): Promise<string | null> => {
      if (isLoading) {
        console.warn("[v0] sendMessage: 既にリクエスト中のためスキップします")
        return null
      }

      const effectiveUserName = userNameOverride || userName
      console.log("[v0] sendMessage呼び出し - userMessage:", userMessage || "(空)", "userName:", effectiveUserName)

      setIsLoading(true)
      setError(null)

      let conversationHistory = [...messagesRef.current]

      if (userMessage.trim()) {
        const userChatMessage: ChatMessage = {
          role: "user",
          content: userMessage,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userChatMessage])
        conversationHistory = [...messagesRef.current, userChatMessage]
      }

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory: conversationHistory.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            userName: effectiveUserName,
          }),
        })

        if (!response.ok) {
          throw new Error("AI応答の取得に失敗しました")
        }

        const data = await response.json()

        const aiChatMessage: ChatMessage = {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, aiChatMessage])

        return data.response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました"
        setError(errorMessage)
        console.error("AI Chat Error:", err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, userName],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setIsInitialized(false)
    setInitialMessageSpoken(false)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    initialMessageSpoken,
    setInitialMessageSpoken,
    userName,
    setUserName,
  }
}
