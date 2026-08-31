import { useEffect } from 'react'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

const getTodayDate = () => new Date().toISOString().slice(0, 10)

function YarnModal({
  isOpen,
  isSaving,
  error,
  form,
  onFieldChange,
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
        <section className="w-full max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200 sm:max-w-5xl" dir="rtl">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">الخيط</p>
              <h4 className="mt-1 text-xl font-semibold text-slate-900">{form.id ? 'تعديل خيط' : 'إضافة خيط جديد'}</h4>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 text-right">
                <label htmlFor="yarnGender" className="block text-sm font-medium text-slate-700">نوع الخيط</label>
                <input
                  id="yarnGender"
                  type="text"
                  value={form.yarnGender}
                  onChange={(event) => onFieldChange('yarnGender', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2 text-right">
                <label htmlFor="lot" className="block text-sm font-medium text-slate-700">LOT</label>
                <input
                  id="lot"
                  type="text"
                  value={form.lot}
                  onChange={(event) => onFieldChange('lot', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2 text-right">
                <label htmlFor="count" className="block text-sm font-medium text-slate-700">العدد</label>
                <input
                  id="count"
                  type="number"
                  value={form.count}
                  onChange={(event) => onFieldChange('count', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2 text-right">
                <label htmlFor="yarnType" className="block text-sm font-medium text-slate-700">نوع الخيط</label>
                <input
                  id="yarnType"
                  type="number"
                  value={form.yarnType}
                  onChange={(event) => onFieldChange('yarnType', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2 text-right">
                <label htmlFor="netKg" className="block text-sm font-medium text-slate-700">الصافي KG</label>
                <input
                  id="netKg"
                  type="number"
                  value={form.netKg}
                  onChange={(event) => onFieldChange('netKg', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2 text-right">
                <label htmlFor="brutKg" className="block text-sm font-medium text-slate-700">القائم KG</label>
                <input
                  id="brutKg"
                  type="number"
                  value={form.brutKg}
                  onChange={(event) => onFieldChange('brutKg', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2 text-right">
                <label htmlFor="loss" className="block text-sm font-medium text-slate-700">نسبة الخياس</label>
                <input
                  id="loss"
                  type="number"
                  step="0.01"
                  value={form.loss}
                  onChange={(event) => onFieldChange('loss', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2 text-right">
                <label htmlFor="ne" className="block text-sm font-medium text-slate-700">NE</label>
                <input
                  id="ne"
                  type="number"
                  step="0.01"
                  value={form.ne}
                  onChange={(event) => onFieldChange('ne', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2 text-right">
                <label htmlFor="company" className="block text-sm font-medium text-slate-700">الشركة</label>
                <input
                  id="company"
                  type="text"
                  value={form.company}
                  onChange={(event) => onFieldChange('company', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2 text-right">
                <label htmlFor="price" className="block text-sm font-medium text-slate-700">السعر</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => onFieldChange('price', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2 text-right">
                <label htmlFor="faturaNo" className="block text-sm font-medium text-slate-700">رقم الفاتورة</label>
                <input
                  id="faturaNo"
                  type="text"
                  value={form.faturaNo}
                  onChange={(event) => onFieldChange('faturaNo', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2 text-right">
                <label htmlFor="incomDate" className="block text-sm font-medium text-slate-700">تاريخ الاستلام</label>
                <input
                  id="incomDate"
                  type="date"
                  value={form.incomDate || getTodayDate()}
                  onChange={(event) => onFieldChange('incomDate', event.target.value)}
                  className={`${buildInputClasses(false)} w-full`}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="border-t border-slate-200 bg-red-50 px-4 py-4 text-sm text-red-800 sm:px-6">{error}</div>
          ) : null}

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button type="button" className={buildButtonClasses('secondary')} onClick={onClose}>إلغاء</button>
            <button type="button" disabled={isSaving} className={buildButtonClasses('primary')} onClick={onSave}>
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default YarnModal
