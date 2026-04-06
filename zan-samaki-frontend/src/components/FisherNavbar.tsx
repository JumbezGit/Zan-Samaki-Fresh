import { Link } from 'react-router-dom'
import { Fish, Menu } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import UserMenu from '@/components/UserMenu'
import { useLanguage } from '@/context/LanguageContext'

interface FisherNavbarProps {
  username: string
  onLogout: () => void
  onOpenSidebar: () => void
}

const FisherNavbar = ({ username, onLogout, onOpenSidebar }: FisherNavbarProps) => {
  const { language } = useLanguage()
  const copy = language === 'en'
    ? {
      dashboard: 'Fisher Dashboard',
      openMenu: 'Open menu'
    }
    : {
      dashboard: 'Dashibodi ya Mvuvi',
      openMenu: 'Fungua menu'
    }

  return (
    <>
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
                <span>{copy.dashboard}</span>
              </Link>
              <UserMenu username={username} onLogout={onLogout} />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <UserMenu username={username} onLogout={onLogout} compact />
              <button
                type="button"
                onClick={onOpenSidebar}
                className="rounded-xl p-2 text-slate-700 transition hover:bg-ocean-50"
                aria-label={copy.openMenu}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default FisherNavbar
