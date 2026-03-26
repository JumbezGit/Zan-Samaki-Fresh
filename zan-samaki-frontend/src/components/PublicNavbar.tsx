import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import BrandLogo from '@/components/BrandLogo'

type UserRole = 'fisher' | 'buyer' | 'admin'

interface PublicNavbarProps {
  onLogin: (role: UserRole) => void
}

const PublicNavbar = ({ onLogin }: PublicNavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeRole, setActiveRole] = useState<UserRole>('fisher')

  const mobileButtonClass = (role: UserRole) =>
    `rounded-xl px-4 py-3 text-left font-semibold transition-all ${
      activeRole === role
        ? 'bg-ocean-600 text-white shadow-lg'
        : 'border border-ocean-200 bg-white text-ocean-700 hover:bg-ocean-50'
    }`

  const handleMobileRole = (role: UserRole) => {
    setActiveRole(role)
    setMobileMenuOpen(false)
    onLogin(role)
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-ocean-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <BrandLogo />

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => onLogin('fisher')}
              className="rounded-xl border border-ocean-200 px-4 py-2 font-semibold text-ocean-700 transition-all hover:bg-ocean-50"
            >
              Mvuvi Ingia
            </button>
            <button
              onClick={() => onLogin('buyer')}
              className="rounded-xl border border-ocean-200 px-4 py-2 font-semibold text-ocean-700 transition-all hover:bg-ocean-50"
            >
              Mnunuzi Ingia
            </button>
            <button
              onClick={() => onLogin('admin')}
              className="bg-ocean-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-ocean-700 transition-all"
            >
              Admin Ingia
            </button>
          </div>

          <button
            className="md:hidden p-2"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((currentValue) => !currentValue)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-ocean-100 py-4 md:hidden">
            <div className="grid gap-3">
              <button
                onClick={() => handleMobileRole('fisher')}
                className={mobileButtonClass('fisher')}
              >
                Mvuvi Ingia
              </button>
              <button
                onClick={() => handleMobileRole('buyer')}
                className={mobileButtonClass('buyer')}
              >
                Mnunuzi Ingia
              </button>
              <button
                onClick={() => handleMobileRole('admin')}
                className={mobileButtonClass('admin')}
              >
                Admin Ingia
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default PublicNavbar
