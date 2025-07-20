import { NextResponse } from "next/server"
import { Database } from "@/lib/db"

export async function GET() {
  try {
    const jobTypes = await Database.getAllJobTypes()
    return NextResponse.json(jobTypes)
  } catch (error) {
    console.error("Error fetching job types:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
