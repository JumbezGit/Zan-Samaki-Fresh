import { useEffect, useState } from 'react'
import { Fish, MapPin, ShoppingCart, Phone, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

interface Catch {
  id: number
  title: string
  fish_type: string
  quantity: number
  price_per_kg: number
  photo: string
  location: string
  user: {
    username: string
  }
}

const BuyerDashboard = () => {
  const [searchParams] = useSearchParams()
  const [catches, setCatches] = useState<Catch[]>([])
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    fishType: '',
    location: '',
    maxPrice: ''
  })
  const [loading, setLoading] = useState(false)
  const [selectedCatch, setSelectedCatch] = useState<Catch | null>(null)

  const FISH_TYPES = ['Dagaa', 'Changu', "Ng'ongo", 'Tafi', 'Pweza']

  useEffect(() => {
    fetchCatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const nextSearch = searchParams.get('search') || ''

    setFilters((currentFilters) => {
      if (currentFilters.search === nextSearch) {
        return currentFilters
      }

      return {
        ...currentFilters,
        search: nextSearch
      }
    })
  }, [searchParams])

  const fetchCatches = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const url = new URL('/api/catches/', window.location.origin)
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value)
        }
      })

      url.search = params.toString()

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      setCatches(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error('Tatizo la kupakia soko')
    } finally {
      setLoading(false)
    }
  }

  const buyCatch = async (catchId: number, quantity: number) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/catches/${catchId}/buy/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity,
          payment_method: 'tigo_pesa'
        })
      })

      if (res.ok) {
        toast.success('Umenunua! Tigo Pesa confirmation sent.')
        fetchCatches()
        setSelectedCatch(null)
      } else {
        toast.error('Kosa la kununua')
      }
    } catch (err) {
      toast.error('Kosa la kununua')
    }
  }

  const filteredCatches = catches.filter((catchItem) => {
    if (
      filters.search &&
      !catchItem.title.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false
    }

    if (filters.fishType && catchItem.fish_type !== filters.fishType) {
      return false
    }

    if (filters.location && !catchItem.location.includes(filters.location)) {
      return false
    }

    if (filters.maxPrice && catchItem.price_per_kg > parseFloat(filters.maxPrice)) {
      return false
    }

    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="">


        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr_auto]">


          <div>
            <label className="block font-semibold mb-2">Aina ya Samaki</label>
            <select
              value={filters.fishType}
              onChange={(e) => setFilters({ ...filters, fishType: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500"
            >
              <option value="">Zote</option>
              {FISH_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2 flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Mahali</span>
            </label>
            <input
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500"
              placeholder="Stone Town"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Bei Max kwa kg</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean-500"
              placeholder="5000"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchCatches}
              disabled={loading}
              className="w-full bg-ocean-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-ocean-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Inapakia...' : 'Tumia Filtari'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold flex items-center space-x-3">
          <Fish className="w-12 h-12 text-ocean-600" />
          <span>Soko la Samaki Safi</span>
        </h1>
        <div className="text-2xl font-bold text-emerald-600">
          {filteredCatches.length} patokanayo
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCatches.map((catchItem) => (
          <div
            key={catchItem.id}
            className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer"
            onClick={() => setSelectedCatch(catchItem)}
          >
            <div className="relative h-48 bg-gradient-to-br from-blue-400/20 to-ocean-500/20 rounded-xl mb-4 overflow-hidden">
              {catchItem.photo ? (
                <img
                  src={catchItem.photo}
                  alt={catchItem.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              ) : (
                <Fish className="w-24 h-24 text-white/30 absolute inset-0 m-auto" />
              )}
            </div>

            <h3 className="font-bold text-xl mb-3 line-clamp-1">{catchItem.title}</h3>

            <div className="flex items-center space-x-2 mb-3">
              <div className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm font-semibold">
                {catchItem.fish_type}
              </div>
              <div className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                {catchItem.location}
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  TZS {catchItem.price_per_kg.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">kwa kg</p>
              </div>
              <div className="text-xl font-bold">{catchItem.quantity} kg</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-5 h-5" />
                <span>{catchItem.user.username}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedCatch(catchItem)
                }}
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Nunua Sasa
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedCatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">{selectedCatch.title}</h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-ocean-500 rounded-xl flex items-center justify-center">
                  <Fish className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">{selectedCatch.fish_type}</p>
                  <p className="text-gray-600">{selectedCatch.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center p-6 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    TZS {selectedCatch.price_per_kg.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">kwa kg</p>
                </div>
                <div className="border-l border-gray-200 pl-6">
                  <p className="text-xl font-bold">{selectedCatch.quantity} kg</p>
                  <p className="text-sm text-gray-600">jumla</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8 p-4 bg-blue-50 rounded-xl">
              <button className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700">
                <Phone className="w-5 h-5" />
                <span>Piga Mvuvi</span>
              </button>
              <button
                onClick={() => buyCatch(selectedCatch.id, selectedCatch.quantity)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                Lipa Tigo Pesa
              </button>
            </div>

            <button
              onClick={() => setSelectedCatch(null)}
              className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Funga
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BuyerDashboard
