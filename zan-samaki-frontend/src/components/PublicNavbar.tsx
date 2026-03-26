import { Menu } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'

type UserRole = 'fisher' | 'buyer' | 'admin'

interface PublicNavbarProps {
  onLogin: (role: UserRole) => void
}

const PublicNavbar = ({ onLogin }: PublicNavbarProps) => {
  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-ocean-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <BrandLogo />



          <button className="md:hidden p-2" aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default PublicNavbar
