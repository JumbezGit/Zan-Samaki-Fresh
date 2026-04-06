import { Link } from 'react-router-dom'
import { Snowflake } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import UserMenu from '@/components/UserMenu'
import { useLanguage } from '@/context/LanguageContext'

interface StaffNavbarProps {
  username: string
  onLogout: () => void
}

const StaffNavbar = ({ username, onLogout }: StaffNavbarProps) => {
  const { language } = useLanguage()
  const staffLabel = language === 'en' ? 'Staff' : 'Staff'

  return (
    <nav className="sticky top-0 z-50 border-b border-ocean-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <BrandLogo />

        <div className="flex items-center space-x-4">
          <Link
            to="/staff"
            className="flex items-center space-x-2 rounded-lg bg-ocean-50 px-3 py-2 font-medium text-ocean-700 transition-all"
          >
            <Snowflake className="h-5 w-5" />
            <span>{staffLabel}</span>
          </Link>
          <UserMenu username={username} onLogout={onLogout} />
        </div>
      </div>
    </nav>
  )
}

export default StaffNavbar
