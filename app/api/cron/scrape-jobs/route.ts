import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

// Rate limiting for notifications
const notificationQueue = new Map<string, number>()

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("Starting job scraping...")

    // Simulate job scraping from various sources
    const scrapedJobs = await scrapeJobs()

    let newJobsCount = 0

    for (const job of scrapedJobs) {
      // Check if job already exists
      const { rows: existing } = await sql`
        SELECT id FROM jobs WHERE url = ${job.url}
      `

      if (existing.length === 0) {
        // Insert new job
        const { rows: insertedJob } = await sql`
          INSERT INTO jobs (title, company, description, url, posted_at)
          VALUES (${job.title}, ${job.company}, ${job.description}, ${job.url}, ${job.postedAt})
          RETURNING id
        `

        const jobId = insertedJob[0].id

        // Extract and store keywords
        const keywords = extractKeywords(job.title + " " + job.description)

        for (const keyword of keywords) {
          await sql`
            INSERT INTO job_keywords (job_id, keyword)
            VALUES (${jobId}, ${keyword})
            ON CONFLICT (job_id, keyword) DO NOTHING
          `
        }

        // Send notifications for matching subscriptions
        await sendNotifications(jobId, job, keywords)
        newJobsCount++
      }
    }

    console.log(`Scraping completed. ${newJobsCount} new jobs added.`)

    return NextResponse.json({
      success: true,
      newJobs: newJobsCount,
      totalScraped: scrapedJobs.length,
    })
  } catch (error) {
    console.error("Error in job scraping:", error)
    return NextResponse.json({ error: "Scraping failed" }, { status: 500 })
  }
}

async function scrapeJobs() {
  // This is a simplified example. In reality, you'd scrape from job boards
  // like Indeed, LinkedIn, etc. using libraries like Puppeteer or Cheerio

  // Simulate API calls to job boards with rate limiting
  const mockJobs = [
    {
      title: "Senior React Developer",
      company: "Tech Corp",
      description: "Looking for a senior React developer with TypeScript experience...",
      url: `https://example.com/job/${Date.now()}-1`,
      postedAt: new Date().toISOString(),
    },
    {
      title: "Python Backend Engineer",
      company: "StartupXYZ",
      description: "Python developer needed for backend services using FastAPI...",
      url: `https://example.com/job/${Date.now()}-2`,
      postedAt: new Date().toISOString(),
    },
  ]

  // Add random delay to simulate real scraping
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return mockJobs
}

function extractKeywords(text: string): string[] {
  const commonKeywords = [
    "react",
    "vue",
    "angular",
    "javascript",
    "typescript",
    "python",
    "java",
    "node.js",
    "express",
    "fastapi",
    "django",
    "flask",
    "sql",
    "mongodb",
    "postgresql",
    "mysql",
    "redis",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "git",
    "ci/cd",
    "agile",
    "scrum",
  ]

  const lowerText = text.toLowerCase()
  return commonKeywords.filter((keyword) => lowerText.includes(keyword))
}

async function sendNotifications(jobId: string, job: any, keywords: string[]) {
  try {
    // Get users subscribed to these keywords
    const { rows: subscriptions } = await sql`
      SELECT DISTINCT u.telegram_id, u.name, s.keyword
      FROM users u
      JOIN subscriptions s ON u.telegram_id = s.user_id
      WHERE s.keyword = ANY(${keywords})
    `

    for (const sub of subscriptions) {
      const userId = sub.telegram_id
      const now = Date.now()

      // Rate limiting: max 1 notification per user per 5 minutes
      const lastNotification = notificationQueue.get(userId) || 0
      if (now - lastNotification < 5 * 60 * 1000) {
        continue
      }

      const message =
        `🔔 New job match for "${sub.keyword}"!\n\n` + `📋 ${job.title}\n` + `🏢 ${job.company}\n` + `🔗 ${job.url}`

      await sendTelegramMessage(userId, message)
      notificationQueue.set(userId, now)

      // Store notification in database for tracking
      await sql`
        INSERT INTO notifications (user_id, job_id, keyword, sent_at)
        VALUES (${userId}, ${jobId}, ${sub.keyword}, NOW())
      `
    }
  } catch (error) {
    console.error("Error sending notifications:", error)
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
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`)
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error)
  }
}
