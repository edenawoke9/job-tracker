import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { sql } from "@vercel/postgres"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const { rowCount } = await sql`
      DELETE FROM subscriptions 
      WHERE id = ${id} AND user_id = ${session.user.id}
    `

    if (rowCount === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
