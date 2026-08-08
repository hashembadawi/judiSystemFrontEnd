import { useEffect } from 'react'

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
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card order-modal-card">
        <h4>{form.id ? 'تعديل خيط' : 'اضافة خيط جديد'}</h4>

        <div className="modal-form-grid order-form-grid">
          <div className="field-group">
            <label htmlFor="yarnGender">نوع الخيط</label>
            <input
              id="yarnGender"
              type="text"
              value={form.yarnGender}
              onChange={(event) => onFieldChange('yarnGender', event.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="lot">LOT</label>
            <input
              id="lot"
              type="text"
              value={form.lot}
              onChange={(event) => onFieldChange('lot', event.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="count">العدد</label>
            <input
              id="count"
              type="number"
              value={form.count}
              onChange={(event) => onFieldChange('count', event.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="yarnType">نوع الخيط (yarnType)</label>
            <input
              id="yarnType"
              type="number"
              value={form.yarnType}
              onChange={(event) => onFieldChange('yarnType', event.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="netKg">الصافي KG</label>
            <input
              id="netKg"
              type="number"
              value={form.netKg}
              onChange={(event) => onFieldChange('netKg', event.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="brutKg">القائم KG</label>
            <input
              id="brutKg"
              type="number"
              value={form.brutKg}
              onChange={(event) => onFieldChange('brutKg', event.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="company">الشركة</label>
            <input
              id="company"
              type="text"
              value={form.company}
              onChange={(event) => onFieldChange('company', event.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="price">السعر</label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(event) => onFieldChange('price', event.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="faturaNo">رقم الفاتورة</label>
            <input
              id="faturaNo"
              type="text"
              value={form.faturaNo}
              onChange={(event) => onFieldChange('faturaNo', event.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="incomDate">تاريخ الاستلام</label>
            <input
              id="incomDate"
              type="date"
              value={form.incomDate || getTodayDate()}
              onChange={(event) => onFieldChange('incomDate', event.target.value)}
            />
          </div>
        </div>

        {error ? <p className="error-box inline-error">{error}</p> : null}

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            الغاء
          </button>
          <button type="button" disabled={isSaving} onClick={onSave}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default YarnModal
