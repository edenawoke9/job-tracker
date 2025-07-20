import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const jobs = await Database.getJobsByPreferences(Number.parseInt(userId))
    return NextResponse.json(jobs)
  } catch (error) {
    console.error("Error fetching matched jobs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
