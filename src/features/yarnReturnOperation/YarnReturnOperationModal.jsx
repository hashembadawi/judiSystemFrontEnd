import { useCallback, useEffect, useRef, useState } from 'react'
import { LoaderCircle, Plus } from 'lucide-react'

const SENT_YARN_LOTS_URL = '/api/yarnReturnOperation/getSentYarnLots'
const GET_OPERATION_URL = '/api/yarnReturnOperation/getById'
const UPSERT_URL = '/api/yarnReturnOperation/upsert'

const createDateTime = () => {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

const createEmptyDetail = () => ({ yarnId: '', count: '', weight: '' })
const createInitialForm = () => ({
  id: 0,
  operationDate: createDateTime(),
  faturaNo: '',
  carBLK: '',
  carOwner: '',
  factoryId: '',
  details: [createEmptyDetail()],
})

const getFactoryId = (factory) => factory?.id ?? factory?.factoryId ?? factory?.FactoryId ?? factory?.value ?? ''
const getFactoryName = (factory) => factory?.name ?? factory?.factoryName ?? factory?.Name ?? factory?.FactoryName ?? factory?.valueName ?? '-'
const getYarnId = (yarn) => yarn?.yarnId ?? yarn?.id ?? yarn?.YarnId
const toDateTimeLocal = (value) => {
  if (!value) return createDateTime()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return createDateTime()
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

function YarnReturnOperationModal({ apiRequest, showNotice, factoryOptions, operationId, onClose, onSaved }) {
  const [form, setForm] = useState(createInitialForm)
  const [yarnLots, setYarnLots] = useState([])
  const [isLoadingOperation, setIsLoadingOperation] = useState(false)
  const [isLoadingYarnLots, setIsLoadingYarnLots] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const yarnRequestId = useRef(0)

  const closeModal = useCallback(() => {
    if (!isSaving) onClose()
  }, [isSaving, onClose])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) closeModal()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeModal, isSaving])

  const loadSentYarnLots = useCallback(async (factoryId) => {
    const requestId = yarnRequestId.current + 1
    yarnRequestId.current = requestId
    setYarnLots([])
    setError('')

    if (!factoryId) {
      setIsLoadingYarnLots(false)
      return
    }

    setIsLoadingYarnLots(true)
    try {
      const query = new URLSearchParams({ factoryId })
      const response = await apiRequest(`${SENT_YARN_LOTS_URL}?${query.toString()}`)
      if (requestId !== yarnRequestId.current) return []

      const items = response?.data?.items
      const nextItems = Array.isArray(items) ? items : []
      setYarnLots(nextItems)
      return nextItems
    } catch (requestError) {
      if (requestId !== yarnRequestId.current) return []
      const message = requestError.message || 'تعذر تحميل الخيوط المرسلة إلى هذا المعمل.'
      setError(message)
      showNotice('error', message)
      return []
    } finally {
      if (requestId === yarnRequestId.current) setIsLoadingYarnLots(false)
    }
  }, [apiRequest, showNotice])

  useEffect(() => {
    if (!operationId) return undefined

    let isCancelled = false
    void Promise.resolve().then(async () => {
      setIsLoadingOperation(true)
      setError('')

      try {
        const query = new URLSearchParams({ id: String(operationId) })
        const response = await apiRequest(`${GET_OPERATION_URL}?${query.toString()}`)
        if (isCancelled) return

        const operation = response?.data
        if (!operation) {
          throw new Error('لم يتم العثور على بيانات الحركة.')
        }

        setForm({
          id: Number(operation.id) || 0,
          operationDate: toDateTimeLocal(operation.operationDate),
          faturaNo: operation.faturaNo ?? '',
          carBLK: operation.carBLK ?? '',
          carOwner: operation.carOwner ?? '',
          factoryId: String(operation.factoryId ?? ''),
          details: Array.isArray(operation.details) && operation.details.length
            ? operation.details.map((detail) => ({
              id: Number(detail.id) || 0,
              yarnId: String(detail.yarnId ?? ''),
              count: String(detail.count ?? ''),
              weight: String(detail.weight ?? ''),
            }))
            : [createEmptyDetail()],
        })
        const availableYarnLots = await loadSentYarnLots(String(operation.factoryId ?? ''))
        if (isCancelled) return

        const availableYarnIds = new Set(availableYarnLots.map((yarn) => String(getYarnId(yarn))))
        const existingYarnLots = (operation.details ?? [])
          .filter((detail) => detail.yarnId != null && !availableYarnIds.has(String(detail.yarnId)))
          .map((detail) => ({
            yarnId: detail.yarnId,
            yarnGender: detail.yarnGender,
            yarnLot: detail.yarnLot,
          }))
        if (existingYarnLots.length) {
          setYarnLots((current) => [...current, ...existingYarnLots])
        }
      } catch (requestError) {
        if (isCancelled) return
        const message = requestError.message || 'تعذر تحميل بيانات الحركة للتعديل.'
        setError(message)
        showNotice('error', message)
      } finally {
        if (!isCancelled) setIsLoadingOperation(false)
      }
    })

    return () => {
      isCancelled = true
      yarnRequestId.current += 1
    }
  }, [apiRequest, loadSentYarnLots, operationId, showNotice])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const selectFactory = (factoryId) => {
    updateField('factoryId', factoryId)
    setForm((current) => ({
      ...current,
      factoryId,
      details: current.details.map((detail) => ({ ...detail, yarnId: '' })),
    }))
    void loadSentYarnLots(factoryId)
  }

  const updateDetail = (index, field, value) => {
    setForm((current) => ({
      ...current,
      details: current.details.map((detail, rowIndex) => (
        rowIndex === index ? { ...detail, [field]: value } : detail
      )),
    }))
  }

  const addDetail = () => {
    setForm((current) => ({ ...current, details: [...current.details, createEmptyDetail()] }))
  }

  const removeDetail = (index) => {
    setForm((current) => ({
      ...current,
      details: current.details.length > 1
        ? current.details.filter((_, rowIndex) => rowIndex !== index)
        : current.details,
    }))
  }

  const saveOperation = async (event) => {
    event.preventDefault()
    setError('')

    const details = form.details.map((detail) => ({
      yarnId: Number(detail.yarnId),
      count: Number(detail.count),
      weight: Number(detail.weight),
    }))

    if (!form.factoryId || details.some((detail) => !detail.yarnId || !Number.isFinite(detail.count) || !Number.isFinite(detail.weight))) {
      setError('يرجى اختيار المعمل والخيط وإدخال العدد والوزن لكل التفاصيل.')
      return
    }

    setIsSaving(true)
    try {
      await apiRequest(UPSERT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Number(form.id) || 0,
          operationDate: new Date(form.operationDate).toISOString(),
          faturaNo: form.faturaNo.trim(),
          carBLK: form.carBLK.trim(),
          carOwner: form.carOwner.trim(),
          factoryId: Number(form.factoryId),
          details: details.map((detail, index) => ({
            ...detail,
            ...(form.details[index].id ? { id: form.details[index].id } : {}),
          })),
        }),
      })
      showNotice('success', 'تم حفظ حركة الخيط المرتجع بنجاح.')
      onSaved()
    } catch (requestError) {
      const message = requestError.message || 'تعذر حفظ حركة الخيط المرتجع.'
      setError(message)
      showNotice('error', message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-6" role="dialog" aria-modal="true" dir="rtl">
      <section className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="text-xl font-semibold text-slate-900">{operationId ? 'تعديل حركة خيط مرتجع' : 'إضافة حركة خيط مرتجع'}</h2>
          <button type="button" disabled={isSaving} onClick={closeModal} aria-label="إغلاق" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-2xl leading-none text-slate-500 transition hover:bg-slate-50 disabled:opacity-50">×</button>
        </header>

        <form onSubmit={saveOperation}>
          <div className="max-h-[75vh] space-y-6 overflow-y-auto p-4 sm:p-6">
            {isLoadingOperation ? (
              <p className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                جارٍ تحميل بيانات الحركة...
              </p>
            ) : (
            <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                <span>المعمل</span>
                <select required value={form.factoryId} onChange={(event) => selectFactory(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">
                  <option value="">اختر المعمل</option>
                  {factoryOptions.map((factory, index) => (
                    <option key={getFactoryId(factory) || index} value={getFactoryId(factory)}>{getFactoryName(factory)}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                <span>تاريخ الحركة</span>
                <input required type="datetime-local" value={form.operationDate} onChange={(event) => updateField('operationDate', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                <span>رقم الفاتورة</span>
                <input type="text" value={form.faturaNo} onChange={(event) => updateField('faturaNo', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                <span>رقم السيارة</span>
                <input type="text" value={form.carBLK} onChange={(event) => updateField('carBLK', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                <span>مالك السيارة</span>
                <input type="text" value={form.carOwner} onChange={(event) => updateField('carOwner', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
              </label>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-800">تفاصيل الحركة</h3>
                <button type="button" onClick={addDetail} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  إضافة سطر
                </button>
              </div>

              {isLoadingYarnLots ? (
                <p className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  جارٍ تحميل الخيوط المرسلة...
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-3 py-3 text-right text-xs font-semibold">الخيط / التشغيلة</th>
                        <th className="w-40 px-3 py-3 text-right text-xs font-semibold">العدد</th>
                        <th className="w-40 px-3 py-3 text-right text-xs font-semibold">الوزن</th>
                        <th className="w-20 px-3 py-3 text-center text-xs font-semibold">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {form.details.map((detail, index) => (
                        <tr key={index}>
                          <td className="px-3 py-3">
                            <select required value={detail.yarnId} onChange={(event) => updateDetail(index, 'yarnId', event.target.value)} disabled={!form.factoryId || isLoadingYarnLots || yarnLots.length === 0} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm outline-none focus:border-sky-500 disabled:bg-slate-100" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                              <option value="">{form.factoryId ? 'اختر الخيط' : 'اختر المعمل أولاً'}</option>
                              {yarnLots.map((yarn, yarnIndex) => (
                                <option key={getYarnId(yarn) ?? yarnIndex} value={getYarnId(yarn)}>
                                  {yarn.yarnGender ?? yarn.YarnGender ?? '-'} - Lot: {yarn.yarnLot ?? yarn.YarnLot ?? '-'}
                                </option>
                              ))}
                            </select>
                            {form.factoryId && !isLoadingYarnLots && yarnLots.length === 0 ? <p className="mt-1 text-xs text-amber-700">لا توجد خيوط مرسلة لهذا المعمل.</p> : null}
                          </td>
                          <td className="px-3 py-3">
                            <input required type="number" min="0" step="1" value={detail.count} onChange={(event) => updateDetail(index, 'count', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                          </td>
                          <td className="px-3 py-3">
                            <input required type="number" min="0" step="0.01" value={detail.weight} onChange={(event) => updateDetail(index, 'weight', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button type="button" onClick={() => removeDetail(index)} disabled={form.details.length <= 1} aria-label={`حذف التفصيل ${index + 1}`} title="حذف السطر" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
            </>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button type="button" onClick={closeModal} disabled={isSaving} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">إلغاء</button>
            <button type="submit" disabled={isSaving || isLoadingYarnLots || isLoadingOperation} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSaving ? 'جارٍ الحفظ...' : operationId ? 'حفظ التعديلات' : 'حفظ الحركة'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default YarnReturnOperationModal
