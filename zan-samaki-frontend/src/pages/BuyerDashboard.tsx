import { useEffect, useState } from 'react'
import { Check, Download, Fish, Phone, Printer, ShoppingCart, X } from 'lucide-react'
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

const formatReceiptNumber = (reference: string) => {
  if (reference.startsWith('INV-')) {
    return reference.replace(/^INV-/, 'RCT-')
  }

  if (reference.startsWith('RCT-')) {
    return reference
  }

  return `RCT-${reference}`
}

const getReceiptStatusLabel = (status: string) => {
  const normalizedStatus = status.trim().toLowerCase()

  if (normalizedStatus === 'completed' || normalizedStatus === 'paid') {
    return 'Paid'
  }

  return status
}

const buildReceiptPayload = (currentInvoice: PurchaseInvoice) => [
  `Receipt: ${formatReceiptNumber(currentInvoice.invoice_number)}`,
  `Buyer: ${currentInvoice.buyer_name}`,
  `Fisher: ${currentInvoice.fisher_name}`,
  `Fish: ${currentInvoice.fish_title}`,
  `Payment: ${currentInvoice.payment_method}`,
  `Quantity: ${currentInvoice.quantity} kg`,
  `Total: TZS ${Number(currentInvoice.total_price).toLocaleString()}`,
  `Status: ${getReceiptStatusLabel(currentInvoice.status)}`
].join('\n')

const getReceiptQrUrl = (currentInvoice: PurchaseInvoice) => {
  const payload = encodeURIComponent(buildReceiptPayload(currentInvoice))
  return `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${payload}`
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('Image load failed'))
  image.src = src
})

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
        toast.success('Umenunua! Receipt imetengenezwa.')
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
  const availableCatches = catches.filter((catchItem) => catchItem.quantity > 0)
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

  const receiptNumber = invoice ? formatReceiptNumber(invoice.invoice_number) : ''
  const receiptQrUrl = invoice ? getReceiptQrUrl(invoice) : ''

  const getInvoiceHtml = (currentInvoice: PurchaseInvoice) => `
    <html>
      <head>
        <title>Receipt ${formatReceiptNumber(currentInvoice.invoice_number)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
          h1 { margin-bottom: 8px; }
          .muted { color: #64748b; margin-bottom: 24px; }
          .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; gap: 16px; }
          .label { color: #64748b; }
          .value { font-weight: 700; }
          .total { font-size: 20px; color: #047857; }
          .qr { border: 1px solid #cbd5e1; border-radius: 12px; padding: 8px; background: #ffffff; }
          .qr img { display: block; width: 96px; height: 96px; }
        </style>
      </head>
      <body>
        <h1>Receipt ${formatReceiptNumber(currentInvoice.invoice_number)}</h1>
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
        <div class="qr">
          <img src="${getReceiptQrUrl(currentInvoice)}" alt="Receipt QR code" />
        </div>
      </body>
    </html>
  `

  const printInvoice = (currentInvoice: PurchaseInvoice) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      toast.error('Imeshindikana kufungua print window')
      return
    }

    printWindow.document.write(getInvoiceHtml(currentInvoice))
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const downloadInvoice = async (currentInvoice: PurchaseInvoice) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1748
      canvas.height = 2480
      const context = canvas.getContext('2d')

      if (!context) {
        toast.error('Imeshindikana kutengeneza receipt image')
        return
      }

      context.fillStyle = '#f8fafc'
      context.fillRect(0, 0, canvas.width, canvas.height)

      context.fillStyle = '#ffffff'
      context.fillRect(80, 80, canvas.width - 160, canvas.height - 160)

      const receiptNumber = formatReceiptNumber(currentInvoice.invoice_number)
      const qrImage = await loadImage(getReceiptQrUrl(currentInvoice))
      const details: Array<[string, string]> = [
        ['Buyer', currentInvoice.buyer_name],
        ['Mvuvi', currentInvoice.fisher_name],
        ['Samaki', currentInvoice.fish_title],
        ['Aina', currentInvoice.fish_type],
        ['Mahali', currentInvoice.location],
        ['Malipo', currentInvoice.payment_method],
        ['Kiasi', `${currentInvoice.quantity} kg`],
        ['Bei kwa kilo', `TZS ${Number(currentInvoice.price_per_kg).toLocaleString()}`],
        ['Jumla', `TZS ${Number(currentInvoice.total_price).toLocaleString()}`],
        ['Status', getReceiptStatusLabel(currentInvoice.status)]
      ]

      context.fillStyle = '#0f172a'
      context.font = 'bold 64px Arial'
      context.fillText('Receipt', 140, 200)
      context.font = 'bold 46px Arial'
      context.fillText(receiptNumber, 140, 270)
      context.fillStyle = '#64748b'
      context.font = '32px Arial'
      context.fillText(`Imekamilika: ${new Date(currentInvoice.issued_at).toLocaleString()}`, 140, 330)

      context.strokeStyle = '#e2e8f0'
      context.lineWidth = 4
      context.strokeRect(120, 390, canvas.width - 240, 1260)

      let currentY = 470
      details.forEach(([label, value], index) => {
        context.fillStyle = '#64748b'
        context.font = '30px Arial'
        context.fillText(label, 160, currentY)
        context.fillStyle = label === 'Jumla' ? '#047857' : '#0f172a'
        context.font = label === 'Jumla' ? 'bold 40px Arial' : 'bold 34px Arial'
        context.fillText(value, 700, currentY)

        if (index < details.length - 1) {
          context.strokeStyle = '#e2e8f0'
          context.lineWidth = 2
          context.beginPath()
          context.moveTo(160, currentY + 28)
          context.lineTo(canvas.width - 160, currentY + 28)
          context.stroke()
        }

        currentY += 110
      })

      context.strokeStyle = '#cbd5e1'
      context.lineWidth = 3
      context.strokeRect((canvas.width - 360) / 2, 1740, 360, 360)
      context.drawImage(qrImage, (canvas.width - 280) / 2, 1780, 280, 280)

      context.fillStyle = '#475569'
      context.font = '28px Arial'
      context.textAlign = 'center'
      context.fillText('Scan for payment details', canvas.width / 2, 2150)
      context.textAlign = 'start'

      const imageUrl = canvas.toDataURL('image/jpeg', 0.92)
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `${receiptNumber}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast.error('Imeshindikana kudownload receipt JPG')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="text-2xl font-bold text-emerald-600">
          {availableCatches.length} patokanayo
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        {availableCatches.map((catchItem) => (
          <FishCard key={catchItem.id} item={catchItem} onSelect={openCatchDetails} />
        ))}
      </div>

      {selectedCatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedCatch(null)}
              className="absolute right-3 top-3 rounded-full p-1.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close payment modal"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="mb-4 text-lg font-bold">{selectedCatch.title}</h2>

            <div className="mb-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ocean-500">
                  <Fish className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{selectedCatch.fish_type}</p>
                  <p className="text-xs text-gray-600">{selectedCatch.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-center">
                <div>
                  <p className="text-lg font-bold text-emerald-600">
                    TZS {selectedCatch.price_per_kg.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">bei kwa kilo</p>
                </div>
                <div className="border-l border-gray-200 pl-3">
                  <p className="text-base font-bold">{selectedCatch.quantity} kg</p>
                  <p className="text-xs text-gray-600">stock iliyopo</p>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Weka kiasi cha kilo unachotaka
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCatch.quantity}
                  step="0.5"
                  value={purchaseQuantity}
                  onChange={(event) => setPurchaseQuantity(event.target.value)}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400"
                  placeholder="Mfano 2"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-gray-700">
                  <span>Bei kwa kilo: TZS {selectedCatch.price_per_kg.toLocaleString()}</span>
                  <span>Jumla: TZS {totalPrice.toLocaleString()}</span>
                </div>
                {!isQuantityValid && (
                  <p className="mt-2 text-xs text-red-600">
                    Weka kiasi sahihi kati ya 1 na {selectedCatch.quantity} kg.
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Chagua njia ya malipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tigo_pesa')}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
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
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
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
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Simulation ya Malipo</p>
                      <p className="mt-1 text-base font-bold text-slate-900">{formatReceiptNumber(previewInvoice.invoice_number)}</p>
                    </div>
                    <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                      {previewInvoice.status}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-700">
                    <p>Jumla: <span className="font-semibold">TZS {Number(previewInvoice.total_price).toLocaleString()}</span></p>
                    <p>Malipo: <span className="font-semibold">{previewInvoice.payment_method}</span></p>
                    <p>Kiasi kitakachobaki: <span className="font-semibold">{paymentPreview.remaining_quantity} kg</span></p>
                    <p className="text-blue-700">{paymentPreview.message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 flex flex-col gap-2 rounded-xl bg-blue-50 p-3">
              <button className="flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700">
                <Phone className="h-4 w-4" />
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
                className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 disabled:opacity-60"
                disabled={!isQuantityValid || previewingPayment || submittingPayment}
              >
                <ShoppingCart className="mr-2 inline h-4 w-4" />
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
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60"
                disabled={!isQuantityValid || !paymentPreview || submittingPayment}
              >
                <ShoppingCart className="mr-2 inline h-4 w-4" />
                {submittingPayment ? 'Inatuma Malipo...' : `Thibitisha ${paymentMethod === 'tigo_pesa' ? 'Tigo Pesa' : 'M-Pesa'}`}
              </button>
            </div>

          </div>
        </div>
      )}

      {invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean-600">Receipt</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{receiptNumber}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Imekamilika: {new Date(invoice.issued_at).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                {getReceiptStatusLabel(invoice.status)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-xs text-slate-500">Buyer</p>
                <p className="text-sm font-semibold text-slate-900">{invoice.buyer_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Mvuvi</p>
                <p className="text-sm font-semibold text-slate-900">{invoice.fisher_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Samaki</p>
                <p className="text-sm font-semibold text-slate-900">{invoice.fish_title}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Aina</p>
                <p className="text-sm font-semibold text-slate-900">{invoice.fish_type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Mahali</p>
                <p className="text-sm font-semibold text-slate-900">{invoice.location}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Malipo</p>
                <p className="text-sm font-semibold text-slate-900">{invoice.payment_method}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-500">Kiasi</span>
                <span className="text-sm font-semibold text-slate-900">{invoice.quantity} kg</span>
              </div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-500">Bei kwa kilo</span>
                <span className="text-sm font-semibold text-slate-900">TZS {Number(invoice.price_per_kg).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-base">
                <span className="font-semibold text-slate-700">Jumla</span>
                <span className="font-bold text-emerald-700">TZS {Number(invoice.total_price).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <img
                  src={receiptQrUrl}
                  alt="Receipt QR code"
                  className="h-24 w-24 rounded-md"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => downloadInvoice(invoice)}
                type="button"
                className="rounded-xl border border-emerald-200 p-2.5 text-emerald-700 transition-all hover:bg-emerald-50"
                aria-label="Download receipt"
                title="Download receipt"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => printInvoice(invoice)}
                type="button"
                className="rounded-xl border border-ocean-200 p-2.5 text-ocean-700 transition-all hover:bg-ocean-50"
                aria-label="Print receipt"
                title="Print receipt"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={() => setInvoice(null)}
                type="button"
                className="rounded-xl bg-ocean-600 p-2.5 text-white transition-all hover:bg-ocean-700"
                aria-label="Close receipt"
                title="Close receipt"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BuyerDashboard
