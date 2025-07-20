import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { sql } from "@vercel/postgres"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rows } = await sql`
      SELECT id, keyword, created_at as "createdAt"
      FROM subscriptions 
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { keyword } = await request.json()
    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "Invalid keyword" }, { status: 400 })
    }

    // Check if subscription already exists
    const { rows: existing } = await sql`
      SELECT id FROM subscriptions 
      WHERE user_id = ${session.user.id} AND keyword = ${keyword.toLowerCase()}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Subscription already exists" }, { status: 409 })
    }

    const { rows } = await sql`
      INSERT INTO subscriptions (user_id, keyword)
      VALUES (${session.user.id}, ${keyword.toLowerCase()})
      RETURNING id, keyword, created_at as "createdAt"
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
