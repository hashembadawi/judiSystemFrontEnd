import { useEffect } from 'react'

const getTodayDate = () => new Date().toISOString().slice(0, 10)

function YarnWeavingTransactionsModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  yarnOptions,
  factoryOptions,
  onFieldChange,
  onDetailFieldChange,
  onAddDetailRow,
  onRemoveDetailRow,
  onClose,
  onSave,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && !isSaving) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSaving, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-6" role="dialog" aria-modal="true" dir="rtl" style={{ direction: 'rtl' }}>
      <section className="relative w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="text-right">
            <h4 className="mt-2 text-xl font-semibold text-slate-900">إضافة حركة جديدة</h4>
          </div>
          <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" onClick={onClose} aria-label="Kapat">×</button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">جارٍ تحميل الخيارات...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="faturaNo" className="block text-xs font-medium text-slate-600 text-right">رقم الفاتورة</label>
                  <input
                    id="faturaNo"
                    type="text"
                    value={form.faturaNo}
                    onChange={(event) => onFieldChange('faturaNo', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="factoryId" className="block text-xs font-medium text-slate-600 text-right">المعمل</label>
                  <select
                    id="factoryId"
                    value={form.factoryId}
                    onChange={(event) => onFieldChange('factoryId', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  >
                    <option value="">اختر المعمل</option>
                    {factoryOptions.map((factory) => (
                      <option key={factory.id} value={factory.id}>
                        {factory.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="date" className="block text-xs font-medium text-slate-600 text-right">التاريخ</label>
                  <input
                    id="date"
                    type="date"
                    value={form.date || getTodayDate()}
                    onChange={(event) => onFieldChange('date', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="writer" className="block text-xs font-medium text-slate-600 text-right">الكاتب</label>
                  <input
                    id="writer"
                    type="text"
                    value={form.writer}
                    onChange={(event) => onFieldChange('writer', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="carBLK" className="block text-xs font-medium text-slate-600 text-right">رقم لوحة السيارة</label>
                  <input
                    id="carBLK"
                    type="text"
                    value={form.carBLK}
                    onChange={(event) => onFieldChange('carBLK', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="carOwner" className="block text-xs font-medium text-slate-600 text-right">مالك السيارة</label>
                  <input
                    id="carOwner"
                    type="text"
                    value={form.carOwner}
                    onChange={(event) => onFieldChange('carOwner', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>
              </div>

              <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h5 className="text-base font-semibold text-slate-800 text-right">تفاصيل الحركة</h5>
                  <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={onAddDetailRow}>
                    إضافة تفصيل
                  </button>
                </div>

                <div className="space-y-4">
                  {form.Details.map((detail, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label htmlFor={`detail-yarn-${index}`} className="block text-xs font-medium text-slate-600 text-right">الخيط</label>
                          <select
                            id={`detail-yarn-${index}`}
                            value={detail.YarnId}
                            onChange={(event) => onDetailFieldChange(index, 'YarnId', event.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                            style={{ direction: 'ltr', textAlign: 'left' }}
                          >
                            <option value="">اختر الخيط</option>
                            {yarnOptions.map((yarn) => {
                              const yarnId = yarn.id ?? yarn.yarnId
                              const yarnGender = yarn.yarnGender ?? yarn.YarnGender ?? yarn.name ?? yarnId
                              const yarnLot = yarn.yarnLot ?? yarn.lot ?? yarn.Lot ?? '-'

                              return (
                                <option key={yarnId} value={yarnId}>
                                  {yarnGender} - Lot : {yarnLot}
                                </option>
                              )
                            })}
                          </select>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-1.5">
                          <label htmlFor={`detail-yarnType-${index}`} className="block text-xs font-medium text-slate-600 text-right">نوع الخيط</label>
                          <input
                            id={`detail-yarnType-${index}`}
                            type="number"
                            value={detail.YarnType}
                            onChange={(event) => onDetailFieldChange(index, 'YarnType', event.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                            style={{ direction: 'ltr', textAlign: 'left' }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor={`detail-count-${index}`} className="block text-xs font-medium text-slate-600 text-right">العدد</label>
                          <input
                            id={`detail-count-${index}`}
                            type="number"
                            value={detail.Count}
                            onChange={(event) => onDetailFieldChange(index, 'Count', event.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                            style={{ direction: 'ltr', textAlign: 'left' }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor={`detail-net-${index}`} className="block text-xs font-medium text-slate-600 text-right">الوزن الصافي كجم</label>
                          <input
                            id={`detail-net-${index}`}
                            type="number"
                            value={detail.NetKg}
                            onChange={(event) => onDetailFieldChange(index, 'NetKg', event.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                            style={{ direction: 'ltr', textAlign: 'left' }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor={`detail-brut-${index}`} className="block text-xs font-medium text-slate-600 text-right">الوزن الإجمالي كجم</label>
                          <input
                            id={`detail-brut-${index}`}
                            type="number"
                            value={detail.BrutKg}
                            onChange={(event) => onDetailFieldChange(index, 'BrutKg', event.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                            style={{ direction: 'ltr', textAlign: 'left' }}
                          />
                        </div>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => onRemoveDetailRow(index)}
                          disabled={form.Details.length === 1}
                        >
                          حذف الصف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 text-left">{error}</p> : null}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" disabled={isSaving || isLoading} onClick={onSave} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default YarnWeavingTransactionsModal
