import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock3, MapPin, Package, ReceiptText } from 'lucide-react'
import toast from 'react-hot-toast'

interface BuyerOrder {
  id: number
  quantity: string
  total_price: string
  payment_method: string
  status: 'pending' | 'paid' | 'delivered'
  created_at: string
  catch: {
    title: string
    location: string
  }
}

interface PaymentInvoice {
  invoice_number: string
  issued_at: string
  buyer_name: string
  fisher_name: string
  fish_title: string
  fish_type: string
  quantity: string
  price_per_kg: string
  total_price: string
  payment_method: string
  status: string
  location: string
}

interface PaymentSimulation {
  can_proceed: boolean
  message: string
  order_status: string
}

type PaymentMethod = 'tigo_pesa' | 'mpesa'

const statusLabel: Record<BuyerOrder['status'], string> = {
  pending: 'Inasubiri',
  paid: 'Imelipwa',
  delivered: 'Imekamilika',
}

const BuyerOrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<BuyerOrder | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tigo_pesa')
  const [paymentPreview, setPaymentPreview] = useState<PaymentSimulation | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<PaymentInvoice | null>(null)
  const [finalInvoice, setFinalInvoice] = useState<PaymentInvoice | null>(null)
  const [previewingPayment, setPreviewingPayment] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/orders/', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await res.json()
      const nextOrders = Array.isArray(data) ? data : []
      setOrders(nextOrders)

      const payOrderId = searchParams.get('payOrder')
      if (payOrderId) {
        const matchedOrder = nextOrders.find((item) => String(item.id) === payOrderId)
        if (matchedOrder) {
          setSelectedOrder(matchedOrder)
          setPaymentMethod((matchedOrder.payment_method as PaymentMethod) || 'tigo_pesa')
        }
      }
    } catch (error) {
      toast.error('Tatizo la kupakia orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedOrder) {
      setPaymentPreview(null)
      setPreviewInvoice(null)
    }
  }, [selectedOrder?.id, paymentMethod])

  const openOrderModal = (order: BuyerOrder) => {
    setSelectedOrder(order)
    setPaymentMethod((order.payment_method as PaymentMethod) || 'tigo_pesa')
    setPaymentPreview(null)
    setPreviewInvoice(null)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('payOrder', String(order.id))
    setSearchParams(nextParams)
  }

  const closeOrderModal = () => {
    setSelectedOrder(null)
    setPaymentPreview(null)
    setPreviewInvoice(null)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('payOrder')
    setSearchParams(nextParams)
  }

  const previewPayment = async (order: BuyerOrder) => {
    try {
      setPreviewingPayment(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/orders/${order.id}/payment-preview/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ payment_method: paymentMethod })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.detail || 'Simulation ya malipo imeshindikana')
        return
      }

      setPaymentPreview(data?.simulation ?? null)
      setPreviewInvoice(data?.invoice ?? null)
      toast.success('Simulation ya malipo iko tayari.')
    } catch {
      toast.error('Simulation ya malipo imeshindikana')
    } finally {
      setPreviewingPayment(false)
    }
  }

  const completePayment = async (order: BuyerOrder) => {
    try {
      setSubmittingPayment(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/orders/${order.id}/pay/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ payment_method: paymentMethod })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.detail || 'Imeshindikana kukamilisha malipo')
        return
      }

      setFinalInvoice(data?.invoice ?? null)
      toast.success('Malipo yamekamilika kwa order ya mnada.')
      await fetchOrders()
      closeOrderModal()
    } catch {
      toast.error('Imeshindikana kukamilisha malipo')
    } finally {
      setSubmittingPayment(false)
    }
  }

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

              <button
                onClick={() => openOrderModal(order)}
                className="px-6 py-3 rounded-xl bg-ocean-600 text-white font-semibold hover:bg-ocean-700 transition-colors"
              >
                {order.status === 'pending' ? 'Lipa Sasa' : 'Angalia Maelezo'}
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Order Payment</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">ORD-{selectedOrder.id}</h2>
              </div>
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                {statusLabel[selectedOrder.status]}
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Samaki</p>
                <p className="font-semibold text-slate-900">{selectedOrder.catch?.title || 'Samaki'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mahali</p>
                <p className="font-semibold text-slate-900">{selectedOrder.catch?.location || 'Zanzibar'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Kiasi</p>
                <p className="font-semibold text-slate-900">{selectedOrder.quantity} kg</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Jumla</p>
                <p className="font-semibold text-slate-900">TZS {Number(selectedOrder.total_price).toLocaleString()}</p>
              </div>
            </div>

            {selectedOrder.status === 'pending' && (
              <>
                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Chagua njia ya malipo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('tigo_pesa')}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                        paymentMethod === 'tigo_pesa'
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      Tigo Pesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mpesa')}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                        paymentMethod === 'mpesa'
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      M-Pesa
                    </button>
                  </div>
                </div>

                {previewInvoice && paymentPreview && (
                  <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Simulation ya Malipo</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{previewInvoice.invoice_number}</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <p>Jumla: <span className="font-semibold">TZS {Number(previewInvoice.total_price).toLocaleString()}</span></p>
                      <p>Malipo: <span className="font-semibold">{previewInvoice.payment_method}</span></p>
                      <p className="text-blue-700">{paymentPreview.message}</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void previewPayment(selectedOrder)}
                    disabled={previewingPayment || submittingPayment}
                    className="flex-1 rounded-xl border border-emerald-200 bg-white px-6 py-3 font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                  >
                    {previewingPayment ? 'Inasimulate...' : 'Simulate Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void completePayment(selectedOrder)}
                    disabled={!paymentPreview || submittingPayment}
                    className="flex-1 rounded-xl bg-ocean-600 px-6 py-3 font-semibold text-white hover:bg-ocean-700 disabled:opacity-60"
                  >
                    {submittingPayment ? 'Inakamilisha...' : 'Kamilisha Malipo'}
                  </button>
                </div>
              </>
            )}

            {selectedOrder.status !== 'pending' && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                Order hii tayari imelipwa au imekamilika.
              </div>
            )}

            <button
              type="button"
              onClick={closeOrderModal}
              className="mt-6 w-full rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Funga
            </button>
          </div>
        </div>
      )}

      {finalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Invoice</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{finalInvoice.invoice_number}</h2>
            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5">
              <p>Buyer: <span className="font-semibold">{finalInvoice.buyer_name}</span></p>
              <p>Samaki: <span className="font-semibold">{finalInvoice.fish_title}</span></p>
              <p>Malipo: <span className="font-semibold">{finalInvoice.payment_method}</span></p>
              <p>Jumla: <span className="font-semibold">TZS {Number(finalInvoice.total_price).toLocaleString()}</span></p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFinalInvoice(null)
                navigate('/buyer/orders')
              }}
              className="mt-6 w-full rounded-xl bg-ocean-600 px-6 py-3 font-semibold text-white hover:bg-ocean-700"
            >
              Funga Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BuyerOrdersPage
