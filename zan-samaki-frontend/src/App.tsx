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
import { LanguageProvider, useLanguage } from '@/context/LanguageContext'

interface AppUser {
  username: string
  role: string
}

type UserRole = 'fisher' | 'buyer' | 'staff' | 'admin'
const copy = {
  en: {
    logoutTitle: 'Confirm Logout',
    logoutText: 'Are you sure you want to logout?',
    logoutConfirm: 'Yes, logout',
    cancel: 'Cancel',
    loggedOut: 'You have logged out!',
    loginLoadError: 'Unable to load your account after login. Please try again.',
    openingDashboard: 'Opening dashboard...',
    roleOnly: {
      fisher: 'This option is only for fishermen.',
      buyer: 'This option is only for buyers.',
      staff: 'This option is only for staff.',
      admin: 'This option is only for admins.'
    },
    home: {
      languageLabel: 'Language',
      english: 'English',
      swahili: 'Swahili',
      headline: 'ZanSamaki Fresh',
      description: 'Your fish marketplace to buy directly from Zanzibar fishers. Reduce post-harvest loss with our solar cold box solution.',
      buyerTitle: 'Buy',
      buyerButton: 'Buy Now',
      fisherTitle: 'Fisher',
      fisherButton: 'Become a Fisher',
      staffTitle: 'Staff',
      staffButton: 'Staff Login',
      adminTitle: 'Admin',
      adminButton: 'Admin Panel'
    }
  },
  sw: {
    logoutTitle: 'Thibitisha Kutoka',
    logoutText: 'Una uhakika unataka kutoka?',
    logoutConfirm: 'Ndiyo, toka',
    cancel: 'Ghairi',
    loggedOut: 'Umetoka!',
    loginLoadError: 'Imeshindikana kupakia akaunti yako baada ya kuingia. Tafadhali jaribu tena.',
    openingDashboard: 'Inafungua dashboard...',
    roleOnly: {
      fisher: 'Chaguo hili ni kwa wavuvi pekee.',
      buyer: 'Chaguo hili ni kwa wanunuzi pekee.',
      staff: 'Chaguo hili ni kwa staff pekee.',
      admin: 'Chaguo hili ni kwa wasimamizi pekee.'
    },
    home: {
      languageLabel: 'Lugha',
      english: 'Kiingereza',
      swahili: 'Kiswahili',
      headline: 'ZanSamaki Fresh',
      description: 'ZanSamaki Fresh ni suluhisho lako la kununua samaki moja kwa moja kutoka kwa wavuvi wa Zanzibar. Punguza upotevu wa mazao kwa sanduku la baridi la sola!',
      buyerTitle: 'Nunua',
      buyerButton: 'Nunua Sasa',
      fisherTitle: 'Mvuvi',
      fisherButton: 'Kuwa Mvuvi',
      staffTitle: 'Staff',
      staffButton: 'Ingia Staff',
      adminTitle: 'Admin',
      adminButton: 'Paneli ya Admin'
    }
  }
} as const

const getDashboardPath = (role: string) => {
  if (role === 'fisher') return '/fisher'
  if (role === 'buyer') return '/buyer'
  if (role === 'staff') return '/staff'
  if (role === 'admin') return '/admin'
  return '/'
}

const AppShell = () => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [role, setRole] = useState('')
  const [authReady, setAuthReady] = useState(false)
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false)
  const [fisherSidebarOpen, setFisherSidebarOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login')
  const [selectedRole, setSelectedRole] = useState<UserRole>('buyer')
  const { language, setLanguage } = useLanguage()
  const navigate = useNavigate()
  const appCopy = copy[language]

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
      title: appCopy.logoutTitle,
      text: appCopy.logoutText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: appCopy.logoutConfirm,
      cancelButtonText: appCopy.cancel,
      reverseButtons: true
    })

    if (!result.isConfirmed) {
      return
    }

    localStorage.removeItem('token')
    setUser(null)
    setRole('')
    setAdminSidebarOpen(false)
    setFisherSidebarOpen(false)
    navigate('/')
    toast.success(appCopy.loggedOut)
  }

  const handleLoginSuccess = async (_expectedRole: UserRole) => {
    const loggedInUser = await fetchUser()

    if (loggedInUser?.role) {
      navigate(getDashboardPath(loggedInUser.role))
      return true
    }

    toast.error(appCopy.loginLoadError)
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

      toast.error(appCopy.roleOnly[targetRole])
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
      return <FisherNavbar username={user.username} onLogout={logout} onOpenSidebar={() => setFisherSidebarOpen(true)} />
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
          <p className="mt-3 text-lg font-semibold text-slate-800">{appCopy.openingDashboard}</p>
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
        <Route
          path="/fisher"
          element={
            role === 'fisher'
              ? <Layout footerOffsetClassName="lg:pl-[304px]"><FisherDashboard isSidebarOpen={fisherSidebarOpen} onCloseSidebar={() => setFisherSidebarOpen(false)} /></Layout>
              : <Navigate to={user && role ? getDashboardPath(role) : '/'} replace />
          }
        />
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
}) => {
  const { language, setLanguage } = useLanguage()
  const homeCopy = copy[language].home

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <div className="mb-8 flex justify-end">
        <div className="inline-flex items-center gap-2 rounded-full border border-ocean-100 bg-white/80 p-1 shadow-sm backdrop-blur-sm">
          <span className="px-3 text-sm font-semibold text-slate-600">{homeCopy.languageLabel}</span>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${language === 'en' ? 'bg-ocean-600 text-white' : 'text-slate-600 hover:bg-ocean-50'}`}
          >
            {homeCopy.english}
          </button>
          <button
            type="button"
            onClick={() => setLanguage('sw')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${language === 'sw' ? 'bg-ocean-600 text-white' : 'text-slate-600 hover:bg-ocean-50'}`}
          >
            {homeCopy.swahili}
          </button>
        </div>
      </div>
      <div className="text-center mb-10">
      <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-ocean-600 to-blue-600 bg-clip-text text-transparent mb-6">
        {homeCopy.headline}
      </h1>
      <p className="text-lg md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
        {homeCopy.description}
      </p>
    
      </div>

      <div id="login-sections" className="mt-5 grid gap-6 scroll-mt-24 md:grid-cols-4">
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
          <ShoppingCart className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4 text-center">{homeCopy.buyerTitle}</h3>
          <button
            onClick={() => onRoleAction('buyer')}
            className="w-full bg-ocean-600 text-white py-3 rounded-xl font-semibold hover:bg-ocean-700"
          >
            {homeCopy.buyerButton}
          </button>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
          <Fish className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4 text-center">{homeCopy.fisherTitle}</h3>
          <button
            onClick={() => onRoleAction('fisher')}
            className="w-full bg-ocean-600 text-white py-3 rounded-xl font-semibold hover:bg-ocean-700"
          >
            {homeCopy.fisherButton}
          </button>
        </div>
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
          <Users className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4 text-center">{homeCopy.staffTitle}</h3>
          <button
            onClick={() => onRoleAction('staff')}
            className="w-full bg-ocean-600 text-white py-3 rounded-xl font-semibold hover:bg-ocean-700"
          >
            {homeCopy.staffButton}
          </button>
        </div>
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
          <Shield className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4 text-center">{homeCopy.adminTitle}</h3>
          <button
            onClick={() => onRoleAction('admin')}
            className="w-full bg-ocean-600 text-white py-3 rounded-xl font-semibold hover:bg-ocean-700"
          >
            {homeCopy.adminButton}
          </button>
        </div>
      </div>
    </div>
  )
}

const App = () => (
  <LanguageProvider>
    <AppShell />
  </LanguageProvider>
)

export default App
