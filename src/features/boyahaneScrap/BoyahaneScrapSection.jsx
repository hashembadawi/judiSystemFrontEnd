import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, Search } from 'lucide-react'
import BoyahaneScrapModal from './BoyahaneScrapModal'

const SCRAP_URL = '/api/boyaHaneScrap/getAll'
const FILL_OPTIONS_URL = '/api/fill-options?requestedValues=1'
const INITIAL_FILTERS = { FactoryId: '0', FromDate: '', ToDate: '' }
const COLUMNS = ['scrapDate', 'factoryName', 'createdDate', 'detailsCount', 'totalKazanGiris', 'totalGirisTopSayisi', 'totalKazanCikis', 'totalCikisTopSayisi', 'totalCost']
const TEXT = {
  title: 'BOYAHANE KUMAŞ HATA TAKİBİ',
  eyebrow: 'HATA HAREKETLERİ',
  factory: 'Boyahane',
  allFactories: 'Tüm boyahaneler',
  fromDate: 'Başlangıç Tarihi',
  toDate: 'Bitiş Tarihi',
  search: 'Ara',
  add: 'Yeni Hareket Ekle',
  columns: ['Tarih', 'Boyahane', 'Oluşturulma Tarihi', 'Detay Sayısı', 'Toplam Kazan Giriş', 'Giriş Top Sayısı', 'Toplam Kazan Çıkış', 'Çıkış Top Sayısı', 'Toplam Maliyet'],
  totalRecords: 'Toplam hareket',
  page: 'Sayfa',
  pageSize: 'Sayfa Boyutu',
  previous: 'Önceki sayfa',
  next: 'Sonraki sayfa',
  loading: 'Hareketler yükleniyor...',
  noData: 'Filtrelerle eşleşen hareket bulunamadı.',
  loadError: 'Hata hareketleri yüklenemedi.',
  optionsError: 'Boyahane listesi yüklenemedi.',
  editLater: 'Düzenleme yakında eklenecek',
  deleteLater: 'Silme yakında eklenecek',
  addLater: 'Hareket ekleme yakında eklenecek',
}

const getFactoryId = (factory) => factory?.id ?? factory?.factoryId ?? factory?.FactoryId ?? ''
const getFactoryName = (factory) => factory?.name ?? factory?.factoryName ?? factory?.Name ?? factory?.label ?? '-'
const getItemValue = (item, key) => item?.[key] ?? item?.[key[0].toUpperCase() + key.slice(1)]
const displayValue = (value) => value == null || value === '' ? '-' : String(value)
const formatNumber = (value) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(Number(value) || 0)
const formatDate = (value) => value ? new Date(value).toLocaleDateString('tr-TR') : '-'
const formatDateTime = (value) => value ? new Date(value).toLocaleString('tr-TR') : '-'

function BoyahaneScrapSection({ apiRequest, showNotice, isActive }) {
  const text = TEXT
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS)
  const [factories, setFactories] = useState([])
  const [items, setItems] = useState([])
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const loadItems = useCallback(async (criteria, page, size) => {
    setIsLoading(true)
    setError('')

    try {
      const query = new URLSearchParams({
        FactoryId: criteria.FactoryId || '0',
        ScrapType: '0',
        PageNumber: String(page),
        PageSize: String(size),
      })
      if (criteria.FromDate) query.set('FromDate', criteria.FromDate)
      if (criteria.ToDate) query.set('ToDate', criteria.ToDate)

      const response = await apiRequest(`${SCRAP_URL}?${query.toString()}`)
      const data = response?.data ?? {}
      const nextItems = Array.isArray(data.items) ? data.items : []
      const count = Number(data.totalRecords) || nextItems.length
      setItems(nextItems)
      setTotalRecords(count)
      setTotalPages(Math.max(Number(data.totalPages) || Math.ceil(count / size), 1))
    } catch (requestError) {
      setItems([])
      setTotalRecords(0)
      setTotalPages(1)
      setError(requestError.message || 'loadError')
      if (requestError.message) showNotice('error', requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, showNotice])

  const loadFactories = useCallback(async () => {
    try {
      const response = await apiRequest(FILL_OPTIONS_URL)
      const options = response?.data?.boyaFactories
      setFactories(Array.isArray(options) ? options : [])
    } catch (requestError) {
      setError(requestError.message || 'optionsError')
      if (requestError.message) showNotice('error', requestError.message)
    }
  }, [apiRequest, showNotice])

  useEffect(() => {
    if (!isActive) return
    void Promise.resolve().then(() => {
      void loadFactories()
      void loadItems(appliedFilters, pageNumber, pageSize)
    })
  }, [appliedFilters, isActive, loadFactories, loadItems, pageNumber, pageSize])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const submitFilters = (event) => {
    event.preventDefault()
    setPageNumber(1)
    setAppliedFilters({ ...filters })
  }

  const handleScrapSaved = () => {
    setIsCreateModalOpen(false)
    void loadItems(appliedFilters, pageNumber, pageSize)
  }

  return (
    <>
    <section className="space-y-5" dir="ltr" lang="tr">
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-white to-emerald-50 px-4 py-5 shadow-sm sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{text.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setIsCreateModalOpen(true)} title={text.add} aria-label={text.add} className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700">
              <Plus className="h-4 w-4" aria-hidden="true" />{text.add}
            </button>
          </div>
        </div>

        <form className="mt-6 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" onSubmit={submitFilters}>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>{text.factory}</span>
            <select name="FactoryId" value={filters.FactoryId} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">
              <option value="0">{text.allFactories}</option>
              {factories.map((factory, index) => <option key={getFactoryId(factory) || index} value={getFactoryId(factory)}>{getFactoryName(factory)}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>{text.fromDate}</span>
            <input name="FromDate" type="date" value={filters.FromDate} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>{text.toDate}</span>
            <input name="ToDate" type="date" value={filters.ToDate} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>
          <div className="flex items-end gap-2">
            <select aria-label={text.pageSize} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageNumber(1) }} className="h-[42px] min-w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm">
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <button type="submit" disabled={isLoading} aria-label={text.search} className="inline-flex h-[42px] flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">
              {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
              {text.search}
            </button>
          </div>
        </form>
      </header>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error === 'loadError' ? text.loadError : error === 'optionsError' ? text.optionsError : error}</p> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-busy={isLoading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1450px] text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-bold">#</th>
                {COLUMNS.map((key, index) => <th key={key} className="whitespace-nowrap px-4 py-3 text-start text-xs font-bold">{text.columns[index]}</th>)}
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={COLUMNS.length + 2} className="px-4 py-10 text-center text-slate-500">{text.loading}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={COLUMNS.length + 2} className="px-4 py-10 text-center text-slate-500">{text.noData}</td></tr>
              ) : items.map((item, index) => (
                <tr key={item.id ?? index} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{(pageNumber - 1) * pageSize + index + 1}</td>
                  {COLUMNS.map((key) => <td key={key} className="whitespace-nowrap px-4 py-3 text-start text-slate-700">{key === 'scrapDate' ? formatDate(getItemValue(item, key)) : key === 'createdDate' ? formatDateTime(getItemValue(item, key)) : ['totalKazanGiris', 'totalKazanCikis', 'totalCost'].includes(key) ? formatNumber(getItemValue(item, key)) : displayValue(getItemValue(item, key))}</td>)}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" disabled title={text.editLater} aria-label={text.editLater} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 opacity-50 disabled:cursor-not-allowed">✏️</button>
                      <button type="button" disabled title={text.deleteLater} aria-label={text.deleteLater} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-600 opacity-50 disabled:cursor-not-allowed">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-700">{text.totalRecords}: <strong className="text-slate-900">{totalRecords}</strong> <span className="mx-2 text-slate-300">|</span> {text.page}: <strong className="text-slate-900">{pageNumber}</strong> / <strong className="text-slate-900">{totalPages}</strong></p>
        <div className="flex items-center justify-end gap-2">
          <button type="button" aria-label={text.previous} disabled={pageNumber <= 1 || isLoading} onClick={() => setPageNumber((current) => Math.max(current - 1, 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" aria-label={text.next} disabled={pageNumber >= totalPages || isLoading} onClick={() => setPageNumber((current) => Math.min(current + 1, totalPages))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </footer>
    </section>
    <BoyahaneScrapModal
      isOpen={isCreateModalOpen}
      apiRequest={apiRequest}
      showNotice={showNotice}
      onClose={() => setIsCreateModalOpen(false)}
      onSaved={handleScrapSaved}
    />
    </>
  )
}

export default BoyahaneScrapSection