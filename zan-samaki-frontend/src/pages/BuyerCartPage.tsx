import { CreditCard, ShoppingBasket, Trash2 } from 'lucide-react'

const cartItems = [
  {
    id: 1,
    name: 'Dagaa Fresh',
    quantity: '5 kg',
    price: 'TZS 18,000',
  },
  {
    id: 2,
    name: 'Pweza',
    quantity: '2 kg',
    price: 'TZS 24,000',
  },
]

const BuyerCartPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <ShoppingBasket className="w-10 h-10 text-ocean-600" />
            <span>Cart Yangu</span>
          </h1>
          <p className="text-gray-600 mt-3">Bidhaa ulizochagua kabla ya kuendelea na malipo.</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-700">Jumla</p>
          <p className="text-2xl font-bold text-emerald-900">TZS 42,000</p>
        </div>
      </div>

      <div className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-white/50 bg-white/75 p-6 shadow-lg"
          >
            <div>
              <h2 className="text-2xl font-bold">{item.name}</h2>
              <p className="text-gray-600 mt-1">{item.quantity}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold text-ocean-700">{item.price}</p>
              <button
                type="button"
                className="rounded-xl border border-red-200 p-3 text-red-600 transition-all hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-ocean-600 px-6 py-3 font-semibold text-white transition-all hover:bg-ocean-700"
      >
        <CreditCard className="w-5 h-5" />
        Endelea Kulipa
      </button>
    </div>
  )
}

export default BuyerCartPage
