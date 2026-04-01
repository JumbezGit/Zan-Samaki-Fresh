import { Link } from 'react-router-dom'
import { Menu, Shield } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import UserMenu from '@/components/UserMenu'

interface AdminNavbarProps {
  username: string
  onLogout: () => void
  onOpenSidebar: () => void
}

const AdminNavbar = ({ username, onLogout, onOpenSidebar }: AdminNavbarProps) => {
  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-ocean-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <BrandLogo />

          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/admin"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-ocean-50 text-ocean-700 font-medium transition-all"
            >
              <Shield className="w-5 h-5" />
              <span>Admin</span>
            </Link>
            <UserMenu username={username} onLogout={onLogout} />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <UserMenu username={username} onLogout={onLogout} compact />
            <button onClick={onOpenSidebar} className="p-2" aria-label="Open menu">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default AdminNavbar
