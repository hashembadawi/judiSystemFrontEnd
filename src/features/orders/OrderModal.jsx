import { useEffect } from 'react'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

const ORDER_STATUS_OPTIONS = [
  { value: 1, label: 'مفتوحة' },
  { value: 2, label: 'جاري العمل' },
  { value: 3, label: 'ملغاة بالكامل' },
  { value: 4, label: 'ملغاة بشكل جزئي' },
  { value: 5, label: 'مكتملة' },
]

function OrderModal({
  isOpen,
  isLoading,
  isSaving,
  isFabricOptionsLoading,
  error,
  form,
  fabricOptions,
  onFieldChange,
  onDetailChange,
  onAddDetail,
  onRemoveDetail,
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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative flex min-h-full items-start justify-center p-0 pt-4 sm:p-4 sm:pt-8">
        <section className="w-full max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200 sm:max-w-6xl">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
            <div>
              <h4 className="mt-1 text-xl font-semibold text-slate-900">{form.id ? 'تعديل الطلبية' : 'اضافة طلبية جديدة'}</h4>
            </div>
            <button
              type="button"
              className="text-2xl leading-none text-slate-400 transition hover:text-slate-600"
              onClick={onClose}
              aria-label="اغلاق"
            >
              ×
            </button>
          </header>

          {isLoading ? (
            <div className="px-4 py-12 text-center text-slate-500 sm:px-6">جاري تحميل بيانات الطلبية...</div>
          ) : (
            <>
              <section className="border-b border-slate-200 px-4 py-5 sm:px-6">
                <div className="mb-4">
                  <h5 className="text-base font-semibold text-slate-900">بيانات الطلبية</h5>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="space-y-2 md:col-span-1">
                    <label htmlFor="orderNo" className="block text-sm font-medium text-slate-700">رقم الطلبية</label>
                    <input
                      id="orderNo"
                      type="text"
                      value={form.orderNo}
                      onChange={(event) => onFieldChange('orderNo', event.target.value)}
                      className={`${buildInputClasses(false)} w-full`}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <label htmlFor="customerName" className="block text-sm font-medium text-slate-700">اسم الزبون</label>
                    <input
                      id="customerName"
                      type="text"
                      value={form.customerName}
                      onChange={(event) => onFieldChange('customerName', event.target.value)}
                      className={`${buildInputClasses(false)} w-full`}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <label htmlFor="orderDate" className="block text-sm font-medium text-slate-700">تاريخ الطلبية</label>
                    <input
                      id="orderDate"
                      type="date"
                      value={form.orderDate}
                      onChange={(event) => onFieldChange('orderDate', event.target.value)}
                      className={`${buildInputClasses(false)} w-full`}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <label htmlFor="orderCreateStatus" className="block text-sm font-medium text-slate-700">الحالة</label>
                    <select
                      id="orderCreateStatus"
                      value={form.status}
                      onChange={(event) => onFieldChange('status', Number(event.target.value))}
                      className={`${buildInputClasses(false)} w-full`}
                    >
                      {ORDER_STATUS_OPTIONS.map((statusOption) => (
                        <option key={statusOption.value} value={statusOption.value}>
                          {statusOption.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-4">
                    <label htmlFor="orderNotes" className="block text-sm font-medium text-slate-700">ملاحظات</label>
                    <input
                      id="orderNotes"
                      type="text"
                      value={form.notes}
                      onChange={(event) => onFieldChange('notes', event.target.value)}
                      className={`${buildInputClasses(false)} w-full`}
                    />
                  </div>
                </div>
              </section>

              <section className="px-4 py-5 sm:px-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h5 className="text-base font-semibold text-slate-900">تفاصيل الأقمشة</h5>
                  <button type="button" className={buildButtonClasses('secondary')} onClick={onAddDetail}>
                    + اضافة نوع قماش
                  </button>
                </div>

                {isFabricOptionsLoading ? (
                  <div className="mb-4 text-sm text-slate-500">جاري تحميل أنواع الأقمشة...</div>
                ) : null}

                <div className="space-y-4">
                  {form.details.map((detail, detailIndex) => (
                    <div key={`${detail.id || detailIndex}-detail`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3">
                        <label htmlFor={`fabricGender-${detailIndex}`} className="mb-2 block text-sm font-medium text-slate-700">جنس القماش</label>
                        <select
                          id={`fabricGender-${detailIndex}`}
                          value={detail.fabricGender}
                          onChange={(event) => onDetailChange(detailIndex, 'fabricGender', event.target.value)}
                          className={`${buildInputClasses(false)} w-full`}
                          dir="auto"
                          style={{ unicodeBidi: 'plaintext', textAlign: 'right', direction: 'ltr' }}
                        >
                          <option value="">اختر جنس القماش</option>
                          {[...new Set([detail.fabricGender, ...fabricOptions].filter(Boolean))].map((fabricOption) => (
                            <option key={fabricOption} value={fabricOption}>
                              {fabricOption}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <label htmlFor={`fabricGSM-${detailIndex}`} className="block text-sm font-medium text-slate-700">GR</label>
                          <input
                            id={`fabricGSM-${detailIndex}`}
                            type="number"
                            value={detail.fabricGSM}
                            onChange={(event) => onDetailChange(detailIndex, 'fabricGSM', event.target.value)}
                            className={`${buildInputClasses(false)} w-full`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor={`fabricWeightKg-${detailIndex}`} className="block text-sm font-medium text-slate-700">الوزن (كغم)</label>
                          <input
                            id={`fabricWeightKg-${detailIndex}`}
                            type="number"
                            step="0.01"
                            value={detail.fabricWeightKg}
                            onChange={(event) => onDetailChange(detailIndex, 'fabricWeightKg', event.target.value)}
                            className={`${buildInputClasses(false)} w-full`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor={`fabricStatus-${detailIndex}`} className="block text-sm font-medium text-slate-700">الحالة</label>
                          <select
                            id={`fabricStatus-${detailIndex}`}
                            value={detail.status}
                            onChange={(event) => onDetailChange(detailIndex, 'status', Number(event.target.value))}
                            className={`${buildInputClasses(false)} w-full`}
                          >
                            {ORDER_STATUS_OPTIONS.map((statusOption) => (
                              <option key={statusOption.value} value={statusOption.value}>
                                {statusOption.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label htmlFor={`description-${detailIndex}`} className="mb-2 block text-sm font-medium text-slate-700">الوصف</label>
                        <input
                          id={`description-${detailIndex}`}
                          type="text"
                          value={detail.description}
                          onChange={(event) => onDetailChange(detailIndex, 'description', event.target.value)}
                          className={`${buildInputClasses(false)} w-full`}
                        />
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={form.details.length === 1}
                          onClick={() => onRemoveDetail(detailIndex)}
                        >
                          حذف هذا السطر
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {error ? (
                <div className="border-t border-slate-200 bg-red-50 px-4 py-4 text-sm text-red-800 sm:px-6">{error}</div>
              ) : null}
            </>
          )}

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button type="button" className={buildButtonClasses('secondary')} onClick={onClose}>الغاء</button>
            <button
              type="button"
              disabled={isSaving || isFabricOptionsLoading || isLoading}
              className={buildButtonClasses('primary')}
              onClick={onSave}
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default OrderModal
