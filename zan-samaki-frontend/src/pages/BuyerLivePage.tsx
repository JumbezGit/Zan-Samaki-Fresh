import { useEffect, useState } from 'react'
import { Activity, Clock3, Gavel, Radio, Users, Waves } from 'lucide-react'
import toast from 'react-hot-toast'

interface LiveAuction {
  id: number
  current_price: string
  increment_gap: string
  status: string
  bidder_count: number
  last_bid_at: string | null
  bid_expires_at: string | null
  server_time: string
  seller: {
    username: string
  }
  highest_bidder: {
    username: string
  } | null
  catch: {
    title: string
    location: string
    quantity: string
  }
}

const liveFeed = [
  {
    id: 1,
    title: 'Buyer anaweza kujiunga na mnada papo hapo',
    time: 'Sasa hivi',
    detail: 'Mara buyer akibonyeza bei ya sasa, mfumo utamweka kama bidder wa juu wa muda huo.',
  },
  {
    id: 2,
    title: 'Bei huongezeka kwa gap ukiwa na buyers wengi',
    time: 'Ndani ya dakika 1',
    detail: 'Buyer wawili au zaidi wakichagua mnada ndani ya dakika 1, bei itapanda kwa increment gap ya mvuvi.',
  },
  {
    id: 3,
    title: 'Mnada huuzwa kwa buyer wa mwisho akibaki peke yake',
    time: 'Baada ya dakika 1',
    detail: 'Kama hakuna bidder mwingine ndani ya dakika 1 baada ya bid ya mwisho, mfumo hufunga mnada na ku-create order kwa winner.',
  },
]

const getAuctionSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/auctions/`
}

const getTimeLeft = (bidExpiresAt: string | null, serverOffsetMs: number) => {
  if (!bidExpiresAt) {
    return 'Dakika 1'
  }

  const remainingMs = Math.max(0, new Date(bidExpiresAt).getTime() - (Date.now() + serverOffsetMs))
  const seconds = Math.ceil(remainingMs / 1000)
  return `${seconds}s`
}

const BuyerLivePage = () => {
  const [liveAuctions, setLiveAuctions] = useState<LiveAuction[]>([])
  const [serverOffsetMs, setServerOffsetMs] = useState(0)
  const [pendingBidAuctionId, setPendingBidAuctionId] = useState<number | null>(null)
  const [, setTick] = useState(0)

  const syncServerOffset = (auctions: LiveAuction[]) => {
    if (auctions.length === 0 || !auctions[0].server_time) {
      return
    }

    setServerOffsetMs(new Date(auctions[0].server_time).getTime() - Date.now())
  }

  const fetchAuctions = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auctions/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const auctions = Array.isArray(data) ? data.filter((item) => item.status === 'open') : []
      setLiveAuctions(auctions)
      syncServerOffset(auctions)
    } catch (error) {
      toast.error('Tatizo la kupakia minada')
    }
  }

  useEffect(() => {
    void fetchAuctions()
  }, [])

  useEffect(() => {
    const socket = new WebSocket(getAuctionSocketUrl())

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      if (payload.type === 'auction_snapshot') {
        const auctions = Array.isArray(payload.auctions) ? payload.auctions : []
        setLiveAuctions(auctions)
        syncServerOffset(auctions)
      }
    }

    return () => socket.close()
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  const placeBid = async (auctionId: number) => {
    try {
      setPendingBidAuctionId(auctionId)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/auctions/${auctionId}/bid/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.detail || 'Imeshindikana kushiriki mnada')
        return
      }

      toast.success(`Bid imewekwa: TZS ${Number(data.bid_amount).toLocaleString()}. Timer itaanza upya kwa buyers wote.`)
    } catch (error) {
      toast.error('Tatizo la kubid mnada')
    } finally {
      setPendingBidAuctionId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="relative mb-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-ocean-700 via-cyan-700 to-emerald-600 p-8 text-white shadow-2xl md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%)]" />
        <div className="relative">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-cyan-100">Live Buyer Feed</p>
          <h1 className="mb-4 flex items-center gap-3 text-4xl font-bold md:text-5xl">
            <Radio className="w-10 h-10" />
            <span>Live Market</span>
          </h1>
          <p className="max-w-3xl text-lg text-cyan-50">
            Hapa buyer anaona minada inayoendelea, bei ya sasa, gap ya kupanda, na anaweza kushiriki moja kwa moja.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/50 bg-white/75 p-6 shadow-lg backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Live Auction</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">Minada Inayoendelea</h2>
              </div>
              <div className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
                Live Now
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {liveAuctions.map((auction) => (
                <div
                  key={auction.id}
                  className="rounded-2xl border border-ocean-100 bg-gradient-to-br from-white to-ocean-50 p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{auction.catch.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {auction.seller.username} • {auction.catch.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                      <Gavel className="w-4 h-4" />
                      <span>Mnada</span>
                    </div>
                  </div>

                  <div className="mb-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bei ya sasa</p>
                      <p className="mt-1 text-lg font-bold text-ocean-700">
                        TZS {Number(auction.current_price).toLocaleString()}/kg
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Muda uliobaki</p>
                      <p className="mt-1 text-lg font-bold text-red-600">
                        {getTimeLeft(auction.bid_expires_at, serverOffsetMs)}
                      </p>
                    </div>
                  </div>

                  <p className="mb-3 text-sm text-slate-600">
                    Gap ya kuongeza: <span className="font-semibold">TZS {Number(auction.increment_gap).toLocaleString()}</span>
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-ocean-600" />
                      <span>{auction.bidder_count} buyers wanafuatilia</span>
                    </div>
                    <button
                      onClick={() => placeBid(auction.id)}
                      className="rounded-xl bg-ocean-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-ocean-700 disabled:opacity-60"
                      disabled={pendingBidAuctionId === auction.id}
                    >
                      {pendingBidAuctionId === auction.id ? 'Inatuma...' : 'Bid Live'}
                    </button>
                  </div>

                  {auction.highest_bidder && (
                    <p className="mt-3 text-sm font-medium text-emerald-700">
                      Kiongozi wa sasa: {auction.highest_bidder.username}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {liveFeed.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/50 bg-white/75 p-6 shadow-lg backdrop-blur-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900">{item.title}</h2>
                <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ocean-700">
                  <Clock3 className="w-4 h-4" />
                  {item.time}
                </span>
              </div>
              <p className="leading-7 text-gray-600">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-white/50 bg-white/75 p-6 shadow-lg backdrop-blur-sm">
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
            <Activity className="w-6 h-6 text-emerald-600" />
            Muda Halisi
          </h2>

          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="mb-1 text-sm font-semibold text-emerald-700">Minada open sasa</p>
              <p className="text-3xl font-bold text-emerald-900">{liveAuctions.length}</p>
            </div>
            <div className="rounded-2xl bg-cyan-50 p-5">
              <p className="mb-1 text-sm font-semibold text-cyan-700">Buyers waliopo live</p>
              <p className="text-3xl font-bold text-cyan-900">
                {liveAuctions.reduce((total, auction) => total + auction.bidder_count, 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-ocean-50 p-5">
              <p className="mb-1 text-sm font-semibold text-ocean-700">Bei ya juu zaidi</p>
              <p className="text-3xl font-bold text-ocean-900">
                TZS {liveAuctions.length > 0
                  ? Math.max(...liveAuctions.map((auction) => Number(auction.current_price))).toLocaleString()
                  : '0'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-gradient-to-r from-ocean-600 to-cyan-600 p-5 text-white">
            <div className="mb-2 flex items-center gap-3">
              <Waves className="w-5 h-5" />
              <p className="font-semibold">Rule ya mnada</p>
            </div>
            <p className="text-sm text-cyan-50">
              Buyer wawili au zaidi wakibofya mnada ndani ya dakika 1, bei inapanda kwa increment gap.
              Ikiwa hakuna bidder mwingine ndani ya dakika 1, mfumo humaliza mnada kwa buyer wa mwisho.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyerLivePage
