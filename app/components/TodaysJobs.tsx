"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, MapPin, DollarSign, Building } from "lucide-react"

interface JobPost {
  id: number
  title: string
  description?: string
  company?: string
  location?: string
  salary?: string
  post_url?: string
  posted_at?: string
  profession?: {
    name: string
    icon: string
  }
  job_type?: {
    name: string
  }
}

interface TodaysJobsProps {
  userId?: number
}

export default function TodaysJobs({ userId }: TodaysJobsProps) {
  const [jobs, setJobs] = useState<JobPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "matched">("all")

  useEffect(() => {
    fetchJobs()
  }, [filter, userId])

  const fetchJobs = async () => {
    try {
      const endpoint = filter === "matched" && userId ? `/api/jobs/matched?userId=${userId}` : "/api/jobs/today"

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          All Jobs ({jobs.length})
        </Button>
        {userId && (
          <Button variant={filter === "matched" ? "default" : "outline"} size="sm" onClick={() => setFilter("matched")}>
            My Matches
          </Button>
        )}
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              {filter === "matched"
                ? "No jobs match your preferences today. Try adjusting your preferences!"
                : "No jobs posted today yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg leading-tight">{job.title}</h3>
                  {job.post_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={job.post_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>

                {/* Job Details */}
                <div className="space-y-2 mb-3">
                  {job.company && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      {job.company}
                    </div>
                  )}

                  {job.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {job.location}
                    </div>
                  )}

                  {job.salary && (
                    <div className="flex items-center text-sm text-green-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {job.salary}
                    </div>
                  )}
                </div>

                {/* Description */}
                {job.description && <p className="text-sm text-gray-700 mb-3 line-clamp-2">{job.description}</p>}

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {job.profession && (
                    <Badge variant="secondary" className="text-xs">
                      {job.profession.icon} {job.profession.name}
                    </Badge>
                  )}
                  {job.job_type && (
                    <Badge variant="outline" className="text-xs">
                      {job.job_type.name}
                    </Badge>
                  )}
                </div>

                {/* Posted Time */}
                {job.posted_at && (
                  <p className="text-xs text-gray-400 mt-2">Posted: {new Date(job.posted_at).toLocaleTimeString()}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
