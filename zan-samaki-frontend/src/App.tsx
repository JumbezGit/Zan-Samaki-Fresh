import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Fish, Shield, ShoppingCart, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import AuthPage from '@/pages/AuthPage'
import FisherDashboard from '@/pages/FisherDashboard'
import BuyerDashboard from '@/pages/BuyerDashboard'
import BuyerOrdersPage from '@/pages/BuyerOrdersPage'
import BuyerLivePage from '@/pages/BuyerLivePage'
import AdminDashboard from '@/pages/AdminDashboard'
import StaffDashboard from '@/pages/StaffDashboard'
import SettingsPage from '@/pages/SettingsPage'
import Layout from '@/components/Layout'
import PublicNavbar from '@/components/PublicNavbar'
import FisherNavbar from '@/components/FisherNavbar'
import BuyerNavbar from '@/components/BuyerNavbar'
import AdminNavbar from '@/components/AdminNavbar'
import StaffNavbar from '@/components/StaffNavbar'
import LoginModal from '@/components/LoginModal'

interface AppUser {
  username: string
  role: string
}

type UserRole = 'fisher' | 'buyer' | 'staff' | 'admin'

const getDashboardPath = (role: string) => {
  if (role === 'fisher') return '/fisher'
  if (role === 'buyer') return '/buyer'
  if (role === 'staff') return '/staff'
  if (role === 'admin') return '/admin'
  return '/'
}

const App = () => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [role, setRole] = useState('')
  const [authReady, setAuthReady] = useState(false)
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login')
  const [selectedRole, setSelectedRole] = useState<UserRole>('buyer')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      void fetchUser()
      return
    }

    setAuthReady(true)
  }, [])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const currentUser = await res.json()
        setUser(currentUser)
        setRole(currentUser?.role || '')
        return currentUser
      }
    } catch (err) {
      localStorage.removeItem('token')
      setUser(null)
      setRole('')
    } finally {
      setAuthReady(true)
    }

    return null
  }

  const logout = async () => {
    const result = await Swal.fire({
      title: 'Confirm Logout',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })

    if (!result.isConfirmed) {
      return
    }

    localStorage.removeItem('token')
    setUser(null)
    setRole('')
    setAdminSidebarOpen(false)
    navigate('/')
    toast.success('Umetoka!')
  }

  const handleLoginSuccess = async (_expectedRole: UserRole) => {
    const loggedInUser = await fetchUser()

    if (loggedInUser?.role) {
      navigate(getDashboardPath(loggedInUser.role))
      return true
    }

    toast.error('Unable to load your account after login. Please try again.')
    return false
  }

  const openRoleLogin = (targetRole: UserRole) => {
    setLoginMode('login')
    setSelectedRole(targetRole)
    setShowLogin(true)
  }

  const handleRoleAction = (targetRole: UserRole) => {
    if (user) {
      if (role === targetRole) {
        navigate(getDashboardPath(targetRole))
        return
      }

      toast.error(`This option is only for ${targetRole === 'fisher' ? 'fishermen' : targetRole === 'buyer' ? 'buyers' : targetRole === 'staff' ? 'staff' : 'admins'}.`)
      return
    }

    setLoginMode(targetRole === 'admin' || targetRole === 'staff' ? 'login' : 'register')
    setSelectedRole(targetRole)
    setShowLogin(true)
  }

  const renderNavbar = () => {
    if (!user) {
      return <PublicNavbar onLogin={openRoleLogin} />
    }

    if (role === 'fisher') {
      return <FisherNavbar username={user.username} onLogout={logout} />
    }

    if (role === 'buyer') {
      return <BuyerNavbar username={user.username} onLogout={logout} />
    }

    if (role === 'admin') {
      return <AdminNavbar username={user.username} onLogout={logout} onOpenSidebar={() => setAdminSidebarOpen(true)} />
    }

    if (role === 'staff') {
      return <StaffNavbar username={user.username} onLogout={logout} />
    }

    return <PublicNavbar onLogin={openRoleLogin} />
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ocean-50 to-blue-50">
        <div className="rounded-2xl border border-white/60 bg-white/80 px-6 py-5 text-center shadow-xl backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">ZanSamaki Fresh</p>
          <p className="mt-3 text-lg font-semibold text-slate-800">Inafungua dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-blue-50">
      {renderNavbar()}

      <Routes>
        <Route
          path="/"
          element={user && role ? <Navigate to={getDashboardPath(role)} replace /> : <Layout><HomePage onRoleAction={handleRoleAction} /></Layout>}
        />
        <Route path="/auth" element={!user ? <AuthPage setUser={setUser} setRole={setRole} /> : <Navigate to={getDashboardPath(role)} replace />} />
        <Route path="/fisher" element={role === 'fisher' ? <Layout><FisherDashboard /></Layout> : <Navigate to={user && role ? getDashboardPath(role) : '/'} replace />} />
        <Route path="/buyer" element={role === 'buyer' ? <Layout><BuyerDashboard /></Layout> : <Navigate to={user && role ? getDashboardPath(role) : '/'} replace />} />
        <Route path="/buyer/orders" element={role === 'buyer' ? <Layout><BuyerOrdersPage /></Layout> : <Navigate to={user && role ? getDashboardPath(role) : '/'} replace />} />
        <Route path="/buyer/live" element={role === 'buyer' ? <Layout><BuyerLivePage /></Layout> : <Navigate to={user && role ? getDashboardPath(role) : '/'} replace />} />
        <Route path="/staff" element={role === 'staff' ? <Layout><StaffDashboard /></Layout> : <Navigate to={user && role ? getDashboardPath(role) : '/'} replace />} />
        <Route
          path="/admin"
          element={
            role === 'admin'
              ? <Layout footerOffsetClassName="lg:pl-[304px]"><AdminDashboard isSidebarOpen={adminSidebarOpen} onCloseSidebar={() => setAdminSidebarOpen(false)} initialSection="overview" /></Layout>
              : <Navigate to={user && role ? getDashboardPath(role) : '/'} replace />
          }
        />
        <Route
          path="/settings"
          element={
            user
              ? (
                role === 'admin'
                  ? <Layout footerOffsetClassName="lg:pl-[304px]"><AdminDashboard isSidebarOpen={adminSidebarOpen} onCloseSidebar={() => setAdminSidebarOpen(false)} initialSection="settings" /></Layout>
                  : <Layout><SettingsPage username={user.username} role={role} /></Layout>
              )
              : <Navigate to="/" replace />
          }
        />
      </Routes>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
        initialMode={loginMode}
        initialRole={selectedRole}
      />
    </div>
  )
}

const HomePage = ({
  onRoleAction
}: {
  onRoleAction: (role: UserRole) => void
}) => (
  <div className="max-w-7xl mx-auto px-4 py-5">
    <div className="text-center mb-10">
      <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-ocean-600 to-blue-600 bg-clip-text text-transparent mb-6">
        ZanSamaki Fresh
      </h1>
      <p className="text-lg md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
        ZanSamaki Fresh ni suluhisho lako Nunua Samaki moja kwa moja kutoka kwa wavuvi wa Zanzibar.
        Punguza upotevu wa mazao kwa sanduku la baridi la solar!
      </p>
    
    </div>

    <div id="login-sections" className="mt-5 grid gap-6 scroll-mt-24 md:grid-cols-4">
       <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <ShoppingCart className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4 text-center">Nunua</h3>
        <button
          onClick={() => onRoleAction('buyer')}
          className="w-full bg-ocean-600 text-white py-3 rounded-xl font-semibold hover:bg-ocean-700"
        >
          Nunua Sasa
        </button>
      </div>

      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <Fish className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4 text-center">Mvuvi</h3>
        <button
          onClick={() => onRoleAction('fisher')}
          className="w-full bg-ocean-600 text-white py-3 rounded-xl font-semibold hover:bg-ocean-700"
        >
          Kuwa Mvuvi
        </button>
      </div>
     
      
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <Users className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4 text-center">Staff</h3>
        <button
          onClick={() => onRoleAction('staff')}
          className="w-full bg-ocean-600 text-white py-3 rounded-xl font-semibold hover:bg-ocean-700"
        >
          Staff Login
        </button>
      </div>
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <Shield className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4 text-center">Admin</h3>
        <button
          onClick={() => onRoleAction('admin')}
          className="w-full bg-ocean-600 text-white py-3 rounded-xl font-semibold hover:bg-ocean-700"
        >
          Admin Panel
        </button>
      </div>
    </div>
  </div>
)

export default App
