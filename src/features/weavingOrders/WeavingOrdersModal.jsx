import { useEffect } from 'react'

function WeavingOrdersModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  orderOptions,
  fabricOptions,
  factoryOptions,
  selectedOrderDetails = [],
  isEditMode = false,
  onFieldChange,
  onDetailChange,
  onAddDetail,
  onRemoveDetail,
  onClose,
  onSave,
  onOrderSelect,
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
        <h4>{isEditMode ? 'Dokuma hareketini düzenle' : 'Yeni dokuma hareketi ekle'}</h4>

        {isLoading ? (
          <p className="table-state">Seçenekler yükleniyor...</p>
        ) : (
          <>
            <div className="modal-form-grid order-form-grid">
              <div className="field-group">
                <label htmlFor="weavingOrderSelect">Sipariş</label>
                <select
                  id="weavingOrderSelect"
                  value={form.OrderId ?? ''}
                  onChange={(event) => onOrderSelect(event.target.value)}
                  style={{ direction: 'ltr', textAlign: 'left' }}
                >
                  <option value="">Sipariş seçin</option>
                  {orderOptions.map((order) => {
                    const orderId = order.id ?? order.orderId ?? order.value ?? ''
                    const orderLabel =
                      order.orderNo ?? order.OrderNo ?? order.orderNumber ?? order.orderNumberText ?? order.name ?? order.label ?? order.text ?? ''

                    return (
                      <option key={orderId ?? orderLabel} value={orderId}>
                        {orderLabel}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="weavingOrderName">İsim</label>
                <input
                  id="weavingOrderName"
                  type="text"
                  value={form.Name ?? ''}
                  onChange={(event) => onFieldChange('Name', event.target.value)}
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
              </div>

              <div className="field-group">
                <label htmlFor="weavingOrderDate">Tarih</label>
                <input
                  id="weavingOrderDate"
                  type="date"
                  value={form.Date ?? ''}
                  onChange={(event) => onFieldChange('Date', event.target.value)}
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
              </div>
            </div>

            <div className="order-details-header">
              <h5>Detaylar</h5>
              <button type="button" className="secondary-btn" onClick={onAddDetail}>
                + Satır ekle
              </button>
            </div>

            {selectedOrderDetails?.length ? (
              <div className="selected-order-details">
                <h6>Seçilen siparişin kumaş bilgileri</h6>
                <div className="selected-order-details-grid">
                  {selectedOrderDetails.map((detail, index) => (
                    <div key={`${detail.fabricGender ?? detail.FabricGender ?? index}`} className="selected-order-detail-item">
                      <span className="fabric-gender">{detail.fabricGender ?? detail.FabricGender ?? '-'}</span>
                      <span className="fabric-weight">{detail.fabricWeight ?? detail.fabricWeight ?? '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="order-details-list">
              {form.Details.map((detail, detailIndex) => (
                <div className="order-detail-card" key={`${detail.id || detailIndex}-detail`}>
                  <div className="order-detail-grid">
                    <div className="field-group">
                      <label htmlFor={`fabricGender-${detailIndex}`}>Kumaş türü</label>
                      <select
                        id={`fabricGender-${detailIndex}`}
                        value={detail.FabricGender ?? ''}
                        onChange={(event) => onDetailChange(detailIndex, 'FabricGender', event.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      >
                        <option value="">Kumaş seçin</option>
                        {fabricOptions.map((fabricOption) => (
                          <option key={fabricOption} value={fabricOption}>
                            {fabricOption}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group">
                      <label htmlFor={`fabricGr-${detailIndex}`}>GR</label>
                      <input
                        id={`fabricGr-${detailIndex}`}
                        type="number"
                        value={detail.FabricGr ?? ''}
                        onChange={(event) => onDetailChange(detailIndex, 'FabricGr', event.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`fabricLot-${detailIndex}`}>LOT</label>
                      <input
                        id={`fabricLot-${detailIndex}`}
                        type="text"
                        value={detail.FabricLot ?? ''}
                        onChange={(event) => onDetailChange(detailIndex, 'FabricLot', event.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`pus-${detailIndex}`}>Pus</label>
                      <input
                        id={`pus-${detailIndex}`}
                        type="number"
                        value={detail.Pus ?? detail.pus ?? ''}
                        onChange={(event) => onDetailChange(detailIndex, 'pus', event.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`fain-${detailIndex}`}>Fain</label>
                      <input
                        id={`fain-${detailIndex}`}
                        type="number"
                        value={detail.Fain ?? detail.fain ?? ''}
                        onChange={(event) => onDetailChange(detailIndex, 'fain', event.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`iplikUzunu-${detailIndex}`}>İplik Uzunluğu</label>
                      <input
                        id={`iplikUzunu-${detailIndex}`}
                        type="number"
                        value={detail.Iplik_Uzunu ?? detail.iplik_Uzunu ?? detail.IplikUzunu ?? ''}
                        onChange={(event) => onDetailChange(detailIndex, 'iplik_Uzunu', event.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`denye-${detailIndex}`}>Denye</label>
                      <input
                        id={`denye-${detailIndex}`}
                        type="number"
                        value={detail.Denye ?? detail.denye ?? ''}
                        onChange={(event) => onDetailChange(detailIndex, 'denye', event.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`weight-${detailIndex}`}>Ağırlık</label>
                      <input
                        id={`weight-${detailIndex}`}
                        type="number"
                        step="0.01"
                        value={detail.Weight ?? ''}
                        onChange={(event) => onDetailChange(detailIndex, 'Weight', event.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor={`factoryId-${detailIndex}`}>Fabrika</label>
                      <select
                        id={`factoryId-${detailIndex}`}
                        value={detail.FactoryId ?? ''}
                        onChange={(event) => onDetailChange(detailIndex, 'FactoryId', event.target.value)}
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      >
                        <option value="">Fabrika seçin</option>
                        {factoryOptions.map((factoryOption) => {
                          const factoryId = factoryOption.id ?? factoryOption.value ?? factoryOption.factoryId ?? ''
                          const factoryLabel =
                            factoryOption.name ??
                            factoryOption.factoryName ??
                            factoryOption.valueName ??
                            factoryOption.label ??
                            factoryOption.text ??
                            ''

                          return (
                            <option key={factoryId ?? factoryLabel} value={factoryId}>
                              {factoryLabel}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="field-group full-width detail-description-field">
                    <label htmlFor={`description-${detailIndex}`}>Açıklama</label>
                    <input
                      id={`description-${detailIndex}`}
                      type="text"
                      value={detail.Description ?? ''}
                      onChange={(event) => onDetailChange(detailIndex, 'Description', event.target.value)}
                      style={{ direction: 'ltr', textAlign: 'left' }}
                    />
                  </div>

                  <div className="order-detail-actions">
                    <button
                      type="button"
                      className="remove-detail-btn"
                      disabled={form.Details.length === 1}
                      onClick={() => onRemoveDetail(detailIndex)}
                    >
                      Satırı sil
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {error ? <p className="error-box inline-error">{error}</p> : null}
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose} disabled={isSaving || isLoading}>
            İptal
          </button>
          <button type="button" disabled={isSaving || isLoading} onClick={onSave}>
            {isSaving ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default WeavingOrdersModal
