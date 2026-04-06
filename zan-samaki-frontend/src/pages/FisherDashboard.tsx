import { useEffect, useState } from 'react'
import { AlertCircle, Clock3, DollarSign, Fish, Gavel, MapPin, Plus, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '@/context/LanguageContext'

interface Catch {
  id: number
  title: string
  fish_type: string
  quantity: number
  price_per_kg: number
  status: string
  is_approved: boolean
  location: string
}

interface CoolBoxRequest {
  id: number
  start_date: string
  days: number
  quantity_kg: string
  price: string
  status: string
  location: string
  active_catch: Catch | null
}

interface Auction {
  id: number
  current_price: string
  increment_gap: string
  status: string
  bidder_count: number
  last_bid_at: string | null
  catch: {
    id: number
    title: string
    location: string
    quantity: string
  }
}

const FisherDashboard = () => {
  const { language } = useLanguage()
  const copy = language === 'en'
    ? {
      loadCatchError: 'Unable to load catches',
      loadAuctionError: 'Unable to load auctions',
      uploadSuccess: 'Catch uploaded!',
      uploadError: 'Upload failed. Please try again.',
      auctionCreated: 'Auction started!',
      auctionCreateError: 'Unable to start auction',
      loadCoolboxError: 'Unable to load coolbox data',
      needEligibleCatch: 'Upload approved fish that is still available before requesting a coolbox.',
      coolboxRequested: 'Coolbox request submitted!',
      coolboxRequestError: 'Coolbox request failed',
      earningsToday: 'Today\'s Earnings',
      catches: 'Catches',
      auctionsSold: 'Auctions Sold',
      auctionLive: 'Live Auctions',
      uploadCatch: 'Upload New Catch',
      startAuction: 'Start Auction',
      requestCoolbox: 'Request CoolBox'
    }
    : {
      loadCatchError: 'Tatizo la kupakia uvuvi',
      loadAuctionError: 'Tatizo la kupakia minada',
      uploadSuccess: 'Uvuvi umepakiwa!',
      uploadError: 'Kosa la kupakia. Jaribu tena.',
      auctionCreated: 'Mnada umeanzishwa!',
      auctionCreateError: 'Imeshindikana kuanzisha mnada',
      loadCoolboxError: 'Tatizo la kupakia coolbox',
      needEligibleCatch: 'Pakia samaki waliothibitishwa na waliopo sokoni kwanza kabla ya kuomba coolbox.',
      coolboxRequested: 'Ombi la sanduku la baridi limewasilishwa!',
      coolboxRequestError: 'Tatizo la ombi la sanduku',
      earningsToday: 'Mapato Leo',
      catches: 'Uvuvi',
      auctionsSold: 'Minada Sold',
      auctionLive: 'Mnada Live',
      uploadCatch: 'Pakia Uvuvi Mpya',
      startAuction: 'Anzisha Mnada',
      requestCoolbox: 'Omba Sanduku la Baridi'
    }
  const COOLBOX_LOCATIONS = ['Malindi', 'Mkokotoni', 'Chwaka', 'Paje']
  const [catches, setCatches] = useState<Catch[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [coolBoxRequests, setCoolBoxRequests] = useState<CoolBoxRequest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showAuctionForm, setShowAuctionForm] = useState(false)
  const [showCoolBoxForm, setShowCoolBoxForm] = useState(false)
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
  const [auctionData, setAuctionData] = useState({
    catch: '',
    initial_price: '',
    increment_gap: '1000'
  })
  const [coolBoxData, setCoolBoxData] = useState({
    catch_id: '',
    days: '1',
    quantity_kg: '',
    location: 'Malindi'
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

  const getAuctionSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws/auctions/`
  }

  useEffect(() => {
    void fetchCatches()
    void fetchAuctions()
    void fetchCoolBoxRequests()
    setEarnings(125000 + Math.floor(Math.random() * 25000))
  }, [])

  useEffect(() => {
    const socket = new WebSocket(getAuctionSocketUrl())

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      if (payload.type === 'auction_snapshot') {
        const nextAuctions = Array.isArray(payload.auctions) ? payload.auctions : []
        setAuctions(nextAuctions)
      }
    }

    return () => socket.close()
  }, [])

  const fetchCatches = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/catches/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCatches(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(copy.loadCatchError)
    }
  }

  const fetchAuctions = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auctions/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAuctions(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(copy.loadAuctionError)
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
        toast.success(copy.uploadSuccess)
        setShowForm(false)
        setFormData({
          title: '',
          description: '',
          fish_type: '',
          quantity: '',
          price_per_kg: '',
          photo: null,
          voice_note: '',
          location: 'Zanzibar'
        })
        void fetchCatches()
      } else {
        toast.error(copy.uploadError)
      }
    } catch (err) {
      toast.error(copy.uploadError)
    } finally {
      setLoading(false)
    }
  }

  const createAuction = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auctions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(auctionData)
      })

      if (res.ok) {
        toast.success(copy.auctionCreated)
        setShowAuctionForm(false)
        setAuctionData({
          catch: '',
          initial_price: '',
          increment_gap: '1000'
        })
        void fetchAuctions()
        void fetchCatches()
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.detail || copy.auctionCreateError)
      }
    } catch (err) {
      toast.error(copy.auctionCreateError)
    }
  }

  const fetchCoolBoxRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/coolbox/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCoolBoxRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(copy.loadCoolboxError)
    }
  }

  const openCoolBoxForm = () => {
    if (eligibleCatches.length === 0) {
      toast.error(copy.needEligibleCatch)
      return
    }

    setCoolBoxData({
      catch_id: String(eligibleCatches[0].id),
      days: '1',
      quantity_kg: String(eligibleCatches[0].quantity),
      location: 'Malindi'
    })
    setShowCoolBoxForm(true)
  }

  const requestCoolBox = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/coolbox/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          days: Number(coolBoxData.days),
          quantity_kg: Number(coolBoxData.quantity_kg),
          catch_id: Number(coolBoxData.catch_id),
          location: coolBoxData.location
        })
      })

      if (res.ok) {
        toast.success(copy.coolboxRequested)
        setShowCoolBoxForm(false)
        setCoolBoxData({
          catch_id: '',
          days: '1',
          quantity_kg: '',
          location: 'Malindi'
        })
        void fetchCoolBoxRequests()
        void fetchCatches()
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.detail || data?.non_field_errors?.[0] || copy.coolboxRequestError)
      }
    } catch (err) {
      toast.error(copy.coolboxRequestError)
    } finally {
      setLoading(false)
    }
  }

  const eligibleCatches = catches.filter((catchItem) => catchItem.status === 'available' && catchItem.is_approved)
  const activeCoolBoxRequests = coolBoxRequests.filter((request) => request.active_catch)

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-600 text-sm uppercase tracking-wide">Mapato Leo</p>
              <p className="text-gray-600 text-sm uppercase tracking-wide">{copy.earningsToday}</p>
              <p className="text-4xl font-bold text-ocean-600">
                TZS {earnings.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-16 h-16 text-ocean-600/20" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-semibold text-lg">{catches.length}</p>
              <p className="text-sm text-gray-600">{copy.catches}</p>
            </div>
            <div>
              <p className="font-semibold text-lg">{auctions.filter((auction) => auction.status === 'sold').length}</p>
              <p className="text-sm text-gray-600">{copy.auctionsSold}</p>
            </div>
            <div>
              <p className="font-semibold text-lg">{auctions.filter((auction) => auction.status === 'open').length}</p>
              <p className="text-sm text-gray-600">{copy.auctionLive}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowForm(true)}
            className="flex w-full items-center space-x-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-lg font-semibold text-white shadow-xl transition-all hover:shadow-2xl"
          >
            <Plus className="w-6 h-6" />
            <span>{copy.uploadCatch}</span>
          </button>

          <button
            onClick={() => setShowAuctionForm(true)}
            className="flex w-full items-center space-x-3 rounded-2xl bg-gradient-to-r from-ocean-600 to-cyan-600 p-6 text-lg font-semibold text-white shadow-xl transition-all hover:shadow-2xl"
          >
            <Gavel className="w-6 h-6" />
            <span>{copy.startAuction}</span>
          </button>

          <button
            onClick={openCoolBoxForm}
            className="flex w-full items-center space-x-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 p-6 text-lg font-semibold text-white shadow-xl transition-all hover:shadow-2xl"
          >
            <AlertCircle className="w-6 h-6" />
            <span>{copy.requestCoolbox}</span>
          </button>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="mb-8 flex items-center space-x-3 text-3xl font-bold">
          <AlertCircle className="w-10 h-10" />
          <span>Samaki Waliohifadhiwa Kwenye CoolBox</span>
        </h2>
        {activeCoolBoxRequests.length === 0 ? (
          <div className="rounded-2xl border border-white/50 bg-white/70 p-8 text-center text-gray-600 shadow-lg">
            Hakuna samaki walio kwenye coolbox kwa sasa. Samaki wakiuzwa, kuisha, au kuondolewa hawataonekana hapa tena.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeCoolBoxRequests.map((request) => {
              const activeCatch = request.active_catch

              if (!activeCatch) {
                return null
              }

              return (
                <div key={request.id} className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold">{activeCatch.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{activeCatch.location}</p>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                      {request.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Aina ya samaki: <span className="font-semibold">{activeCatch.fish_type}</span></p>
                    <p>Coolbox location: <span className="font-semibold">{request.location}</span></p>
                    <p>Kilo saved in coolbox: <span className="font-semibold">{request.quantity_kg} kg</span></p>
                    <p>Kilo zilizopo: <span className="font-semibold">{activeCatch.quantity} kg</span></p>
                    <p>Muda wa coolbox: <span className="font-semibold">{request.days} siku</span></p>
                    <p>Gharama: <span className="font-semibold">TZS {Number(request.price).toLocaleString()}</span></p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="mb-8 flex items-center space-x-3 text-3xl font-bold">
          <Gavel className="w-10 h-10" />
          <span>Samaki Tayari Kwa Mnada</span>
        </h2>
        {eligibleCatches.length === 0 ? (
          <div className="rounded-2xl border border-white/50 bg-white/70 p-8 text-center text-gray-600 shadow-lg">
            Hakuna samaki wa database walioko tayari kwa mnada kwa sasa. Hakikisha catch imeidhinishwa na ipo `available`.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eligibleCatches.map((catchItem) => (
              <div key={catchItem.id} className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">{catchItem.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{catchItem.fish_type}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Approved
                  </span>
                </div>
                <div className="mb-5 space-y-2 text-sm text-gray-600">
                  <p>Kilo zilizopo: <span className="font-semibold">{catchItem.quantity} kg</span></p>
                  <p>Bei ya kawaida: <span className="font-semibold">TZS {Number(catchItem.price_per_kg).toLocaleString()}/kg</span></p>
                  <p>Status: <span className="font-semibold">{catchItem.status}</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuctionData((currentData) => ({
                      ...currentData,
                      catch: String(catchItem.id),
                      initial_price: String(catchItem.price_per_kg),
                    }))
                    setShowAuctionForm(true)
                  }}
                  className="w-full rounded-xl bg-ocean-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-ocean-700"
                >
                  Weka Kwenye Mnada
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="mb-8 flex items-center space-x-3 text-3xl font-bold">
          <Gavel className="w-10 h-10" />
          <span>Minada Yangu</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <div key={auction.id} className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">{auction.catch.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{auction.catch.location}</p>
                </div>
                <span className="rounded-full bg-ocean-100 px-3 py-1 text-xs font-semibold text-ocean-800">
                  {auction.status}
                </span>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <p>Bei ya sasa: <span className="font-bold text-ocean-700">TZS {Number(auction.current_price).toLocaleString()}</span></p>
                <p>Gap: <span className="font-semibold">TZS {Number(auction.increment_gap).toLocaleString()}</span></p>
                <p>Buyers: <span className="font-semibold">{auction.bidder_count}</span></p>
                <p className="flex items-center gap-2">
                  <Clock3 className="w-4 h-4" />
                  <span>{auction.last_bid_at ? 'Bid ya mwisho imepokelewa' : 'Inasubiri bid ya kwanza'}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="mb-8 flex items-center space-x-3 text-3xl font-bold">
          <Fish className="w-10 h-10" />
          <span>Uvuvi Wako Wa Hivi Karibuni</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catches.slice(0, 6).map((catchItem) => (
            <div key={catchItem.id} className="group rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="mb-4 flex h-48 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-ocean-500">
                <Fish className="w-24 h-24 text-white/30" />
              </div>
              <h3 className="mb-2 text-xl font-bold">{catchItem.title}</h3>
              <p className="mb-2 font-semibold text-ocean-600">{catchItem.fish_type}</p>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-emerald-600">{catchItem.quantity}kg</span>
                <span className="text-lg font-bold text-gray-700">
                  TZS {(catchItem.price_per_kg * catchItem.quantity).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  catchItem.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {catchItem.is_approved ? 'Imeruhusiwa' : 'Inasubiri'}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  catchItem.status === 'sold'
                    ? 'bg-green-100 text-green-800'
                    : catchItem.status === 'reserved'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {catchItem.status === 'sold' ? 'Imeuzwa' : catchItem.status === 'reserved' ? 'Kwenye Mnada' : 'Inapatikana'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Pakia Uvuvi Mpya</h2>
              <button onClick={() => setShowForm(false)} className="rounded-xl p-2 hover:bg-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-semibold">Jina la Uvuvi</label>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-4 focus:border-transparent focus:ring-2 focus:ring-ocean-500"
                    placeholder="Mfano: Dagaa 50kg Stone Town"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block font-semibold">Aina ya Samaki</label>
                  <select
                    value={formData.fish_type}
                    onChange={(e) => setFormData({ ...formData, fish_type: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                    required
                  >
                    <option value="">Chagua aina</option>
                    {FISH_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center font-semibold">
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Bei kwa kilo (TZS)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price_per_kg}
                    onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                    placeholder="5000"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center font-semibold">
                    <span>Mizani (kg)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                    placeholder="50.5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-semibold">Maelezo</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full resize-vertical rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                  placeholder="Elezea hali ya samaki"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center font-semibold">
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Sura ya Samaki</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                    className="w-full rounded-xl border-2 border-dashed border-gray-300 p-4 transition-all hover:border-ocean-400"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center font-semibold">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>Mahali</span>
                  </label>
                  <input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                    placeholder="Stone Town, Zanzibar"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4 text-lg font-bold text-white shadow-xl transition-all hover:shadow-2xl disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Kupakia...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>Pakia Uvuvi</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl bg-gray-200 px-6 py-4 font-semibold text-gray-800 transition-all hover:bg-gray-300"
                >
                  Ghairi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCoolBoxForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Omba CoolBox</h2>
              <button onClick={() => setShowCoolBoxForm(false)} className="rounded-xl p-2 hover:bg-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={requestCoolBox} className="space-y-6">
              <div>
                <label className="mb-2 block font-semibold">Chagua Samaki wa Kuhifadhi</label>
                <select
                  value={coolBoxData.catch_id}
                  onChange={(e) => {
                    const selectedCatch = eligibleCatches.find((catchItem) => String(catchItem.id) === e.target.value)
                    setCoolBoxData({
                      ...coolBoxData,
                      catch_id: e.target.value,
                      quantity_kg: selectedCatch ? String(selectedCatch.quantity) : ''
                    })
                  }}
                  className="w-full rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                  required
                >
                  <option value="">Chagua samaki</option>
                  {eligibleCatches.map((catchItem) => (
                    <option key={catchItem.id} value={catchItem.id}>
                      {catchItem.title} - {catchItem.quantity}kg - {catchItem.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold">Siku za Kuhifadhi</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={coolBoxData.days}
                  onChange={(e) => setCoolBoxData({ ...coolBoxData, days: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">Kilo za Kuhifadhi kwenye CoolBox</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  max={
                    eligibleCatches.find((catchItem) => String(catchItem.id) === coolBoxData.catch_id)?.quantity || undefined
                  }
                  value={coolBoxData.quantity_kg}
                  onChange={(e) => setCoolBoxData({ ...coolBoxData, quantity_kg: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                  required
                />
                {coolBoxData.catch_id && (
                  <p className="mt-2 text-sm text-gray-500">
                    Available kilos:{' '}
                    {eligibleCatches.find((catchItem) => String(catchItem.id) === coolBoxData.catch_id)?.quantity ?? 0} kg
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block font-semibold">Chagua Location ya CoolBox</label>
                <select
                  value={coolBoxData.location}
                  onChange={(e) => setCoolBoxData({ ...coolBoxData, location: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                  required
                >
                  {COOLBOX_LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-4 font-bold text-white shadow-xl transition-all hover:shadow-2xl disabled:opacity-50"
                >
                  {loading ? 'Inatuma...' : 'Tuma Ombi'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCoolBoxForm(false)}
                  className="flex-1 rounded-xl bg-gray-200 px-6 py-4 font-semibold text-gray-800 transition-all hover:bg-gray-300"
                >
                  Ghairi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAuctionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Anzisha Mnada</h2>
              <button onClick={() => setShowAuctionForm(false)} className="rounded-xl p-2 hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={createAuction} className="space-y-5">
              <div>
                <label className="mb-2 block font-semibold">Chagua Samaki</label>
                <select
                  value={auctionData.catch}
                  onChange={(e) => setAuctionData({ ...auctionData, catch: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                  required
                >
                  <option value="">Chagua catch</option>
                  {eligibleCatches.map((catchItem) => (
                    <option key={catchItem.id} value={catchItem.id}>
                      {catchItem.title} - {catchItem.quantity}kg
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-semibold">Bei ya kuanzia</label>
                  <input
                    type="number"
                    value={auctionData.initial_price}
                    onChange={(e) => setAuctionData({ ...auctionData, initial_price: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                    placeholder="20000"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block font-semibold">Gap ya kuongeza</label>
                  <input
                    type="number"
                    value={auctionData.increment_gap}
                    onChange={(e) => setAuctionData({ ...auctionData, increment_gap: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-4 focus:ring-2 focus:ring-ocean-500"
                    placeholder="1000"
                    required
                  />
                </div>
              </div>

              <p className="rounded-xl bg-ocean-50 p-4 text-sm text-ocean-700">
                Buyer wawili au zaidi wakichagua ndani ya dakika 1, bei itaongezeka kwa gap uliyoweka.
                Ikiwa hakuna buyer mwingine ndani ya dakika 1, mnada utauzwa kwa buyer wa mwisho.
              </p>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-ocean-600 to-cyan-600 px-6 py-4 font-semibold text-white hover:from-ocean-700 hover:to-cyan-700"
              >
                Publish Mnada
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FisherDashboard
