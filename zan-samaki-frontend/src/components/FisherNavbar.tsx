import { Link } from 'react-router-dom'
import { Fish } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import UserMenu from '@/components/UserMenu'

interface FisherNavbarProps {
  username: string
  onLogout: () => void
}

const FisherNavbar = ({ username, onLogout }: FisherNavbarProps) => {
  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-ocean-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <BrandLogo />

          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/fisher"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-ocean-50 text-ocean-700 font-medium transition-all"
            >
              <Fish className="w-5 h-5" />
              <span>Dashibodi ya Mvuvi</span>
            </Link>
            <UserMenu username={username} onLogout={onLogout} />
          </div>

          <div className="md:hidden">
            <UserMenu username={username} onLogout={onLogout} compact />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default FisherNavbar
