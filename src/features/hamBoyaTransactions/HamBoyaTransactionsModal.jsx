import { useEffect } from 'react'

function HamBoyaTransactionsModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  customerOrdersOptions,
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
      <section className="modal-card order-modal-card">
        <h4>اضافة حركة جديدة</h4>

        {isLoading ? (
          <p className="table-state">جاري تحميل الخيارات...</p>
        ) : (
          <>
            <div className="modal-form-grid order-form-grid">
              <div className="field-group">
                <label htmlFor="FaturaNo">رقم الفاتورة</label>
                <input
                  id="FaturaNo"
                  type="text"
                  value={form.FaturaNo}
                  onChange={(event) => onFieldChange('FaturaNo', event.target.value)}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="field-group">
                <label htmlFor="FactoryId">المصبغة</label>
                <select
                  id="FactoryId"
                  value={form.FactoryId}
                  onChange={(event) => onFieldChange('FactoryId', event.target.value)}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                >
                  <option value="">اختر المصبغة</option>
                  {boyaFactoriesOptions.map((factory) => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="Date">التاريخ</label>
                <input
                  id="Date"
                  type="date"
                  value={form.Date}
                  onChange={(event) => onFieldChange('Date', event.target.value)}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="field-group">
                <label htmlFor="Writer">الكاتب</label>
                <input
                  id="Writer"
                  type="text"
                  value={form.Writer}
                  onChange={(event) => onFieldChange('Writer', event.target.value)}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="field-group">
                <label htmlFor="CarBLK">لوحة السيارة</label>
                <input
                  id="CarBLK"
                  type="text"
                  value={form.CarBLK ?? ''}
                  onChange={(event) => onFieldChange('CarBLK', event.target.value)}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="field-group">
                <label htmlFor="CarOwner">صاحب السيارة</label>
                <input
                  id="CarOwner"
                  type="text"
                  value={form.CarOwner}
                  onChange={(event) => onFieldChange('CarOwner', event.target.value)}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
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
                      <label htmlFor={`detail-order-${index}`}>رقم الطلبية</label>
                      <input
                        id={`detail-order-${index}`}
                        type="text"
                        value={detail.OrderNo ?? ''}
                        onChange={(event) => onDetailFieldChange(index, 'OrderNo', event.target.value)}
                        placeholder="أدخل رقم الطلبية"
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`detail-fabric-${index}`}>جنس القماش</label>
                      <select
                        id={`detail-fabric-${index}`}
                        value={detail.FabricGender ?? ''}
                        onChange={(event) => onDetailFieldChange(index, 'FabricGender', event.target.value)}
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                      >
                        <option value="">اختر القماش</option>
                        {hamFabricsOptions.map((fabric, optionIndex) => (
                          <option key={`${fabric}-${optionIndex}`} value={fabric || ''}>
                            {fabric}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group">
                      <label htmlFor={`detail-weight-${index}`}>الوزن</label>
                      <input
                        id={`detail-weight-${index}`}
                        type="number"
                        value={detail.FabricWeight}
                        onChange={(event) => onDetailFieldChange(index, 'FabricWeight', event.target.value)}
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`detail-top-${index}`}>عدد الأثواب</label>
                      <input
                        id={`detail-top-${index}`}
                        type="number"
                        value={detail.FabricTopCount}
                        onChange={(event) => onDetailFieldChange(index, 'FabricTopCount', event.target.value)}
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`detail-lot-${index}`}>لوت القماش</label>
                      <input
                        id={`detail-lot-${index}`}
                        type="text"
                        value={detail.FabricLot ?? detail.lot ?? ''}
                        onChange={(event) => onDetailFieldChange(index, 'FabricLot', event.target.value)}
                        placeholder="أدخل لوت القماش"
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
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

export default HamBoyaTransactionsModal
