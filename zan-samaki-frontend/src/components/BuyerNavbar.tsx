import { FormEvent, useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, Package, Radio, Search, ShoppingBasket, ShoppingCart } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import UserMenu from '@/components/UserMenu'

interface BuyerNavbarProps {
  username: string
  onLogout: () => void
}

const BuyerNavbar = ({ username, onLogout }: BuyerNavbarProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [orderCount, setOrderCount] = useState(0)
  const [liveCount, setLiveCount] = useState(0)
  const navigate = useNavigate()
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-2 rounded-lg px-3 py-2 font-medium transition-all ${
      isActive
        ? 'bg-ocean-50 text-ocean-700'
        : 'text-gray-700 hover:bg-ocean-50 hover:text-ocean-600'
    }`

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams()

    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    }

    navigate(`/buyer${params.toString() ? `?${params.toString()}` : ''}`)
  }

  useEffect(() => {
    const getAuctionSocketUrl = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${window.location.host}/ws/auctions/`
    }

    const fetchOrderCount = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/orders/', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) {
          return
        }

        const data = await res.json()
        setOrderCount(Array.isArray(data) ? data.length : 0)
      } catch {
        setOrderCount(0)
      }
    }

    const fetchLiveCount = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/auctions/', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) {
          return
        }

        const data = await res.json()
        const auctions = Array.isArray(data) ? data.filter((item) => item.status === 'open') : []
        setLiveCount(auctions.length)
      } catch {
        setLiveCount(0)
      }
    }

    void fetchOrderCount()
    void fetchLiveCount()

    const socket = new WebSocket(getAuctionSocketUrl())
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      if (payload.type === 'auction_snapshot') {
        const auctions = Array.isArray(payload.auctions) ? payload.auctions : []
        setLiveCount(auctions.length)
      }
    }

    const interval = window.setInterval(() => {
      void fetchOrderCount()
    }, 15000)

    return () => {
      socket.close()
      window.clearInterval(interval)
    }
  }, [])

  const renderBubble = (count: number) => (
    count > 0 ? (
      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
        {count > 99 ? '99+' : count}
      </span>
    ) : null
  )

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-ocean-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <BrandLogo />

          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tafuta samaki..."
                className="w-56 rounded-xl border border-ocean-100 bg-white px-10 py-2 text-sm text-gray-700 shadow-sm outline-none transition-all focus:border-ocean-400 focus:ring-2 focus:ring-ocean-200"
              />
            </form>
            <NavLink
              to="/buyer"
              end
              className={navLinkClass}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Soko</span>
            </NavLink>
            <NavLink
              to="/buyer/orders"
              className={navLinkClass}
            >
              <Package className="w-5 h-5" />
              <span>Order</span>
              {renderBubble(orderCount)}
            </NavLink>
            <NavLink
              to="/buyer/cart"
              className={navLinkClass}
            >
              <ShoppingBasket className="w-5 h-5" />
              <span>Cart</span>
            </NavLink>
            <NavLink
              to="/buyer/live"
              className={navLinkClass}
            >
              <Radio className="w-5 h-5" />
              <span>Live</span>
              {renderBubble(liveCount)}
            </NavLink>
            <UserMenu username={username} onLogout={onLogout} />
          </div>

          <button className="md:hidden p-2" aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default BuyerNavbar
