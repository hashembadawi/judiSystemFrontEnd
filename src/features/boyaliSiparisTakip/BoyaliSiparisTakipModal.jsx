import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" dir="ltr" style={{ direction: 'ltr' }}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative flex min-h-full items-start justify-center p-0 pt-4 sm:p-4 sm:pt-8">
        <section className="w-full max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200 sm:max-w-6xl" dir="ltr" style={{ direction: 'ltr', maxWidth: '95vw' }}>
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6" dir="ltr">
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 text-left">Sipariş</p>
              <h4 className="mt-1 text-xl font-semibold text-slate-900 text-left">{orderForm.orderNo || 'Sipariş Detayı'}</h4>
            </div>
            <button
              type="button"
              className="text-2xl leading-none text-slate-400 transition hover:text-slate-600"
              onClick={onClose}
              aria-label="Kapat"
            >
              ×
            </button>
          </header>

          <div className="px-4 py-5 sm:px-6">
            {isLoading ? (
              <p className="py-8 text-center text-slate-500">Detaylar yükleniyor...</p>
            ) : (
              <>
                {error ? (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 text-left" dir="ltr">
                    {error}
                  </div>
                ) : null}

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px] text-left text-[11px]" dir="ltr" style={{ direction: 'ltr', borderCollapse: 'collapse' }}>
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">E.Başlığı</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">Kumaş Cinsi</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">LOT</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">En</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">Gr</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">Renk</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">R.Kodu</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">Sip.MIKTAR</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">Parti No</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">Top Sayı</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">K.Giriş(Kg)</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">Durum</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">Sevk Hazır</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {orderForm.details.map((detail, index) => (
                          <tr key={detail.id ?? `${detail.fabricGender}-${index}`} className="hover:bg-slate-50">
                            <td className="px-1 py-1 w-full">
                              <input
                                type="text"
                                value={detail.etiket_Basligi ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'etiket_Basligi', event.target.value)}
                                className={`${buildInputClasses(false)} h-7 w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px' }}
                              />
                            </td>
                            <td className="px-1 py-1 w-full text-[11px] text-slate-700 whitespace-nowrap">{detail.fabricGender ?? '-'}</td>
                            <td className="px-1 py-1 w-full">
                              <input
                                type="text"
                                value={detail.lot ?? detail.LOT ?? detail.fabricLot ?? detail.FabricLot ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'lot', event.target.value)}
                                className={`${buildInputClasses(false)} h-7 w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px' }}
                              />
                            </td>
                            <td className="px-1 py-1 w-full text-[11px] text-slate-700 whitespace-nowrap">{detail.en ?? '-'}</td>
                            <td className="px-1 py-1 w-full text-[11px] text-slate-700 whitespace-nowrap">{detail.gr ?? '-'}</td>
                            <td className="px-1 py-1 w-full text-[11px] text-slate-700 whitespace-nowrap">{detail.renk ?? '-'}</td>
                            <td className="px-1 py-1 w-full text-[11px] text-slate-700 whitespace-nowrap">{detail.renkCode ?? '-'}</td>
                            <td className="px-1 py-1 w-full text-[11px] text-slate-700 whitespace-nowrap">{detail.siparisMiktari ?? '-'}</td>
                            <td className="px-1 py-1 w-full">
                              <input
                                type="text"
                                value={detail.PartiNo ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'PartiNo', event.target.value)}
                                className={`${buildInputClasses(false)} h-7 w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px' }}
                              />
                            </td>
                            <td className="px-1 py-1 w-full">
                              <input
                                type="number"
                                step="1"
                                value={detail.topSayi ?? detail.TopSayi ?? 0}
                                onChange={(event) => onDetailFieldChange(index, 'topSayi', event.target.value === '' ? 0 : Number(event.target.value))}
                                className={`${buildInputClasses(false)} h-7 w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px' }}
                              />
                            </td>
                            <td className="px-1 py-1 w-full">
                              <input
                                type="number"
                                value={detail.KazanGiris ?? ''}
                                onFocus={() => loadSendedFabrics(index, detail)}
                                onChange={(event) => {
                                  const nextValue = event.target.value === '' ? '' : Number(event.target.value)
                                  onDetailFieldChange(index, 'KazanGiris', nextValue)
                                }}
                                className={`${buildInputClasses(false)} h-7 w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px' }}
                              />
                            </td>
                            <td className="px-1 py-1 w-full">
                              <select
                                value={detail.Status ?? 1}
                                onChange={(event) => onDetailFieldChange(index, 'Status', Number(event.target.value))}
                                className={`${buildInputClasses(false)} h-7 w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px', lineHeight: 'normal' }}
                              >
                                {statusOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.durum || option.name || option.statusName || option.value}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-1 py-1 w-full">
                              <input
                                type="number"
                                step="0.01"
                                value={detail.SevkHazir ?? 0}
                                onChange={(event) => onDetailFieldChange(index, 'SevkHazir', Number(event.target.value))}
                                className={`${buildInputClasses(false)} h-7 w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px' }}
                              />
                            </td>
                            <td className="px-1 py-1 w-full text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleCopyRow(index)}
                                  title="Kopyala"
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-slate-50 text-[11px] text-slate-600 transition hover:bg-slate-100"
                                >
                                  📄
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(index)}
                                  title="Sil"
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-red-300 bg-red-50 text-[11px] text-red-600 transition hover:bg-red-100"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {activeFabricState ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <div className="mb-1.5 px-2 text-[11px] font-semibold text-slate-700">Gönderilmiş kumaşlar</div>
                    {activeFabricState.loading ? (
                      <p className="px-2 py-1.5 text-[10px] text-slate-500">Yükleniyor...</p>
                    ) : activeFabricState.error ? (
                      <p className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] text-red-700 mx-2">
                        {activeFabricState.error}
                      </p>
                    ) : activeFabricState.items.length === 0 ? (
                      <p className="px-2 py-1.5 text-[10px] text-slate-500">Kumaş bulunamadı.</p>
                    ) : (
                      <div className="space-y-1">
                        {activeFabricState.items.map((item) => {
                          const isSelected = activeFabricState.selectedLotIds.includes(item.fabricLot)
                          return (
                            <div
                              key={`${item.fabricLot}-${item.totalWeight}`}
                              className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1.5 hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectedLot(activeKazanRowIndex, item.fabricLot)}
                                className="h-4 w-4 flex-shrink-0 rounded border-slate-300 text-slate-700 focus:ring-slate-400"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] text-slate-600">
                                  <div className="font-medium text-slate-900 truncate text-[11px]">{item.fabricGender ?? '-'}</div>
                                  <div className="text-[10px]">
                                    <span className="font-medium text-slate-900">L: {item.fabricLot}</span>
                                    <span className="mx-1 text-slate-400">•</span>
                                    <span>Gr: {item.fabricGr}</span>
                                    <span className="mx-1 text-slate-400">•</span>
                                    <span>W: {item.totalWeight}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="sticky bottom-0 mt-4 flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:justify-end sm:px-6" dir="ltr">
                  <button
                    type="button"
                    className={`${buildButtonClasses('secondary')} px-3 py-1.5 text-[11px]`}
                    onClick={onClose}
                    disabled={isSaving}
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className={`${buildButtonClasses('primary')} px-3 py-1.5 text-[11px]`}
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default BoyaliSiparisTakipModal
