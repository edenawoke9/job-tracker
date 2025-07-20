import { NextResponse } from "next/server"
import { Database } from "@/lib/db"

export async function GET() {
  try {
    const professions = await Database.getAllProfessions()
    return NextResponse.json(professions)
  } catch (error) {
    console.error("Error fetching professions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
