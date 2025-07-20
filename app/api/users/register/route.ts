import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { telegram_id, username, first_name } = await request.json()

    if (!telegram_id) {
      return NextResponse.json({ error: "Telegram ID is required" }, { status: 400 })
    }

    const user = await Database.createUser(telegram_id, username, first_name)
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
