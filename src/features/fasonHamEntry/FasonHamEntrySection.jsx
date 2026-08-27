import { useCallback, useEffect, useRef, useState } from 'react'

const FASON_HAM_ENTRY_URL = '/api/FasonHamEntry'

function FasonHamEntrySection({ apiRequest, showNotice, isActive, onNewTransaction, onEditTransaction, onDeleteTransaction, refreshKey }) {
  const today = new Date().toISOString().split('T')[0]
  const [searchText, setSearchText] = useState('')
  const [factoryId, setFactoryId] = useState('')
  const [factoryOptions, setFactoryOptions] = useState([])
  const [optionDate, setOptionDate] = useState(false)
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const factoryOptionsLoadRef = useRef(false)
  const itemsLoadRef = useRef(null)

  const loadFactoryOptions = useCallback(async () => {
    try {
      const response = await apiRequest('/api/fill-options?requestedValues=1')
      const data = response.data || {}
      setFactoryOptions(Array.isArray(data.fasonFactories) ? data.fasonFactories : [])
    } catch {
      setFactoryOptions([])
    }
  }, [apiRequest])

  const loadItems = useCallback(async () => {
    setError('')
    setIsLoading(true)

    try {
      const query = new URLSearchParams({
        PageNumber: String(pageNumber),
        PageSize: String(pageSize),
        SearchText: searchText.trim(),
        FactoryId: factoryId || '0',
        OptionDate: String(optionDate),
        DateFrom: dateFrom,
        DateTo: dateTo,
      })

      const response = await apiRequest(`${FASON_HAM_ENTRY_URL}?${query.toString()}`)
      const data = response.data || {}
      const nextItems = Array.isArray(data.items) ? data.items : []

      setItems(nextItems)
      setTotalCount(data.totalRecords ?? data.totalCount ?? nextItems.length)
    } catch (requestError) {
      const message = requestError.message || 'Fason ham kumaş girişleri alınırken hata oluştu.'
      setError(message)
      setItems([])
      setTotalCount(0)
      showNotice('error', message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, dateFrom, dateTo, factoryId, optionDate, pageNumber, pageSize, searchText, showNotice])

  useEffect(() => {
    if (!isActive) {
      factoryOptionsLoadRef.current = false
      return
    }

    if (factoryOptionsLoadRef.current) {
      return
    }

    factoryOptionsLoadRef.current = true

    const loadOptions = async () => {
      await loadFactoryOptions()
    }

    void loadOptions()
  }, [isActive, loadFactoryOptions])

  useEffect(() => {
    if (!isActive) {
      itemsLoadRef.current = null
      return
    }

    if (itemsLoadRef.current === loadItems) {
      return
    }

    itemsLoadRef.current = loadItems

    const loadPage = async () => {
      await loadItems()
    }

    void loadPage()
  }, [isActive, loadItems, refreshKey])

  const resetToFirstPage = (setter) => (value) => {
    setter(value)
    setPageNumber(1)
  }

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)
  const formatDate = (value) => value ? new Date(value).toLocaleDateString('tr-TR') : '-'

  return (
    <div className="space-y-6" dir="ltr">
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-2xl font-bold text-sky-900">FASON GİRİŞ KUMAŞ HAREKETLERİ</h3>
          <button type="button" onClick={() => onNewTransaction()} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            + Yeni Hareket
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <div className="flex flex-col gap-2 lg:col-span-2">
            <label htmlFor="fasonHamEntrySearch" className="text-xs font-medium text-slate-600">Arama</label>
            <input
              id="fasonHamEntrySearch"
              type="text"
              value={searchText}
              onChange={(event) => resetToFirstPage(setSearchText)(event.target.value)}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-slate-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="fasonHamEntryFactory" className="text-xs font-medium text-slate-600">Fabrika</label>
            <select
              id="fasonHamEntryFactory"
              value={factoryId}
              onChange={(event) => resetToFirstPage(setFactoryId)(event.target.value)}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
            >
              <option value="">Tüm fabrikalar</option>
              {factoryOptions.map((factory) => (
                <option key={factory.id ?? factory.Id} value={factory.id ?? factory.Id}>
                  {factory.name ?? factory.Name ?? factory.factoryName ?? factory.FactoryName ?? '-'}
                </option>
              ))}
            </select>
          </div>

          <label htmlFor="fasonHamEntryOptionDate" className="flex items-center gap-2 self-end rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
            <input
              id="fasonHamEntryOptionDate"
              type="checkbox"
              checked={optionDate}
              onChange={(event) => {
                setOptionDate(event.target.checked)
                setPageNumber(1)
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
            Tarih filtresi
          </label>

          <div className="flex flex-col gap-2">
            <label htmlFor="fasonHamEntryDateFrom" className="text-xs font-medium text-slate-600">Başlangıç Tarihi</label>
            <input id="fasonHamEntryDateFrom" type="date" value={dateFrom} onChange={(event) => resetToFirstPage(setDateFrom)(event.target.value)} disabled={!optionDate} className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="fasonHamEntryDateTo" className="text-xs font-medium text-slate-600">Bitiş Tarihi</label>
            <input id="fasonHamEntryDateTo" type="date" value={dateTo} onChange={(event) => resetToFirstPage(setDateTo)(event.target.value)} disabled={!optionDate} className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="fasonHamEntryPageSize" className="text-xs font-medium text-slate-600">Sayfa Boyutu</label>
            <select id="fasonHamEntryPageSize" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageNumber(1) }} className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </header>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Tarih</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Fabrika</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Personel</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Toplam Ağırlık</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Top Sayısı</th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">İşlemler</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Hareketler yükleniyor...</td></tr> : items.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Eşleşen veri bulunamadı.</td></tr> : items.map((item) => (
                <tr key={`${item.entryDate}-${item.factoryName}-${item.personalName}`} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4 text-left text-slate-700">{formatDate(item.entryDate)}</td>
                  <td className="px-6 py-4 text-left text-slate-900">{item.factoryName ?? '-'}</td>
                  <td className="px-6 py-4 text-left text-slate-700">{item.personalName ?? '-'}</td>
                  <td className="px-6 py-4 text-left text-slate-700">{item.totalWeight ?? '-'}</td>
                  <td className="px-6 py-4 text-left text-slate-700">{item.totalRollCount ?? '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" title="تعديل الحركة" aria-label="تعديل الحركة" disabled={!item.id || isLoading} onClick={() => onEditTransaction(item.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">✏️</button>
                      <button type="button" title="حذف الحركة" aria-label="حذف الحركة" disabled={!item.id || isLoading} onClick={() => onDeleteTransaction(item.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-slate-700">Toplam sonuç: <strong className="text-slate-900">{totalCount}</strong> | Sayfa: <strong className="text-slate-900">{pageNumber}</strong> / <strong className="text-slate-900">{totalPages}</strong></p>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" disabled={pageNumber <= 1 || isLoading} onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}>Önceki</button>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">Sayfa {pageNumber} / {totalPages}</span>
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" disabled={pageNumber >= totalPages || isLoading} onClick={() => setPageNumber((prev) => Math.min(prev + 1, totalPages))}>Sonraki</button>
        </div>
      </footer>
    </div>
  )
}

export default FasonHamEntrySection