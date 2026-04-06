import { Fish, MapPin, ShoppingCart, User } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export interface FishCardItem {
  id: number
  title: string
  fish_type: string
  quantity: number
  price_per_kg: number
  photo: string
  location: string
  user: {
    username: string
  }
}

interface FishCardProps {
  item: FishCardItem
  onSelect: (item: FishCardItem) => void
}

const FishCard = ({ item, onSelect }: FishCardProps) => {
  const { language } = useLanguage()
  const copy = language === 'en'
    ? {
      stock: 'Stock',
      pricePerKg: 'Price per kg',
      buy: 'Buy'
    }
    : {
      stock: 'Stock',
      pricePerKg: 'Bei kwa kilo',
      buy: 'Nunua'
    }

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/80 shadow-lg transition-all hover:-translate-y-1.5 hover:shadow-2xl"
      onClick={() => onSelect(item)}
    >
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-sky-200 via-cyan-100 to-emerald-100">
        {item.photo ? (
          <img
            src={item.photo}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Fish className="h-20 w-20 text-white/50" />
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ocean-700 shadow-sm">
          {item.fish_type}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 text-lg font-bold text-slate-900">{item.title}</h3>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>{item.location}</span>
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 px-2.5 py-1.5 text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">{copy.stock}</p>
            <p className="text-base font-bold text-emerald-900">{item.quantity} kg</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-slate-50 p-3">
          <p className="text-sm text-slate-500">{copy.pricePerKg}</p>
          <p className="text-xl font-bold text-ocean-700">
            TZS {item.price_per_kg.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-100">
              <User className="h-4 w-4 text-ocean-700" />
            </div>
            <span className="font-medium">{item.user.username}</span>
          </div>

          <button
            onClick={(event) => {
              event.stopPropagation()
              onSelect(item)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
          >
            <ShoppingCart className="h-4 w-4" />
            {copy.buy}
          </button>
        </div>
      </div>
    </article>
  )
}

export default FishCard
