import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

const TRACKING_MODAL_STYLES = `
  .boyali-tracking-modal {
    --tracking-font-size: 10px;
    --tracking-cell-padding: 3px 2px;
  }

  .boyali-tracking-modal .tracking-table-scroll {
    overflow-x: auto;
  }

  .boyali-tracking-modal .tracking-table {
    width: max-content;
    min-width: 100% !important;
    table-layout: auto;
    font-size: var(--tracking-font-size);
    border-collapse: collapse;
    background: #ffffff;
  }

  .boyali-tracking-modal .tracking-table th,
  .boyali-tracking-modal .tracking-table td {
    width: auto;
    min-width: 0 !important;
    padding: var(--tracking-cell-padding);
    vertical-align: middle;
    overflow-wrap: normal;
    white-space: nowrap;
    border: 1px solid #c9ced6;
    font-size: 10px !important;
    direction: ltr;
    text-align: left;
  }

  .boyali-tracking-modal .tracking-table th {
    font-size: 12px !important;
    line-height: 1.15;
    white-space: nowrap;
    background: #e7e9ed;
    color: #1f2937;
    font-weight: 700;
    text-align: left;
  }

  .boyali-tracking-modal .tracking-table tbody tr:nth-child(even) {
    background: #f8f9fa;
  }

  .boyali-tracking-modal .tracking-table tbody tr:hover {
    background: #eaf2ff;
  }

  .boyali-tracking-modal .tracking-table td > input,
  .boyali-tracking-modal .tracking-table td > select {
    width: 100%;
    min-width: 0 !important;
    height: 25px;
    padding: 2px 4px;
    font-size: 10px !important;
    line-height: 1.1;
    border: 1px solid #aeb6c2;
    border-radius: 0;
    background: #ffffff;
    color: #111827;
    box-shadow: none;
    direction: ltr;
    text-align: left;
  }

  .boyali-tracking-modal .tracking-table td > input:focus,
  .boyali-tracking-modal .tracking-table td > select:focus {
    border-color: #2563eb;
    outline: 1px solid #2563eb;
    outline-offset: -1px;
    box-shadow: none;
  }

  .boyali-tracking-modal .tracking-table th:nth-child(2),
  .boyali-tracking-modal .tracking-table td:nth-child(2) {
    width: max-content;
    min-width: 50px !important;
    padding-left: 27px;
    padding-right: 27px;
    white-space: nowrap;
    overflow: visible;
    overflow-wrap: normal;
  }

  .boyali-tracking-modal .tracking-table th:nth-child(4),
  .boyali-tracking-modal .tracking-table td:nth-child(4),
  .boyali-tracking-modal .tracking-table th:nth-child(5),
  .boyali-tracking-modal .tracking-table td:nth-child(5) {
    padding-left: 14.5px;
    padding-right: 14.5px;
  }

  .boyali-tracking-modal .tracking-table th:nth-child(6),
  .boyali-tracking-modal .tracking-table td:nth-child(6),
  .boyali-tracking-modal .tracking-table th:nth-child(7),
  .boyali-tracking-modal .tracking-table td:nth-child(7) {
    padding-left: 19.5px;
    padding-right: 19.5px;
  }

  .boyali-tracking-modal .tracking-table th:nth-child(10),
  .boyali-tracking-modal .tracking-table td:nth-child(10),
  .boyali-tracking-modal .tracking-table th:nth-child(11),
  .boyali-tracking-modal .tracking-table td:nth-child(11),
  .boyali-tracking-modal .tracking-table th:nth-child(13),
  .boyali-tracking-modal .tracking-table td:nth-child(13),
  .boyali-tracking-modal .tracking-table th:nth-child(14),
  .boyali-tracking-modal .tracking-table td:nth-child(14) {
    width: 50px;
    max-width: 50px;
    min-width: 50px !important;
    padding-left: 1px;
    padding-right: 1px;
  }

  .boyali-tracking-modal .tracking-table th:nth-child(10),
  .boyali-tracking-modal .tracking-table td:nth-child(10) {
    width: 60px;
    max-width: 60px;
    min-width: 60px !important;
  }

  .boyali-tracking-modal .tracking-table th:nth-child(14),
  .boyali-tracking-modal .tracking-table td:nth-child(14) {
    width: 60px !important;
    max-width: 60px !important;
    min-width: 60px !important;
  }

  .boyali-tracking-modal .tracking-table th:nth-child(13),
  .boyali-tracking-modal .tracking-table td:nth-child(13),
  .boyali-tracking-modal .tracking-table td:nth-child(13) > input {
    width: 60px !important;
    max-width: 60px !important;
    min-width: 0 !important;
  }

  .boyali-tracking-modal .tracking-table td:nth-child(14) > input {
    width: 60px !important;
    max-width: 60px !important;
    min-width: 0 !important;
  }

  .boyali-tracking-modal .tracking-table .tracking-action-button {
    width: 22px;
    height: 22px;
    padding: 0;
    font-size: 10px;
    border-radius: 0;
  }

  @media (max-width: 900px) {
    .boyali-tracking-modal {
      --tracking-cell-padding: 2px 1px;
    }

    .boyali-tracking-modal .tracking-table td > input,
    .boyali-tracking-modal .tracking-table td > select {
      height: 23px;
      padding: 1px 2px;
    }
  }
`

function BoyaliSiparisTakipModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  orderForm,
  statusOptions,
  onClose,
  onSave,
  onDetailFieldChange,
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

  const parseWeight = useCallback((value) => {
    return Number(String(value ?? 0).replace(',', '.')) || 0
  }, [])

  const getAvailableWeight = useCallback(
    (rowIndex, items) => {
      const totalWeight = items.reduce((total, item) => total + parseWeight(item.totalWeight), 0)
      const currentEnteredWeight = parseWeight(orderForm.details[rowIndex]?.kazanGiris)

      return totalWeight + currentEnteredWeight
    },
    [orderForm.details, parseWeight],
  )

  const exceededFabricWeight = useMemo(() => {
    return Object.entries(sendedFabricsByRow).some(([rowIndex, fabricState]) => {
      if (fabricState.loading || fabricState.error || !fabricState.items.length) {
        return false
      }

      const numericRowIndex = Number(rowIndex)
      const availableWeight = getAvailableWeight(numericRowIndex, fabricState.items)
      const enteredWeight = parseWeight(orderForm.details[numericRowIndex]?.kazanGiris)

      return enteredWeight > availableWeight
    })
  }, [getAvailableWeight, orderForm.details, parseWeight, sendedFabricsByRow])

  const activeAvailableWeight = useMemo(() => {
    if (!activeFabricState?.items.length) {
      return 0
    }

    return getAvailableWeight(activeKazanRowIndex, activeFabricState.items)
  }, [activeFabricState, activeKazanRowIndex, getAvailableWeight])

  const activeEnteredWeight = parseWeight(orderForm.details[activeKazanRowIndex]?.kazanGiris)
  const activeRemainingWeight = activeAvailableWeight - activeEnteredWeight

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

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" dir="ltr" style={{ direction: 'ltr' }}>
      <style>{TRACKING_MODAL_STYLES}</style>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative flex min-h-full items-start justify-center p-0 pt-4 sm:p-4 sm:pt-8">
        <section className="boyali-tracking-modal w-full max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200 sm:max-w-6xl" dir="ltr" style={{ direction: 'ltr', maxWidth: '95vw' }}>
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6" dir="ltr">
            <div className="text-left">
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
                  <div className="tracking-table-scroll">
                    <table className="tracking-table w-full min-w-[1200px] text-left text-[11px]" dir="ltr" style={{ direction: 'ltr', borderCollapse: 'collapse' }}>
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">E.Başlığı</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">Kumaş Cinsi</th>
                          <th className="min-w-[220px] px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 whitespace-nowrap">LOT</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">En</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">Gr</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">Renk</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">R.Kodu</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">Sip.MIKTAR</th>
                          <th className="min-w-[180px] px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">Parti No</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">K.Giriş</th>
                          <th className="min-w-[80px] px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">G.Top</th>
                          <th className="min-w-[180px] px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">Durum</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">K.Çıkış</th>
                          <th className="min-w-[80px] px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">Ç.Top</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">FİRE %</th>
                          <th className="px-1 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-600 whitespace-nowrap">İşlemler</th>
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
                            <td className="min-w-[220px] px-1 py-1 w-full">
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
                            <td className="min-w-[180px] px-1 py-1 w-full">
                              <input
                                type="text"
                                value={detail.partiNo ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'partiNo', event.target.value)}
                                className={`${buildInputClasses(false)} h-7 min-w-[170px] w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px' }}
                              />
                            </td>
                            <td className="px-1 py-1 w-full">
                              <input
                                type="number"
                                value={detail.kazanGiris ?? ''}
                                onFocus={() => loadSendedFabrics(index, detail)}
                                  onChange={(event) => {
                                  const nextValue = event.target.value === '' ? '' : Number(event.target.value)
                                  onDetailFieldChange(index, 'kazanGiris', nextValue)
                                }}
                                  max={activeKazanRowIndex === index && activeAvailableWeight > 0 ? activeAvailableWeight : undefined}
                                className={`${buildInputClasses(false)} h-7 w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px' }}
                              />
                            </td>
                            <td className="min-w-[80px] px-1 py-1 w-full">
                              <input
                                type="number"
                                step="1"
                                value={detail.girisTopSayisi ?? 0}
                                onChange={(event) => onDetailFieldChange(index, 'girisTopSayisi', event.target.value === '' ? 0 : Number(event.target.value))}
                                className={`${buildInputClasses(false)} h-7 min-w-[70px] w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px' }}
                              />
                            </td>
                            <td className="min-w-[180px] px-1 py-1 w-full">
                              <select
                                value={detail.status ?? 1}
                                onChange={(event) => onDetailFieldChange(index, 'status', Number(event.target.value))}
                                className={`${buildInputClasses(false)} h-7 min-w-[170px] w-full text-[11px]`}
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
                                value={detail.sevkHazir ?? 0}
                                onChange={(event) => onDetailFieldChange(index, 'sevkHazir', Number(event.target.value))}
                                className={`${buildInputClasses(false)} h-7 w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px' }}
                              />
                            </td>
                            <td className="px-1 py-1 w-full">
                              <input
                                type="number"
                                step="1"
                                value={detail.cikisTopSayisi ?? 0}
                                onChange={(event) => onDetailFieldChange(index, 'cikisTopSayisi', event.target.value === '' ? 0 : Number(event.target.value))}
                                className={`${buildInputClasses(false)} h-7 w-full text-[11px]`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px', padding: '2px 4px' }}
                              />
                            </td>
                            <td className="px-1 py-1 w-full text-center text-[11px] font-medium text-slate-700">
                              {parseWeight(detail.sevkHazir) > 0 && parseWeight(detail.kazanGiris) > 0
                                ? `${(((parseWeight(detail.kazanGiris) - parseWeight(detail.sevkHazir)) / parseWeight(detail.kazanGiris)) * 100).toFixed(2)}%`
                                : '-'}
                            </td>
                            <td className="px-1 py-1 w-full text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleCopyRow(index)}
                                  title="Kopyala"
                                  className="tracking-action-button inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-slate-50 text-[11px] text-slate-600 transition hover:bg-slate-100"
                                >
                                  📄
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(index)}
                                  title="Sil"
                                  className="tracking-action-button inline-flex h-6 w-6 items-center justify-center rounded-md border border-red-300 bg-red-50 text-[11px] text-red-600 transition hover:bg-red-100"
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
                    {!activeFabricState.loading && !activeFabricState.error && activeFabricState.items.length > 0 ? (
                      <div className={`mt-2 rounded border px-2 py-1.5 text-[11px] ${activeRemainingWeight < 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                        Toplam mevcut: <strong>{activeAvailableWeight.toFixed(2)} kg</strong>
                        <span className="mx-1">|</span>
                        Kalan: <strong>{Math.max(activeRemainingWeight, 0).toFixed(2)} kg</strong>
                        {activeRemainingWeight < 0 ? <span className="ml-2 font-semibold">Girilen ağırlık mevcut miktarı aşıyor.</span> : null}
                      </div>
                    ) : null}
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
                    disabled={isSaving || exceededFabricWeight}
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
