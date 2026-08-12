import { useEffect } from 'react'
import './FasonFabricTransactionModal.css'

function FasonFabricTransactionModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  factoryOptions,
  weavingOrdersByRow,
  fabricsByRow,
  fabricTypeOptions,
  apiRequest,
  onFieldChange,
  onDetailFieldChange,
  onFactorySelect,
  onWeavingOrderSelect,
  onFabricSelect,
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
      <section className="modal-card order-modal-card fason-modal">
        <h4>FASON KUMAŞ HAREKETİ EKLE</h4>

        {isLoading ? (
          <p className="table-state">Seçenekler yükleniyor...</p>
        ) : (
          <>
            <div className="modal-form-grid order-form-grid">
              <div className="field-group">
                <label htmlFor="fasonShift">Vardiya</label>
                <select
                  id="fasonShift"
                  value={form.Shift ?? 'A'}
                  onChange={(event) => onFieldChange('Shift', event.target.value)}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="fasonDate">Tarih</label>
                <input
                  id="fasonDate"
                  type="date"
                  value={form.Date ?? ''}
                  onChange={(event) => onFieldChange('Date', event.target.value)}
                />
              </div>

              <div className="field-group">
                <label htmlFor="fasonPersonal">Personel</label>
                <input
                  id="fasonPersonal"
                  type="text"
                  value={form.Personal ?? ''}
                  onChange={(event) => onFieldChange('Personal', event.target.value)}
                />
              </div>
            </div>

            <section className="order-details-list">
              <div className="order-details-header">
                <h5>Detaylar</h5>
                <div style={{ marginTop: '10px' }}>
                  <button type="button" className="secondary-btn" onClick={onAddDetailRow}>
                    + Satır Ekle
                  </button>
                </div>
              </div>

              <div className="order-details-table-wrapper">
                <table className="order-details-table" style={{ direction: 'ltr' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Fabrika</th>
                      <th style={{ textAlign: 'left' }}>Dokuma Siparişi</th>
                      <th style={{ textAlign: 'left' }}>Kumaş Cinsi</th>
                      <th style={{ textAlign: 'left' }}>GR</th>
                      <th style={{ textAlign: 'left' }}>LOT</th>
                      <th style={{ textAlign: 'left' }}>Adet</th>
                      <th style={{ textAlign: 'left' }}>Ağırlık</th>
                      <th style={{ textAlign: 'left' }}>Tip</th>
                      <th style={{ textAlign: 'left' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.Details ?? []).map((detail, index) => (
                      <tr key={index}>
                        <td>
                          <select
                            value={detail.FactoryId ?? ''}
                            onChange={(event) => onFactorySelect(index, event.target.value)}
                            className="input-small"
                          >
                            <option value="">Fabrika seçin</option>
                            {factoryOptions.map((factory) => (
                              <option key={factory.id ?? factory.value ?? factory} value={factory.id ?? factory.value ?? factory}>
                                {factory.name ?? factory.factoryName ?? factory.valueName ?? factory.value ?? factory}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={detail.OrderId ?? ''}
                            onChange={(event) => onWeavingOrderSelect(index, event.target.value)}
                            disabled={!detail.FactoryId}
                            className="input-small"
                          >
                            <option value="">Sipariş seçin</option>
                            {(weavingOrdersByRow[index] ?? []).map((order) => (
                              <option key={order.id ?? order.value ?? order.name} value={order.id ?? order.value ?? order.name}>
                                {order.name ?? order.label ?? String(order.id ?? order.value ?? order.name)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={detail.FabricGender ?? ''}
                            onChange={(event) => onFabricSelect(index, event.target.value)}
                            disabled={!detail.OrderId}
                            className="input-small"
                          >
                            <option value="">Kumaş seçin</option>
                            {(fabricsByRow[index] ?? []).map((item, itemIndex) => {
                              const fabricGender = item?.fabricGender ?? item?.FabricGender ?? ''
                              return (
                                <option key={`${fabricGender}-${itemIndex}`} value={fabricGender}>
                                  {fabricGender}
                                </option>
                              )
                            })}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={detail.FabricGSM ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'FabricGSM', event.target.value)}
                            className="input-small"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={detail.FabricLot ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'FabricLot', event.target.value)}
                            className="input-small"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={detail.Count ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'Count', event.target.value)}
                            className="input-small"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={detail.Weight ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'Weight', event.target.value)}
                            className="input-small"
                          />
                        </td>
                        <td>
                          <select
                            value={detail.FabricType ?? 1}
                            onChange={(event) => onDetailFieldChange(index, 'FabricType', Number(event.target.value))}
                            className="input-small"
                          >
                            {(fabricTypeOptions ?? []).map((option) => (
                              <option key={option.id ?? option.value ?? option.text} value={option.id ?? option.value ?? option.text}>
                                {option.text ?? option.label ?? option.name ?? option.id ?? option.value ?? option.text}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="action-btn delete"
                              onClick={() => onRemoveDetailRow(index)}
                              title="Satırı sil"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {error ? <p className="error-box inline-error">{error}</p> : null}
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose} disabled={isSaving || isLoading}>
            İptal
          </button>
          <button type="button" disabled={isSaving || isLoading} onClick={onSave}>
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default FasonFabricTransactionModal
