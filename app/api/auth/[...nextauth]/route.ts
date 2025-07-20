import NextAuth, { type NextAuthOptions } from "next-auth"
import { sql } from "@vercel/postgres"

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "telegram",
      name: "Telegram",
      type: "oauth",
      authorization: {
        url: "https://oauth.telegram.org/auth",
        params: {
          bot_id: process.env.TELEGRAM_BOT_TOKEN?.split(":")[0],
          origin: process.env.NEXTAUTH_URL,
          request_access: "write",
        },
      },
      token: "https://oauth.telegram.org/auth/request",
      userinfo: {
        url: "https://oauth.telegram.org/auth/get",
        async request({ tokens }) {
          // Verify Telegram auth data
          const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`)
          const botInfo = await response.json()

          return {
            id: tokens.user?.id,
            name: `${tokens.user?.first_name} ${tokens.user?.last_name || ""}`.trim(),
            username: tokens.user?.username,
            image: tokens.user?.photo_url,
          }
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name,
          username: profile.username,
          image: profile.image,
        }
      },
      clientId: process.env.TELEGRAM_BOT_TOKEN?.split(":")[0] || "",
      clientSecret: process.env.TELEGRAM_BOT_TOKEN || "",
    },
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "telegram") {
        try {
          // Store user in database
          await sql`
            INSERT INTO users (telegram_id, name, username, image)
            VALUES (${user.id}, ${user.name}, ${user.username || ""}, ${user.image || ""})
            ON CONFLICT (telegram_id) 
            DO UPDATE SET 
              name = EXCLUDED.name,
              username = EXCLUDED.username,
              image = EXCLUDED.image,
              updated_at = NOW()
          `
          return true
        } catch (error) {
          console.error("Error storing user:", error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: "/",
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
