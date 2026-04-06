import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Snowflake, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '@/context/LanguageContext'

type CoolBoxCondition = 'good' | 'bad' | 'broken'

interface CoolBoxRecord {
  id: number
  location: string
  condition_status: CoolBoxCondition
  notes: string
  updated_at: string
}

interface CoolBoxRequestRecord {
  id: number
  location: string
  start_date: string
  days: number
  quantity_kg: string
  amount_per_day: string
  price: string
  status: 'requested' | 'approved' | 'rejected'
  user: {
    username: string
  }
  catch: {
    title: string
  } | null
  active_catch: {
    title: string
    fish_type: string
    quantity: number
  } | null
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
  const { language } = useLanguage()
  const copy = language === 'en'
    ? {
      good: 'Good',
      bad: 'Bad',
      broken: 'Broken',
      loadError: 'Failed to load your assigned coolboxes',
      updated: 'updated',
      updateError: 'Failed to update coolbox condition',
      requestApproved: 'CoolBox request approved',
      requestRejected: 'CoolBox request rejected',
      requestSaved: 'CoolBox kilos and daily amount updated',
      requestApproveError: 'Failed to approve coolbox request',
      requestRejectError: 'Failed to reject coolbox request',
      requestSaveError: 'Failed to update coolbox request details',
      loading: 'Loading assigned coolboxes...',
      dashboard: 'Staff Dashboard',
      title: 'Solar CoolBox Status Updates',
      subtitle: 'Update the condition of the coolboxes assigned to you so admin can track what is working well and what needs attention.',
      assignedCoolboxes: 'Assigned CoolBoxes',
      requests: 'CoolBox Requests',
      approveRequests: 'Approve Fisher Requests',
      pendingRequests: 'Pending Requests',
      noRequests: 'No coolbox requests for your assigned locations yet.'
    }
    : {
      good: 'Nzuri',
      bad: 'Mbovu',
      broken: 'Imeharibika',
      loadError: 'Imeshindikana kupakia coolbox ulizopangiwa',
      updated: 'imesasishwa',
      updateError: 'Imeshindikana kusasisha hali ya coolbox',
      requestApproved: 'Ombi la CoolBox limekubaliwa',
      requestRejected: 'Ombi la CoolBox limekataliwa',
      requestSaved: 'Kilo na kiasi kwa siku vya coolbox vimesasishwa',
      requestApproveError: 'Imeshindikana kukubali ombi la coolbox',
      requestRejectError: 'Imeshindikana kukataa ombi la coolbox',
      requestSaveError: 'Imeshindikana kusasisha maelezo ya ombi la coolbox',
      loading: 'Inapakia coolbox ulizopangiwa...',
      dashboard: 'Dashibodi ya Staff',
      title: 'Marekebisho ya Hali ya Solar CoolBox',
      subtitle: 'Sasisha hali ya coolbox ulizopangiwa ili admin aweze kufuatilia vinavyofanya kazi vizuri na vinavyohitaji matengenezo.',
      assignedCoolboxes: 'CoolBox Ulizopangiwa',
      requests: 'Maombi ya CoolBox',
      approveRequests: 'Kubali Maombi ya Wavuvi',
      pendingRequests: 'Maombi Yanayosubiri',
      noRequests: 'Hakuna maombi ya coolbox kwa maeneo uliyopangiwa bado.'
    }
  const [coolboxes, setCoolboxes] = useState<CoolBoxRecord[]>([])
  const [coolboxRequests, setCoolboxRequests] = useState<CoolBoxRequestRecord[]>([])
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({})
  const [requestDrafts, setRequestDrafts] = useState<Record<number, { quantity_kg: string; amount_per_day: string }>>({})
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
      const [coolboxesData, coolboxRequestsData] = await Promise.all([
        request('/api/solar-coolboxes/'),
        request('/api/coolbox/')
      ])
      const nextCoolboxes = Array.isArray(coolboxesData) ? coolboxesData : []
      const nextCoolboxRequests = Array.isArray(coolboxRequestsData) ? coolboxRequestsData : []

      setCoolboxes(nextCoolboxes)
      setCoolboxRequests(nextCoolboxRequests)
      setRequestDrafts(
        nextCoolboxRequests.reduce<Record<number, { quantity_kg: string; amount_per_day: string }>>((drafts, item) => {
          drafts[item.id] = {
            quantity_kg: String(item.quantity_kg ?? ''),
            amount_per_day: String(item.amount_per_day ?? '')
          }
          return drafts
        }, {})
      )
      setDraftNotes(
        nextCoolboxes.reduce<Record<number, string>>((notes, item) => {
          notes[item.id] = item.notes || ''
          return notes
        }, {})
      )
    } catch (error) {
      toast.error(copy.loadError)
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

  const updateCoolBoxRequest = async (
    item: CoolBoxRequestRecord,
    patch: Partial<Pick<CoolBoxRequestRecord, 'status' | 'quantity_kg' | 'amount_per_day'>>
  ) => {
    await request(`/api/coolbox/${item.id}/`, {
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
      toast.success(`CoolBox ${item.location} ${copy.updated}`)
      await loadCoolboxes()
    } catch (error) {
      toast.error(copy.updateError)
    } finally {
      setBusyKey(null)
    }
  }

  const saveRequestDetails = async (item: CoolBoxRequestRecord, status?: 'approved' | 'rejected') => {
    const key = status ? `request-${status}-${item.id}` : `request-save-${item.id}`
    setBusyKey(key)

    try {
      await updateCoolBoxRequest(item, {
        quantity_kg: requestDrafts[item.id]?.quantity_kg || item.quantity_kg,
        amount_per_day: requestDrafts[item.id]?.amount_per_day || item.amount_per_day,
        ...(status ? { status } : {})
      })
      toast.success(
        status === 'approved'
          ? copy.requestApproved
          : status === 'rejected'
            ? copy.requestRejected
            : copy.requestSaved
      )
      await loadCoolboxes()
    } catch (error) {
      toast.error(
        status === 'approved'
          ? copy.requestApproveError
          : status === 'rejected'
            ? copy.requestRejectError
            : copy.requestSaveError
      )
    } finally {
      setBusyKey(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white/90 px-6 py-5 text-slate-700 shadow-xl">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-medium">{copy.loading}</span>
        </div>
      </div>
    )
  }

  const pendingRequests = coolboxRequests.filter((item) => item.status === 'requested')

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">{copy.dashboard}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">{copy.title}</h1>
            <p className="mt-3 max-w-2xl text-slate-600">{copy.subtitle}</p>
          </div>
          <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-sm text-white/70">{copy.assignedCoolboxes}</p>
            <p className="text-3xl font-bold">{coolboxes.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">{copy.requests}</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">{copy.approveRequests}</h2>
          </div>
          <div className="rounded-3xl bg-amber-50 px-5 py-4 text-amber-800">
            <p className="text-sm">{copy.pendingRequests}</p>
            <p className="text-3xl font-bold">{pendingRequests.length}</p>
          </div>
        </div>

        {coolboxRequests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            {copy.noRequests}
          </div>
        ) : (
          <div className="grid gap-4">
            {coolboxRequests.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-950">{item.user.username}</h3>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Location: {item.location} • Fish: {item.active_catch?.title || item.catch?.title || 'No active fish'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.days} day(s) • Total TZS {Number(item.price).toLocaleString()} • Start {formatDateTime(item.start_date)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Active fish kg: {item.active_catch ? Number(item.active_catch.quantity).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Kilo in coolbox
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={requestDrafts[item.id]?.quantity_kg ?? ''}
                          onChange={(event) =>
                            setRequestDrafts((current) => ({
                              ...current,
                              [item.id]: {
                                quantity_kg: event.target.value,
                                amount_per_day: current[item.id]?.amount_per_day ?? String(item.amount_per_day)
                              }
                            }))
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                        />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Amount per day
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={requestDrafts[item.id]?.amount_per_day ?? ''}
                          onChange={(event) =>
                            setRequestDrafts((current) => ({
                              ...current,
                              [item.id]: {
                                quantity_kg: current[item.id]?.quantity_kg ?? String(item.quantity_kg),
                                amount_per_day: event.target.value
                              }
                            }))
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                        />
                      </label>
                    </div>
                    <button
                      onClick={() => void saveRequestDetails(item)}
                      disabled={busyKey === `request-save-${item.id}`}
                      className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Save Details
                    </button>
                    <button
                      onClick={() => void saveRequestDetails(item, 'approved')}
                      disabled={busyKey === `request-approved-${item.id}` || item.status === 'approved'}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => void saveRequestDetails(item, 'rejected')}
                      disabled={busyKey === `request-rejected-${item.id}` || item.status === 'rejected'}
                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
