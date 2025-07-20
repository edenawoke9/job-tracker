import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const preferences = await Database.getUserPreferences(Number.parseInt(userId))
    return NextResponse.json(preferences)
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, professionId, jobTypeId, keywords } = await request.json()

    if (!userId || !professionId || !jobTypeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const preference = await Database.addUserPreference(userId, professionId, jobTypeId, keywords)
    return NextResponse.json(preference, { status: 201 })
  } catch (error) {
    console.error("Error adding preference:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
