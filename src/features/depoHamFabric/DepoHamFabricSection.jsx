import { useCallback, useEffect, useMemo, useState } from 'react'

const DEPOT_HAM_FABRIC_URL = '/api/DepoHamFabric/getDepoFabrics'

function DepoHamFabricSection({ apiRequest, showNotice, isActive }) {
  const [searchText, setSearchText] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadItems = useCallback(async () => {
    setError('')
    setIsLoading(true)

    try {
      const query = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
      })

      if (searchText.trim() !== '') {
        query.set('searchText', searchText.trim())
      }

      const response = await apiRequest(`${DEPOT_HAM_FABRIC_URL}?${query.toString()}`)
      const payload = response.data || {}

      setItems(Array.isArray(payload.items) ? payload.items : [])
      setTotalCount(payload.totalRecords ?? 0)
    } catch (requestError) {
      const message = requestError.message || 'Ham fabric stok verileri alınırken hata oluştu.'
      setError(message)
      setItems([])
      setTotalCount(0)
      showNotice('error', message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, pageNumber, pageSize, searchText, showNotice])

  const handleSearchChange = (value) => {
    setSearchText(value)
    setPageNumber(1)
  }

  useEffect(() => {
    if (!isActive) {
      return
    }

    loadItems()
  }, [searchText, pageSize, pageNumber, isActive, loadItems])

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const fabricType = String(item.fabricType ?? '').trim().toLowerCase()
        const count = Number(item.count ?? 0)
        const weight = Number(item.weight ?? 0)

        if (fabricType === 'saglam') {
          acc.saglamCount += count
          acc.saglamWeight += weight
        }

        if (fabricType === 'hata') {
          acc.hataCount += count
          acc.hataWeight += weight
        }

        acc.totalCount += count
        acc.totalWeight += weight
        return acc
      },
      {
        saglamCount: 0,
        saglamWeight: 0,
        hataCount: 0,
        hataWeight: 0,
        totalCount: 0,
        totalWeight: 0,
      },
    )
  }, [items])

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)

  return (
    <div className="space-y-6" dir="ltr">
      <header className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Depo</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">DEPO HAM KUMAŞ</h3>
            <p className="mt-2 text-sm text-slate-600">Ham kumaş stoklarını sayfalandırılmış şekilde görüntüleyin.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label htmlFor="depoHamSearch" className="mb-2 block text-xs font-medium text-slate-600">Arama</label>
            <input
              id="depoHamSearch"
              type="text"
              value={searchText}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Sipariş, kumaş adı veya fabrika ile ara"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              dir="ltr"
              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label htmlFor="depoHamPageSize" className="mb-2 block text-xs font-medium text-slate-600">Sayfa boyutu</label>
            <select
              id="depoHamPageSize"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPageNumber(1)
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              dir="ltr"
              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-medium text-slate-600">Toplam sonuç</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{totalCount}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="rounded-md bg-slate-200 px-2.5 py-1 font-medium text-slate-700">Sayfa {pageNumber} / {totalPages}</span>
            <span className="rounded-md bg-slate-200 px-2.5 py-1 font-medium text-slate-700">{pageSize} / sayfa</span>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm" style={{ direction: 'ltr' }}>
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="px-6 py-3 text-left" style={{ textAlign: 'left' }}><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Kumaş Cinsiyeti</span></th>
                <th className="px-6 py-3 text-left" style={{ textAlign: 'left' }}><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">GR</span></th>
                <th className="px-6 py-3 text-left" style={{ textAlign: 'left' }}><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">LOT</span></th>
                <th className="px-6 py-3 text-left" style={{ textAlign: 'left' }}><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Adet</span></th>
                <th className="px-6 py-3 text-left" style={{ textAlign: 'left' }}><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Ağırlık</span></th>
                <th className="px-6 py-3 text-left" style={{ textAlign: 'left' }}><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Fabrika</span></th>
                <th className="px-6 py-3 text-left" style={{ textAlign: 'left' }}><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Sipariş No</span></th>
                <th className="px-6 py-3 text-left" style={{ textAlign: 'left' }}><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Kumaş Türü</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Veriler yükleniyor...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Eşleşen veri bulunamadı.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id ?? `${item.orderId}-${item.factoryId}-${item.fabricLOT}`} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-900">{item.fabricGender ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{item.fabricGSM ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{item.fabricLOT ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{item.count ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{item.weight ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{item.factoryName ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{item.orderNo ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{item.fabricType ?? '-'}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden">
          {isLoading ? (
            <div className="px-4 py-12 text-center text-slate-500">Veriler yükleniyor...</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-500">Eşleşen veri bulunamadı.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {items.map((item) => (
                <div key={item.id ?? `${item.orderId}-${item.factoryId}-${item.fabricLOT}`} className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{item.fabricType ?? '-'}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.fabricGender ?? '-'}</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-center justify-between gap-3"><span>GR:</span><span className="font-medium text-slate-900">{item.fabricGSM ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>LOT:</span><span className="font-medium text-slate-900">{item.fabricLOT ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Adet:</span><span className="font-medium text-slate-900">{item.count ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Ağırlık:</span><span className="font-medium text-slate-900">{item.weight ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Fabrika:</span><span className="font-medium text-slate-900">{item.factoryName ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Sipariş No:</span><span className="font-medium text-slate-900">{item.orderNo ?? '-'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1 text-sm text-slate-700">
          <p>Toplam sonuç: <strong className="text-slate-900">{totalCount}</strong> | Sayfa: <strong className="text-slate-900">{pageNumber}</strong> / <strong className="text-slate-900">{totalPages}</strong></p>
          <p>Toplam Adet: <strong className="text-slate-900">{totals.totalCount}</strong> | Toplam Ağırlık: <strong className="text-slate-900">{totals.totalWeight}</strong></p>
          <p>Sağlam: <strong className="text-slate-900">{totals.saglamCount}</strong> adet, <strong className="text-slate-900">{totals.saglamWeight}</strong> ağırlık</p>
          <p>Hata: <strong className="text-slate-900">{totals.hataCount}</strong> adet, <strong className="text-slate-900">{totals.hataWeight}</strong> ağırlık</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pageNumber <= 1 || isLoading}
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
          >
            Önceki
          </button>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
            Sayfa {pageNumber} / {totalPages}
          </span>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pageNumber >= totalPages || isLoading}
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, totalPages))}
          >
            Sonraki
          </button>
        </div>
      </footer>
    </div>
  )
}

export default DepoHamFabricSection
