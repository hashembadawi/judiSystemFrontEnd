
import { useEffect } from 'react'

function BoyaliSiparisDetailsModal({ isOpen, isLoading, error, order, details, onClose, onDetailClick }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" dir="ltr" style={{ direction: 'ltr' }}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative flex min-h-full items-start justify-center p-0 pt-4 sm:p-4 sm:pt-8">
        <section className="w-full max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200 sm:max-w-5xl" dir="ltr" style={{ direction: 'ltr', maxWidth: '95vw' }}>
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
            <h4 className="text-xl font-semibold text-slate-900 text-left">{order?.orderNo || 'تفاصيل الطلبية'}</h4>
            <button
              type="button"
              className="text-2xl leading-none text-slate-400 transition hover:text-slate-600"
              onClick={onClose}
              aria-label="Kapat"
            >
              ×
            </button>
          </header>

          <div className="px-4 py-5 sm:px-6">
            {isLoading ? <p className="py-8 text-center text-slate-500">Detaylar yükleniyor...</p> : null}

            {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 text-left">{error}</div> : null}

            {!isLoading && !error ? (
              details.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[900px] text-left text-sm" dir="ltr" style={{ direction: 'ltr', borderCollapse: 'collapse' }}>
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-600">Etiket Başlığı</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-600">Kumaş Cinsi</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-600">En</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-600">Gr</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-600">Renk</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-600">Renk Kodu</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-600">Sipariş Miktarı</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-600">Fiyat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {details.map((detail, index) => (
                        <tr
                          key={detail.id ?? index}
                          className={detail.id && onDetailClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50'}
                          onClick={() => onDetailClick?.(detail)}
                        >
                          <td className="px-3 py-3 text-slate-700">{detail.etiket_Basligi ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{detail.fabricGender ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{detail.en ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{detail.gr ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{detail.renk ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{detail.renkCode ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{detail.siparisMiktari ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{detail.fiyat ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-center text-slate-500">Bu sipariş için detay bulunamadı.</p>
              )
            ) : null}
          </div>

          <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={onClose}>
              Kapat
            </button>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default BoyaliSiparisDetailsModal
