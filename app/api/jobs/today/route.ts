import { NextResponse } from "next/server"
import { Database } from "@/lib/db"

export const revalidate = 300 // ISR: revalidate every 5 minutes

export async function GET() {
  try {
    const jobs = await Database.getTodaysJobs()
    return NextResponse.json(jobs)
  } catch (error) {
    console.error("Error fetching today's jobs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
