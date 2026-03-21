import { useState, useEffect } from 'react'
import { Shield, Eye, CheckCircle, XCircle, RefreshCw, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [pendingCatches, setPendingCatches] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = () => {
    // Simulate admin stats
    setPendingCatches(12)
    setTotalUsers(156)
    setTotalOrders(89)
  }

  const approveAllPending = async () => {
    setLoading(true)
    // Simulate approval
    setTimeout(() => {
      setPendingCatches(0)
      toast.success('All pending catches approved!')
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold flex items-center space-x-3 mb-8">
          <Shield className="w-12 h-12 text-ocean-600" />
          <span>Admin Panel - ZanSamaki</span>
        </h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold opacity-90">Pending Approvals</p>
                <p className="text-4xl font-bold">{pendingCatches}</p>
              </div>
              <Eye className="w-16 h-16 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-400 to-green-500 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold opacity-90">Watumiaji</p>
                <p className="text-4xl font-bold">{totalUsers}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                👥
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-ocean-500 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold opacity-90">Amri</p>
                <p className="text-4xl font-bold">{totalOrders}</p>
              </div>
              <ShoppingCart className="w-16 h-16 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Quick Actions</h2>
          <button
            onClick={approveAllPending}
            disabled={loading || pendingCatches === 0}
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Inafanya...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Ruhusu Zote</span>
              </>
            )}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Pending Catches</span>
            </h3>
            <div className="space-y-3">
              {Array.from({ length: pendingCatches }, (_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">Dagaa - Juma Fisher</p>
                    <p className="text-sm text-gray-600">Stone Town · 25kg · TZS 4,500/kg</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-emerald-600 hover:text-emerald-700 p-2 rounded-lg hover:bg-emerald-100">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-100">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  ✅
                </div>
                <div>
                  <p className="font-semibold">Order #123 completed</p>
                  <p className="text-sm text-gray-600">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  👤
                </div>
                <div>
                  <p className="font-semibold">New buyer registered</p>
                  <p className="text-sm text-gray-600">5 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Django Admin Link */}
      <div className="mt-12 text-center">
        <a 
          href="/admin/" 
          target="_blank" 
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
        >
          <Shield className="w-6 h-6" />
          <span>Django Admin Panel</span>
          <span className="ml-2">→</span>
        </a>
      </div>
    </div>
  )
}

export default AdminDashboard

