import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { sql } from "@vercel/postgres"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's subscribed keywords
    const { rows: subscriptions } = await sql`
      SELECT keyword FROM subscriptions WHERE user_id = ${session.user.id}
    `

    if (subscriptions.length === 0) {
      return NextResponse.json([])
    }

    const keywords = subscriptions.map((s) => s.keyword)

    // Get jobs matching user's keywords
    const { rows: jobs } = await sql`
      SELECT DISTINCT j.id, j.title, j.company, j.description, j.url, j.posted_at as "postedAt",
             array_agg(DISTINCT jk.keyword) as keywords
      FROM jobs j
      JOIN job_keywords jk ON j.id = jk.job_id
      WHERE jk.keyword = ANY(${keywords})
      GROUP BY j.id, j.title, j.company, j.description, j.url, j.posted_at
      ORDER BY j.posted_at DESC
      LIMIT 50
    `

    return NextResponse.json(jobs)
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// This endpoint will be used by ISR to revalidate job listings
export async function POST() {
  try {
    // Trigger revalidation of job listings
    // This would be called by your cron job after scraping new jobs
    return NextResponse.json({ revalidated: true })
  } catch (error) {
    console.error("Error revalidating jobs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
