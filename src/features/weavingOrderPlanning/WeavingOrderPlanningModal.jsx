import { useEffect } from 'react'

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 })
}

function WeavingOrderPlanningModal({ order, isLoading, error, onClose, onOpenProductionPlanning }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isLoading, onClose])

  if (!order && !isLoading && !error) {
    return null
  }

  const details = Array.isArray(order?.details) ? order.details : []

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:p-5" role="dialog" aria-modal="true" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
      <section className="relative w-full max-w-6xl overflow-hidden rounded-2xl bg-white text-left shadow-[0_24px_50px_rgba(15,23,42,0.18)] ring-1 ring-slate-200" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-100 via-emerald-50 to-sky-50 px-4 py-3 sm:px-5">
          <div>
            <h4 className="text-sm font-semibold text-emerald-900">DOKUMA SİPARİŞİ PLANLAMA</h4>
          </div>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" onClick={onClose} aria-label="Kapat">×</button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto p-3 text-left sm:p-5" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
          {isLoading ? <p className="py-10 text-center text-sm text-slate-500">Dokuma siparişi yükleniyor...</p> : null}
          {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

          {order ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-2 text-xs"><span className="block text-[10px] text-slate-500">ÖRGÜ İŞ EMRİ</span><strong className="text-xs">{order.name || '-'}</strong></div>
                <div className="rounded-lg bg-slate-50 p-2 text-xs"><span className="block text-[10px] text-slate-500">Tarih</span><strong className="text-xs">{order.date || '-'}</strong></div>
                <div className="rounded-lg bg-slate-50 p-2 text-xs"><span className="block text-[10px] text-slate-500">Durum</span><strong className="text-xs">{order.weavingOrderStatusName || '-'}</strong></div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <h5 className="text-xs font-semibold text-slate-800">Kumaş detayları</h5>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">{details.length} ürün</span>
              </div>

              <div className="mt-1.5 space-y-2">
                {details.length === 0 ? <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Bu siparişe ait kumaş bulunamadı.</p> : details.map((detail, index) => {
                  const yarnDetails = Array.isArray(detail.yarnDetails) ? detail.yarnDetails : []
                  return (
                    <div key={detail.id ?? index} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
                        <table className="w-full min-w-[620px] text-left text-[10px]" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <th className="w-32 bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-500">Kumaş cinsi</th>
                              <td className="px-2 py-1.5 font-medium text-slate-900">{detail.fabricGender || '-'}</td>
                              <th className="w-32 bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-500">Fabrika</th>
                              <td className="px-2 py-1.5 font-medium text-slate-900">{detail.factoryName || detail.factoryId || '-'}</td>
                            </tr>
                            <tr>
                              <th className="bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-500">GR / Pus / Fain</th>
                              <td className="px-2 py-1.5 text-slate-900">{detail.fabricGr ?? '-'} / {detail.pus ?? '-'} / {detail.fain ?? '-'}</td>
                              <th className="bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-500">Fiyat</th>
                              <td className="px-2 py-1.5 text-slate-900">{formatNumber(detail.price)}</td>
                            </tr>
                            <tr>
                              <th className="bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-500">Gerekli ağırlık</th>
                              <td className="px-2 py-1.5 text-slate-900">{formatNumber(detail.requiredWeight)}</td>
                              <th className="bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-500">Üretilen ağırlık</th>
                              <td className="px-2 py-1.5 text-slate-900">{formatNumber(detail.producedWeight)}</td>
                            </tr>
                            <tr>
                              <th className="bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-500">Kalan ağırlık</th>
                              <td className="px-2 py-1.5 text-slate-900">{formatNumber(detail.remainingWeight)}</td>
                              <th className="bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-500">İlerleme</th>
                              <td className="px-2 py-1.5 text-slate-900">{formatNumber(detail.progressPercent)}%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-2 overflow-x-auto rounded-md border border-slate-200 bg-white">
                        <table className="w-full min-w-[520px] text-left text-[10px]" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                          <thead className="bg-slate-100 text-slate-600"><tr><th className="px-2 py-1.5 text-left">Yarn Cinsi</th><th className="px-2 py-1.5 text-left">İplik Uzunu</th><th className="px-2 py-1.5 text-left">%</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">
                            {yarnDetails.length ? yarnDetails.map((yarn, yarnIndex) => <tr key={yarn.id ?? yarnIndex}><td className="px-2 py-1.5 text-left">{yarn.yarnGender || '-'}</td><td className="px-2 py-1.5 text-left">{yarn.iplikUzun ?? '-'}</td><td className="px-2 py-1.5 text-left">{yarn.percentage ?? '-'}%</td></tr>) : <tr><td colSpan={3} className="px-2 py-1.5 text-center text-slate-500">İplik detayı bulunamadı.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : null}
        </div>

        <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          <button
            type="button"
            className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onOpenProductionPlanning}
            disabled={isLoading || !order}
          >
            Üretim Planı Ekle
          </button>
        </footer>
      </section>
    </div>
  )
}

export default WeavingOrderPlanningModal
