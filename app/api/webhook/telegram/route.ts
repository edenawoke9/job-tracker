import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verify webhook is from Telegram
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      return NextResponse.json({ error: "Bot token not configured" }, { status: 500 })
    }

    // Handle different types of updates
    if (body.message) {
      await handleMessage(body.message)
    } else if (body.callback_query) {
      await handleCallbackQuery(body.callback_query)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleMessage(message: any) {
  const chatId = message.chat.id.toString()
  const text = message.text

  if (text === "/start") {
    const welcomeMessage =
      `Welcome to Job Keyword Notifier! 🎉\n\n` +
      `To get started:\n` +
      `1. Visit our website to login\n` +
      `2. Subscribe to job keywords\n` +
      `3. Receive notifications here when matching jobs are found!\n\n` +
      `Website: ${process.env.NEXTAUTH_URL}`

    await sendTelegramMessage(chatId, welcomeMessage)
  } else if (text === "/help") {
    const helpMessage =
      `Available commands:\n\n` +
      `/start - Get started\n` +
      `/help - Show this help\n` +
      `/status - Check your subscriptions\n\n` +
      `Visit ${process.env.NEXTAUTH_URL} to manage your subscriptions.`

    await sendTelegramMessage(chatId, helpMessage)
  } else if (text === "/status") {
    await handleStatusCommand(chatId)
  }
}

async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id.toString()
  const data = callbackQuery.data

  // Handle inline keyboard callbacks
  if (data.startsWith("unsubscribe_")) {
    const keyword = data.replace("unsubscribe_", "")
    // Handle unsubscribe logic
    await sendTelegramMessage(chatId, `Unsubscribed from "${keyword}"`)
  }
}

async function handleStatusCommand(chatId: string) {
  try {
    const { rows: subscriptions } = await sql`
      SELECT keyword FROM subscriptions WHERE user_id = ${chatId}
    `

    if (subscriptions.length === 0) {
      await sendTelegramMessage(chatId, "You have no active subscriptions. Visit our website to add some!")
    } else {
      const keywords = subscriptions.map((s) => `• ${s.keyword}`).join("\n")
      const message = `Your active subscriptions:\n\n${keywords}\n\nManage them at: ${process.env.NEXTAUTH_URL}`
      await sendTelegramMessage(chatId, message)
    }
  } catch (error) {
    console.error("Error handling status command:", error)
    await sendTelegramMessage(chatId, "Sorry, there was an error checking your subscriptions.")
  }
}

async function sendTelegramMessage(chatId: string, message: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`)
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error)
  }
}
