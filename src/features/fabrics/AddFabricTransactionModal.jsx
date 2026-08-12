import { useEffect, useState } from 'react'
import JsBarcode from 'jsbarcode'
import './AddFabricTransactionModal.css'

function AddFabricTransactionModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  shiftOptions,
  fabricGenderOptions,
  orderOptions,
  factoryOptions,
  operatorOptions,
  fabricTypeOptions,
  apiRequest,
  onFieldChange,
  onDetailFieldChange,
  onAddDetailRow,
  onCopyDetailRow,
  onRemoveDetailRow,
  onClose,
  onSave,
}) {
  const [weavingOrders, setWeavingOrders] = useState([])
  const [selectedWeavingOrderId, setSelectedWeavingOrderId] = useState('')
  const [fabricsByRow, setFabricsByRow] = useState({})
  const [savingRows, setSavingRows] = useState({})
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
    if (!isOpen || !apiRequest) return

    let mounted = true

    const loadWeavingOrders = async () => {
      try {
        const res = await apiRequest('/api/DailyHamFabricsTransaction/GetAllWeavingOrder')
        if (!mounted) return
        setWeavingOrders(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        // ignore silently; parent handles global notices
      }
    }

    loadWeavingOrders()

    return () => {
      mounted = false
    }
  }, [isOpen, apiRequest])

  const handleRowWeavingOrderSelect = async (rowIndex, value) => {
    if (!apiRequest) return
    // set order id on row
    onDetailFieldChange(rowIndex, 'OrderId', value)

    if (!value) {
      setFabricsByRow((prev) => {
        const next = { ...prev }
        delete next[rowIndex]
        return next
      })
      return
    }

    try {
      const res = await apiRequest(`/api/DailyHamFabricsTransaction/getFabricByWeavingOrder?Id=${value}`)
      const items = res?.data?.items ?? []

      const fabrics = Array.from(
        new Set(items.map((it) => (it.fabricGender ?? it.FabricGender ?? '').trim()).filter(Boolean)),
      )

      setFabricsByRow((prev) => ({ ...prev, [rowIndex]: items }))

      // if exactly one fabric returned, prefill the row fields
      if (items.length === 1) {
        const item = items[0]
        onDetailFieldChange(rowIndex, 'FabricGender', item.fabricGender ?? item.FabricGender ?? '')
        onDetailFieldChange(rowIndex, 'FabricGSM', item.fabricGr ?? item.FabricGr ?? '')
        onDetailFieldChange(rowIndex, 'FabricLot', item.fabricLot ?? item.FabricLot ?? '')
      }
    } catch (e) {
      // noop
    }
  }

  const handleFabricGenderSelect = (rowIndex, value) => {
    onDetailFieldChange(rowIndex, 'FabricGender', value)

    const rowItems = fabricsByRow[rowIndex] ?? []
    const selectedItem = rowItems.find((item) => {
      const fabricGender = item?.fabricGender ?? item?.FabricGender ?? ''
      return String(fabricGender).trim() === String(value).trim()
    })

    if (selectedItem) {
      onDetailFieldChange(rowIndex, 'FabricGSM', selectedItem.fabricGr ?? selectedItem.FabricGr ?? '')
      onDetailFieldChange(rowIndex, 'FabricLot', selectedItem.fabricLot ?? selectedItem.FabricLot ?? '')
    }
  }

  const handleSaveRow = async (index) => {
    if (!apiRequest) return

    const detail = form.Details[index]
    if (!detail) return

    // build payload expected by API
    const payload = {
      Id: detail.DepoRollId || detail.Id || 0,
      FabricGender: detail.FabricGender || '',
      FabricLot: detail.FabricLot || '',
      FabricGr: detail.FabricGSM || detail.FabricGr || 0,
      Makine: detail.Makine || detail.Machine || 0,
      Operator: detail.Operator || form.Personal || '',
      WeavingOrderId: detail.OrderId || 0,
      Date: form.Date || '',
      Weight: detail.Weight || 0,
      FabricType: detail.FabricType || 1,
      Shift: form.Shift || '',
    }

    try {
      setSavingRows((s) => ({ ...s, [index]: true }))
      const res = await apiRequest('/api/DailyHamFabricsTransaction/DepoFabricRollsUpsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const returnedData = res?.data ?? res?.data?.data ?? res
      const savedId = returnedData?.id ?? returnedData?.Id ?? returnedData
      const savedOrderNo = returnedData?.orderNo ?? returnedData?.OrderNo ?? detail.orderNo ?? detail.OrderNo
      const savedOrderIdValue = returnedData?.orderId ?? returnedData?.OrderId ?? detail.OrderId ?? detail.orderId
      const normalizedOrderId = savedOrderIdValue === undefined || savedOrderIdValue === null || savedOrderIdValue === ''
        ? (detail.OrderId ?? '')
        : Number(savedOrderIdValue) || 0
      // store returned id and orderNo on the detail and lock the row
      onDetailFieldChange(index, 'DepoRollId', savedId)
      onDetailFieldChange(index, 'Id', savedId)
      onDetailFieldChange(index, 'id', savedId)
      onDetailFieldChange(index, 'OrderNo', savedOrderNo)
      onDetailFieldChange(index, 'orderNo', savedOrderNo)
      onDetailFieldChange(index, 'OrderId', normalizedOrderId)
      onDetailFieldChange(index, 'orderId', normalizedOrderId)
      onDetailFieldChange(index, 'Locked', true)
      handlePrintLabel(detail, savedId, savedOrderNo)
    } catch (e) {
      // parent will show global notices; keep silent here
    } finally {
      setSavingRows((s) => {
        const next = { ...s }
        delete next[index]
        return next
      })
    }
  }

  const handleDeleteRow = async (index) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السطر؟')) {
      return
    }

    const detail = form.Details[index]
    if (!detail) return

    const id = detail.DepoRollId || detail.Id
    if (id) {
      try {
        await apiRequest(`/api/DailyHamFabricsTransaction/DepoFabricRollsDelete?Id=${id}`, {
          method: 'DELETE',
        })
        onRemoveDetailRow(index)
      } catch (e) {
        // noop
      }
    } else {
      onRemoveDetailRow(index)
    }
  }

  const handlePrintLabel = (detail, savedId, savedOrderNo) => {
    const barcodeValue = detail.Weight ? String(detail.Weight) : ''
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    JsBarcode(svg, barcodeValue, {
      format: 'CODE128',
      displayValue: true,
      width: 2,
      height: 60,
      margin: 0,
      fontSize: 14,
    })

    const svgMarkup = new XMLSerializer().serializeToString(svg)
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Label</title><style>body{margin:0;padding:0;font-family:Arial,sans-serif;} .label{padding:10px;width:280px;} .label .info{margin-top:10px;font-size:14px;line-height:1.3;} .label .info div{margin-bottom:4px;} .barcode{margin-top:10px;}</style></head><body><div class="label"><div class="info"><div><strong>${detail.FabricGender || ''}</strong></div><div>GR: ${detail.FabricGSM || ''}</div><div>Lot: ${detail.FabricLot || ''}</div><div>Makine: ${detail.Makine || ''}</div><div>Operator: ${detail.Operator || ''}</div><div>Ağırlık: ${detail.Weight || ''}</div><div>Tarih: ${form.Date || ''}</div><div>Vardiya: ${form.Shift || ''}</div><div>Sipariş No: ${savedOrderNo ?? detail.orderNo ?? detail.OrderNo ?? ''}</div></div><div class="barcode">${svgMarkup}</div></div></body></html>`

    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  const handleToggleLock = (index) => {
    const detail = form.Details[index]
    if (!detail) return

    // only unlocking requires password (123)
    if (detail.Locked) {
      const pw = window.prompt('Enter password to unlock row')
      if (pw === '123') {
        onDetailFieldChange(index, 'Locked', false)
      } else {
        // wrong password: ignore
      }
    } else {
      // allow manual lock without password
      onDetailFieldChange(index, 'Locked', true)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card order-modal-card">
        <h4>Kumaş Hareketi Ekle</h4>

        {isLoading ? (
          <p className="table-state">Seçenekler yükleniyor...</p>
        ) : (
          <>
            <div className="modal-form-grid order-form-grid">
              <div className="field-group">
                <label htmlFor="Shift">Vardiya</label>
                <select
                  id="Shift"
                  value={form.Shift}
                  onChange={(event) => onFieldChange('Shift', event.target.value)}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                >
                  {shiftOptions.map((shift) => (
                    <option key={shift} value={shift}>
                      {shift}
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
                <label htmlFor="Personal">Personel</label>
                <input
                  id="Personal"
                  type="text"
                  value={form.Personal}
                  onChange={(event) => onFieldChange('Personal', event.target.value)}
                  dir="ltr"
                  style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                />
              </div>
              <datalist id="operator-options">
                {operatorOptions.map((operatorName, index) => (
                  <option key={index} value={operatorName} />
                ))}
              </datalist>

              {/* per-row weaving order selection moved into details table */}
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
                          <th style={{ textAlign: 'left' }}>Dokuma Siparişi</th>
                          <th style={{ textAlign: 'left' }}>Kumaş Cinsi</th>
                          <th style={{ textAlign: 'left' }}>GR</th>
                          <th style={{ textAlign: 'left' }}>LOT</th>
                          <th style={{ textAlign: 'left' }}>Makine</th>
                          <th style={{ textAlign: 'left' }}>Operator</th>
                          <th style={{ textAlign: 'left' }}>Ağırlık</th>
                          <th style={{ textAlign: 'left' }}>Fabrika</th>
                          <th style={{ textAlign: 'left' }}>Kumaş Tipi</th>
                          <th style={{ textAlign: 'left' }}>İşlemler</th>
                        </tr>
                  </thead>
                  <tbody>
                    {form.Details.map((detail, index) => (
                      <tr key={index}>
                            <td>
                              <select
                                value={detail.OrderId ?? ''}
                                onChange={(e) => handleRowWeavingOrderSelect(index, e.target.value)}
                                disabled={detail.Locked}
                                className="input-small"
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                              >
                                <option value="">Sipariş seçin</option>
                                {weavingOrders.map((wo) => (
                                  <option key={wo.id ?? wo.value ?? wo.name} value={wo.id}>
                                    {wo.name ?? wo.label ?? String(wo.id)}
                                  </option>
                                ))}
                              </select>
                            </td>
                        <td>
                          <select
                            value={detail.FabricGender ?? ''}
                            onChange={(event) => handleFabricGenderSelect(index, event.target.value)}
                            disabled={detail.Locked}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          >
                            <option value="">Kumaş seçin</option>
                                {((fabricsByRow[index] && fabricsByRow[index].length) ? fabricsByRow[index] : []).map((option, optionIndex) => {
                                  const fabricGender = option?.fabricGender ?? option?.FabricGender ?? ''
                                  return (
                                    <option key={`${fabricGender}-${optionIndex}`} value={fabricGender}>
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
                            disabled={detail.Locked}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={detail.FabricLot ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'FabricLot', event.target.value)}
                            disabled={detail.Locked}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={detail.Makine ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'Makine', event.target.value)}
                            disabled={detail.Locked}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            list="operator-options"
                            value={detail.Operator ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'Operator', event.target.value)}
                            disabled={detail.Locked}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={detail.Weight ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'Weight', event.target.value)}
                            disabled={detail.Locked}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          />
                        </td>
                        <td>
                          <select
                            value={detail.FactoryId ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'FactoryId', event.target.value)}
                            disabled={detail.Locked}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          >
                            <option value="">Fabrika seçin</option>
                            {factoryOptions.map((factory) => (
                              <option key={factory.id ?? factory.value ?? factory} value={factory.id ?? factory.value ?? factory}>
                                {factory.name ?? factory.factoryName ?? factory.valueName ?? getOptionDisplayText(factory)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={detail.FabricType ?? ''}
                            onChange={(event) => onDetailFieldChange(index, 'FabricType', Number(event.target.value))}
                            disabled={detail.Locked}
                            className="input-small"
                            dir="ltr"
                            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                          >
                            <option value="">Tip seçin</option>
                            {fabricTypeOptions.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.text}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="action-btn copy"
                              onClick={() => handleSaveRow(index)}
                              disabled={detail.Locked || !!savingRows[index]}
                              title="Satırı sunucuya kaydet"
                            >
                              {savingRows[index] ? '...' : '💾'}
                            </button>
                            <button
                              type="button"
                              className="action-btn lock"
                              onClick={() => handleToggleLock(index)}
                              title={detail.Locked ? 'Kilidi aç' : 'Kilitle'}
                            >
                              {detail.Locked ? '🔒' : '🔓'}
                            </button>
                            <button
                              type="button"
                              className="action-btn delete"
                              onClick={() => handleDeleteRow(index)}
                              disabled={detail.Locked || form.Details.length === 1}
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

const getOptionDisplayText = (item) => {
  if (item == null) {
    return ''
  }

  if (typeof item === 'string') {
    return item
  }

  if (typeof item === 'object') {
    return (
      item.label ??
      item.text ??
      item.name ??
      item.valueName ??
      item.value ??
      item.orderNo ??
      item.OrderNo ??
      item.orderNumber ??
      item.factoryName ??
      item.name ??
      ''
    )
  }

  return String(item)
}

export default AddFabricTransactionModal
