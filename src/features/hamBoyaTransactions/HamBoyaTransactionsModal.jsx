import { useEffect } from 'react'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

function HamBoyaTransactionsModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  boyaFactoriesOptions,
  hamFabricsOptions,
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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative flex min-h-full items-start justify-center p-0 pt-4 sm:p-4 sm:pt-8">
        <section className="w-full max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200 max-w-6xl" dir="rtl" style={{ direction: 'rtl' }}>
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6" dir="rtl">
            <div className="text-right">
              <h4 className="mt-1 text-xl font-semibold text-slate-900 text-right">إرسال خام للمصابغ</h4>
            </div>
            <button
              type="button"
              className="text-2xl leading-none text-slate-400 transition hover:text-slate-600"
              onClick={onClose}
              aria-label="إغلاق"
            >
              ×
            </button>
          </header>

          <div className="px-4 py-5 sm:px-6">
            {isLoading ? (
              <p className="py-8 text-center text-slate-500">جاري تحميل الخيارات...</p>
            ) : (
              <>
                <section className="mb-6 space-y-3" dir="rtl">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-6" dir="rtl">
                    <div className="space-y-2" dir="rtl">
                      <label htmlFor="FaturaNo" className="block text-sm font-medium text-slate-700 text-right">رقم الفاتورة</label>
                      <input
                        id="FaturaNo"
                        type="text"
                        value={form.FaturaNo}
                        onChange={(event) => onFieldChange('FaturaNo', event.target.value)}
                        className={buildInputClasses(false)}
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                      />
                    </div>

                    <div className="space-y-2" dir="rtl">
                      <label htmlFor="FactoryId" className="block text-sm font-medium text-slate-700 text-right">المصبغة</label>
                      <select
                        id="FactoryId"
                        value={form.FactoryId}
                        onChange={(event) => onFieldChange('FactoryId', event.target.value)}
                        className={buildInputClasses(false)}
                      >
                        <option value="">اختر المصبغة</option>
                        {boyaFactoriesOptions.map((factory) => (
                          <option key={factory.id} value={factory.id}>
                            {factory.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2" dir="rtl">
                      <label htmlFor="Date" className="block text-sm font-medium text-slate-700 text-right">التاريخ</label>
                      <input
                        id="Date"
                        type="date"
                        value={form.Date}
                        onChange={(event) => onFieldChange('Date', event.target.value)}
                        className={buildInputClasses(false)}
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                      />
                    </div>

                    <div className="space-y-2" dir="rtl">
                      <label htmlFor="Writer" className="block text-sm font-medium text-slate-700 text-right">الكاتب</label>
                      <input
                        id="Writer"
                        type="text"
                        value={form.Writer}
                        onChange={(event) => onFieldChange('Writer', event.target.value)}
                        className={buildInputClasses(false)}
                      />
                    </div>

                    <div className="space-y-2" dir="rtl">
                      <label htmlFor="CarBLK" className="block text-sm font-medium text-slate-700 text-right">لوحة السيارة</label>
                      <input
                        id="CarBLK"
                        type="text"
                        value={form.CarBLK ?? ''}
                        onChange={(event) => onFieldChange('CarBLK', event.target.value)}
                        className={buildInputClasses(false)}
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                      />
                    </div>

                    <div className="space-y-2" dir="rtl">
                      <label htmlFor="CarOwner" className="block text-sm font-medium text-slate-700 text-right">صاحب السيارة</label>
                      <input
                        id="CarOwner"
                        type="text"
                        value={form.CarOwner}
                        onChange={(event) => onFieldChange('CarOwner', event.target.value)}
                        className={buildInputClasses(false)}
                      />
                    </div>
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-5 space-y-3" dir="rtl">
                  <div className="flex items-center justify-between pb-2" dir="rtl">
                    <h5 className="text-lg font-semibold text-slate-900 text-right">تفاصيل الحركة</h5>
                    <button type="button" className={buildButtonClasses('secondary')} onClick={onAddDetailRow}>
                      إضافة تفاصيل
                    </button>
                  </div>

                  {form.Details.map((detail, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4" dir="rtl">
                      <div className="space-y-3" dir="rtl">
                        {/* جنس القماش في سطر منفصل */}
                        <div className="space-y-2" dir="ltr">
                          <label htmlFor={`detail-fabric-${index}`} className="block text-sm font-medium text-slate-700 text-right">جنس القماش</label>
                          <select
                            id={`detail-fabric-${index}`}
                            value={detail.FabricGender ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'FabricGender', event.target.value)}
                            className={`${buildInputClasses(false)} w-full text-sm`}
                          >
                            <option value="">اختر القماش</option>
                            {hamFabricsOptions.map((fabric, optionIndex) => (
                              <option key={`${fabric}-${optionIndex}`} value={fabric || ''}>
                                {fabric}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* باقي الحقول في سطر واحد */}
                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" dir="rtl">
                          <div className="space-y-2" dir="rtl">
                            <label htmlFor={`detail-lot-${index}`} className="block text-sm font-medium text-slate-700 text-right">لوت القماش</label>
                            <input
                              id={`detail-lot-${index}`}
                              type="text"
                              value={detail.FabricLot ?? detail.lot ?? detail.Lot ?? ''}
                              onChange={(event) => onDetailFieldChange(index, 'FabricLot', event.target.value)}
                              className={`${buildInputClasses(false)} w-full text-sm`}
                            />
                          </div>

                          <div className="space-y-2" dir="rtl">
                            <label htmlFor={`detail-gr-${index}`} className="block text-sm font-medium text-slate-700 text-right">GR</label>
                            <input
                              id={`detail-gr-${index}`}
                              type="number"
                              value={detail.FabricGr ?? detail.fabricGr ?? ''}
                              onChange={(event) => onDetailFieldChange(index, 'FabricGr', event.target.value)}
                              className={`${buildInputClasses(false)} w-full text-sm`}
                              dir="ltr"
                              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                            />
                          </div>

                          <div className="space-y-2" dir="rtl">
                            <label htmlFor={`detail-weight-${index}`} className="block text-sm font-medium text-slate-700 text-right">الوزن</label>
                            <input
                              id={`detail-weight-${index}`}
                              type="number"
                              value={detail.FabricWeight}
                              onChange={(event) => onDetailFieldChange(index, 'FabricWeight', event.target.value)}
                              className={`${buildInputClasses(false)} w-full text-sm`}
                              dir="ltr"
                              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                            />
                          </div>

                          <div className="space-y-2" dir="rtl">
                            <label htmlFor={`detail-top-${index}`} className="block text-sm font-medium text-slate-700 text-right">عدد الأثواب</label>
                            <input
                              id={`detail-top-${index}`}
                              type="number"
                              value={detail.FabricTopCount}
                              onChange={(event) => onDetailFieldChange(index, 'FabricTopCount', event.target.value)}
                              className={`${buildInputClasses(false)} w-full text-sm`}
                              dir="ltr"
                              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                            />
                          </div>

                          <div className="space-y-2" dir="rtl">
                            <label htmlFor={`detail-order-${index}`} className="block text-sm font-medium text-slate-700 text-right">رقم الطلبية</label>
                            <input
                              id={`detail-order-${index}`}
                              type="text"
                              value={detail.OrderNo ?? ''}
                              onChange={(event) => onDetailFieldChange(index, 'OrderNo', event.target.value)}
                              className={`${buildInputClasses(false)} w-full text-sm`}
                              dir="ltr"
                              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-300 flex justify-start" dir="rtl">
                        <button
                          type="button"
                          onClick={() => onRemoveDetailRow(index)}
                          disabled={form.Details.length === 1}
                          className="inline-flex h-8 px-4 items-center rounded-md border border-red-300 bg-red-50 text-red-600 text-sm font-medium transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          حذف السطر
                        </button>
                      </div>
                    </div>
                  ))}
                </section>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 mt-6 text-right" dir="rtl">{error}</div>
                ) : null}
              </>
            )}
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-start sm:px-6" dir="rtl">
            <button type="button" className={buildButtonClasses('secondary')} onClick={onClose} disabled={isSaving || isLoading}>
              إلغاء
            </button>
            <button type="button" disabled={isSaving || isLoading} className={buildButtonClasses('primary')} onClick={onSave}>
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default HamBoyaTransactionsModal
