import { useEffect, useState } from 'react'
import { Fish, MapPin, ShoppingCart, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import FishCard, { type FishCardItem } from '@/components/FishCard'

type Catch = FishCardItem

interface PurchaseInvoice {
  invoice_number: string
  issued_at: string
  buyer_name: string
  fisher_name: string
  fish_title: string
  fish_type: string
  quantity: string
  price_per_kg: string
  total_price: string
  payment_method: string
  status: string
  location: string
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
  const [purchaseQuantity, setPurchaseQuantity] = useState('1')
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null)

  const FISH_TYPES = ['Dagaa', 'Changu', "Ng'ongo", 'Tafi', 'Pweza']

  useEffect(() => {
    setFilters((currentFilters) => {
      const nextSearch = searchParams.get('search') || ''

      if (currentFilters.search === nextSearch) {
        return currentFilters
      }

      return {
        ...currentFilters,
        search: nextSearch
      }
    })
  }, [searchParams])

  const fetchCatches = async (activeFilters = filters) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const url = new URL('/api/catches/', window.location.origin)
      const params = new URLSearchParams()

      Object.entries(activeFilters).forEach(([key, value]) => {
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

  useEffect(() => {
    void fetchCatches(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

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
        const data = await res.json()
        setInvoice(data.invoice ?? null)
        toast.success('Umenunua! Invoice imetengenezwa.')
        fetchCatches()
        setSelectedCatch(null)
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.detail || 'Kosa la kununua')
      }
    } catch (err) {
      toast.error('Kosa la kununua')
    }
  }

  const openCatchDetails = (catchItem: Catch) => {
    setSelectedCatch(catchItem)
    setPurchaseQuantity('1')
  }

  const parsedPurchaseQuantity = Number(purchaseQuantity)
  const isQuantityValid = Boolean(
    selectedCatch &&
    Number.isFinite(parsedPurchaseQuantity) &&
    parsedPurchaseQuantity > 0 &&
    parsedPurchaseQuantity <= selectedCatch.quantity
  )
  const totalPrice = selectedCatch && isQuantityValid
    ? parsedPurchaseQuantity * selectedCatch.price_per_kg
    : 0

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
              onClick={() => void fetchCatches(filters)}
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
          {catches.length} patokanayo
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {catches.map((catchItem) => (
          <FishCard key={catchItem.id} item={catchItem} onSelect={openCatchDetails} />
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
                  <p className="text-sm text-gray-600">bei kwa kilo</p>
                </div>
                <div className="border-l border-gray-200 pl-6">
                  <p className="text-xl font-bold">{selectedCatch.quantity} kg</p>
                  <p className="text-sm text-gray-600">stock iliyopo</p>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Weka kiasi cha kilo unachotaka
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCatch.quantity}
                  step="0.5"
                  value={purchaseQuantity}
                  onChange={(event) => setPurchaseQuantity(event.target.value)}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 focus:ring-2 focus:ring-emerald-400"
                  placeholder="Mfano 2"
                />
                <div className="mt-3 flex items-center justify-between text-sm text-gray-700">
                  <span>Bei kwa kilo: TZS {selectedCatch.price_per_kg.toLocaleString()}</span>
                  <span>Jumla: TZS {totalPrice.toLocaleString()}</span>
                </div>
                {!isQuantityValid && (
                  <p className="mt-2 text-sm text-red-600">
                    Weka kiasi sahihi kati ya 1 na {selectedCatch.quantity} kg.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8 p-4 bg-blue-50 rounded-xl">
              <button className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700">
                <Phone className="w-5 h-5" />
                <span>Piga Mvuvi</span>
              </button>
              <button
                onClick={() => {
                  if (!isQuantityValid) {
                    toast.error('Weka kiasi sahihi cha kilo')
                    return
                  }
                  buyCatch(selectedCatch.id, parsedPurchaseQuantity)
                }}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                disabled={!isQuantityValid}
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

      {invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Invoice</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">{invoice.invoice_number}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Imekamilika: {new Date(invoice.issued_at).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                {invoice.status}
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Buyer</p>
                <p className="font-semibold text-slate-900">{invoice.buyer_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mvuvi</p>
                <p className="font-semibold text-slate-900">{invoice.fisher_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Samaki</p>
                <p className="font-semibold text-slate-900">{invoice.fish_title}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Aina</p>
                <p className="font-semibold text-slate-900">{invoice.fish_type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mahali</p>
                <p className="font-semibold text-slate-900">{invoice.location}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Malipo</p>
                <p className="font-semibold text-slate-900">{invoice.payment_method}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-slate-500">Kiasi</span>
                <span className="font-semibold text-slate-900">{invoice.quantity} kg</span>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-slate-500">Bei kwa kilo</span>
                <span className="font-semibold text-slate-900">TZS {Number(invoice.price_per_kg).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg">
                <span className="font-semibold text-slate-700">Jumla</span>
                <span className="font-bold text-emerald-700">TZS {Number(invoice.total_price).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setInvoice(null)}
              className="mt-6 w-full rounded-xl bg-ocean-600 px-6 py-3 font-semibold text-white transition-all hover:bg-ocean-700"
            >
              Funga Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BuyerDashboard
