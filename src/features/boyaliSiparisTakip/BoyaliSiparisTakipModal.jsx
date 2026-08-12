import { useCallback, useEffect, useMemo, useState } from 'react'
import './BoyaliSiparisTakip.css'

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
      <section className="modal-card order-modal-card boyali-modal">
        <div className="modal-header">
          <p className="modal-title">{orderForm.orderNo || 'Sipariş Detayı'}</p>
        </div>

        {isLoading ? (
          <p className="table-state">Detaylar yükleniyor...</p>
        ) : (
          <>
            {error ? <p className="inline-error error-box">{error}</p> : null}

            <div style={{ marginTop: '8px', maxWidth: '100%' }}>
              <div className="table-wrapper">
                <table className="boyali-orders-table">
                  <thead>
                    <tr>
                      <th>Etiket Başlığı</th>
                      <th>Kumaş Cinsi</th>
                      <th>LOT</th>
                      <th>En</th>
                      <th>Gr</th>
                      <th>Renk</th>
                      <th>Renk Kodu</th>
                      <th>Sipariş Miktarı</th>
                      <th>Parti No</th>
                      <th>Kazan Giriş (Kg)</th>
                      <th>DURUM</th>
                      <th>SEVKE HAZIR</th>
                      <th>İşlemler</th>
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
                            className="compact-input"
                            style={{ width: '85px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'left', padding: '4px 4px', fontSize: '0.8rem' }}>{detail.fabricGender ?? '-'}</td>
                        <td style={{ textAlign: 'left', padding: '4px 4px' }}>
                          <input
                            type="text"
                            value={detail.lot ?? detail.LOT ?? detail.fabricLot ?? detail.FabricLot ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'lot', event.target.value)}
                            className="compact-input"
                            style={{ width: '70px' }}
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
                            className="compact-input"
                            style={{ width: '70px' }}
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
                            className="compact-input"
                            style={{ width: '70px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'left', padding: '4px 4px' }}>
                          <select
                            value={detail.Status ?? 1}
                            onChange={(event) => onDetailFieldChange(index, 'Status', Number(event.target.value))}
                            className="compact-select"
                            style={{ width: '90px' }}
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
                            className="compact-input"
                            style={{ width: '70px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '4px 4px', whiteSpace: 'nowrap' }}>
                          <div className="row-actions">
                            <button type="button" onClick={() => handleCopyRow(index)} title="Kopyala">📄</button>
                            <button type="button" onClick={() => handleDeleteRow(index)} title="Sil">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {activeFabricState ? (
              <div className="active-fabrics-panel">
                <div className="panel-title">Gönderilmiş kumaşlar</div>
                {activeFabricState.loading ? (
                  <p className="table-state">Kumaşlar yükleniyor...</p>
                ) : activeFabricState.error ? (
                  <p className="inline-error error-box">{activeFabricState.error}</p>
                ) : activeFabricState.items.length === 0 ? (
                  <p className="table-state">Bu satır için gönderilmiş kumaş bulunamadı.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="boyali-orders-table active-fabrics-table">
                      <thead>
                        <tr>
                          <th>Seç</th>
                          <th>Fabric Gender</th>
                          <th>Lot</th>
                          <th>Toplam Ağırlık</th>
                          <th>Kalan</th>
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
