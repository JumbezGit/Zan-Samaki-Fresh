import { Link } from 'react-router-dom'
import { Package, Radio, ShoppingCart, X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

type BuyerSection = 'market' | 'orders' | 'live'

interface BuyerSidebarProps {
  activeSection: BuyerSection
  isOpen: boolean
  onClose: () => void
}

const BuyerSidebar = ({ activeSection, isOpen, onClose }: BuyerSidebarProps) => {
  const { language } = useLanguage()
  const copy = language === 'en'
    ? {
      title: 'Buyer Navigation',
      closeMenu: 'Close navigation menu',
      market: 'Market',
      orders: 'Orders',
      live: 'Live'
    }
    : {
      title: 'Urambazaji wa Mnunuzi',
      closeMenu: 'Funga menu ya urambazaji',
      market: 'Soko',
      orders: 'Order',
      live: 'Live'
    }

  const items = [
    { id: 'market' as const, label: copy.market, href: '/buyer', icon: ShoppingCart },
    { id: 'orders' as const, label: copy.orders, href: '/buyer/orders', icon: Package },
    { id: 'live' as const, label: copy.live, href: '/buyer/live', icon: Radio }
  ]

  return (
    <>
      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-label={copy.closeMenu}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-slate-200 bg-slate-950 p-6 text-white shadow-2xl lg:hidden">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">{copy.title}</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 p-2 text-slate-200 transition hover:bg-white/10"
                aria-label={copy.closeMenu}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-3">
              {items.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition ${
                      isActive ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>
        </>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-slate-200 bg-slate-950 p-6 text-white shadow-2xl lg:top-16 lg:block lg:h-[calc(100vh-4rem)]">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">{copy.title}</p>
        <nav className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition ${
                  isActive ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default BuyerSidebar 
