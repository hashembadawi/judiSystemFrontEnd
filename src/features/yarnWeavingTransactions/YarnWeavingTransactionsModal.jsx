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
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card order-modal-card">
        <h4>إضافة حركة جديدة</h4>

        {isLoading ? (
          <p className="table-state">جاري تحميل الخيارات...</p>
        ) : (
          <>
            <div className="modal-form-grid order-form-grid">
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
                <label htmlFor="factoryId">المعمل</label>
                <select
                  id="factoryId"
                  value={form.factoryId}
                  onChange={(event) => onFieldChange('factoryId', event.target.value)}
                >
                  <option value="">اختر المعمل</option>
                  {factoryOptions.map((factory) => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="date">التاريخ</label>
                <input
                  id="date"
                  type="date"
                  value={form.date || getTodayDate()}
                  onChange={(event) => onFieldChange('date', event.target.value)}
                />
              </div>

              <div className="field-group">
                <label htmlFor="writer">الكاتب</label>
                <input
                  id="writer"
                  type="text"
                  value={form.writer}
                  onChange={(event) => onFieldChange('writer', event.target.value)}
                />
              </div>

              <div className="field-group">
                <label htmlFor="carBLK">لوحة السيارة</label>
                <input
                  id="carBLK"
                  type="text"
                  value={form.carBLK}
                  onChange={(event) => onFieldChange('carBLK', event.target.value)}
                />
              </div>

              <div className="field-group">
                <label htmlFor="carOwner">صاحب السيارة</label>
                <input
                  id="carOwner"
                  type="text"
                  value={form.carOwner}
                  onChange={(event) => onFieldChange('carOwner', event.target.value)}
                />
              </div>
            </div>

            <section className="order-details-list">
              <div className="order-details-header">
                <h5>تفاصيل الحركة</h5>
                <button type="button" className="secondary-btn" onClick={onAddDetailRow}>
                  إضافة تفاصيل
                </button>
              </div>

              {form.Details.map((detail, index) => (
                <div key={index} className="order-detail-card">
                  <div className="order-detail-grid">
                    <div className="field-group">
                      <label htmlFor={`detail-yarn-${index}`}>الخيط</label>
                      <select
                        id={`detail-yarn-${index}`}
                        value={detail.YarnId}
                        onChange={(event) => onDetailFieldChange(index, 'YarnId', event.target.value)}
                      >
                        <option value="">اختر الخيط</option>
                        {yarnOptions.map((yarn) => (
                          <option key={yarn.id} value={yarn.id}>
                            {yarn.yarnGender || yarn.name || yarn.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group">
                      <label htmlFor={`detail-lot-${index}`}>LOT</label>
                      <input
                        id={`detail-lot-${index}`}
                        type="text"
                        value={detail.Lot}
                        onChange={(event) => onDetailFieldChange(index, 'Lot', event.target.value)}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`detail-yarnType-${index}`}>نوع الخيط</label>
                      <input
                        id={`detail-yarnType-${index}`}
                        type="number"
                        value={detail.YarnType}
                        onChange={(event) => onDetailFieldChange(index, 'YarnType', event.target.value)}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`detail-count-${index}`}>العدد</label>
                      <input
                        id={`detail-count-${index}`}
                        type="number"
                        value={detail.Count}
                        onChange={(event) => onDetailFieldChange(index, 'Count', event.target.value)}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`detail-net-${index}`}>الصافي KG</label>
                      <input
                        id={`detail-net-${index}`}
                        type="number"
                        value={detail.NetKg}
                        onChange={(event) => onDetailFieldChange(index, 'NetKg', event.target.value)}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`detail-brut-${index}`}>القائم KG</label>
                      <input
                        id={`detail-brut-${index}`}
                        type="number"
                        value={detail.BrutKg}
                        onChange={(event) => onDetailFieldChange(index, 'BrutKg', event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="order-detail-actions">
                    <button
                      type="button"
                      className="remove-detail-btn"
                      onClick={() => onRemoveDetailRow(index)}
                      disabled={form.Details.length === 1}
                    >
                      حذف السطر
                    </button>
                  </div>
                </div>
              ))}
            </section>

            {error ? <p className="error-box inline-error">{error}</p> : null}
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            الغاء
          </button>
          <button type="button" disabled={isSaving || isLoading} onClick={onSave}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default YarnWeavingTransactionsModal
