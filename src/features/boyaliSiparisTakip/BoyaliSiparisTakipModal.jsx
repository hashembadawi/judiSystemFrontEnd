import { useCallback, useEffect, useMemo, useState } from 'react'

function BoyaliSiparisTakipModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  orderForm,
  statusOptions,
  factoryNameLabel,
  onClose,
  onSave,
  onDetailFieldChange,
  onAddDetailRow,
  onDeleteDetailRow,
  onCopyDetailRow,
  apiRequest,
  showNotice,
}) {
  const [activeKazanRowIndex, setActiveKazanRowIndex] = useState(null)
  const [sendedFabricsByRow, setSendedFabricsByRow] = useState({})

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

  useEffect(() => {
    if (!isOpen) {
      setActiveKazanRowIndex(null)
      setSendedFabricsByRow({})
    }
  }, [isOpen])

  const loadSendedFabrics = useCallback(
    async (index, detail) => {
      if (!detail?.fabricGender || !orderForm.factoryId) {
        return
      }

      setActiveKazanRowIndex(index)
      setSendedFabricsByRow((prev) => ({
        ...prev,
        [index]: {
          loading: true,
          items: prev[index]?.items || [],
          selectedLotIds: prev[index]?.selectedLotIds || [],
          error: '',
        },
      }))

      try {
        const response = await apiRequest(
          `/api/fill-sended-fabrics?factoryId=${orderForm.factoryId}&fabricGender=${encodeURIComponent(detail.fabricGender)}`,
        )

        const items = Array.isArray(response?.data?.items) ? response.data.items : []

        setSendedFabricsByRow((prev) => ({
          ...prev,
          [index]: {
            loading: false,
            items,
            selectedLotIds: [],
            error: '',
          },
        }))
      } catch (requestError) {
        const message = requestError.message || 'Gönderilmiş kumaşlar alınamadı.'
        setSendedFabricsByRow((prev) => ({
          ...prev,
          [index]: {
            loading: false,
            items: [],
            selectedLotIds: [],
            error: message,
          },
        }))

        if (showNotice) {
          showNotice('error', message)
        }
      }
    },
    [apiRequest, orderForm.factoryId, showNotice],
  )

  const toggleSelectedLot = useCallback(
    (index, fabricLot) => {
      setSendedFabricsByRow((prev) => {
        const current = prev[index] || { items: [], selectedLotIds: [] }
        const nextSelectedLotIds = current.selectedLotIds.includes(fabricLot)
          ? current.selectedLotIds.filter((lot) => lot !== fabricLot)
          : [...current.selectedLotIds, fabricLot]

        if (onDetailFieldChange) {
          onDetailFieldChange(index, 'lot', nextSelectedLotIds.join(','))
        }

        return {
          ...prev,
          [index]: {
            ...current,
            selectedLotIds: nextSelectedLotIds,
          },
        }
      })
    },
    [onDetailFieldChange],
  )

  const activeFabricState = useMemo(() => {
    if (activeKazanRowIndex === null) {
      return null
    }

    return sendedFabricsByRow[activeKazanRowIndex] || { items: [], selectedLotIds: [], loading: false, error: '' }
  }, [activeKazanRowIndex, sendedFabricsByRow])

  const handleDeleteRow = useCallback(
    (index) => {
      if (onDeleteDetailRow && window.confirm('Bu satırı silmek istediğinizden emin misiniz?')) {
        onDeleteDetailRow(index)
      }
    },
    [onDeleteDetailRow],
  )

  const handleCopyRow = useCallback(
    (index) => {
      if (onCopyDetailRow) {
        onCopyDetailRow(index)
      }
    },
    [onCopyDetailRow],
  )

  const activeDetail = useMemo(() => {
    if (activeKazanRowIndex === null) {
      return null
    }

    return orderForm.details?.[activeKazanRowIndex] || null
  }, [activeKazanRowIndex, orderForm.details])

  const activeAllocatedItems = useMemo(() => {
    if (!activeDetail || !activeFabricState) {
      return []
    }

    const kazanGirisValue = Number(activeDetail.KazanGiris ?? 0)
    const selectedItems = (activeFabricState.items || []).filter((item) =>
      activeFabricState.selectedLotIds.includes(item.fabricLot),
    )

    if (selectedItems.length === 0) {
      return []
    }

    const totalSelectedWeight = selectedItems.reduce(
      (total, item) => total + Number(item.totalWeight || 0),
      0,
    )

    if (totalSelectedWeight === 0) {
      return selectedItems.map((item) => ({ ...item, allocatedWeight: 0 }))
    }

    return selectedItems.map((item) => ({
      ...item,
      allocatedWeight: kazanGirisValue * (Number(item.totalWeight || 0) / totalSelectedWeight),
    }))
  }, [activeDetail, activeFabricState])

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card order-modal-card" style={{ maxWidth: '1400px', width: '98%', maxHeight: '95vh', overflowY: 'auto' }}>
        <div className="content-header" style={{ marginBottom: '12px', justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <p style={{ margin: '6px auto 0', fontSize: '1rem', fontWeight: 700 }}>{orderForm.orderNo || 'Sipariş Detayı'}</p>
          </div>
        </div>

        {isLoading ? (
          <p className="table-state">Detaylar yükleniyor...</p>
        ) : (
          <>
            {error ? <p className="inline-error error-box">{error}</p> : null}

            <div style={{ marginTop: '8px', direction: 'ltr', maxWidth: '100%' }}>
              <div
                className="table-wrapper"
                style={{
                  overflowX: 'auto',
                  overflowY: 'auto',
                  maxHeight: '320px',
                  borderTop: '1px solid #e1e8ef',
                  borderBottom: '1px solid #e1e8ef',
                }}
              >
                <table className="boyali-orders-table" style={{ direction: 'ltr', minWidth: '1200px', fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>Etiket Başlığı</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>Kumaş Cinsi</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>LOT</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>En</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>Gr</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>Renk</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>Renk Kodu</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>Sipariş Miktarı</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>Parti No</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>Kazan Giriş (Kg)</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>DURUM</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>SEVKE HAZIR</th>
                      <th style={{ padding: '4px 6px', lineHeight: '1.2' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderForm.details.map((detail, index) => (
                      <tr key={detail.id ?? `${detail.fabricGender}-${index}`}>
                        <td style={{ textAlign: 'left', padding: '4px 4px' }}>
                          <input
                            type="text"
                            value={detail.etiket_Basligi ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'etiket_Basligi', event.target.value)}
                            style={{ textAlign: 'left', direction: 'ltr', width: '85px', padding: '2px 4px', fontSize: '0.8rem', lineHeight: '1.1' }}
                          />
                        </td>
                        <td style={{ textAlign: 'left', padding: '4px 4px', fontSize: '0.8rem' }}>{detail.fabricGender ?? '-'}</td>
                        <td style={{ textAlign: 'left', padding: '4px 4px' }}>
                          <input
                            type="text"
                            value={detail.lot ?? detail.LOT ?? detail.fabricLot ?? detail.FabricLot ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'lot', event.target.value)}
                            style={{ textAlign: 'left', direction: 'ltr', width: '70px', padding: '2px 4px', fontSize: '0.8rem', lineHeight: '1.1' }}
                          />
                        </td>
                        <td style={{ textAlign: 'left', padding: '4px 4px', fontSize: '0.8rem' }}>{detail.en ?? '-'}</td>
                        <td style={{ textAlign: 'left', padding: '4px 4px', fontSize: '0.8rem' }}>{detail.gr ?? '-'}</td>
                        <td style={{ textAlign: 'left', padding: '4px 4px', fontSize: '0.8rem' }}>{detail.renk ?? '-'}</td>
                        <td style={{ textAlign: 'left', padding: '4px 4px', fontSize: '0.8rem' }}>{detail.renkCode ?? '-'}</td>
                        <td style={{ textAlign: 'left', padding: '4px 4px', fontSize: '0.8rem' }}>{detail.siparisMiktari ?? '-'}</td>
                        <td style={{ textAlign: 'left', padding: '4px 4px' }}>
                          <input
                            type="text"
                            value={detail.PartiNo ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'PartiNo', event.target.value)}
                            style={{ textAlign: 'left', direction: 'ltr', width: '70px', padding: '2px 4px', fontSize: '0.8rem', lineHeight: '1.1' }}
                          />
                        </td>
                        <td style={{ textAlign: 'left', padding: '4px 4px' }}>
                          <input
                            type="number"
                            value={detail.KazanGiris ?? ''}
                            onFocus={() => loadSendedFabrics(index, detail)}
                            onChange={(event) => {
                              const nextValue = event.target.value === '' ? '' : Number(event.target.value)
                              onDetailFieldChange(index, 'KazanGiris', nextValue)
                            }}
                            style={{ textAlign: 'left', direction: 'ltr', width: '70px', padding: '2px 4px', fontSize: '0.8rem', lineHeight: '1.1' }}
                          />
                        </td>
                        <td style={{ textAlign: 'left', padding: '4px 4px' }}>
                          <select
                            value={detail.Status ?? 1}
                            onChange={(event) => onDetailFieldChange(index, 'Status', Number(event.target.value))}
                            style={{ textAlign: 'left', direction: 'ltr', width: '90px', padding: '2px 4px', fontSize: '0.8rem', lineHeight: '1.1' }}
                          >
                            {statusOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.durum || option.name || option.statusName || option.value}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ textAlign: 'left', padding: '4px 4px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={detail.SevkHazir ?? 0}
                            onChange={(event) => onDetailFieldChange(index, 'SevkHazir', Number(event.target.value))}
                            style={{ textAlign: 'left', direction: 'ltr', width: '70px', padding: '2px 4px', fontSize: '0.8rem', lineHeight: '1.1' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '4px 4px', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleCopyRow(index)}
                            title="Kopyala"
                            style={{
                              marginRight: '6px',
                              padding: '4px 8px',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              minWidth: '32px',
                            }}
                          >
                            📄
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(index)}
                            title="Sil"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              minWidth: '32px',
                            }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {activeFabricState ? (
              <div
                style={{
                  marginTop: '12px',
                  border: '1px solid #dce8ef',
                  borderRadius: '10px',
                  padding: '8px',
                  background: '#f9fcfe',
                  maxWidth: '680px',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '0.82rem' }}>Gönderilmiş kumaşlar</div>
                {activeFabricState.loading ? (
                  <p className="table-state">Kumaşlar yükleniyor...</p>
                ) : activeFabricState.error ? (
                  <p className="inline-error error-box">{activeFabricState.error}</p>
                ) : activeFabricState.items.length === 0 ? (
                  <p className="table-state">Bu satır için gönderilmiş kumaş bulunamadı.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="boyali-orders-table" style={{ minWidth: '520px', direction: 'ltr', fontSize: '0.78rem' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '4px 6px' }}>Seç</th>
                          <th style={{ padding: '4px 6px' }}>Fabric Gender</th>
                          <th style={{ padding: '4px 6px' }}>Lot</th>
                          <th style={{ padding: '4px 6px' }}>Toplam Ağırlık</th>
                          <th style={{ padding: '4px 6px' }}>Kalan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeFabricState.items.map((item) => {
                          const isSelected = activeFabricState.selectedLotIds.includes(item.fabricLot)
                          const allocatedItem = activeAllocatedItems.find((row) => row.fabricLot === item.fabricLot)

                          return (
                            <tr key={`${item.fabricLot}-${item.totalWeight}`}>
                              <td style={{ textAlign: 'center', padding: '4px 6px' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectedLot(activeKazanRowIndex, item.fabricLot)}
                                />
                              </td>
                              <td style={{ padding: '4px 6px' }}>{item.fabricGender ?? '-'}</td>
                              <td style={{ padding: '4px 6px' }}>{item.fabricLot ?? '-'}</td>
                              <td style={{ padding: '4px 6px' }}>{item.totalWeight ?? '-'}</td>
                              <td style={{ padding: '4px 6px' }}>{item.kalan ?? '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose} disabled={isSaving}>
                İptal
              </button>
              <button type="button" onClick={onSave} disabled={isSaving}>
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default BoyaliSiparisTakipModal
