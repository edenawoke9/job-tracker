"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import AddPreferenceModal from "./AddPreferenceModal"

interface Profession {
  id: number
  name: string
  slug: string
  icon?: string
}

interface JobType {
  id: number
  name: string
  slug: string
}

interface UserPreference {
  id: number
  profession: Profession
  job_type: JobType
  keywords?: string[]
}

interface ManageProfessionsProps {
  userId?: number
}

export default function ManageProfessions({ userId }: ManageProfessionsProps) {
  const [preferences, setPreferences] = useState<UserPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchPreferences()
    }
  }, [userId])

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`/api/preferences?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error("Error fetching preferences:", error)
    } finally {
      setLoading(false)
    }
  }

  const removePreference = async (preferenceId: number) => {
    try {
      const response = await fetch(`/api/preferences/${preferenceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        setPreferences(preferences.filter((p) => p.id !== preferenceId))
      }
    } catch (error) {
      console.error("Error removing preference:", error)
    }
  }

  const handlePreferenceAdded = () => {
    fetchPreferences()
    setShowAddModal(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Job Preferences</h2>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Current Preferences */}
      {preferences.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">
              No job preferences set yet. Add some to get personalized notifications!
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Preference
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {preferences.map((preference) => (
            <Card key={preference.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{preference.profession.icon}</span>
                      <h3 className="font-medium">{preference.profession.name}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{preference.job_type.name}</Badge>

                      {preference.keywords && preference.keywords.length > 0 && (
                        <>
                          {preference.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePreference(preference.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Preference Modal */}
      {showAddModal && (
        <AddPreferenceModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onPreferenceAdded={handlePreferenceAdded}
        />
      )}
    </div>
  )
}
