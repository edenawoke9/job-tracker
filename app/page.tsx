"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TodaysJobs from "./components/TodaysJobs"
import ManageProfessions from "./components/ManageProfessions"
import { initTelegramWebApp } from "./lib/telegram-webapp"

export default function MiniApp() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initApp = async () => {
      try {
        const webApp = initTelegramWebApp()
        if (webApp?.initDataUnsafe?.user) {
          setUser(webApp.initDataUnsafe.user)

          // Register user in our database
          await fetch("/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              telegram_id: webApp.initDataUnsafe.user.id,
              username: webApp.initDataUnsafe.user.username,
              first_name: webApp.initDataUnsafe.user.first_name,
            }),
          })
        } else {
          // Fallback for local development: set userId = 1
          setUser({ id: 1, first_name: "Dev User" })
        }
      } catch (error) {
        console.error("Error initializing app:", error)
        // Fallback for local development: set userId = 1
        setUser({ id: 1, first_name: "Dev User" })
      } finally {
        setIsLoading(false)
      }
    }

    initApp()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-100flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4">
          <h1 className="text-xl font-bold">Yene Sira</h1>
          {user && <p className="text-blue-100 text-sm">Welcome, {user.first_name}! 👋</p>}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-2 m-4">
            <TabsTrigger value="jobs">Today's Jobs</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="px-4 pb-4">
            <TodaysJobs userId={user?.id} />
          </TabsContent>

          <TabsContent value="preferences" className="px-4 pb-4">
            <ManageProfessions userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
