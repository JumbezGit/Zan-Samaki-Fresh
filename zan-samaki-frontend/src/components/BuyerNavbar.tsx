import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Fish, Menu, Package, Radio, Search, ShoppingCart } from 'lucide-react'
import UserMenu from '@/components/UserMenu'

interface BuyerNavbarProps {
  username: string
  onLogout: () => void
}

const BuyerNavbar = ({ username, onLogout }: BuyerNavbarProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams()

    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    }

    navigate(`/buyer${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-ocean-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Fish className="w-8 h-8 text-ocean-600" />
            <span className="font-bold text-xl bg-gradient-to-r from-ocean-600 to-blue-600 bg-clip-text text-transparent">
              ZanSamaki
            </span>
          </Link>

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
            <Link
              to="/buyer"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-ocean-50 text-ocean-700 font-medium transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Soko</span>
            </Link>
            <Link
              to="/buyer/orders"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:text-ocean-600 hover:bg-ocean-50 font-medium transition-all"
            >
              <Package className="w-5 h-5" />
              <span>Order</span>
            </Link>
            <Link
              to="/buyer/live"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:text-ocean-600 hover:bg-ocean-50 font-medium transition-all"
            >
              <Radio className="w-5 h-5" />
              <span>Live</span>
            </Link>
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
