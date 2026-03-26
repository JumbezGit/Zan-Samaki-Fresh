import { useEffect, useState } from 'react'
import { Fish, ShoppingCart, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import FishCard, { type FishCardItem } from '@/components/FishCard'

type Catch = FishCardItem

interface PurchaseInvoice {
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
  remaining_quantity: string
  catch_status: string
}

type PaymentMethod = 'tigo_pesa' | 'mpesa'

const BuyerDashboard = () => {
  const [searchParams] = useSearchParams()
  const [catches, setCatches] = useState<Catch[]>([])
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedCatch, setSelectedCatch] = useState<Catch | null>(null)
  const [purchaseQuantity, setPurchaseQuantity] = useState('1')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tigo_pesa')
  const [paymentPreview, setPaymentPreview] = useState<PaymentSimulation | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<PurchaseInvoice | null>(null)
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null)
  const [previewingPayment, setPreviewingPayment] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)

  useEffect(() => {
    setSearch(searchParams.get('search') || '')
  }, [searchParams])

  const fetchCatches = async (activeSearch = search) => {
    try {
      const token = localStorage.getItem('token')
      const url = new URL('/api/catches/', window.location.origin)
      const params = new URLSearchParams()

      if (activeSearch) {
        params.append('search', activeSearch)
      }

      url.search = params.toString()

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      setCatches(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error('Tatizo la kupakia soko')
    }
  }

  useEffect(() => {
    void fetchCatches(search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const buyCatch = async (catchId: number, quantity: number, selectedPaymentMethod: PaymentMethod) => {
    try {
      setSubmittingPayment(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/catches/${catchId}/buy/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity,
          payment_method: selectedPaymentMethod
        })
      })

      if (res.ok) {
        const data = await res.json()
        setInvoice(data.invoice ?? null)
        toast.success('Umenunua! Invoice imetengenezwa.')
        void fetchCatches()
        setSelectedCatch(null)
        setPaymentPreview(null)
        setPreviewInvoice(null)
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.detail || 'Kosa la kununua')
      }
    } catch (err) {
      toast.error('Kosa la kununua')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const openCatchDetails = (catchItem: Catch) => {
    setSelectedCatch(catchItem)
    setPurchaseQuantity('1')
    setPaymentMethod('tigo_pesa')
    setPaymentPreview(null)
    setPreviewInvoice(null)
  }

  const simulatePayment = async (catchId: number, quantity: number, selectedPaymentMethod: PaymentMethod) => {
    try {
      setPreviewingPayment(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/catches/${catchId}/buy-preview/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity,
          payment_method: selectedPaymentMethod
        })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.detail || 'Simulation ya malipo imeshindikana')
        return
      }

      setPaymentPreview(data?.simulation ?? null)
      setPreviewInvoice(data?.invoice ?? null)
      toast.success('Simulation ya malipo imekamilika. Thibitisha sasa.')
    } catch (err) {
      toast.error('Simulation ya malipo imeshindikana')
    } finally {
      setPreviewingPayment(false)
    }
  }

  const parsedPurchaseQuantity = Number(purchaseQuantity)
  const isQuantityValid = Boolean(
    selectedCatch &&
    Number.isFinite(parsedPurchaseQuantity) &&
    parsedPurchaseQuantity > 0 &&
    parsedPurchaseQuantity <= selectedCatch.quantity
  )
  const totalPrice = selectedCatch && isQuantityValid
    ? parsedPurchaseQuantity * selectedCatch.price_per_kg
    : 0

  useEffect(() => {
    setPaymentPreview(null)
    setPreviewInvoice(null)
  }, [purchaseQuantity, paymentMethod, selectedCatch?.id])

  const printInvoice = (currentInvoice: PurchaseInvoice) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      toast.error('Imeshindikana kufungua print window')
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${currentInvoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1 { margin-bottom: 8px; }
            .muted { color: #64748b; margin-bottom: 24px; }
            .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; gap: 16px; }
            .label { color: #64748b; }
            .value { font-weight: 700; }
            .total { font-size: 20px; color: #047857; }
          </style>
        </head>
        <body>
          <h1>${currentInvoice.invoice_number}</h1>
          <p class="muted">Imekamilika: ${new Date(currentInvoice.issued_at).toLocaleString()}</p>
          <div class="card">
            <div class="row"><span class="label">Buyer</span><span class="value">${currentInvoice.buyer_name}</span></div>
            <div class="row"><span class="label">Mvuvi</span><span class="value">${currentInvoice.fisher_name}</span></div>
            <div class="row"><span class="label">Samaki</span><span class="value">${currentInvoice.fish_title}</span></div>
            <div class="row"><span class="label">Aina</span><span class="value">${currentInvoice.fish_type}</span></div>
            <div class="row"><span class="label">Mahali</span><span class="value">${currentInvoice.location}</span></div>
            <div class="row"><span class="label">Malipo</span><span class="value">${currentInvoice.payment_method}</span></div>
          </div>
          <div class="card">
            <div class="row"><span class="label">Kiasi</span><span class="value">${currentInvoice.quantity} kg</span></div>
            <div class="row"><span class="label">Bei kwa kilo</span><span class="value">TZS ${Number(currentInvoice.price_per_kg).toLocaleString()}</span></div>
            <div class="row"><span class="label total">Jumla</span><span class="value total">TZS ${Number(currentInvoice.total_price).toLocaleString()}</span></div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  useEffect(() => {
    if (invoice) {
      window.setTimeout(() => {
        printInvoice(invoice)
      }, 250)
    }
  }, [invoice])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="text-2xl font-bold text-emerald-600">
          {catches.length} patokanayo
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {catches.map((catchItem) => (
          <FishCard key={catchItem.id} item={catchItem} onSelect={openCatchDetails} />
        ))}
      </div>

      {selectedCatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">{selectedCatch.title}</h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-ocean-500 rounded-xl flex items-center justify-center">
                  <Fish className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">{selectedCatch.fish_type}</p>
                  <p className="text-gray-600">{selectedCatch.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center p-6 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    TZS {selectedCatch.price_per_kg.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">bei kwa kilo</p>
                </div>
                <div className="border-l border-gray-200 pl-6">
                  <p className="text-xl font-bold">{selectedCatch.quantity} kg</p>
                  <p className="text-sm text-gray-600">stock iliyopo</p>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Weka kiasi cha kilo unachotaka
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCatch.quantity}
                  step="0.5"
                  value={purchaseQuantity}
                  onChange={(event) => setPurchaseQuantity(event.target.value)}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 focus:ring-2 focus:ring-emerald-400"
                  placeholder="Mfano 2"
                />
                <div className="mt-3 flex items-center justify-between text-sm text-gray-700">
                  <span>Bei kwa kilo: TZS {selectedCatch.price_per_kg.toLocaleString()}</span>
                  <span>Jumla: TZS {totalPrice.toLocaleString()}</span>
                </div>
                {!isQuantityValid && (
                  <p className="mt-2 text-sm text-red-600">
                    Weka kiasi sahihi kati ya 1 na {selectedCatch.quantity} kg.
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chagua njia ya malipo
                </label>
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
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Simulation ya Malipo</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{previewInvoice.invoice_number}</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                      {previewInvoice.status}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <p>Jumla: <span className="font-semibold">TZS {Number(previewInvoice.total_price).toLocaleString()}</span></p>
                    <p>Malipo: <span className="font-semibold">{previewInvoice.payment_method}</span></p>
                    <p>Kiasi kitakachobaki: <span className="font-semibold">{paymentPreview.remaining_quantity} kg</span></p>
                    <p className="text-blue-700">{paymentPreview.message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8 p-4 bg-blue-50 rounded-xl">
              <button className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700">
                <Phone className="w-5 h-5" />
                <span>Piga Mvuvi</span>
              </button>
              <button
                onClick={() => {
                  if (!isQuantityValid) {
                    toast.error('Weka kiasi sahihi cha kilo')
                    return
                  }
                  void simulatePayment(selectedCatch.id, parsedPurchaseQuantity, paymentMethod)
                }}
                className="flex-1 rounded-xl border border-emerald-200 bg-white py-3 px-4 font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 disabled:opacity-60"
                disabled={!isQuantityValid || previewingPayment || submittingPayment}
              >
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                {previewingPayment ? 'Inasimulate...' : 'Simulate Payment'}
              </button>
              <button
                onClick={() => {
                  if (!isQuantityValid) {
                    toast.error('Weka kiasi sahihi cha kilo')
                    return
                  }
                  if (!paymentPreview || !previewInvoice) {
                    toast.error('Fanya simulation ya malipo kwanza')
                    return
                  }
                  void buyCatch(selectedCatch.id, parsedPurchaseQuantity, paymentMethod)
                }}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                disabled={!isQuantityValid || !paymentPreview || submittingPayment}
              >
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                {submittingPayment ? 'Inatuma Malipo...' : `Thibitisha ${paymentMethod === 'tigo_pesa' ? 'Tigo Pesa' : 'M-Pesa'}`}
              </button>
            </div>

            <button
              onClick={() => setSelectedCatch(null)}
              className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Funga
            </button>
          </div>
        </div>
      )}

      {invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Invoice</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">{invoice.invoice_number}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Imekamilika: {new Date(invoice.issued_at).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                {invoice.status}
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Buyer</p>
                <p className="font-semibold text-slate-900">{invoice.buyer_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mvuvi</p>
                <p className="font-semibold text-slate-900">{invoice.fisher_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Samaki</p>
                <p className="font-semibold text-slate-900">{invoice.fish_title}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Aina</p>
                <p className="font-semibold text-slate-900">{invoice.fish_type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mahali</p>
                <p className="font-semibold text-slate-900">{invoice.location}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Malipo</p>
                <p className="font-semibold text-slate-900">{invoice.payment_method}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-slate-500">Kiasi</span>
                <span className="font-semibold text-slate-900">{invoice.quantity} kg</span>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-slate-500">Bei kwa kilo</span>
                <span className="font-semibold text-slate-900">TZS {Number(invoice.price_per_kg).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg">
                <span className="font-semibold text-slate-700">Jumla</span>
                <span className="font-bold text-emerald-700">TZS {Number(invoice.total_price).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => printInvoice(invoice)}
                className="flex-1 rounded-xl border border-ocean-200 px-6 py-3 font-semibold text-ocean-700 transition-all hover:bg-ocean-50"
              >
                Print Invoice
              </button>
              <button
                onClick={() => setInvoice(null)}
                className="flex-1 rounded-xl bg-ocean-600 px-6 py-3 font-semibold text-white transition-all hover:bg-ocean-700"
              >
                Funga Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BuyerDashboard
