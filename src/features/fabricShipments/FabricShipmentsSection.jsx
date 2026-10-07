import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, Search } from 'lucide-react'
import FabricShipmentModal from './FabricShipmentModal'

const SHIPMENTS_URL = '/api/fabricShipment/getAll'
const DELETE_SHIPMENT_URL = '/api/fabricShipment/delete'
const INITIAL_FILTERS = { ShipmentNo: '', CustomerName: '', DateFrom: '', DateTo: '' }
const COLUMNS = [
  ['shipmentNo', 'Sevkiyat No'],
  ['shipmentDate', 'Sevkiyat Tarihi'],
  ['customerName', 'Müşteri'],
  ['notes', 'Notlar'],
  ['carBlk', 'Araç Plakası'],
  ['driverTcNo', 'Sürücü TC Kimlik No'],
  ['totalItems', 'Toplam Kalem'],
  ['totalTopCount', 'Toplam Top'],
  ['totalWeight', 'Toplam Ağırlık'],
  ['totalCost', 'Toplam Tutar'],
]

const displayValue = (value) => value == null || value === '' ? '-' : value
const formatDate = (value) => value ? new Date(value).toLocaleDateString('tr-TR') : '-'
const formatNumber = (value) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(Number(value) || 0)

function FabricShipmentsSection({ apiRequest, showNotice, isActive }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS)
  const [items, setItems] = useState([])
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingShipmentId, setEditingShipmentId] = useState(null)
  const [deletingShipmentId, setDeletingShipmentId] = useState(null)

  const loadShipments = useCallback(async (criteria, page, size) => {
    setIsLoading(true)
    setError('')

    try {
      const query = new URLSearchParams()
      const shipmentNo = criteria.ShipmentNo.trim()
      const customerName = criteria.CustomerName.trim()
      const hasFilters = shipmentNo || customerName || criteria.DateFrom || criteria.DateTo

      if (hasFilters || page !== 1 || size !== 50) {
        if (shipmentNo) query.set('ShipmentNo', shipmentNo)
        if (customerName) query.set('CustomerName', customerName)
        if (criteria.DateFrom) query.set('DateFrom', criteria.DateFrom)
        if (criteria.DateTo) query.set('DateTo', criteria.DateTo)
        query.set('PageNumber', String(page))
        query.set('PageSize', String(size))
      }

      const queryString = query.toString()
      const response = await apiRequest(queryString ? `${SHIPMENTS_URL}?${queryString}` : SHIPMENTS_URL)
      const data = response?.data ?? {}
      const nextItems = Array.isArray(data.items) ? data.items : []

      setItems(nextItems)
      setTotalRecords(data.totalRecords ?? nextItems.length)
      setTotalPages(Math.max(Number(data.totalPages) || Math.ceil((data.totalRecords ?? nextItems.length) / size), 1))
    } catch (requestError) {
      const message = requestError.message || 'Sevkiyatlar yüklenemedi.'
      setItems([])
      setTotalRecords(0)
      setTotalPages(1)
      setError(message)
      showNotice('error', message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, showNotice])

  useEffect(() => {
    if (!isActive) {
      return
    }

    void Promise.resolve().then(() => loadShipments(appliedFilters, pageNumber, pageSize))
  }, [appliedFilters, isActive, loadShipments, pageNumber, pageSize])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const submitFilters = (event) => {
    event.preventDefault()
    setPageNumber(1)
    setAppliedFilters({ ...filters })
  }

  const handleShipmentSaved = () => {
    setIsCreateModalOpen(false)
    setEditingShipmentId(null)
    void loadShipments(appliedFilters, pageNumber, pageSize)
  }

  const openCreateModal = () => {
    setEditingShipmentId(null)
    setIsCreateModalOpen(true)
  }

  const openEditModal = (shipmentId) => {
    setEditingShipmentId(shipmentId)
    setIsCreateModalOpen(true)
  }

  const deleteShipment = async (shipment) => {
    if (!shipment.id || !window.confirm(`"${shipment.shipmentNo}" sevkiyatını silmek istediğinizden emin misiniz?`)) {
      return
    }

    setDeletingShipmentId(shipment.id)
    try {
      const query = new URLSearchParams({ id: String(shipment.id) })
      await apiRequest(`${DELETE_SHIPMENT_URL}?${query.toString()}`, { method: 'DELETE' })
      showNotice('success', 'Sevkiyat başarıyla silindi.')

      if (items.length === 1 && pageNumber > 1) {
        setPageNumber((current) => current - 1)
      } else {
        void loadShipments(appliedFilters, pageNumber, pageSize)
      }
    } catch (requestError) {
      showNotice('error', requestError.message || 'Sevkiyat silinemedi.')
    } finally {
      setDeletingShipmentId(null)
    }
  }

  const formatCell = (key, value) => {
    if (key === 'shipmentDate') {
      return formatDate(value)
    }
    if (key === 'totalWeight' || key === 'totalCost') {
      return formatNumber(value)
    }
    return displayValue(value)
  }

  return (
    <>
    <section className="space-y-5" dir="ltr" lang="tr">
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-white to-emerald-50 px-4 py-5 shadow-sm sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">BOYALI KUMAŞ SEVKİYATLARI</h2>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            title="Yeni sevkiyat ekle"
            aria-label="Yeni sevkiyat ekle"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Yeni Sevkiyat
          </button>
        </div>

        <form className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(5,minmax(130px,1fr))_auto]" onSubmit={submitFilters}>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>Sevkiyat No</span>
            <input name="ShipmentNo" value={filters.ShipmentNo} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>Müşteri Adı</span>
            <input name="CustomerName" value={filters.CustomerName} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>Başlangıç Tarihi</span>
            <input name="DateFrom" type="date" value={filters.DateFrom} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>Bitiş Tarihi</span>
            <input name="DateTo" type="date" value={filters.DateTo} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>Sayfa Boyutu</span>
            <select aria-label="Sayfa boyutu" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageNumber(1) }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / sayfa</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={isLoading} aria-label="Ara" className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
              {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
              Ara
            </button>
          </div>
        </form>
      </header>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-busy={isLoading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold">#</th>
                {COLUMNS.map(([, label]) => <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold">{label}</th>)}
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={COLUMNS.length + 2} className="px-4 py-10 text-center text-slate-500">Sevkiyatlar yükleniyor...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={COLUMNS.length + 2} className="px-4 py-10 text-center text-slate-500">Filtrelerle eşleşen sevkiyat bulunamadı.</td></tr>
              ) : items.map((item, index) => (
                <tr key={item.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{(pageNumber - 1) * pageSize + index + 1}</td>
                  {COLUMNS.map(([key]) => <td key={key} className="whitespace-nowrap px-4 py-3 text-left text-slate-700">{formatCell(key, item[key])}</td>)}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" onClick={() => openEditModal(item.id)} title="Sevkiyatı düzenle" aria-label={`${item.shipmentNo} sevkiyatını düzenle`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100">
                        ✏️
                      </button>
                      <button type="button" onClick={() => deleteShipment(item)} disabled={deletingShipmentId === item.id || isLoading} title="Sevkiyatı sil" aria-label={`${item.shipmentNo} sevkiyatını sil`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-slate-700">
          <span>Toplam kayıt: <strong className="text-slate-900">{totalRecords}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Sayfa: <strong className="text-slate-900">{pageNumber}</strong> / <strong className="text-slate-900">{totalPages}</strong></span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" aria-label="Önceki sayfa" disabled={pageNumber <= 1 || isLoading} onClick={() => setPageNumber((current) => Math.max(current - 1, 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Sonraki sayfa" disabled={pageNumber >= totalPages || isLoading} onClick={() => setPageNumber((current) => Math.min(current + 1, totalPages))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
    <FabricShipmentModal
      isOpen={isCreateModalOpen}
      shipmentId={editingShipmentId}
      apiRequest={apiRequest}
      showNotice={showNotice}
      onClose={() => { setIsCreateModalOpen(false); setEditingShipmentId(null) }}
      onSaved={handleShipmentSaved}
    />
    </>
  )
}

export default FabricShipmentsSection