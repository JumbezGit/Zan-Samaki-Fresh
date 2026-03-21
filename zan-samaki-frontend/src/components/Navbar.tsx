import { Link } from 'react-router-dom'
import { User, LogOut, Menu, Fish } from 'lucide-react'

interface NavbarProps {
  user: any
  navItems: Array<{ name: string, icon: any, href: string }>
  onLogin: () => void
  onLogout: () => void
}

const Navbar = ({ user, navItems, onLogin, onLogout }: NavbarProps) => {
  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-ocean-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Fish className="w-8 h-8 text-ocean-600" />
            <span className="font-bold text-xl bg-gradient-to-r from-ocean-600 to-blue-600 bg-clip-text text-transparent">
              ZanSamaki
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                to={item.href}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:text-ocean-600 hover:bg-ocean-50 font-medium transition-all"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-ocean-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{user.username}</span>
                <button
                  onClick={onLogout}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="bg-ocean-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-ocean-700 transition-all"
              >
                Ingia
              </button>
            )}
          </div>

          <button className="md:hidden p-2">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

