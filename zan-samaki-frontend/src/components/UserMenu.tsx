import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LogOut, Settings, User } from 'lucide-react'

interface UserMenuProps {
  username: string
  onLogout: () => void
}

const UserMenu = ({ username, onLogout }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center space-x-3 rounded-xl px-2 py-2 transition-all hover:bg-ocean-50"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open user menu"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean-600">
          <User className="h-4 w-4 text-white" />
        </div>
        <span className="font-medium text-gray-700">{username}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-2xl"
          role="menu"
        >
          <div className="border-b border-ocean-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Account</p>
            <p className="truncate font-semibold text-gray-800">{username}</p>
          </div>
          <div className="p-2">
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center space-x-3 rounded-xl px-3 py-2 text-gray-700 transition-colors hover:bg-ocean-50 hover:text-ocean-700"
              role="menuitem"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onLogout()
              }}
              className="flex w-full items-center space-x-3 rounded-xl px-3 py-2 text-red-600 transition-colors hover:bg-red-50"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu
