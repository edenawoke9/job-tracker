"use client"

import React, { useState, useRef } from "react"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

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

interface AddPreferenceModalProps {
  userId?: number
  onClose: () => void
  onPreferenceAdded: () => void
}

export default function AddPreferenceModal({ userId, onClose, onPreferenceAdded }: AddPreferenceModalProps) {
  const [professions, setProfessions] = useState<Profession[]>([])
  const [jobTypes, setJobTypes] = useState<JobType[]>([])
  const [selectedProfession, setSelectedProfession] = useState<number | null>(null)
  const [selectedJobType, setSelectedJobType] = useState<number | null>(null)
  const [keywords, setKeywords] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [professionsRes, jobTypesRes] = await Promise.all([fetch("/api/professions"), fetch("/api/job-types")])

      if (professionsRes.ok && jobTypesRes.ok) {
        const [professionsData, jobTypesData] = await Promise.all([professionsRes.json(), jobTypesRes.json()])

        setProfessions(professionsData)
        setJobTypes(jobTypesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProfession || !selectedJobType || !userId) return

    setLoading(true)
    try {
      const keywordArray = keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0)

      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          professionId: selectedProfession,
          jobTypeId: selectedJobType,
          keywords: keywordArray.length > 0 ? keywordArray : undefined,
        }),
      })

      if (response.ok) {
        onPreferenceAdded()
      }
    } catch (error) {
      console.error("Error adding preference:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add Job Preference</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profession Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Choose Profession</Label>
              <SearchableDropdown<Profession>
                options={professions}
                value={selectedProfession}
                onChange={setSelectedProfession}
                placeholder="Search or select a profession..."
                getOptionLabel={(p) => `${p.icon ? p.icon + ' ' : ''}${p.name}`}
                optionArray={KNOWN_PROFESSIONS}
              />
            </div>

            {/* Job Type Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Job Type</Label>
              <SearchableDropdown<JobType>
                options={jobTypes}
                value={selectedJobType}
                onChange={setSelectedJobType}
                placeholder="Search or select a job type..."
                getOptionLabel={(jt) => jt.name}
                optionArray={JOB_TYPE_OPTIONS}
              />
            </div>

            {/* Keywords */}
            <div>
              <Label htmlFor="keywords" className="text-sm font-medium mb-2 block">
                Additional Keywords (optional)
              </Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., React, Python, Senior (comma separated)"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Add specific skills or terms to narrow down matches</p>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={!selectedProfession || !selectedJobType || loading} className="w-full">
              {loading ? "Adding..." : "Add Preference"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function SearchableDropdown<T extends { id: number }>({
  options,
  value,
  onChange,
  placeholder,
  getOptionLabel,
  optionArray,
}: {
  options: T[]
  value: number | null
  onChange: (id: number | null) => void
  placeholder: string
  getOptionLabel: (option: T) => string
  optionArray?: T[]
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use optionArray if provided, otherwise use options from props
  const data = optionArray && optionArray.length > 0 ? optionArray : options;

  const filtered = data.filter((opt) =>
    getOptionLabel(opt).toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = data.find((opt) => opt.id === value);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={selectedOption ? getOptionLabel(selectedOption) : search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
          onChange(null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        placeholder={placeholder}
        className="text-sm cursor-pointer"
        readOnly={!!selectedOption}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 bg-white border border-gray-200 rounded shadow w-full mt-1 max-h-48 overflow-y-auto">
          {filtered.map((opt) => (
            <div
              key={opt.id}
              className={`px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm ${value === opt.id ? 'bg-blue-50 font-semibold' : ''}`}
              onMouseDown={() => {
                onChange(opt.id);
                setSearch("");
                setOpen(false);
                inputRef.current?.blur();
              }}
            >
              {getOptionLabel(opt)}
            </div>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-10 bg-white border border-gray-200 rounded shadow w-full mt-1 p-2 text-sm text-gray-400">
          No options found
        </div>
      )}
      {selectedOption && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
          onClick={() => {
            onChange(null);
            setSearch("");
            setOpen(true);
            inputRef.current?.focus();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

const KNOWN_PROFESSIONS = [
  { id: 1, name: "Software Engineer", slug: "software-engineer", icon: "💻" },
  { id: 2, name: "Designer", slug: "designer", icon: "🎨" },
  { id: 3, name: "Product Manager", slug: "product-manager", icon: "📦" },
  { id: 4, name: "Data Scientist", slug: "data-scientist", icon: "📊" },
  { id: 5, name: "Marketing Specialist", slug: "marketing-specialist", icon: "📣" },
  { id: 6, name: "Sales Representative", slug: "sales-representative", icon: "🤝" },
  { id: 7, name: "Business Analyst", slug: "business-analyst", icon: "📈" },
  { id: 8, name: "HR Manager", slug: "hr-manager", icon: "🧑‍💼" },
  { id: 9, name: "QA Engineer", slug: "qa-engineer", icon: "🧪" },
  { id: 10, name: "DevOps Engineer", slug: "devops-engineer", icon: "⚙️" },
  { id: 11, name: "Waiter/Waitress", slug: "waiter-waitress", icon: "🍽️" },
  { id: 12, name: "Social Media Manager", slug: "social-media-manager", icon: "📱" },
  { id: 13, name: "Driver", slug: "driver", icon: "🚗" },
  { id: 14, name: "Customer Support", slug: "customer-support", icon: "🎧" },
  { id: 15, name: "Teacher", slug: "teacher", icon: "👩‍🏫" },
  { id: 16, name: "Nurse", slug: "nurse", icon: "🩺" },
  { id: 17, name: "Chef", slug: "chef", icon: "👨‍🍳" },
  { id: 18, name: "Construction Worker", slug: "construction-worker", icon: "👷" },
  { id: 19, name: "Electrician", slug: "electrician", icon: "💡" },
  { id: 20, name: "Plumber", slug: "plumber", icon: "🔧" },
  { id: 21, name: "Receptionist", slug: "receptionist", icon: "📞" },
  { id: 22, name: "Accountant", slug: "accountant", icon: "🧾" },
  { id: 23, name: "Mechanic", slug: "mechanic", icon: "🔩" },
  { id: 24, name: "Security Guard", slug: "security-guard", icon: "🛡️" },
  { id: 25, name: "Cleaner", slug: "cleaner", icon: "🧹" },
  { id: 26, name: "Barista", slug: "barista", icon: "☕" },
  { id: 27, name: "Bartender", slug: "bartender", icon: "🍸" },
  { id: 28, name: "Photographer", slug: "photographer", icon: "📷" },
  { id: 29, name: "Dentist", slug: "dentist", icon: "🦷" },
  { id: 30, name: "Doctor", slug: "doctor", icon: "👨‍⚕️" },
];

const JOB_TYPE_OPTIONS = [
  { id: 1, name: "Part Time", slug: "part-time" },
  { id: 2, name: "Full Time", slug: "full-time" },
  { id: 3, name: "Remote", slug: "remote" },
  { id: 4, name: "Internship", slug: "internship" },
];
