import { Link } from 'react-router-dom'
import { Fish, Menu, ShoppingCart } from 'lucide-react'
import UserMenu from '@/components/UserMenu'

interface BuyerNavbarProps {
  username: string
  onLogout: () => void
}

const BuyerNavbar = ({ username, onLogout }: BuyerNavbarProps) => {
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
            <Link
              to="/buyer"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-ocean-50 text-ocean-700 font-medium transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Soko</span>
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
