import { useEffect } from 'react'

function OrderFactoryTransactionsModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  boyaFactoriesOptions,
  fabricTypesOptions,
  onFieldChange,
  onDetailFieldChange,
  onAddDetailRow,
  onCopyDetailRow,
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

  const handleRemoveDetailRow = (index) => {
    const confirmed = window.confirm('Bu detay satırını silmek istediğinizden emin misiniz?')
    if (!confirmed) {
      return
    }

    onRemoveDetailRow(index)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card order-modal-card">
        <h4>Yeni Hareket Ekle</h4>

        {isLoading ? (
          <p className="table-state">Seçenekler yükleniyor...</p>
        ) : (
          <>
            <div className="modal-form-grid order-form-grid">
              <div className="field-group">
                <label htmlFor="OrderNo">Sipariş No</label>
                <input
                  id="OrderNo"
                  type="text"
                  value={form.OrderNo ?? ''}
                  onChange={(event) => onFieldChange('OrderNo', event.target.value)}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>

              <div className="field-group">
                <label htmlFor="FactoryId">Boya Fabrikası</label>
                <select
                  id="FactoryId"
                  value={form.FactoryId}
                  onChange={(event) => onFieldChange('FactoryId', event.target.value)}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                >
                  <option value="">Boya fabrikasını seçin</option>
                  {boyaFactoriesOptions.map((factory) => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="Date">Tarih</label>
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
                <label htmlFor="TransactionStatus">Hareket Durumu</label>
                <select
                  id="TransactionStatus"
                  value={form.TransactionStatus}
                  onChange={(event) => onFieldChange('TransactionStatus', event.target.value)}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                >
                  <option value={1}>Açık</option>
                  <option value={2}>Tamamlandı</option>
                  <option value={3}>Kapalı</option>
                </select>
              </div>
            </div>

            <section className="order-details-list">
              <div className="order-details-header">
                <h5>Hareket Detayları</h5>
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
                      <th style={{ textAlign: 'left' }}>Etiket</th>
                      <th style={{ textAlign: 'left' }}>KUMAŞ CİNSİ</th>
                      <th style={{ textAlign: 'left' }}>En</th>
                      <th style={{ textAlign: 'left' }}>Gr</th>
                      <th style={{ textAlign: 'left' }}>Renk</th>
                      <th style={{ textAlign: 'left' }}>Renk Kodu</th>
                      <th style={{ textAlign: 'left' }}>Sipariş Miktarı</th>
                      <th style={{ textAlign: 'left' }}>FİYAT</th>
                      <th style={{ textAlign: 'left' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.Details.map((detail, index) => {
                      const selectedFabricType = String(detail.FabricGender ?? '').trim()
                      const hasSelectedFabricTypeInOptions =
                        selectedFabricType !== '' &&
                        fabricTypesOptions.some((fabric) => String(fabric ?? '') === selectedFabricType)

                      return (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              value={detail.Etiket_Basligi}
                              onChange={(event) =>
                                onDetailFieldChange(index, 'Etiket_Basligi', event.target.value)
                              }
                              className="input-small"
                              dir="ltr"
                              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                            />
                          </td>
                          <td>
                            <select
                              value={selectedFabricType}
                              onChange={(event) =>
                                onDetailFieldChange(index, 'FabricGender', event.target.value)
                              }
                              className="input-small"
                              required
                              dir="ltr"
                              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                            >
                              <option value="">-- Seçin --</option>
                              {!hasSelectedFabricTypeInOptions && selectedFabricType ? (
                                <option value={selectedFabricType}>{selectedFabricType}</option>
                              ) : null}
                              {fabricTypesOptions.map((fabric, idx) => (
                                <option key={idx} value={fabric || ''}>
                                  {fabric}
                                </option>
                              ))}
                            </select>
                          </td>
                        <td>
                          <input
                            type="number"
                            value={detail.En}
                            onChange={(event) => onDetailFieldChange(index, 'En', event.target.value)}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={detail.Gr}
                            onChange={(event) => onDetailFieldChange(index, 'Gr', event.target.value)}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={detail.Renk}
                            onChange={(event) => onDetailFieldChange(index, 'Renk', event.target.value)}
                            className="input-small"
                            required
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={detail.RenkCode}
                            onChange={(event) => onDetailFieldChange(index, 'RenkCode', event.target.value)}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={detail.SiparisMiktari ?? ''}
                            onChange={(event) =>
                              onDetailFieldChange(index, 'SiparisMiktari', event.target.value)
                            }
                            className="input-small"
                            required
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={detail.Fiyat ?? detail.Price ?? 0}
                            onChange={(event) => onDetailFieldChange(index, 'Fiyat', event.target.value)}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          />
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="action-btn copy"
                              onClick={() => onCopyDetailRow(index)}
                              title="Satırı kopyala"
                            >
                              📋
                            </button>
                            <button
                              type="button"
                              className="action-btn delete"
                              onClick={() => handleRemoveDetailRow(index)}
                              disabled={form.Details.length === 1}
                              title="Satırı sil"
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  handleRemoveDetailRow(index)
                                }
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {error ? <p className="error-box inline-error">{error}</p> : null}
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose} disabled={isSaving}>
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

export default OrderFactoryTransactionsModal
