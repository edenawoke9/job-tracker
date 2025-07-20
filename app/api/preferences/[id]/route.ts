import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await request.json()
    const preferenceId = Number.parseInt(params.id)

    if (!userId || !preferenceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await Database.removeUserPreference(userId, preferenceId)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Preference not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error deleting preference:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
