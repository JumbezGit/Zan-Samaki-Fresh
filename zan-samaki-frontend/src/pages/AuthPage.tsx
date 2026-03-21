import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

interface AuthPageProps {
  setUser: (user: any) => void
  setRole: (role: string) => void
}

const AuthPage = ({ setUser, setRole }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'fisher' as 'fisher' | 'buyer' | 'admin'
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/jwt/login/' : '/api/auth/jwt/register/'
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            username: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.auth_token)
        setUser(data.user)
        setRole(data.user.role)
        toast.success(isLogin ? 'Umeingia!' : 'Akaunti yako imeundwa!')
        navigate('/')
      } else {
        toast.error(data.detail || data.message || 'Hitilafu imetokea')
      }
    } catch (err) {
      toast.error('Hitilafu ya mtandao')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-ocean-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            {isLogin ? <Lock className="w-10 h-10 text-white" /> : <UserPlus className="w-10 h-10 text-white" />}
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-ocean-600 to-blue-600 bg-clip-text text-transparent mb-2">
            {isLogin ? 'Ingia' : 'Jiunge'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? 'Ingia ili uanze kutumia ZanSamaki' : 'Unda akaunti yako sasa'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jina</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white/50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jukumu</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white/50"
                >
                  <option value="fisher">Mvuvi</option>
                  <option value="buyer">Mnunuzi</option>
                  <option value="admin">Msimamizi</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Barua Pepe</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white/50"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nenosiri</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                minLength={5}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white/50"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-ocean-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-xl hover:from-ocean-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Inapakia...</span>
              </>
            ) : (
              <>{isLogin ? 'Ingia' : 'Jiunge'}</>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-ocean-600 hover:text-ocean-700 font-semibold transition-colors"
          >
            {isLogin ? 'Huna akaunti? Jiunge' : 'Una akaunti? Ingia'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
