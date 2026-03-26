import { Fish, MapPin, ShoppingCart, User } from 'lucide-react'

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
  return (
    <article
      className="group overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/80 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-sky-200 via-cyan-100 to-emerald-100">
        {item.photo ? (
          <img
            src={item.photo}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Fish className="h-24 w-24 text-white/50" />
          </div>
        )}

        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-ocean-700 shadow-sm">
          {item.fish_type}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{item.title}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>{item.location}</span>
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Stock</p>
            <p className="text-lg font-bold text-emerald-900">{item.quantity} kg</p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Bei kwa kilo</p>
          <p className="text-2xl font-bold text-ocean-700">
            TZS {item.price_per_kg.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean-100">
              <User className="h-4 w-4 text-ocean-700" />
            </div>
            <span className="font-medium">{item.user.username}</span>
          </div>

          <button
            onClick={(event) => {
              event.stopPropagation()
              onSelect(item)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
          >
            <ShoppingCart className="h-4 w-4" />
            Nunua
          </button>
        </div>
      </div>
    </article>
  )
}

export default FishCard
