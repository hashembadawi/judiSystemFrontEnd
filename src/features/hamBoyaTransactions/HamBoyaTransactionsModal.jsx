import { useEffect } from 'react'
import './HamBoyaTransactionsModal.css'

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
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card ham-boya-modal-card">
        <div className="ham-boya-modal-header">
          <div>
            <span className="ham-boya-modal-tag">حركة قماش</span>
            <h4>ارسال خام للمصابغ</h4>
          </div>
          <button
            type="button"
            className="ham-boya-close-btn"
            onClick={onClose}
            aria-label="اغلاق"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <p className="table-state">جاري تحميل الخيارات...</p>
        ) : (
          <>
            <section className="ham-boya-card-section">
              <div className="ham-boya-section-title">
                <h5>بيانات الحركة</h5>
              </div>
              <div className="ham-boya-modal-form-grid">
                <div className="ham-boya-field-group">
                  <label htmlFor="FaturaNo">رقم الفاتورة</label>
                  <input
                    id="FaturaNo"
                    type="text"
                    className="ham-boya-field-input"
                    value={form.FaturaNo}
                    onChange={(event) => onFieldChange('FaturaNo', event.target.value)}
                  />
                </div>

                <div className="ham-boya-field-group">
                  <label htmlFor="FactoryId">المصبغة</label>
                  <select
                    id="FactoryId"
                    className="ham-boya-field-input"
                    value={form.FactoryId}
                    onChange={(event) => onFieldChange('FactoryId', event.target.value)}
                  >
                    <option value="">اختر المصبغة</option>
                    {boyaFactoriesOptions.map((factory) => (
                      <option key={factory.id} value={factory.id}>
                        {factory.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ham-boya-field-group">
                  <label htmlFor="Date">التاريخ</label>
                  <input
                    id="Date"
                    type="date"
                    className="ham-boya-field-input"
                    value={form.Date}
                    onChange={(event) => onFieldChange('Date', event.target.value)}
                  />
                </div>

                <div className="ham-boya-field-group">
                  <label htmlFor="Writer">الكاتب</label>
                  <input
                    id="Writer"
                    type="text"
                    className="ham-boya-field-input"
                    value={form.Writer}
                    onChange={(event) => onFieldChange('Writer', event.target.value)}
                  />
                </div>

                <div className="ham-boya-field-group">
                  <label htmlFor="CarBLK">لوحة السيارة</label>
                  <input
                    id="CarBLK"
                    type="text"
                    className="ham-boya-field-input"
                    value={form.CarBLK ?? ''}
                    onChange={(event) => onFieldChange('CarBLK', event.target.value)}
                  />
                </div>

                <div className="ham-boya-field-group">
                  <label htmlFor="CarOwner">صاحب السيارة</label>
                  <input
                    id="CarOwner"
                    type="text"
                    className="ham-boya-field-input"
                    value={form.CarOwner}
                    onChange={(event) => onFieldChange('CarOwner', event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="ham-boya-card-section ham-boya-details-section">
              <div className="ham-boya-order-details-header">
                <h5>تفاصيل الحركة</h5>
                <button type="button" className="secondary-btn ham-boya-add-detail-btn" onClick={onAddDetailRow}>
                  إضافة تفاصيل
                </button>
              </div>

              {form.Details.map((detail, index) => (
                <div key={index} className="ham-boya-order-detail-card">
                  <div className="ham-boya-order-detail-grid">
                    <div className="ham-boya-field-group">
                      <label htmlFor={`detail-fabric-${index}`}>جنس القماش</label>
                      <select
                        id={`detail-fabric-${index}`}
                        className="ham-boya-field-input"
                        value={detail.FabricGender ?? ''}
                        onChange={(event) => onDetailFieldChange(index, 'FabricGender', event.target.value)}
                      >
                        <option value="">اختر القماش</option>
                        {hamFabricsOptions.map((fabric, optionIndex) => (
                          <option key={`${fabric}-${optionIndex}`} value={fabric || ''}>
                            {fabric}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="ham-boya-field-group">
                      <label htmlFor={`detail-lot-${index}`}>لوت القماش</label>
                      <input
                        id={`detail-lot-${index}`}
                        type="text"
                        className="ham-boya-field-input"
                        value={detail.FabricLot ?? detail.lot ?? detail.Lot ?? ''}
                        onChange={(event) => onDetailFieldChange(index, 'FabricLot', event.target.value)}
                      />
                    </div>

                    <div className="ham-boya-field-group">
                      <label htmlFor={`detail-gr-${index}`}>GR</label>
                      <input
                        id={`detail-gr-${index}`}
                        type="number"
                        className="ham-boya-field-input ham-boya-input-compact"
                        value={detail.FabricGr ?? detail.fabricGr ?? ''}
                        onChange={(event) => onDetailFieldChange(index, 'FabricGr', event.target.value)}
                      />
                    </div>

                    <div className="ham-boya-field-group">
                      <label htmlFor={`detail-order-${index}`}>رقم الطلبية</label>
                      <input
                        id={`detail-order-${index}`}
                        type="text"
                        className="ham-boya-field-input"
                        value={detail.OrderNo ?? ''}
                        onChange={(event) => onDetailFieldChange(index, 'OrderNo', event.target.value)}
                      />
                    </div>

                    <div className="ham-boya-field-group">
                      <label htmlFor={`detail-top-${index}`}>عدد الأثواب</label>
                      <input
                        id={`detail-top-${index}`}
                        type="number"
                        className="ham-boya-field-input ham-boya-input-compact"
                        value={detail.FabricTopCount}
                        onChange={(event) => onDetailFieldChange(index, 'FabricTopCount', event.target.value)}
                      />
                    </div>

                    <div className="ham-boya-field-group">
                      <label htmlFor={`detail-weight-${index}`}>الوزن</label>
                      <input
                        id={`detail-weight-${index}`}
                        type="number"
                        className="ham-boya-field-input ham-boya-input-compact"
                        value={detail.FabricWeight}
                        onChange={(event) => onDetailFieldChange(index, 'FabricWeight', event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ham-boya-order-detail-actions">
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

        <div className="ham-boya-modal-actions">
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

export default HamBoyaTransactionsModal
