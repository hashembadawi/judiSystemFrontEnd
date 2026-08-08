import { useEffect } from 'react'

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
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card order-modal-card">
        <h4>{form.id ? 'تعديل الطلبية' : 'اضافة طلبية جديدة'}</h4>

        {isLoading ? (
          <p className="table-state">جاري تحميل بيانات الطلبية...</p>
        ) : (
          <>
            <div className="modal-form-grid order-form-grid">
              <div className="field-group">
                <label htmlFor="orderNo">رقم الطلبية</label>
                <input
                  id="orderNo"
                  type="text"
                  value={form.orderNo}
                  onChange={(event) => onFieldChange('orderNo', event.target.value)}
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
              </div>

              <div className="field-group">
                <label htmlFor="customerName">اسم الزبون</label>
                <input
                  id="customerName"
                  type="text"
                  value={form.customerName}
                  onChange={(event) => onFieldChange('customerName', event.target.value)}
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
              </div>

              <div className="field-group">
                <label htmlFor="orderDate">تاريخ الطلبية</label>
                <input
                  id="orderDate"
                  type="date"
                  value={form.orderDate}
                  onChange={(event) => onFieldChange('orderDate', event.target.value)}
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
              </div>

              <div className="field-group">
                <label htmlFor="orderCreateStatus">الحالة</label>
                <select
                  id="orderCreateStatus"
                  value={form.status}
                  onChange={(event) => onFieldChange('status', Number(event.target.value))}
                  style={{ direction: 'ltr', textAlign: 'left' }}
                >
                  {ORDER_STATUS_OPTIONS.map((statusOption) => (
                    <option key={statusOption.value} value={statusOption.value}>
                      {statusOption.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group full-width">
                <label htmlFor="orderNotes">ملاحظات</label>
                <input
                  id="orderNotes"
                  type="text"
                  value={form.notes}
                  onChange={(event) => onFieldChange('notes', event.target.value)}
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
              </div>
            </div>

            <div className="order-details-header">
              <h5>تفاصيل الأقمشة</h5>
              <button type="button" className="secondary-btn" onClick={onAddDetail}>
                + اضافة نوع قماش
              </button>
            </div>

            {isFabricOptionsLoading ? (
              <p className="table-state">جاري تحميل أنواع الأقمشة...</p>
            ) : null}

            <div className="order-details-list">
              {form.details.map((detail, detailIndex) => (
                <div className="order-detail-card" key={`${detail.id || detailIndex}-detail`}>
                  <div className="order-detail-grid">
                    <div className="field-group">
                      <label htmlFor={`fabricGender-${detailIndex}`}>نوع القماش</label>
                      <select
                        id={`fabricGender-${detailIndex}`}
                        value={detail.fabricGender}
                        onChange={(event) =>
                          onDetailChange(detailIndex, 'fabricGender', event.target.value)
                        }
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      >
                        <option value="">اختر نوع القماش</option>
                        {[...new Set([detail.fabricGender, ...fabricOptions].filter(Boolean))].map(
                          (fabricOption) => (
                            <option key={fabricOption} value={fabricOption}>
                              {fabricOption}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div className="field-group">
                      <label htmlFor={`fabricGSM-${detailIndex}`}>GSM</label>
                      <input
                        id={`fabricGSM-${detailIndex}`}
                        type="number"
                        value={detail.fabricGSM}
                        onChange={(event) =>
                          onDetailChange(detailIndex, 'fabricGSM', event.target.value)
                        }
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`fabricWeightKg-${detailIndex}`}>الوزن (كغم)</label>
                      <input
                        id={`fabricWeightKg-${detailIndex}`}
                        type="number"
                        step="0.01"
                        value={detail.fabricWeightKg}
                        onChange={(event) =>
                          onDetailChange(detailIndex, 'fabricWeightKg', event.target.value)
                        }
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`fabricStatus-${detailIndex}`}>الحالة</label>
                      <select
                        id={`fabricStatus-${detailIndex}`}
                        value={detail.status}
                        onChange={(event) =>
                          onDetailChange(detailIndex, 'status', Number(event.target.value))
                        }
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      >
                        {ORDER_STATUS_OPTIONS.map((statusOption) => (
                          <option key={statusOption.value} value={statusOption.value}>
                            {statusOption.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group full-width">
                      <label htmlFor={`description-${detailIndex}`}>الوصف</label>
                      <input
                        id={`description-${detailIndex}`}
                        type="text"
                        value={detail.description}
                        onChange={(event) =>
                          onDetailChange(detailIndex, 'description', event.target.value)
                        }
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
                    </div>
                  </div>

                  <div className="order-detail-actions">
                    <button
                      type="button"
                      className="remove-detail-btn"
                      disabled={form.details.length === 1}
                      onClick={() => onRemoveDetail(detailIndex)}
                    >
                      حذف هذا السطر
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {error ? <p className="error-box inline-error">{error}</p> : null}
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            الغاء
          </button>
          <button
            type="button"
            disabled={isSaving || isFabricOptionsLoading || isLoading}
            onClick={onSave}
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default OrderModal
