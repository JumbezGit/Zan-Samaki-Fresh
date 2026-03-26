import { Activity, Clock3, Radio, Waves } from 'lucide-react'

const liveFeed = [
  {
    id: 1,
    title: 'Dagaa mpya zimewasili kutoka Stone Town',
    time: 'Dakika 2 zilizopita',
    detail: 'Samaki 120kg zimeongezwa sokoni na ziko tayari kuuzwa.',
  },
  {
    id: 2,
    title: 'Mvuvi mpya yuko live kutoka Nungwi',
    time: 'Dakika 7 zilizopita',
    detail: 'Anaonyesha mzigo wa leo na bei za mwanzo kwa wanunuzi.',
  },
  {
    id: 3,
    title: 'Order yako ORD-201 imeanza kusafirishwa',
    time: 'Dakika 11 zilizopita',
    detail: 'Dereva yuko njiani na muda wa kufika umesasishwa.',
  },
]

const BuyerLivePage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ocean-700 via-cyan-700 to-emerald-600 text-white p-8 md:p-10 shadow-2xl mb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%)]" />
        <div className="relative">
          <p className="uppercase tracking-[0.25em] text-sm text-cyan-100 mb-3">Live Buyer Feed</p>
          <h1 className="text-4xl md:text-5xl font-bold flex items-center gap-3 mb-4">
            <Radio className="w-10 h-10" />
            <span>Live Market</span>
          </h1>
          <p className="text-lg text-cyan-50 max-w-2xl">
            Ona mabadiliko ya soko kwa muda halisi, taarifa za oda, na samaki wapya wanaowasili.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-5">
          {liveFeed.map((item) => (
            <div
              key={item.id}
              className="bg-white/75 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-2xl font-bold text-gray-900">{item.title}</h2>
                <span className="shrink-0 flex items-center gap-2 text-sm text-ocean-700 font-semibold">
                  <Clock3 className="w-4 h-4" />
                  {item.time}
                </span>
              </div>
              <p className="text-gray-600 leading-7">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/75 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6 h-fit">
          <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            Muda Halisi
          </h2>

          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm text-emerald-700 font-semibold mb-1">Listings mpya leo</p>
              <p className="text-3xl font-bold text-emerald-900">18</p>
            </div>
            <div className="rounded-2xl bg-cyan-50 p-5">
              <p className="text-sm text-cyan-700 font-semibold mb-1">Wavuvi walio live</p>
              <p className="text-3xl font-bold text-cyan-900">6</p>
            </div>
            <div className="rounded-2xl bg-ocean-50 p-5">
              <p className="text-sm text-ocean-700 font-semibold mb-1">Oda zinazotumwa</p>
              <p className="text-3xl font-bold text-ocean-900">9</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-gradient-to-r from-ocean-600 to-cyan-600 p-5 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Waves className="w-5 h-5" />
              <p className="font-semibold">Soko linaendelea vizuri</p>
            </div>
            <p className="text-sm text-cyan-50">
              Taarifa hizi ni za mwonekano wa buyer live page na zinaweza kuunganishwa na data halisi baadaye.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyerLivePage
