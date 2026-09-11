import { useCallback, useEffect, useState } from 'react'
import WeavingOrderPlanningModal from './WeavingOrderPlanningModal'
import ProductionPlanningModal from './ProductionPlanningModal'

const WEAVING_ORDERS_URL = '/api/WeavingOrder'
const getTodayDate = () => new Date().toISOString().slice(0, 10)

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 })
}

function WeavingOrderPlanningSection({ apiRequest, showNotice, isActive }) {
  const [orders, setOrders] = useState([])
  const [searchText, setSearchText] = useState('')
  const today = getTodayDate()
  const [optionDate, setOptionDate] = useState(false)
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isPlanningLoading, setIsPlanningLoading] = useState(false)
  const [planningError, setPlanningError] = useState('')
  const [isProductionPlanningOpen, setIsProductionPlanningOpen] = useState(false)
  const [isProductionPlanningLoading, setIsProductionPlanningLoading] = useState(false)
  const [productionPlanningError, setProductionPlanningError] = useState('')
  const [machines, setMachines] = useState([])
  const [productionPlanningForm, setProductionPlanningForm] = useState({ machineId: '' })

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const query = new URLSearchParams({
        PageNumber: String(pageNumber),
        PageSize: String(pageSize),
        OptionDate: String(optionDate),
        DateFrom: optionDate && dateFrom ? dateFrom : today,
        DateTo: optionDate && dateTo ? dateTo : today,
      })

      if (searchText.trim()) {
        query.set('SearchText', searchText.trim())
      }

      const response = await apiRequest(`${WEAVING_ORDERS_URL}?${query.toString()}`)
      const data = response?.data || {}
      const items = Array.isArray(data.items) ? data.items : []

      setOrders(items)
      setTotalCount(Number(data.totalRecords ?? data.totalCount ?? items.length))
    } catch (requestError) {
      const message = requestError.message || 'Dokuma siparişleri yüklenemedi.'
      setError(message)
      setOrders([])
      setTotalCount(0)
      showNotice('error', message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, dateFrom, dateTo, optionDate, pageNumber, pageSize, searchText, showNotice, today])

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const timer = setTimeout(loadOrders, 300)
    return () => clearTimeout(timer)
  }, [isActive, loadOrders])

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)

  const handlePlanOrder = useCallback(async (order) => {
    if (!order?.id) {
      return
    }

    setSelectedOrder(null)
    setPlanningError('')
    setIsPlanningLoading(true)

    try {
      const response = await apiRequest(`${WEAVING_ORDERS_URL}/${order.id}`)
      setSelectedOrder(response?.data || {})
    } catch (requestError) {
      const message = requestError.message || 'Dokuma siparişi detayları yüklenemedi.'
      setPlanningError(message)
      showNotice('error', message)
    } finally {
      setIsPlanningLoading(false)
    }
  }, [apiRequest, showNotice])

  const closePlanningModal = useCallback(() => {
    if (isPlanningLoading) {
      return
    }

    setSelectedOrder(null)
    setPlanningError('')
  }, [isPlanningLoading])

  const openProductionPlanningModal = useCallback(async () => {
    const factoryId = selectedOrder?.details?.find((detail) => detail?.factoryId ?? detail?.FactoryId)?.factoryId
      ?? selectedOrder?.details?.find((detail) => detail?.factoryId ?? detail?.FactoryId)?.FactoryId
      ?? selectedOrder?.factoryId
      ?? selectedOrder?.FactoryId

    setIsProductionPlanningOpen(true)
    setIsProductionPlanningLoading(true)
    setProductionPlanningError('')
    setMachines([])
    setProductionPlanningForm({ machineId: '' })

    if (!factoryId) {
      setProductionPlanningError('Fabrika bilgisi bulunamadı.')
      setIsProductionPlanningLoading(false)
      return
    }

    try {
      const response = await apiRequest(`${WEAVING_ORDERS_URL}/getAllMachines?FactoryId=${factoryId}&IsAvailable=true`)
      setMachines(Array.isArray(response?.data) ? response.data : [])
    } catch (requestError) {
      const message = requestError.message || 'Makineler yüklenemedi.'
      setProductionPlanningError(message)
      showNotice('error', message)
    } finally {
      setIsProductionPlanningLoading(false)
    }
  }, [apiRequest, selectedOrder, showNotice])

  const closeProductionPlanningModal = useCallback(() => {
    if (isProductionPlanningLoading) {
      return
    }

    setIsProductionPlanningOpen(false)
    setProductionPlanningError('')
  }, [isProductionPlanningLoading])

  const updateProductionPlanningField = useCallback((field, value) => {
    setProductionPlanningForm((previous) => ({ ...previous, [field]: value }))
  }, [])

  return (
    <div className="space-y-4" dir="ltr">
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-2xl font-bold text-sky-900">DOKUMA SİPARİŞİ PLANLAMA</h3>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="weavingOrderPlanningSearch" className="mb-1 block text-xs font-medium text-slate-600">Arama</label>
            <input
              id="weavingOrderPlanningSearch"
              type="text"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value)
                setPageNumber(1)
              }}
              placeholder="Sipariş numarası veya isim"
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white"
            />
          </div>
          <div className="min-w-[120px]">
            <label htmlFor="weavingOrderPlanningDateToggle" className="mb-1 block text-xs font-medium text-slate-600">Tarih filtresi</label>
            <div className="flex h-10 items-center gap-2 rounded-lg bg-slate-100 px-3">
              <input
                id="weavingOrderPlanningDateToggle"
                type="checkbox"
                checked={optionDate}
                onChange={(event) => {
                  setOptionDate(event.target.checked)
                  setPageNumber(1)
                }}
                className="h-4 w-4 rounded border-slate-300 text-sky-700"
              />
              <label htmlFor="weavingOrderPlanningDateToggle" className="text-sm text-slate-700">Tarih aralığı</label>
            </div>
          </div>
          <div className="min-w-[140px]">
            <label htmlFor="weavingOrderPlanningDateFrom" className="mb-1 block text-xs font-medium text-slate-600">Başlangıç</label>
            <input
              id="weavingOrderPlanningDateFrom"
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value)
                setPageNumber(1)
              }}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white"
            />
          </div>
          <div className="min-w-[140px]">
            <label htmlFor="weavingOrderPlanningDateTo" className="mb-1 block text-xs font-medium text-slate-600">Bitiş</label>
            <input
              id="weavingOrderPlanningDateTo"
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value)
                setPageNumber(1)
              }}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white"
            />
          </div>
          <div className="w-24">
            <label htmlFor="weavingOrderPlanningPageSize" className="mb-1 block text-xs font-medium text-slate-600">Sayfa</label>
            <select
              id="weavingOrderPlanningPageSize"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPageNumber(1)
              }}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none"
            >
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
          <table className="w-full min-w-[1050px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Sipariş No</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">İsim</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Tarih</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Durum</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Gerekli</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Üretilen</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Kalan</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">İlerleme</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">Dokuma siparişleri yükleniyor...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">Eşleşen sipariş bulunamadı.</td></tr>
              ) : orders.map((order, index) => (
                <tr key={order.id ?? `${order.orderNo ?? 'row'}-${index}`} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-900">{(pageNumber - 1) * pageSize + index + 1}</td>
                  <td className="px-4 py-4 text-slate-700">{order.orderNo || '-'}</td>
                  <td className="px-4 py-4 text-slate-700">{order.name || '-'}</td>
                  <td className="px-4 py-4 text-slate-700">{order.date || '-'}</td>
                  <td className="px-4 py-4 text-slate-700">{order.weavingOrderStatusName || '-'}</td>
                  <td className="px-4 py-4 text-right text-slate-700">{formatNumber(order.totalRequiredWeight)}</td>
                  <td className="px-4 py-4 text-right text-slate-700">{formatNumber(order.totalProducedWeight)}</td>
                  <td className="px-4 py-4 text-right text-slate-700">{formatNumber(order.totalRemainingWeight)}</td>
                  <td className="px-4 py-4 text-right font-medium text-slate-700">{formatNumber(order.progressPercent)}%</td>
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handlePlanOrder(order)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-lg text-emerald-700 transition hover:bg-emerald-100"
                      aria-label={`Planla ${order.orderNo || order.name || ''}`}
                      title="Planla"
                    >
                      ⛭
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">Toplam hareket: <strong className="text-slate-900">{totalCount}</strong></div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={pageNumber <= 1 || isLoading} onClick={() => setPageNumber((page) => page - 1)}>Önceki</button>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">Sayfa {pageNumber} / {totalPages}</span>
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={pageNumber >= totalPages || isLoading} onClick={() => setPageNumber((page) => page + 1)}>Sonraki</button>
        </div>
      </footer>

      <WeavingOrderPlanningModal
        order={selectedOrder}
        isLoading={isPlanningLoading}
        error={planningError}
        onClose={closePlanningModal}
        onOpenProductionPlanning={openProductionPlanningModal}
      />

      <ProductionPlanningModal
        isOpen={isProductionPlanningOpen}
        isLoading={isProductionPlanningLoading}
        error={productionPlanningError}
        machines={machines}
        order={selectedOrder}
        form={productionPlanningForm}
        onFieldChange={updateProductionPlanningField}
        onClose={closeProductionPlanningModal}
      />
    </div>
  )
}

export default WeavingOrderPlanningSection
