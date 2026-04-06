import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import BrandLogo from '@/components/BrandLogo'
import { useLanguage } from '@/context/LanguageContext'

type UserRole = 'fisher' | 'buyer' | 'staff' | 'admin'

const labels = {
  en: {
    openMenu: 'Open menu',
    fisher: 'Fisher Login',
    buyer: 'Buyer Login',
    admin: 'Admin Login',
    staff: 'Staff Login'
  },
  sw: {
    openMenu: 'Fungua menu',
    fisher: 'Mvuvi Ingia',
    buyer: 'Mnunuzi Ingia',
    admin: 'Admin Ingia',
    staff: 'Staff Ingia'
  }
} as const

interface PublicNavbarProps {
  onLogin: (role: UserRole) => void
}

const PublicNavbar = ({ onLogin }: PublicNavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeRole, setActiveRole] = useState<UserRole>('fisher')
  const { language, setLanguage } = useLanguage()
  const copy = labels[language]

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

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${language === 'en' ? 'bg-ocean-600 text-white' : 'text-slate-600 hover:bg-ocean-50'}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('sw')}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${language === 'sw' ? 'bg-ocean-600 text-white' : 'text-slate-600 hover:bg-ocean-50'}`}
            >
              SW
            </button>
          </div>

          <button
            className="md:hidden p-2"
            aria-label={copy.openMenu}
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
                {copy.fisher}
              </button>
              <button
                onClick={() => handleMobileRole('buyer')}
                className={mobileButtonClass('buyer')}
              >
                {copy.buyer}
              </button>
              <button
                onClick={() => handleMobileRole('admin')}
                className={mobileButtonClass('admin')}
              >
                {copy.admin}
              </button>
              <button
                onClick={() => handleMobileRole('staff')}
                className={mobileButtonClass('staff')}
              >
                {copy.staff}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default PublicNavbar
