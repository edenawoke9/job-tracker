"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"

interface Subscription {
  id: string
  keyword: string
  createdAt: string
}

export function Dashboard() {
  const { data: session } = useSession()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions")
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data)
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    }
  }

  const addSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyword.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      })

      if (response.ok) {
        setNewKeyword("")
        fetchSubscriptions()
      }
    } catch (error) {
      console.error("Error adding subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const removeSubscription = async (id: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchSubscriptions()
      }
    } catch (error) {
      console.error("Error removing subscription:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={addSubscription} className="mb-6">
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Enter job keyword (e.g., React, Python)"
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add"}
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          {subscriptions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No subscriptions yet. Add some keywords to get started!</p>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge variant="secondary">{sub.keyword}</Badge>
                <Button variant="ghost" size="sm" onClick={() => removeSubscription(sub.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
