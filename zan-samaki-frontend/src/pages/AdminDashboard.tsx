import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Fish,
  Loader2,
  RefreshCw,
  Settings,
  Shield,
  ShoppingCart,
  Snowflake,
  User,
  Users,
  X,
  XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

type AdminSection = 'overview' | 'catches' | 'users' | 'orders' | 'coolbox' | 'settings'
type UserRole = 'fisher' | 'buyer' | 'staff' | 'admin'
type CoolBoxCondition = 'good' | 'bad' | 'broken'

interface AdminUser {
  id: number
  username: string
  email: string
  role: UserRole
  location: string
  phone: string
}

interface FishCatchRecord {
  id: number
  title: string
  fish_type: string
  quantity: string
  price_per_kg: string
  location: string
  status: string
  is_approved: boolean
  created_at: string
  user: AdminUser
}

interface OrderRecord {
  id: number
  quantity: string
  total_price: string
  payment_method: string
  status: string
  created_at: string
  buyer: AdminUser
  catch: FishCatchRecord
}

interface SolarCoolBoxRecord {
  id: number
  location: string
  condition_status: CoolBoxCondition
  notes: string
  updated_at: string
  assigned_staff: AdminUser | null
  assigned_staff_id: number | null
}

interface CoolBoxRequestRecord {
  id: number
  location: string
  start_date: string
  days: number
  price: string
  status: 'requested' | 'approved' | 'rejected'
  user: AdminUser
  catch: FishCatchRecord | null
  active_catch: FishCatchRecord | null
}

const sections: Array<{ id: AdminSection; label: string; icon: typeof Shield }> = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'catches', label: 'Catch Approval', icon: Fish },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'coolbox', label: 'Solar CoolBox', icon: Snowflake },
  { id: 'settings', label: 'Settings', icon: Settings }
]

const currency = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  maximumFractionDigits: 0
})

const formatCurrency = (value: string | number) => currency.format(Number(value || 0))

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const statusClass = (status: string) => {
  if (status === 'approved' || status === 'paid' || status === 'delivered' || status === 'good') {
    return 'bg-emerald-100 text-emerald-800'
  }
  if (status === 'pending' || status === 'reserved' || status === 'bad') {
    return 'bg-yellow-100 text-yellow-800'
  }
  if (status === 'sold') {
    return 'bg-blue-100 text-blue-800'
  }
  if (status === 'broken') {
    return 'bg-red-100 text-red-700'
  }
  return 'bg-gray-100 text-gray-700'
}

const conditionLabel: Record<CoolBoxCondition, string> = {
  good: 'Good',
  bad: 'Bad',
  broken: 'Broken'
}

interface AdminDashboardProps {
  isSidebarOpen: boolean
  onCloseSidebar: () => void
  initialSection?: AdminSection
}

const AdminDashboard = ({ isSidebarOpen, onCloseSidebar, initialSection = 'overview' }: AdminDashboardProps) => {
  const [activeSection, setActiveSection] = useState<AdminSection>(initialSection)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [catches, setCatches] = useState<FishCatchRecord[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [coolboxes, setCoolboxes] = useState<SolarCoolBoxRecord[]>([])
  const [coolboxRequests, setCoolboxRequests] = useState<CoolBoxRequestRecord[]>([])
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const token = localStorage.getItem('token')
  const staffUsers = useMemo(() => users.filter((item) => item.role === 'staff'), [users])

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

  const loadAdminData = async () => {
    setLoading(true)

    try {
      const [usersData, catchesData, ordersData, coolboxesData, coolboxRequestsData] = await Promise.all([
        request('/api/users/'),
        request('/api/catches/'),
        request('/api/orders/'),
        request('/api/solar-coolboxes/'),
        request('/api/coolbox/')
      ])

      const nextUsers = Array.isArray(usersData) ? usersData : []
      const nextCatches = Array.isArray(catchesData) ? catchesData : []
      const nextOrders = Array.isArray(ordersData) ? ordersData : []
      const nextCoolboxes = Array.isArray(coolboxesData) ? coolboxesData : []
      const nextCoolboxRequests = Array.isArray(coolboxRequestsData) ? coolboxRequestsData : []

      setUsers(nextUsers)
      setCatches(nextCatches)
      setOrders(nextOrders)
      setCoolboxes(nextCoolboxes)
      setCoolboxRequests(nextCoolboxRequests)
      setAssignmentDrafts(
        nextCoolboxes.reduce<Record<number, string>>((drafts, item) => {
          drafts[item.id] = item.assigned_staff_id ? String(item.assigned_staff_id) : ''
          return drafts
        }, {})
      )
    } catch (error) {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    void loadAdminData()
  }, [])

  useEffect(() => {
    setActiveSection(initialSection)
  }, [initialSection])

  const stats = useMemo(() => {
    const pendingCatches = catches.filter((item) => !item.is_approved).length
    const fisherCount = users.filter((item) => item.role === 'fisher').length
    const staffCount = users.filter((item) => item.role === 'staff').length
    const brokenCoolboxes = coolboxes.filter((item) => item.condition_status === 'broken').length
    const pendingCoolboxRequests = coolboxRequests.filter((item) => item.status === 'requested').length
    const orderRevenue = orders.reduce((sum, item) => sum + Number(item.total_price || 0), 0)

    return { pendingCatches, fisherCount, staffCount, brokenCoolboxes, pendingCoolboxRequests, orderRevenue }
  }, [catches, coolboxRequests, coolboxes, orders, users])

  const runAction = async (key: string, action: () => Promise<void>, successMessage: string) => {
    setBusyKey(key)
    try {
      await action()
      toast.success(successMessage)
      await loadAdminData()
    } catch (error) {
      toast.error('Action failed')
    } finally {
      setBusyKey(null)
    }
  }

  const updateCatch = async (item: FishCatchRecord, patch: Partial<FishCatchRecord>) => {
    await request(`/api/catches/${item.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    })
  }

  const updateUser = async (item: AdminUser, patch: Partial<AdminUser>) => {
    await request(`/api/users/${item.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    })
  }

  const updateOrder = async (item: OrderRecord, patch: Partial<OrderRecord>) => {
    await request(`/api/orders/${item.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    })
  }

  const updateCoolBox = async (
    item: SolarCoolBoxRecord,
    patch: Partial<Pick<SolarCoolBoxRecord, 'condition_status' | 'notes'>> & { assigned_staff_id?: number | null }
  ) => {
    await request(`/api/solar-coolboxes/${item.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    })
  }

  const updateCoolBoxRequest = async (item: CoolBoxRequestRecord, patch: Partial<Pick<CoolBoxRequestRecord, 'status'>>) => {
    await request(`/api/coolbox/${item.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    })
  }

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending Catches" value={stats.pendingCatches} tone="amber" icon={Fish} />
        <StatCard label="Fishers" value={stats.fisherCount} tone="sky" icon={Users} />
        <StatCard label="Staff" value={stats.staffCount} tone="emerald" icon={User} />
        <StatCard label="Broken CoolBoxes" value={stats.brokenCoolboxes} tone="rose" icon={Snowflake} />
        <StatCard label="Pending CoolBox Requests" value={stats.pendingCoolboxRequests} tone="slate" icon={Shield} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Pending Approval Queue">
          <div className="space-y-3">
            {catches.filter((item) => !item.is_approved).slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">
                      {item.user.username} • {item.fish_type} • {item.quantity}kg
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      void runAction(
                        `catch-approve-${item.id}`,
                        () => updateCatch(item, { is_approved: true }),
                        'Catch approved'
                      )
                    }
                    disabled={busyKey === `catch-approve-${item.id}`}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busyKey === `catch-approve-${item.id}` ? 'Saving...' : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
            {!catches.some((item) => !item.is_approved) && <EmptyState text="No pending catches right now." />}
          </div>
        </Panel>

        <Panel title="Solar CoolBox Status">
          <div className="space-y-3">
            {coolboxRequests.filter((item) => item.status === 'requested').slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.user.username} requested {item.location}</p>
                    <p className="text-sm text-slate-600">
                      Fish: {item.active_catch?.title || item.catch?.title || 'No active fish'} • {item.days} day(s)
                    </p>
                    <p className="text-sm text-slate-500">Start {formatDate(item.start_date)}</p>
                  </div>
                  <button
                    onClick={() =>
                      void runAction(
                        `coolbox-request-approve-${item.id}`,
                        () => updateCoolBoxRequest(item, { status: 'approved' }),
                        'CoolBox request approved'
                      )
                    }
                    disabled={busyKey === `coolbox-request-approve-${item.id}`}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busyKey === `coolbox-request-approve-${item.id}` ? 'Saving...' : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
            {!coolboxRequests.some((item) => item.status === 'requested') && <EmptyState text="No pending coolbox requests right now." />}
          </div>
        </Panel>
      </div>
    </div>
  )

  const renderCatches = () => (
    <Panel title="Catch Approval">
      <div className="space-y-4">
        {catches.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {item.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {item.user.username} • {item.fish_type} • {item.quantity}kg • {formatCurrency(item.price_per_kg)}/kg
                </p>
                <p className="text-sm text-slate-500">{item.location} • {formatDate(item.created_at)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    void runAction(
                      `approve-${item.id}`,
                      () => updateCatch(item, { is_approved: true }),
                      'Catch approved'
                    )
                  }
                  disabled={busyKey === `approve-${item.id}` || item.is_approved}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    void runAction(
                      `hold-${item.id}`,
                      () => updateCatch(item, { is_approved: false, status: 'available' }),
                      'Catch moved back to pending'
                    )
                  }
                  disabled={busyKey === `hold-${item.id}` || !item.is_approved}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 disabled:opacity-50"
                >
                  Hold
                </button>
                <button
                  onClick={() =>
                    void runAction(
                      `reject-${item.id}`,
                      async () => {
                        await request(`/api/catches/${item.id}/`, { method: 'DELETE' })
                      },
                      'Catch removed'
                    )
                  }
                  disabled={busyKey === `reject-${item.id}`}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
        {catches.length === 0 && <EmptyState text="No catches found." />}
      </div>
    </Panel>
  )

  const renderUsers = () => (
    <Panel title="User Management">
      <div className="space-y-4">
        {users.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{item.username}</h3>
                <p className="text-sm text-slate-600">{item.email || 'No email'} • {item.location || 'No location'}</p>
                <p className="text-sm text-slate-500">{item.phone || 'No phone number'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['fisher', 'buyer', 'staff', 'admin'] as UserRole[]).map((nextRole) => (
                  <button
                    key={nextRole}
                    onClick={() =>
                      void runAction(
                        `user-role-${item.id}-${nextRole}`,
                        () => updateUser(item, { role: nextRole }),
                        'User role updated'
                      )
                    }
                    disabled={busyKey === `user-role-${item.id}-${nextRole}` || item.role === nextRole}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                      item.role === nextRole
                        ? 'bg-ocean-600 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-700'
                    } disabled:opacity-50`}
                  >
                    {nextRole}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )

  const renderOrders = () => (
    <Panel title="Order Management">
      <div className="space-y-4">
        {orders.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{item.catch.title}</h3>
                <p className="text-sm text-slate-600">
                  Buyer: {item.buyer.username} • Qty: {item.quantity}kg • {formatCurrency(item.total_price)}
                </p>
                <p className="text-sm text-slate-500">{item.payment_method} • {formatDate(item.created_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'paid', 'delivered'] as const).map((nextStatus) => (
                  <button
                    key={nextStatus}
                    onClick={() =>
                      void runAction(
                        `order-${item.id}-${nextStatus}`,
                        () => updateOrder(item, { status: nextStatus }),
                        'Order status updated'
                      )
                    }
                    disabled={busyKey === `order-${item.id}-${nextStatus}` || item.status === nextStatus}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                      item.status === nextStatus
                        ? 'bg-ocean-600 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-700'
                    } disabled:opacity-50`}
                  >
                    {nextStatus}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && <EmptyState text="No orders found." />}
      </div>
    </Panel>
  )

  const renderCoolBox = () => (
    <Panel title="Solar CoolBox Management">
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-900">Fisher Requests</h4>
          {coolboxRequests.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{item.user.username}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Location: {item.location} • Fish: {item.active_catch?.title || item.catch?.title || 'No active fish'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {item.days} day(s) • {formatCurrency(item.price)} • Start {formatDate(item.start_date)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      void runAction(
                        `coolbox-request-approve-${item.id}`,
                        () => updateCoolBoxRequest(item, { status: 'approved' }),
                        'CoolBox request approved'
                      )
                    }
                    disabled={busyKey === `coolbox-request-approve-${item.id}` || item.status === 'approved'}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      void runAction(
                        `coolbox-request-reject-${item.id}`,
                        () => updateCoolBoxRequest(item, { status: 'rejected' }),
                        'CoolBox request rejected'
                      )
                    }
                    disabled={busyKey === `coolbox-request-reject-${item.id}` || item.status === 'rejected'}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
          {coolboxRequests.length === 0 && <EmptyState text="No coolbox requests found." />}
        </div>

        <div className="space-y-4">
        {coolboxes.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{item.location}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.condition_status)}`}>
                    {conditionLabel[item.condition_status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Assigned staff: {item.assigned_staff?.username || 'Nobody assigned yet'}
                </p>
                <p className="text-sm text-slate-500">Last update: {formatDateTime(item.updated_at)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(['good', 'bad', 'broken'] as CoolBoxCondition[]).map((nextCondition) => (
                    <button
                      key={nextCondition}
                      onClick={() =>
                        void runAction(
                          `coolbox-condition-${item.id}-${nextCondition}`,
                          () => updateCoolBox(item, { condition_status: nextCondition }),
                          'CoolBox condition updated'
                        )
                      }
                      disabled={busyKey === `coolbox-condition-${item.id}-${nextCondition}` || item.condition_status === nextCondition}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                        item.condition_status === nextCondition
                          ? 'bg-ocean-600 text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-700'
                      } disabled:opacity-50`}
                    >
                      {conditionLabel[nextCondition]}
                    </button>
                  ))}
                </div>
                {item.notes && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    {item.notes}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Assign Staff</p>
                <select
                  value={assignmentDrafts[item.id] ?? ''}
                  onChange={(event) =>
                    setAssignmentDrafts((current) => ({
                      ...current,
                      [item.id]: event.target.value
                    }))
                  }
                  className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                >
                  <option value="">No staff assigned</option>
                  {staffUsers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.username} {staff.location ? `- ${staff.location}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    void runAction(
                      `coolbox-assign-${item.id}`,
                      () =>
                        updateCoolBox(item, {
                          assigned_staff_id: assignmentDrafts[item.id] ? Number(assignmentDrafts[item.id]) : null
                        }),
                      'Staff assignment updated'
                    )
                  }
                  disabled={busyKey === `coolbox-assign-${item.id}`}
                  className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busyKey === `coolbox-assign-${item.id}` ? 'Saving...' : 'Save assignment'}
                </button>
                {staffUsers.length === 0 && (
                  <p className="mt-3 text-sm text-amber-700">
                    No staff users yet. Change a user role to `staff` in User Management first.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </Panel>
  )

  const renderSettings = () => (
    <Panel title="Settings">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <User className="h-5 w-5 text-ocean-700" />
            <h3 className="text-xl font-semibold text-slate-900">Admin Profile</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">Admin Users</p>
              <p className="mt-1 text-lg font-medium text-slate-800">{users.filter((item) => item.role === 'admin').length}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">Staff Users</p>
              <p className="mt-1 text-lg font-medium text-slate-800">{staffUsers.length}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">Solar CoolBoxes</p>
              <p className="mt-1 text-lg font-medium text-slate-800">{coolboxes.length}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Settings className="h-5 w-5 text-ocean-700" />
            <h3 className="text-xl font-semibold text-slate-900">Workspace Settings</h3>
          </div>
          <p className="text-slate-600">
            Admin can now assign staff to solar coolboxes in Malindi, Mkokotoni, Chwaka, and Paje, then monitor the
            latest condition updates from the same dashboard.
          </p>
        </section>
      </div>
    </Panel>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[420px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white/80">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="font-medium">Loading admin workspace...</span>
          </div>
        </div>
      )
    }

    if (activeSection === 'overview') return renderOverview()
    if (activeSection === 'catches') return renderCatches()
    if (activeSection === 'users') return renderUsers()
    if (activeSection === 'orders') return renderOrders()
    if (activeSection === 'coolbox') return renderCoolBox()
    return renderSettings()
  }

  return (
    <div className="min-h-screen">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onCloseSidebar}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r border-slate-200 bg-slate-950 p-6 text-white shadow-2xl transition-transform duration-300 lg:inset-y-auto lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={onCloseSidebar}
            className="rounded-xl border border-white/10 p-2 text-slate-200 transition hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            const active = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id)
                  onCloseSidebar()
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                  active ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-semibold">{section.label}</span>
              </button>
            )
          })}
        </nav>

        <button
          onClick={() => void loadAdminData()}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 font-semibold text-slate-100 transition-all hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
      </aside>

      <div className="space-y-6 p-4 md:p-6 lg:pl-[304px]">
        <div className="rounded-[1rem] border border-slate-200 bg-white/85 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Admin Panel</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">Solar CoolBox Control Center</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <SummaryChip label="Users" value={users.length} icon={Users} />
              <SummaryChip label="Staff" value={staffUsers.length} icon={User} />
              <SummaryChip label="Broken" value={stats.brokenCoolboxes} icon={XCircle} />
            </div>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  )
}

const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-[1rem] border border-slate-200 bg-white/85 p-6 shadow-xl backdrop-blur-sm">
    <h3 className="mb-5 text-xl font-bold text-slate-950">{title}</h3>
    {children}
  </div>
)

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-1xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-500">
    {text}
  </div>
)

const StatCard = ({
  label,
  value,
  tone,
  icon: Icon
}: {
  label: string
  value: string | number
  tone: 'amber' | 'sky' | 'emerald' | 'slate' | 'rose'
  icon: typeof Shield
}) => {
  const tones = {
    amber: 'from-amber-400 to-orange-500',
    sky: 'from-sky-500 to-cyan-600',
    emerald: 'from-emerald-500 to-green-600',
    slate: 'from-slate-700 to-slate-900',
    rose: 'from-rose-500 to-red-600'
  }

  return (
    <div className={`min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br ${tones[tone]} p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold uppercase tracking-wide text-white/80">{label}</p>
          <p className="mt-3 max-w-full overflow-hidden whitespace-nowrap text-[clamp(0.8rem,1.6vw,1.5rem)] font-bold leading-tight tracking-tight">
            {value}
          </p>
        </div>
        <Icon className="h-8 w-8 shrink-0 text-white/70" />
      </div>
    </div>
  )
}

const SummaryChip = ({
  label,
  value,
  icon: Icon
}: {
  label: string
  value: string | number
  icon: typeof Shield
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <div className="rounded-xl bg-ocean-100 p-2 text-ocean-700">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  </div>
)

export default AdminDashboard
