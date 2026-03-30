import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Snowflake, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'

type CoolBoxCondition = 'good' | 'bad' | 'broken'

interface CoolBoxRecord {
  id: number
  location: string
  condition_status: CoolBoxCondition
  notes: string
  updated_at: string
}

const conditionConfig = {
  good: {
    label: 'Good',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  bad: {
    label: 'Bad',
    icon: AlertTriangle,
    className: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  broken: {
    label: 'Broken',
    icon: Wrench,
    className: 'bg-rose-100 text-rose-800 border-rose-200'
  }
} as const

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const StaffDashboard = () => {
  const [coolboxes, setCoolboxes] = useState<CoolBoxRecord[]>([])
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const token = localStorage.getItem('token')

  const request = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    })

    if (!res.ok) {
      throw new Error('Request failed')
    }

    return res.status === 204 ? null : res.json()
  }

  const loadCoolboxes = async () => {
    setLoading(true)

    try {
      const data = await request('/api/solar-coolboxes/')
      const nextCoolboxes = Array.isArray(data) ? data : []
      setCoolboxes(nextCoolboxes)
      setDraftNotes(
        nextCoolboxes.reduce<Record<number, string>>((notes, item) => {
          notes[item.id] = item.notes || ''
          return notes
        }, {})
      )
    } catch (error) {
      toast.error('Failed to load your assigned coolboxes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCoolboxes()
  }, [])

  const updateCoolBox = async (item: CoolBoxRecord, patch: Partial<CoolBoxRecord>) => {
    await request(`/api/solar-coolboxes/${item.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    })
  }

  const saveUpdate = async (item: CoolBoxRecord, condition_status: CoolBoxCondition) => {
    const key = `${item.id}-${condition_status}`
    setBusyKey(key)

    try {
      await updateCoolBox(item, {
        condition_status,
        notes: draftNotes[item.id] || ''
      })
      toast.success(`CoolBox ${item.location} updated`)
      await loadCoolboxes()
    } catch (error) {
      toast.error('Failed to update coolbox condition')
    } finally {
      setBusyKey(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white/90 px-6 py-5 text-slate-700 shadow-xl">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-medium">Loading assigned coolboxes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Staff Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Solar CoolBox Status Updates</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Update the condition of the coolboxes assigned to you so admin can track what is working well and what
              needs attention.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-sm text-white/70">Assigned CoolBoxes</p>
            <p className="text-3xl font-bold">{coolboxes.length}</p>
          </div>
        </div>
      </section>

      {coolboxes.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
          No coolbox has been assigned to your staff account yet.
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {coolboxes.map((item) => {
            const activeConfig = conditionConfig[item.condition_status]
            const ActiveIcon = activeConfig.icon

            return (
              <section key={item.id} className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-ocean-100 p-3 text-ocean-700">
                        <Snowflake className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-950">{item.location}</h2>
                        <p className="text-sm text-slate-500">Last update: {formatDateTime(item.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeConfig.className}`}>
                    <ActiveIcon className="h-4 w-4" />
                    {activeConfig.label}
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor={`notes-${item.id}`} className="text-sm font-semibold text-slate-700">
                    Notes for admin
                  </label>
                  <textarea
                    id={`notes-${item.id}`}
                    rows={4}
                    value={draftNotes[item.id] ?? ''}
                    onChange={(event) =>
                      setDraftNotes((current) => ({
                        ...current,
                        [item.id]: event.target.value
                      }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    placeholder="Describe what you checked, any issue found, or what needs repair."
                  />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {(['good', 'bad', 'broken'] as CoolBoxCondition[]).map((status) => {
                    const config = conditionConfig[status]
                    const Icon = config.icon
                    const key = `${item.id}-${status}`

                    return (
                      <button
                        key={status}
                        onClick={() => void saveUpdate(item, status)}
                        disabled={busyKey === key}
                        className={`rounded-3xl border px-4 py-4 text-left transition-all ${config.className} disabled:opacity-50`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <div>
                            <p className="font-semibold">{config.label}</p>
                            <p className="text-xs opacity-80">Send update to admin</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StaffDashboard
