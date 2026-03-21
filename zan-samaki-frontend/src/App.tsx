import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Shield, Fish, ShoppingCart, Home } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthPage from '@/pages/AuthPage'
import FisherDashboard from '@/pages/FisherDashboard'
import BuyerDashboard from '@/pages/BuyerDashboard'
import AdminDashboard from '@/pages/AdminDashboard'
import Layout from '@/components/Layout'
import Navbar from '@/components/Navbar'
import LoginModal from '@/components/LoginModal'

interface AppUser {
  username: string
  role: string
}

const App = () => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [role, setRole] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      // Fetch user info
      fetchUser()
    }
  }, [])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/users/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData[0])
        setRole(userData[0]?.role || '')
      }
    } catch (err) {
      localStorage.removeItem('token')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setRole('')
    navigate('/')
    toast.success('Umetoka! 👋')
  }

  const navItems = [
    { name: 'Nyumbani', icon: Home, href: '/' },
    ...(role === 'fisher' ? [{ name: 'Dashibodi ya Mvuvi', icon: Fish, href: '/fisher' }] : []),
    ...(role === 'buyer' ? [{ name: 'Soko', icon: ShoppingCart, href: '/buyer' }] : []),
    ...(role === 'admin' ? [{ name: 'Admin', icon: Shield, href: '/admin' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-blue-50">
      <Navbar 
        user={user} 
        navItems={navItems}
        onLogin={() => setShowLogin(true)}
        onLogout={logout}
      />
      
      <Routes>
        <Route path="/" element={<Layout><HomePage onLogin={() => setShowLogin(true)} /></Layout>} />
        <Route path="/auth" element={!user ? <AuthPage setUser={setUser} setRole={setRole} /> : <Navigate to="/" />} />
        <Route path="/fisher" element={role === 'fisher' ? <Layout><FisherDashboard /></Layout> : <Navigate to="/" />} />
        <Route path="/buyer" element={role === 'buyer' ? <Layout><BuyerDashboard /></Layout> : <Navigate to="/" />} />
        <Route path="/admin" element={role === 'admin' ? <Layout><AdminDashboard /></Layout> : <Navigate to="/" />} />
      </Routes>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={fetchUser} />
    </div>
  )
}

const HomePage = ({ onLogin }: { onLogin: () => void }) => (
  <div className="max-w-7xl mx-auto px-4 py-20">
    <div className="text-center mb-20">
      <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-ocean-600 to-blue-600 bg-clip-text text-transparent mb-6">
        🐟 ZanSamaki Fresh
      </h1>
      <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
        Samaki safi moja kwa moja kutoka kwa wavuvi wa Zanzibar. 
        Punguza upotevu wa mazao kwa sanduku la baridi la solar!
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={onLogin}
          className="bg-ocean-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-ocean-700 transition-all shadow-xl"
        >
          Anza Sasa
        </button>
        <button className="border-2 border-ocean-600 text-ocean-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-ocean-600 hover:text-white transition-all">
          Angalia Video
        </button>
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-8 mt-20">
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50">
        <Fish className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4 text-center">Mvuvi</h3>
        <p className="text-gray-600 mb-6 text-center">Pakia uvuvi wako na upate bei bora haraka!</p>
        <button 
          onClick={onLogin}
          className="w-full bg-ocean-600 text-white py-3 rounded-xl font-semibold hover:bg-ocean-700"
        >
          Kuwa Mvuvi
        </button>
      </div>
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50">
        <ShoppingCart className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4 text-center">Nunua</h3>
        <p className="text-gray-600 mb-6 text-center">Pata samaki safi na ubadilishe haraka!</p>
        <button 
          onClick={onLogin}
          className="w-full bg-ocean-600 text-white py-3 rounded-xl font-semibold hover:bg-ocean-700"
        >
          Nunua Sasa
        </button>
      </div>
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50">
        <Shield className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4 text-center">Admin</h3>
        <p className="text-gray-600 mb-6 text-center">Dhibiti uvuvi na ruhusu listings</p>
        <button 
          onClick={onLogin}
          className="w-full bg-ocean-600 text-white py-3 rounded-xl font-semibold hover:bg-ocean-700"
        >
          Admin Panel
        </button>
      </div>
    </div>
  </div>
)

export default App

