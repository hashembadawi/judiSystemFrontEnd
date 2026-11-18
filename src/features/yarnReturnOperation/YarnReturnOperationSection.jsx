import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, Search } from 'lucide-react'
import YarnReturnOperationModal from './YarnReturnOperationModal'

const YARN_RETURN_URL = '/api/yarnReturnOperation/getAll'
const FILL_OPTIONS_URL = '/api/fill-options?requestedValues=1'
const DELETE_OPERATION_URL = '/api/yarnReturnOperation/delete'

const getFactoryId = (factory) => factory?.id ?? factory?.factoryId ?? factory?.FactoryId ?? ''
const getFactoryName = (factory) => factory?.name ?? factory?.factoryName ?? factory?.Name ?? factory?.FactoryName ?? '-'
const displayValue = (value) => value == null || value === '' ? '-' : value
const formatNumber = (value) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(Number(value) || 0)
const formatDate = (value) => value ? new Date(value).toLocaleDateString('tr-TR') : '-'
const getCurrentMonthFilters = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const toDateInputValue = (date) => {
    const dateYear = date.getFullYear()
    const dateMonth = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${dateYear}-${dateMonth}-${day}`
  }

  return {
    FactoryId: '0',
    FaturaNo: '',
    FromDate: toDateInputValue(new Date(year, month, 1)),
    ToDate: toDateInputValue(new Date(year, month + 1, 0)),
  }
}

function YarnReturnOperationSection({ apiRequest, showNotice, isActive }) {
  const [filters, setFilters] = useState(getCurrentMonthFilters)
  const [appliedFilters, setAppliedFilters] = useState(getCurrentMonthFilters)
  const [factories, setFactories] = useState([])
  const [items, setItems] = useState([])
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingOperationId, setEditingOperationId] = useState(null)
  const [deletingOperationId, setDeletingOperationId] = useState(null)

  const pageStatistics = useMemo(() => items.reduce((totals, item) => ({
    detailsCount: totals.detailsCount + (Number(item.detailsCount) || 0),
    totalYarnCount: totals.totalYarnCount + (Number(item.totalYarnCount) || 0),
    totalWeight: totals.totalWeight + (Number(item.totalWeight) || 0),
  }), { detailsCount: 0, totalYarnCount: 0, totalWeight: 0 }), [items])

  const loadFactories = useCallback(async () => {
    try {
      const response = await apiRequest(FILL_OPTIONS_URL)
      const options = response?.data?.fasonFactories ?? response?.data?.boyaFactories
      setFactories(Array.isArray(options) ? options : [])
    } catch (requestError) {
      const message = requestError.message || 'تعذر تحميل قائمة المصانع.'
      showNotice('error', message)
    }
  }, [apiRequest, showNotice])

  const loadItems = useCallback(async (criteria, page, size) => {
    setIsLoading(true)
    setError('')

    try {
      const query = new URLSearchParams({
        FactoryId: criteria.FactoryId || '0',
        PageNumber: String(page),
        PageSize: String(size),
      })
      const faturaNo = criteria.FaturaNo.trim()

      if (faturaNo) query.set('FaturaNo', faturaNo)
      if (criteria.FromDate) query.set('FromDate', criteria.FromDate)
      if (criteria.ToDate) query.set('ToDate', criteria.ToDate)

      const response = await apiRequest(`${YARN_RETURN_URL}?${query.toString()}`)
      const data = response?.data ?? {}
      const nextItems = Array.isArray(data.items) ? data.items : []
      const nextTotalRecords = Number(data.totalRecords) || 0

      setItems(nextItems)
      setTotalRecords(nextTotalRecords)
      setTotalPages(Math.max(Number(data.totalPages) || Math.ceil(nextTotalRecords / size), 1))
    } catch (requestError) {
      const message = requestError.message || 'تعذر تحميل حركات الخيط المرتجع من فاصون.'
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
    if (!isActive) return
    void Promise.resolve().then(() => loadFactories())
  }, [isActive, loadFactories])

  useEffect(() => {
    if (!isActive) return
    void Promise.resolve().then(() => loadItems(appliedFilters, pageNumber, pageSize))
  }, [appliedFilters, isActive, loadItems, pageNumber, pageSize])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const submitFilters = (event) => {
    event.preventDefault()
    setPageNumber(1)
    setAppliedFilters({ ...filters })
  }

  const updatePageSize = (event) => {
    setPageSize(Number(event.target.value))
    setPageNumber(1)
  }

  const handleOperationSaved = () => {
    setIsCreateModalOpen(false)
    setEditingOperationId(null)
    setPageNumber(1)
    setAppliedFilters((current) => ({ ...current }))
  }

  const openCreateModal = () => {
    setEditingOperationId(null)
    setIsCreateModalOpen(true)
  }

  const openEditModal = (operationId) => {
    setEditingOperationId(operationId)
    setIsCreateModalOpen(true)
  }

  const closeOperationModal = () => {
    setIsCreateModalOpen(false)
    setEditingOperationId(null)
  }

  const deleteOperation = async (item) => {
    if (!item.id || !window.confirm(`هل أنت متأكد من حذف حركة الخيط المرتجع رقم ${item.id}؟`)) {
      return
    }

    setDeletingOperationId(item.id)
    try {
      const query = new URLSearchParams({ id: String(item.id) })
      await apiRequest(`${DELETE_OPERATION_URL}?${query.toString()}`, { method: 'DELETE' })
      showNotice('success', 'تم حذف حركة الخيط المرتجع بنجاح.')

      if (items.length === 1 && pageNumber > 1) {
        setPageNumber((current) => current - 1)
      } else {
        void loadItems(appliedFilters, pageNumber, pageSize)
      }
    } catch (requestError) {
      showNotice('error', requestError.message || 'تعذر حذف حركة الخيط المرتجع.')
    } finally {
      setDeletingOperationId(null)
    }
  }

  return (
    <>
    <section className="space-y-5" dir="ltr" lang="ar">
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-white to-emerald-50 px-4 py-5 shadow-sm sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">خيط مرتجع من فاصون</h2>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            title="إضافة حركة جديدة"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            حركة جديدة
          </button>
        </div>

        <form className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6" onSubmit={submitFilters}>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>المصنع</span>
            <select name="FactoryId" value={filters.FactoryId} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">
              <option value="0">كل المصانع</option>
              {factories.map((factory, index) => (
                <option key={getFactoryId(factory) || index} value={getFactoryId(factory)}>
                  {getFactoryName(factory)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>رقم الفاتورة</span>
            <input name="FaturaNo" value={filters.FaturaNo} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>من تاريخ</span>
            <input name="FromDate" type="date" value={filters.FromDate} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>إلى تاريخ</span>
            <input name="ToDate" type="date" value={filters.ToDate} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>حجم الصفحة</span>
            <select aria-label="حجم الصفحة" value={pageSize} onChange={updatePageSize} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={isLoading} className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">
              {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
              بحث
            </button>
          </div>
        </form>
      </header>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-busy={isLoading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                {['#', 'تاريخ الحركة', 'رقم الفاتورة', 'المصنع', 'رقم السيارة', 'مالك السيارة', 'عدد التفاصيل', 'عدد', 'الوزن الإجمالي', 'العمليات'].map((column) => (
                  <th key={column} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">جارٍ تحميل الحركات...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">لا توجد حركات مطابقة للفلاتر.</td></tr>
              ) : items.map((item, index) => (
                <tr key={item.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{(pageNumber - 1) * pageSize + index + 1}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(item.operationDate)}</td>
                  <td className="px-4 py-3 text-slate-700">{displayValue(item.faturaNo)}</td>
                  <td className="px-4 py-3 text-slate-700">{displayValue(item.factoryName)}</td>
                  <td className="px-4 py-3 text-slate-700">{displayValue(item.carBLK)}</td>
                  <td className="px-4 py-3 text-slate-700">{displayValue(item.carOwner)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(item.detailsCount)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(item.totalYarnCount)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(item.totalWeight)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" onClick={() => openEditModal(item.id)} disabled={!item.id || isLoading} title="تعديل الحركة" aria-label={`تعديل الحركة رقم ${item.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
                        ✏️
                      </button>
                      <button type="button" onClick={() => deleteOperation(item)} disabled={!item.id || isLoading || deletingOperationId === item.id} title="حذف الحركة" aria-label={`حذف الحركة رقم ${item.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">
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

      <footer className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6" dir="rtl">
        <div className="space-y-1 text-sm text-slate-700">
          <p>
            إجمالي النتائج: <strong className="text-slate-900">{formatNumber(totalRecords)}</strong>
            {' | '}حركات الصفحة: <strong className="text-slate-900">{formatNumber(items.length)}</strong>
            {' | '}التفاصيل: <strong className="text-slate-900">{formatNumber(pageStatistics.detailsCount)}</strong>
          </p>
          <p>
            إجمالي الخيوط في الصفحة: <strong className="text-slate-900">{formatNumber(pageStatistics.totalYarnCount)}</strong>
            {' | '}الوزن الكلي في الصفحة: <strong className="text-slate-900">{formatNumber(pageStatistics.totalWeight)}</strong>
          </p>
        </div>
        <div className="flex items-center justify-start gap-2">
          <span className="text-sm text-slate-600">الصفحة {pageNumber} من {totalPages}</span>
          <button type="button" aria-label="الصفحة السابقة" disabled={pageNumber <= 1 || isLoading} onClick={() => setPageNumber((current) => Math.max(current - 1, 1))} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            السابق
          </button>
          <button type="button" aria-label="الصفحة التالية" disabled={pageNumber >= totalPages || isLoading} onClick={() => setPageNumber((current) => Math.min(current + 1, totalPages))} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            التالي
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
    {isCreateModalOpen ? (
      <YarnReturnOperationModal
        apiRequest={apiRequest}
        showNotice={showNotice}
        factoryOptions={factories}
        operationId={editingOperationId}
        onClose={closeOperationModal}
        onSaved={handleOperationSaved}
      />
    ) : null}
    </>
  )
}

export default YarnReturnOperationSection
