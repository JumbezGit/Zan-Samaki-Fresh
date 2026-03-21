import { useState, useEffect } from 'react'
import { Fish, Plus, Upload, MapPin, DollarSign, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Catch {
  id: number
  title: string
  fish_type: string
  quantity: number
  price_per_kg: number
  status: string
  is_approved: boolean
}

const FisherDashboard = () => {
  const [catches, setCatches] = useState<Catch[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fish_type: '',
    quantity: '',
    price_per_kg: '',
    photo: null as File | null,
    voice_note: '',
    location: 'Zanzibar'
  })
  const [earnings, setEarnings] = useState(0)
  const [loading, setLoading] = useState(false)

  const FISH_TYPES = [
    { value: 'Dagaa', label: 'Dagaa (Sardines)' },
    { value: 'Changu', label: 'Changu (Kingfish)' },
{ value: "Ng'ongo", label: "Ng'ongo (Snapper)" },
    { value: 'Tafi', label: 'Tafi (Rabbitfish)' },
    { value: 'Pweza', label: 'Pweza (Octopus)' },
  ]

  useEffect(() => {
    fetchCatches()
    // Simulate earnings
    setEarnings(125000 + Math.floor(Math.random() * 25000))
  }, [])

  const fetchCatches = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/catches/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCatches(data)
    } catch (err) {
      toast.error('Tatizo la kupakia uvuvi')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'photo' && value) {
          formDataToSend.append('photo', value)
        } else if (value) {
          formDataToSend.append(key, String(value))
        }
      })

      const token = localStorage.getItem('token')
      const res = await fetch('/api/catches/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      })

      if (res.ok) {
        toast.success('Uvuvi umepakiwa! 🐟')
        setShowForm(false)
        Object.keys(formData).forEach(key => {
          // @ts-ignore
          setFormData(prev => ({ ...prev, [key]: '' }))
        })
        fetchCatches()
      }
    } catch (err) {
      toast.error('Kosa la kupakia. Jaribu tena.')
    } finally {
      setLoading(false)
    }
  }

  const requestCoolBox = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/coolbox/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ days: 1 })
      })
      toast.success('Ombi la sanduku la baridi limewasilishwa! TZS 3,000/day')
    } catch (err) {
      toast.error('Tatizo la ombi la sanduku')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Earnings Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-600 text-sm uppercase tracking-wide">Mapato Leo</p>
              <p className="text-4xl font-bold text-ocean-600">
                TZS {earnings.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-16 h-16 text-ocean-600/20" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-semibold text-lg">{catches.length}</p>
              <p className="text-sm text-gray-600">Uvuvi</p>
            </div>
            <div>
              <p className="font-semibold text-lg">4</p>
              <p className="text-sm text-gray-600">Imeuzwa</p>
            </div>
            <div>
              <p className="font-semibold text-lg">2</p>
              <p className="text-sm text-gray-600">Imehifadhiwa</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center space-x-3"
          >
            <Plus className="w-6 h-6" />
            <span>Pakia Uvuvi Mpya</span>
          </button>
          
          <button
            onClick={requestCoolBox}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center space-x-3"
          >
            <AlertCircle className="w-6 h-6" />
            <span>Omba Sanduku la Baridi (TZS 3,000/day)</span>
          </button>
        </div>
      </div>

      {/* Recent Catches */}
      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-8 flex items-center space-x-3">
          <Fish className="w-10 h-10" />
          <span>Uvuvi Wako Wa Hivi Karibuni</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catches.slice(0, 6).map((catchItem) => (
            <div key={catchItem.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 group hover:shadow-xl transition-all">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-ocean-500 rounded-xl mb-4 flex items-center justify-center">
                <Fish className="w-24 h-24 text-white/30" />
              </div>
              <h3 className="font-bold text-xl mb-2">{catchItem.title}</h3>
              <p className="text-ocean-600 font-semibold mb-2">{catchItem.fish_type}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-emerald-600">
                  {catchItem.quantity}kg
                </span>
                <span className="text-lg font-bold text-gray-700">
                  TZS {(catchItem.price_per_kg * catchItem.quantity).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  catchItem.is_approved 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {catchItem.is_approved ? 'Imeruhusiwa' : 'Inasubiri'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  catchItem.status === 'sold' 
                    ? 'bg-green-100 text-green-800' 
                    : catchItem.status === 'reserved' 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {catchItem.status === 'sold' ? 'Imeuzwa' : catchItem.status === 'reserved' ? 'Imehifadhiwa' : 'Inapatikana'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Pakia Uvuvi Mpya 🐟</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-200 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold mb-2">Jina la Uvuvi</label>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                    placeholder="Mfano: Dagaa 50kg Stone Town"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Aina ya Samaki</label>
                  <select
                    value={formData.fish_type}
                    onChange={(e) => setFormData({...formData, fish_type: e.target.value})}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500"
                    required
                  >
                    <option value="">Chagua aina</option>
                    {FISH_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center font-semibold mb-2">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>Bei kwa kilo (TZS)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price_per_kg}
                    onChange={(e) => setFormData({...formData, price_per_kg: e.target.value})}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500"
                    placeholder="5000"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center font-semibold mb-2">
                    <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                    <span>Mizani (kg)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500"
                    placeholder="50.5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Maelezo / Voice Note</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500 resize-vertical"
                  placeholder="Elezea hali ya samaki (mzao, ukubwa, mahali ulipovulia...)"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center font-semibold mb-2">
                    <Upload className="w-4 h-4 mr-2" />
                    <span>Sura ya Samaki</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({...formData, photo: e.target.files?.[0] || null})}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-ocean-400 transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center font-semibold mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>Mahali</span>
                  </label>
                  <input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500"
                    placeholder="Stone Town, Zanzibar"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Kupakia...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Pakia Uvuvi</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-4 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Ghairi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FisherDashboard

