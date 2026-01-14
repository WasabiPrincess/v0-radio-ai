"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface GoodbyeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GoodbyeModal({ isOpen, onClose }: GoodbyeModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleReturn = () => {
    onClose()
    router.push("/")
  }

  return (
    <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 sm:p-12 relative">
        {/* 装飾的な円 - 左上 */}
        <div className="absolute top-20 left-12 w-12 h-12 rounded-full bg-[#d4e8e5] opacity-60"></div>
        <div className="absolute top-32 left-20 w-8 h-8 rounded-full bg-[#a8d5cf] opacity-40"></div>
        <div className="absolute top-28 left-32 w-6 h-6 rounded-full bg-[#d4e8e5] opacity-50"></div>

        {/* 装飾的な円 - 右上 */}
        <div className="absolute top-24 right-16 w-10 h-10 rounded-full bg-[#a8d5cf] opacity-50"></div>
        <div className="absolute top-36 right-24 w-14 h-14 rounded-full bg-[#d4e8e5] opacity-40"></div>
        <div className="absolute top-32 right-12 w-6 h-6 rounded-full bg-[#a8d5cf] opacity-60"></div>

        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#22a790] text-center mb-8">おつかれさまでした</h2>

          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-64">
              <Image
                src="/images/design-mode/%E3%81%B5%E3%82%8F%E3%82%8A%E3%82%A2%E3%83%8B%E3%83%A1%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3.gif"
                alt="ふわり"
                width={256}
                height={256}
                className="rounded-full"
                unoptimized
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-gray-700 text-lg mb-2">あなたのお話を聞けてよかったです</p>
            <p className="text-gray-700 text-lg">またいつでも話に来てくださいね</p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleReturn}
              className="bg-[#22a790] hover:bg-[#1a8a76] text-white text-xl px-16 py-6 rounded-full"
            >
              またね
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
