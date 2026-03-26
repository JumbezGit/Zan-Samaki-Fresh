import { Clock3, MapPin, Package, ReceiptText } from 'lucide-react'

const orders = [
  {
    id: 'ORD-201',
    fish: 'Dagaa Fresh',
    status: 'Inasafirishwa',
    amount: 'TZS 24,000',
    location: 'Stone Town',
    eta: 'Dakika 25',
  },
  {
    id: 'ORD-198',
    fish: 'Pweza',
    status: 'Imethibitishwa',
    amount: 'TZS 41,500',
    location: 'Mtoni',
    eta: 'Dakika 40',
  },
  {
    id: 'ORD-187',
    fish: "Ng'ongo",
    status: 'Imekamilika',
    amount: 'TZS 18,000',
    location: 'Nungwi',
    eta: 'Imewasili',
  },
]

const BuyerOrdersPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <p className="text-ocean-600 font-semibold mb-2">Buyer Center</p>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Package className="w-10 h-10 text-ocean-600" />
            <span>Orders Zangu</span>
          </h1>
          <p className="text-gray-600 mt-3 max-w-2xl">
            Fuatilia oda zako, hali ya usafirishaji, na muda wa kufika kwa urahisi.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg px-6 py-4">
          <p className="text-sm text-gray-500">Jumla ya orders</p>
          <p className="text-3xl font-bold text-emerald-600">{orders.length}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 rounded-full bg-ocean-100 text-ocean-800 text-sm font-semibold">
                    {order.id}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold">
                    {order.status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2">{order.fish}</h2>
                <div className="flex flex-wrap gap-4 text-gray-600">
                  <span className="flex items-center gap-2">
                    <ReceiptText className="w-4 h-4" />
                    {order.amount}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {order.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4" />
                    {order.eta}
                  </span>
                </div>
              </div>

              <button className="px-6 py-3 rounded-xl bg-ocean-600 text-white font-semibold hover:bg-ocean-700 transition-colors">
                Angalia Maelezo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BuyerOrdersPage
