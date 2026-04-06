import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Clock3, Fish, Gavel, Radio, Users, Waves } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '@/context/LanguageContext'

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
    photo?: string | null
  }
}

const getAuctionSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/auctions/`
}

const getTimeLeft = (bidExpiresAt: string | null, serverOffsetMs: number, fallback: string) => {
  if (!bidExpiresAt) {
    return fallback
  }

  const remainingMs = Math.max(0, new Date(bidExpiresAt).getTime() - (Date.now() + serverOffsetMs))
  const seconds = Math.ceil(remainingMs / 1000)
  return `${seconds}s`
}

const BuyerLivePage = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const copy = language === 'en'
    ? {
      loadError: 'Unable to load live auctions',
      winnerRedirect: 'You won the auction. Opening payment now.',
      winnerFallback: 'You won the auction. Go to Orders to complete payment.',
      bidError: 'Unable to join auction',
      bidPlaced: 'Bid placed: TZS {amount}. The timer restarted for all buyers.',
      bidNetworkError: 'Auction bid failed',
      heroEyebrow: 'Live Buyer Feed',
      heroTitle: 'Live Market',
      heroDescription: 'Here buyers can see active auctions, the current price, the bid gap, and join instantly.',
      liveAuction: 'Live Auction',
      liveTitle: 'Ongoing Auctions',
      liveNow: 'Live Now',
      noImage: 'No fish image',
      auction: 'Auction',
      currentPrice: 'Current price',
      timeLeft: 'Time left',
      incrementGap: 'Increment gap',
      availableKilos: 'Available kilos',
      buyersWatching: 'buyers watching',
      sending: 'Sending...',
      bidLive: 'Bid Live',
      currentLeader: 'Current leader',
      realtime: 'Realtime',
      openNow: 'Open auctions now',
      liveBuyers: 'Buyers live now',
      highestPrice: 'Highest price',
      ruleTitle: 'Auction rule',
      ruleText: 'If two or more buyers bid within 1 minute, the price increases by the increment gap. If no other bidder joins within 1 minute, the auction closes for the last buyer.',
      fallbackMinute: '1 minute',
      liveFeed: [
        { id: 1, title: 'Buyers can join an auction instantly', time: 'Right now', detail: 'As soon as a buyer taps the current price, the system marks them as the highest bidder for that moment.' },
        { id: 2, title: 'Price rises when more buyers compete', time: 'Within 1 minute', detail: 'If two or more buyers join an auction within 1 minute, the price rises by the fisher’s increment gap.' },
        { id: 3, title: 'The last remaining buyer wins', time: 'After 1 minute', detail: 'If no other bidder joins within 1 minute after the latest bid, the system closes the auction and creates an order for the winner.' }
      ]
    }
    : {
      loadError: 'Tatizo la kupakia minada',
      winnerRedirect: 'Umeshinda mnada. Mfumo unafungua malipo sasa.',
      winnerFallback: 'Umeshinda mnada. Nenda Orders ukamilishe malipo.',
      bidError: 'Imeshindikana kushiriki mnada',
      bidPlaced: 'Bid imewekwa: TZS {amount}. Timer itaanza upya kwa buyers wote.',
      bidNetworkError: 'Tatizo la kubid mnada',
      heroEyebrow: 'Live Buyer Feed',
      heroTitle: 'Live Market',
      heroDescription: 'Hapa buyer anaona minada inayoendelea, bei ya sasa, gap ya kupanda, na anaweza kushiriki moja kwa moja.',
      liveAuction: 'Live Auction',
      liveTitle: 'Minada Inayoendelea',
      liveNow: 'Live Now',
      noImage: 'Hakuna picha ya samaki',
      auction: 'Mnada',
      currentPrice: 'Bei ya sasa',
      timeLeft: 'Muda uliobaki',
      incrementGap: 'Gap ya kuongeza',
      availableKilos: 'Kilo zilizopo',
      buyersWatching: 'buyers wanafuatilia',
      sending: 'Inatuma...',
      bidLive: 'Bid Live',
      currentLeader: 'Kiongozi wa sasa',
      realtime: 'Muda Halisi',
      openNow: 'Minada open sasa',
      liveBuyers: 'Buyers waliopo live',
      highestPrice: 'Bei ya juu zaidi',
      ruleTitle: 'Rule ya mnada',
      ruleText: 'Buyer wawili au zaidi wakibofya mnada ndani ya dakika 1, bei inapanda kwa increment gap. Ikiwa hakuna bidder mwingine ndani ya dakika 1, mfumo humaliza mnada kwa buyer wa mwisho.',
      fallbackMinute: 'Dakika 1',
      liveFeed: [
        { id: 1, title: 'Buyer anaweza kujiunga na mnada papo hapo', time: 'Sasa hivi', detail: 'Mara buyer akibonyeza bei ya sasa, mfumo utamweka kama bidder wa juu wa muda huo.' },
        { id: 2, title: 'Bei huongezeka kwa gap ukiwa na buyers wengi', time: 'Ndani ya dakika 1', detail: 'Buyer wawili au zaidi wakichagua mnada ndani ya dakika 1, bei itapanda kwa increment gap ya mvuvi.' },
        { id: 3, title: 'Mnada huuzwa kwa buyer wa mwisho akibaki peke yake', time: 'Baada ya dakika 1', detail: 'Kama hakuna bidder mwingine ndani ya dakika 1 baada ya bid ya mwisho, mfumo hufunga mnada na ku-create order kwa winner.' }
      ]
    }
  const [liveAuctions, setLiveAuctions] = useState<LiveAuction[]>([])
  const [currentUsername, setCurrentUsername] = useState('')
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
      toast.error(copy.loadError)
    }
  }

  useEffect(() => {
    void fetchAuctions()
  }, [])

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/users/me/', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) {
          return
        }

        const data = await res.json()
        setCurrentUsername(data?.username || '')
      } catch {
        setCurrentUsername('')
      }
    }

    void fetchCurrentUser()
  }, [])

  useEffect(() => {
    const socket = new WebSocket(getAuctionSocketUrl())

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      if (payload.type === 'auction_snapshot') {
        const auctions = Array.isArray(payload.auctions) ? payload.auctions : []
        setLiveAuctions((previousAuctions) => {
          const closedWinningAuction = previousAuctions.find(
            (auction) =>
              auction.highest_bidder?.username === currentUsername &&
              !auctions.some((openAuction: LiveAuction) => openAuction.id === auction.id)
          )

          if (closedWinningAuction) {
            const token = localStorage.getItem('token')
            void fetch('/api/orders/', {
              headers: { Authorization: `Bearer ${token}` }
            })
              .then((res) => res.json())
              .then((orders) => {
                const matchedOrder = Array.isArray(orders)
                  ? orders.find(
                    (order: { id: number; status: string; catch?: { title?: string } }) =>
                      order.status === 'pending' &&
                      order.catch?.title === closedWinningAuction.catch.title
                  )
                  : null

                if (matchedOrder) {
                  toast.success(copy.winnerRedirect)
                  navigate(`/buyer/orders?payOrder=${matchedOrder.id}`)
                }
              })
              .catch(() => {
                toast.success(copy.winnerFallback)
              })
          }

          return auctions
        })
        syncServerOffset(auctions)
      }
    }

    return () => socket.close()
  }, [currentUsername, navigate])

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
        toast.error(data?.detail || copy.bidError)
        return
      }

      toast.success(copy.bidPlaced.replace('{amount}', Number(data.bid_amount).toLocaleString()))
    } catch (error) {
      toast.error(copy.bidNetworkError)
    } finally {
      setPendingBidAuctionId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="relative mb-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-ocean-700 via-cyan-700 to-emerald-600 p-8 text-white shadow-2xl md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%)]" />
        <div className="relative">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-cyan-100">{copy.heroEyebrow}</p>
          <h1 className="mb-4 flex items-center gap-3 text-4xl font-bold md:text-5xl">
            <Radio className="w-10 h-10" />
            <span>{copy.heroTitle}</span>
          </h1>
          <p className="max-w-3xl text-lg text-cyan-50">{copy.heroDescription}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/50 bg-white/75 p-6 shadow-lg backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Live Auction</p>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">{copy.liveAuction}</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">{copy.liveTitle}</h2>
              </div>
              <div className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
                {copy.liveNow}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {liveAuctions.map((auction) => (
                <div
                  key={auction.id}
                  className="rounded-2xl border border-ocean-100 bg-gradient-to-br from-white to-ocean-50 p-5 shadow-sm"
                >
                  <div className="mb-4 overflow-hidden rounded-2xl border border-ocean-100 bg-slate-100">
                    {auction.catch.photo ? (
                      <img
                        src={auction.catch.photo}
                        alt={auction.catch.title}
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-gradient-to-br from-cyan-100 via-ocean-100 to-emerald-100 text-ocean-700">
                        <div className="text-center">
                          <Fish className="mx-auto h-14 w-14 opacity-70" />
                          <p className="mt-3 text-sm font-semibold">{copy.noImage}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{auction.catch.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {auction.seller.username} • {auction.catch.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                      <Gavel className="w-4 h-4" />
                      <span>{copy.auction}</span>
                    </div>
                  </div>

                  <div className="mb-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.currentPrice}</p>
                      <p className="mt-1 text-lg font-bold text-ocean-700">
                        TZS {Number(auction.current_price).toLocaleString()}/kg
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.timeLeft}</p>
                      <p className="mt-1 text-lg font-bold text-red-600">
                        {getTimeLeft(auction.bid_expires_at, serverOffsetMs, copy.fallbackMinute)}
                      </p>
                    </div>
                  </div>

                  <p className="mb-3 text-sm text-slate-600">
                    {copy.incrementGap}: <span className="font-semibold">TZS {Number(auction.increment_gap).toLocaleString()}</span>
                  </p>

                  <p className="mb-4 text-sm text-slate-600">
                    {copy.availableKilos}: <span className="font-semibold">{Number(auction.catch.quantity).toLocaleString()} kg</span>
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-ocean-600" />
                      <span>{auction.bidder_count} {copy.buyersWatching}</span>
                    </div>
                    <button
                      onClick={() => placeBid(auction.id)}
                      className="rounded-xl bg-ocean-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-ocean-700 disabled:opacity-60"
                      disabled={pendingBidAuctionId === auction.id}
                    >
                      {pendingBidAuctionId === auction.id ? copy.sending : copy.bidLive}
                    </button>
                  </div>

                  {auction.highest_bidder && (
                    <p className="mt-3 text-sm font-medium text-emerald-700">
                      {copy.currentLeader}: {auction.highest_bidder.username}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {copy.liveFeed.map((item) => (
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
            {copy.realtime}
          </h2>

          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="mb-1 text-sm font-semibold text-emerald-700">{copy.openNow}</p>
              <p className="text-3xl font-bold text-emerald-900">{liveAuctions.length}</p>
            </div>
            <div className="rounded-2xl bg-cyan-50 p-5">
              <p className="mb-1 text-sm font-semibold text-cyan-700">{copy.liveBuyers}</p>
              <p className="text-3xl font-bold text-cyan-900">
                {liveAuctions.reduce((total, auction) => total + auction.bidder_count, 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-ocean-50 p-5">
              <p className="mb-1 text-sm font-semibold text-ocean-700">{copy.highestPrice}</p>
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
              <p className="font-semibold">{copy.ruleTitle}</p>
            </div>
            <p className="text-sm text-cyan-50">{copy.ruleText}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyerLivePage
