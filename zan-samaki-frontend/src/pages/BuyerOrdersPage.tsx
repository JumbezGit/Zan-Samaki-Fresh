import { useEffect, useState } from 'react'
import { Clock3, MapPin, Package, ReceiptText } from 'lucide-react'
import toast from 'react-hot-toast'

interface BuyerOrder {
  id: number
  quantity: string
  total_price: string
  status: 'pending' | 'paid' | 'delivered'
  created_at: string
  catch: {
    title: string
    location: string
  }
}

const statusLabel: Record<BuyerOrder['status'], string> = {
  pending: 'Inasubiri',
  paid: 'Imelipwa',
  delivered: 'Imekamilika',
}

const BuyerOrdersPage = () => {
  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/orders/', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) {
          throw new Error('Failed to fetch orders')
        }

        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
      } catch (error) {
        toast.error('Tatizo la kupakia orders')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    void fetchOrders()
  }, [])

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

      {loading ? (
        <div className="rounded-2xl border border-white/50 bg-white/70 p-8 text-center text-gray-600 shadow-lg">
          Inapakia orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/70 p-8 text-center text-gray-600 shadow-lg">
          Bado huna order yoyote kwenye database.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6"
          >
            <div className="flex h-full flex-col justify-between gap-5">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 rounded-full bg-ocean-100 text-ocean-800 text-sm font-semibold">
                    ORD-{order.id}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold">
                    {statusLabel[order.status] || order.status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2">{order.catch?.title || 'Samaki'}</h2>
                <div className="flex flex-wrap gap-4 text-gray-600">
                  <span className="flex items-center gap-2">
                    <ReceiptText className="w-4 h-4" />
                    TZS {Number(order.total_price).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {order.catch?.location || 'Zanzibar'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4" />
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {order.quantity} kg
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
      )}
    </div>
  )
}

export default BuyerOrdersPage
