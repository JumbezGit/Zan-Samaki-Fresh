import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Fish,
  Loader2,
  Menu,
  RefreshCw,
  Shield,
  ShoppingCart,
  Snowflake,
  Users,
  X,
  XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

type AdminSection = 'overview' | 'catches' | 'users' | 'orders' | 'coolbox'

interface AdminUser {
  id: number
  username: string
  email: string
  role: 'fisher' | 'buyer' | 'admin'
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

interface CoolBoxRentalRecord {
  id: number
  start_date: string
  days: number
  price: string
  status: string
  user: AdminUser
}

const sections: Array<{ id: AdminSection; label: string; icon: typeof Shield }> = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'catches', label: 'Catch Approval', icon: Fish },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'coolbox', label: 'CoolBox', icon: Snowflake }
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

const statusClass = (status: string) => {
  if (status === 'approved' || status === 'paid' || status === 'delivered' || status === 'requested') {
    return 'bg-emerald-100 text-emerald-800'
  }
  if (status === 'pending' || status === 'reserved') {
    return 'bg-yellow-100 text-yellow-800'
  }
  if (status === 'sold') {
    return 'bg-blue-100 text-blue-800'
  }
  return 'bg-gray-100 text-gray-700'
}

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [catches, setCatches] = useState<FishCatchRecord[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [rentals, setRentals] = useState<CoolBoxRentalRecord[]>([])
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

  const loadAdminData = async () => {
    setLoading(true)

    try {
      const [usersData, catchesData, ordersData, rentalsData] = await Promise.all([
        request('/api/users/'),
        request('/api/catches/'),
        request('/api/orders/'),
        request('/api/coolbox/')
      ])

      setUsers(Array.isArray(usersData) ? usersData : [])
      setCatches(Array.isArray(catchesData) ? catchesData : [])
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setRentals(Array.isArray(rentalsData) ? rentalsData : [])
    } catch (error) {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAdminData()
  }, [])

  const stats = useMemo(() => {
    const pendingCatches = catches.filter((item) => !item.is_approved).length
    const fisherCount = users.filter((item) => item.role === 'fisher').length
    const buyerCount = users.filter((item) => item.role === 'buyer').length
    const orderRevenue = orders.reduce((sum, item) => sum + Number(item.total_price || 0), 0)

    return { pendingCatches, fisherCount, buyerCount, orderRevenue }
  }, [catches, orders, users])

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

  const updateRental = async (item: CoolBoxRentalRecord, patch: Partial<CoolBoxRentalRecord>) => {
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
        <StatCard label="Buyers" value={stats.buyerCount} tone="emerald" icon={ShoppingCart} />
        <StatCard label="Order Revenue" value={formatCurrency(stats.orderRevenue)} tone="slate" icon={Shield} />
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

        <Panel title="Recent Orders">
          <div className="space-y-3">
            {orders.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{item.catch.title}</p>
                <p className="text-sm text-slate-600">
                  Buyer: {item.buyer.username} • {formatCurrency(item.total_price)}
                </p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                  {item.status}
                </span>
              </div>
            ))}
            {orders.length === 0 && <EmptyState text="No orders recorded yet." />}
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
                {(['fisher', 'buyer', 'admin'] as UserRole[]).map((nextRole) => (
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
    <Panel title="CoolBox Rentals">
      <div className="space-y-4">
        {rentals.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{item.user.username}</h3>
                <p className="text-sm text-slate-600">
                  {item.days} day(s) • {formatCurrency(item.price)} • Start {formatDate(item.start_date)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['requested', 'approved', 'collected'] as const).map((nextStatus) => (
                  <button
                    key={nextStatus}
                    onClick={() =>
                      void runAction(
                        `rental-${item.id}-${nextStatus}`,
                        () => updateRental(item, { status: nextStatus }),
                        'Rental status updated'
                      )
                    }
                    disabled={busyKey === `rental-${item.id}-${nextStatus}` || item.status === nextStatus}
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
        {rentals.length === 0 && <EmptyState text="No coolbox rentals found." />}
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
    return renderCoolBox()
  }

  return (
    <div className="min-h-screen">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r border-slate-200 bg-slate-950 p-6 text-white shadow-2xl transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">Admin Workspace</h1>
            <p className="mt-2 text-sm text-slate-300">
              Manage users, catch approvals, orders, and coolbox requests directly from ZanSamaki.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-xl border border-white/10 p-2 text-slate-200 transition hover:bg-white/10"
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
                  setIsSidebarOpen(false)
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

      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-2xl bg-slate-950 p-3 text-white shadow-lg transition hover:bg-slate-800"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Admin Panel</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">Marketplace Control Center</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <SummaryChip label="Users" value={users.length} icon={Users} />
              <SummaryChip label="Orders" value={orders.length} icon={ShoppingCart} />
              <SummaryChip label="Pending" value={stats.pendingCatches} icon={XCircle} />
            </div>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  )
}

const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-xl backdrop-blur-sm">
    <h3 className="mb-5 text-xl font-bold text-slate-950">{title}</h3>
    {children}
  </div>
)

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-500">
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
  tone: 'amber' | 'sky' | 'emerald' | 'slate'
  icon: typeof Shield
}) => {
  const tones = {
    amber: 'from-amber-400 to-orange-500',
    sky: 'from-sky-500 to-cyan-600',
    emerald: 'from-emerald-500 to-green-600',
    slate: 'from-slate-700 to-slate-900'
  }

  return (
    <div className={`rounded-[1.75rem] bg-gradient-to-br ${tones[tone]} p-6 text-white shadow-xl`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">{label}</p>
          <p className="mt-3 text-3xl font-bold">{value}</p>
        </div>
        <Icon className="h-10 w-10 text-white/70" />
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
