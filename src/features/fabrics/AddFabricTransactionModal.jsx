import { Fragment, useCallback, useEffect, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

function AddFabricTransactionModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  shiftOptions,
  operatorOptions,
  fabricTypeOptions,
  apiRequest,
  onFieldChange,
  onDetailFieldChange,
  onAddDetailRow,
  onRemoveDetailRow,
  onClose,
  onSave,
}) {
  const [weavingOrders, setWeavingOrders] = useState([])
  const [fabricsByRow, setFabricsByRow] = useState({})
  const [savingRows, setSavingRows] = useState({})

  const handleCloseRequest = useCallback(() => {
    if (isSaving || isLoading) {
      return
    }

    const shouldClose = window.confirm('Kaydetmeden önce pencereyi kapatmak istediğinize emin misiniz?')
    if (shouldClose) {
      onClose()
    }
  }, [isLoading, isSaving, onClose])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && !isSaving) {
        handleCloseRequest()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleCloseRequest, isOpen, isSaving])

  useEffect(() => {
    if (!isOpen || !apiRequest) return

    let mounted = true

    const loadWeavingOrders = async () => {
      try {
        const res = await apiRequest('/api/DailyHamFabricsTransaction/GetAllWeavingOrder')
        if (!mounted) return
        setWeavingOrders(Array.isArray(res.data) ? res.data : [])
      } catch {
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

    onDetailFieldChange(rowIndex, 'OrderId', value)
    onDetailFieldChange(rowIndex, 'weavingOrderId', value)
    onDetailFieldChange(rowIndex, 'WeavingOrderId', value)

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

      const normalizedOptions = fabrics.map((fabric) => ({
        raw: fabric,
        display: formatFabricGenderDisplay(fabric),
      }))

      if (normalizedOptions.length) {
        // keep the original values in the form while showing the formatted labels in the select list
        const fabricMap = new Map(normalizedOptions.map((option) => [option.raw, option.display]))
        setFabricsByRow((prev) => ({
          ...prev,
          [rowIndex]: items.map((item) => ({
            ...item,
            fabricGenderDisplay: fabricMap[item?.fabricGender ?? item?.FabricGender ?? ''] ?? (item?.fabricGender ?? item?.FabricGender ?? ''),
          })),
        }))
      }

      // if exactly one fabric returned, prefill the row fields
      if (items.length === 1) {
        const item = items[0]
        onDetailFieldChange(rowIndex, 'FabricGender', item.fabricGender ?? item.FabricGender ?? '')
        onDetailFieldChange(rowIndex, 'FabricGSM', item.fabricGr ?? item.FabricGr ?? '')
        onDetailFieldChange(rowIndex, 'FabricLot', item.fabricLot ?? item.FabricLot ?? '')
      }
    } catch {
      // noop
    }
  }

  const formatFabricGenderDisplay = (value) => {
    if (value == null) {
      return ''
    }

    const text = String(value).trim()
    if (!text) {
      return ''
    }

    const ratioMatch = text.match(/^(.*?)(\d+\s*\/\s*\d+(?:\s*\/\s*\d+)?)\s*$/)
    if (ratioMatch) {
      const prefix = ratioMatch[1].trim()
      const ratio = ratioMatch[2].trim()

      if (prefix && ratio) {
        return `${ratio} ${prefix}`
      }
    }

    return text
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
      factoryId: 1,
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
      const savedOrderId = returnedData?.orderId ?? returnedData?.OrderId ?? detail.orderId ?? detail.OrderId
      const savedOrderNo = returnedData?.orderNo ?? returnedData?.OrderNo ?? detail.orderNo ?? detail.OrderNo
      // store returned id and orderNo on the detail and lock the row
      onDetailFieldChange(index, 'DepoRollId', savedId)
      onDetailFieldChange(index, 'Id', savedId)
      onDetailFieldChange(index, 'id', savedId)
      onDetailFieldChange(index, 'orderId', savedOrderId)
      onDetailFieldChange(index, 'OrderId', savedOrderId)
      onDetailFieldChange(index, 'OrderNo', savedOrderNo)
      onDetailFieldChange(index, 'orderNo', savedOrderNo)
      onDetailFieldChange(index, 'Locked', true)
      handlePrintLabel(detail, savedId, savedOrderNo)
    } catch {
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
    if (!window.confirm('Bu satırı silmek istediğinizden emin misiniz?')) {
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
      } catch {
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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50" onClick={handleCloseRequest} />

      <div className="relative flex min-h-full items-start justify-center p-0 pt-4 sm:p-4 sm:pt-8">
        <section className="w-full max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200 sm:max-w-full" style={{ maxWidth: '95vw' }} dir="ltr">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
            <div className="text-left">
              <h4 className="mt-1 text-xl font-semibold text-slate-900">Kumaş Hareketi Ekle</h4>
            </div>
            <button
              type="button"
              className="text-2xl leading-none text-slate-400 transition hover:text-slate-600"
              onClick={handleCloseRequest}
              aria-label="Kapat"
            >
              ×
            </button>
          </header>

          <div className="px-4 py-5 sm:px-6">
            {isLoading ? (
              <p className="py-8 text-center text-slate-500">Seçenekler yükleniyor...</p>
            ) : (
              <>
                <div className="mb-6 grid gap-4 sm:grid-cols-3 text-left">
                  <div className="space-y-2">
                    <label htmlFor="Shift" className="block text-sm font-medium text-slate-700">Vardiya</label>
                    <select
                      id="Shift"
                      value={form.Shift}
                      onChange={(event) => onFieldChange('Shift', event.target.value)}
                      className={`${buildInputClasses(false)} w-full`}
                      dir="ltr"
                      style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                    >
                      <option value="">Vardiya seçin</option>
                      {shiftOptions.map((shift) => (
                        <option key={shift} value={shift}>
                          {shift}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="Date" className="block text-sm font-medium text-slate-700">Tarih</label>
                    <input
                      id="Date"
                      type="date"
                      value={form.Date}
                      onChange={(event) => onFieldChange('Date', event.target.value)}
                      className={`${buildInputClasses(false)} w-full`}
                      dir="ltr"
                      style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="Personal" className="block text-sm font-medium text-slate-700">Personel</label>
                    <input
                      id="Personal"
                      type="text"
                      value={form.Personal}
                      onChange={(event) => onFieldChange('Personal', event.target.value)}
                      list="operator-options"
                      className={`${buildInputClasses(false)} w-full`}
                      dir="ltr"
                      style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                    />
                    <datalist id="operator-options">
                      {operatorOptions.map((operatorName, index) => (
                        <option key={index} value={operatorName} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <section className="space-y-4 border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between">
                    <h5 className="text-lg font-semibold text-slate-900">Detaylar</h5>
                    <button type="button" className={buildButtonClasses('secondary')} onClick={onAddDetailRow}>
                      + Satır Ekle
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm" style={{ direction: 'ltr', tableLayout: 'auto' }}>
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 text-left" style={{ minWidth: '100px' }}><span className="text-sm font-semibold text-slate-600">Sipariş</span></th>
                          <th className="px-4 py-3 text-left" style={{ minWidth: '280px' }}><span className="text-sm font-semibold text-slate-600">Kumaş Cinsi</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '50px' }}><span className="text-sm font-semibold text-slate-600">GR</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '65px' }}><span className="text-sm font-semibold text-slate-600">LOT</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '40px' }}><span className="text-sm font-semibold text-slate-600">Makine</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '120px' }}><span className="text-sm font-semibold text-slate-600">Operator</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '40px' }}><span className="text-sm font-semibold text-slate-600">Ağırlık</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '100px' }}><span className="text-sm font-semibold text-slate-600">Fabrika</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '100px' }}><span className="text-sm font-semibold text-slate-600">Tip</span></th>
                          <th className="px-3 py-3 text-center"><span className="text-sm font-semibold text-slate-600">İşlemler</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {form.Details.map((detail, index) => (
                          <Fragment key={index}>
                            <tr className="hover:bg-slate-50">
                            <td className="px-4 py-3" style={{ minWidth: '100px' }}>
                              <select
                                value={detail.OrderId ?? ''}
                                onChange={(e) => handleRowWeavingOrderSelect(index, e.target.value)}
                                disabled={detail.Locked}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left',fontSize: '9px', minWidth: '100%' }}
                              >
                                <option value="">Sipariş seçin</option>
                                {weavingOrders.map((wo) => (
                                  <option key={wo.id ?? wo.value ?? wo.name} value={wo.id}>
                                    {wo.name ?? wo.label ?? String(wo.id)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3" style={{ minWidth: '280px' }}>
                              <select
                                value={detail.FabricGender ?? ''}
                                onChange={(event) => handleFabricGenderSelect(index, event.target.value)}
                                disabled={detail.Locked}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '10px', minWidth: '100%' }}
                              >
                                <option value="">Kumaş seçin</option>
                                {((fabricsByRow[index] && fabricsByRow[index].length) ? fabricsByRow[index] : []).map((option, optionIndex) => {
                                  const fabricGender = option?.fabricGender ?? option?.FabricGender ?? ''
                                  return (
                                    <option key={`${fabricGender}-${optionIndex}`} value={fabricGender}>
                                      {formatFabricGenderDisplay(fabricGender)}
                                    </option>
                                  )
                                })}
                              </select>
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                value={detail.FabricGSM ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'FabricGSM', event.target.value)}
                                disabled={detail.Locked}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext',  textAlign: 'left', fontSize: '10px' }}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={detail.FabricLot ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'FabricLot', event.target.value)}
                                disabled={detail.Locked}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext',  textAlign: 'left', fontSize: '10px' }}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                value={detail.Makine ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'Makine', event.target.value)}
                                disabled={detail.Locked}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext',  textAlign: 'left', fontSize: '10px' }}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="text"
                                list="operator-options"
                                value={detail.Operator ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'Operator', event.target.value)}
                                disabled={detail.Locked}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext',  textAlign: 'left', fontSize: '10px'  }}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={detail.Weight ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'Weight', event.target.value)}
                                disabled={detail.Locked}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left' , fontSize: '10px' }}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <select
                                value={detail.FactoryId || 1}
                                onChange={(event) => onDetailFieldChange(index, 'FactoryId', event.target.value)}
                                disabled={detail.Locked}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left' , fontSize: '10px' }}
                              >
                                <option value="">Fabrika seçin</option>
                                <option value="1">judi mensucat</option>
                              </select>
                            </td>
                            <td className="px-3 py-3">
                              <select
                                value={detail.FabricType ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'FabricType', Number(event.target.value))}
                                disabled={detail.Locked}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left' , fontSize: '10px' }}
                              >
                                <option value="">Tip seçin</option>
                                {fabricTypeOptions.map((type) => (
                                  <option key={type.id} value={type.id}>
                                    {type.text}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveRow(index)}
                                  disabled={detail.Locked || !!savingRows[index]}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Satırı sunucuya kaydet"
                                >
                                  {savingRows[index] ? '⋯' : '💾'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleLock(index)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                                  title={detail.Locked ? 'Kilidi aç' : 'Kilitle'}
                                >
                                  {detail.Locked ? '🔒' : '🔓'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(index)}
                                  disabled={detail.Locked || form.Details.length === 1}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-300 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Satırı sil"
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
                ) : null}
              </>
            )}
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button type="button" className={buildButtonClasses('secondary')} onClick={handleCloseRequest} disabled={isSaving || isLoading}>
              İptal
            </button>
            <button type="button" disabled={isSaving || isLoading} className={buildButtonClasses('primary')} onClick={onSave}>
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AddFabricTransactionModal
