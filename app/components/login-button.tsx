"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function LoginButton() {
  return (
    <Button onClick={() => signIn("telegram")} className="bg-blue-500 hover:bg-blue-600">
      Login with Telegram
    </Button>
  )
}
