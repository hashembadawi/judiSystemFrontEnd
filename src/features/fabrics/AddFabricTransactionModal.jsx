import { useCallback, useEffect, useRef, useState } from 'react'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

const EMPTY_DETAILS = []
const SHEET_INPUT_CLASSES = 'w-full rounded-none border-0 bg-transparent px-1.5 py-1 text-[11px] text-slate-900 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-500'

const extractWeightValue = (message) => {
  let value = message

  if (typeof message === 'string') {
    try {
      value = JSON.parse(message)
    } catch {
      return message.trim()
    }
  }

  const findValue = (candidate) => {
    if (typeof candidate === 'number') {
      return String(candidate)
    }

    if (typeof candidate === 'string') {
      return candidate.trim()
    }

    if (Array.isArray(candidate)) {
      return candidate.length ? findValue(candidate[0]) : ''
    }

    if (candidate && typeof candidate === 'object') {
      for (const key of ['weight', 'Weight', 'value', 'Value', 'result', 'Result', 'data', 'Data']) {
        if (candidate[key] !== undefined && candidate[key] !== null) {
          const nestedValue = findValue(candidate[key])
          if (nestedValue !== '') {
            return nestedValue
          }
        }
      }
    }

    return ''
  }

  return findValue(value)
}

function AddFabricTransactionModal({
  isOpen,
  isLoading,
  error,
  form,
  shiftOptions,
  operatorOptions,
  machines,
  currentUserName,
  isAddingDetail,
  savingDetailIndex,
  onFieldChange,
  onDetailFieldChange,
  onToggleDetailLock,
  onPrintDetail,
  onAddDetail,
  onSaveDetail,
  onClose,
}) {
  const details = form?.Details ?? EMPTY_DETAILS
  const weightSockets = useRef(new Map())
  const [weightReadStates, setWeightReadStates] = useState({})
  const [selectedMachineId, setSelectedMachineId] = useState('all')
  const enteredMachineIds = new Set(
    details
      .map((detail) => detail.Makine)
      .filter((machineId) => machineId !== undefined && machineId !== null && String(machineId).trim() !== '')
      .map(String),
  )
  const machineFilterOptions = machines.filter((machine) => enteredMachineIds.has(String(machine.machineId)))
  const activeMachineId = selectedMachineId === 'all'
    || machineFilterOptions.some((machine) => String(machine.machineId) === selectedMachineId)
    ? selectedMachineId
    : 'all'
  const filteredDetails = details
    .map((detail, index) => ({ detail, index }))
    .filter(({ detail }) => activeMachineId === 'all' || String(detail.Makine) === activeMachineId)
  const summaryDetails = filteredDetails.filter(({ detail }) =>
    detail.Makine !== undefined && detail.Makine !== null && String(detail.Makine).trim() !== '',
  )
  const totalWeight = summaryDetails.reduce((total, { detail }) => {
    const weight = Number(detail.Weight)
    return total + (Number.isFinite(weight) ? weight : 0)
  }, 0)

  const handleDetailMachineChange = (index, value) => {
    const currentMachineId = String(details[index]?.Makine ?? '')
    const hasOtherRowsForSelectedMachine = details.some((detail, detailIndex) =>
      detailIndex !== index && String(detail.Makine ?? '') === selectedMachineId,
    )

    if (
      selectedMachineId !== 'all'
      && currentMachineId === selectedMachineId
      && !hasOtherRowsForSelectedMachine
    ) {
      setSelectedMachineId('all')
    }

    onDetailFieldChange(index, 'Makine', value)
  }

  const readWeight = useCallback((index) => {
    if (!isOpen || details[index]?.isLocked || savingDetailIndex !== null || weightSockets.current.has(index)) {
      return
    }

    setWeightReadStates((previous) => ({ ...previous, [index]: 'loading' }))

    let socket
    try {
      socket = new WebSocket('ws://localhost:8181')
      weightSockets.current.set(index, socket)
    } catch {
      setWeightReadStates((previous) => ({ ...previous, [index]: 'Teraziye bağlanılamadı.' }))
      return
    }

    const failRead = () => {
      if (weightSockets.current.get(index) !== socket) {
        return
      }

      weightSockets.current.delete(index)
      setWeightReadStates((previous) => ({ ...previous, [index]: 'Terazi verisi alınamadı.' }))
      socket.close()
    }

    socket.onopen = () => {
      try {
        socket.send('READ')
      } catch {
        failRead()
      }
    }

    socket.onmessage = async (event) => {
      if (weightSockets.current.get(index) !== socket) {
        return
      }

      try {
        const message = typeof event.data === 'string' ? event.data : await event.data.text()
        const weight = extractWeightValue(message)
        if (weight === '') {
          failRead()
          return
        }

        weightSockets.current.delete(index)
        setWeightReadStates((previous) => {
          const next = { ...previous }
          delete next[index]
          return next
        })
        onDetailFieldChange(index, 'Weight', weight)
        socket.close()
      } catch {
        failRead()
      }
    }

    socket.onerror = failRead
    socket.onclose = () => {
      if (weightSockets.current.get(index) === socket) {
        weightSockets.current.delete(index)
        setWeightReadStates((previous) => ({ ...previous, [index]: 'Terazi bağlantısı kesildi.' }))
      }
    }
  }, [details, isOpen, onDetailFieldChange, savingDetailIndex])

  const handleWeightChange = useCallback((index, value) => {
    const socket = weightSockets.current.get(index)
    if (socket) {
      weightSockets.current.delete(index)
      socket.close()
    }

    setWeightReadStates((previous) => {
      const next = { ...previous }
      delete next[index]
      return next
    })
    onDetailFieldChange(index, 'Weight', value)
  }, [onDetailFieldChange])

  useEffect(() => {
    if (isOpen) {
      return undefined
    }

    weightSockets.current.forEach((socket) => socket.close())
    weightSockets.current.clear()
    return undefined
  }, [isOpen])

  const handleCloseRequest = useCallback(() => {
    if (savingDetailIndex !== null || isLoading) {
      return
    }

    if (window.confirm('Kaydetmeden önce pencereyi kapatmak istediğinize emin misiniz?')) {
      setWeightReadStates({})
      setSelectedMachineId('all')
      onClose()
    }
  }, [isLoading, onClose, savingDetailIndex])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && savingDetailIndex === null) {
        handleCloseRequest()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleCloseRequest, isOpen, savingDetailIndex])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50" onClick={handleCloseRequest} />
      <div className="relative flex min-h-full items-start justify-center p-4 pt-8">
        <section className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200" dir="ltr">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
            <h4 className="text-xl font-semibold text-slate-900">Kumaş Hareketi Ekle</h4>
            <button type="button" className="text-2xl leading-none text-slate-400 transition hover:text-slate-600" onClick={handleCloseRequest} aria-label="Kapat">×</button>
          </header>

          <div className="max-h-[calc(100vh-11rem)] space-y-5 overflow-y-auto px-5 py-6">
            {isLoading ? <p className="py-8 text-center text-slate-500">Makineler ve seçenekler yükleniyor...</p> : null}
            {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

            {!isLoading ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="fabricMovementShift" className="block text-xs font-medium text-slate-700">Vardiya</label>
                  <select id="fabricMovementShift" value={form.Shift ?? ''} onChange={(event) => onFieldChange('Shift', event.target.value)} className={`${buildInputClasses(false)} w-full`}>
                    <option value="">Vardiya seçin</option>
                    {shiftOptions.map((shift) => <option key={shift} value={shift}>{shift}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="fabricMovementDate" className="block text-xs font-medium text-slate-700">Tarih</label>
                  <input id="fabricMovementDate" type="date" value={form.Date ?? ''} onChange={(event) => onFieldChange('Date', event.target.value)} className={`${buildInputClasses(false)} w-full`} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="fabricMovementPersonal" className="block text-xs font-medium text-slate-700">Veri Girişi</label>
                  <input id="fabricMovementPersonal" type="text" value={currentUserName ?? ''} readOnly className={`${buildInputClasses(false)} w-full bg-slate-50`} />
                </div>

                <div className="space-y-4 lg:col-span-3">
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-2">
                    <button type="button" className={`${buildButtonClasses('secondary')} px-3 py-1.5 text-xs`} onClick={() => { setSelectedMachineId('all'); onAddDetail() }} disabled={!machines.length || isAddingDetail}>
                      {isAddingDetail ? 'Yükleniyor...' : '+ Yeni Top'}
                    </button>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="space-y-1">
                        <label htmlFor="fabricMovementMachineFilter" className="block text-[11px] font-medium text-slate-700">Makine filtresi</label>
                        <select
                          id="fabricMovementMachineFilter"
                          value={activeMachineId}
                          onChange={(event) => setSelectedMachineId(event.target.value)}
                          className={`${buildInputClasses(false)} min-w-44 py-1.5 text-xs`}
                        >
                          <option value="all">Tüm makineler</option>
                          {machineFilterOptions.map((machine) => (
                            <option key={machine.machineId} value={String(machine.machineId)}>
                              {machine.makineNo ?? machine.machineId}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs" aria-live="polite">
                        <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                          Toplam top: <span className="font-semibold text-slate-900">{summaryDetails.length}</span>
                        </div>
                        <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                          Toplam ağırlık: <span className="font-semibold text-slate-900">{totalWeight.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {filteredDetails.length ? (
                    <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm">
                      <table className="w-full min-w-[900px] table-fixed border-collapse text-xs" dir="ltr">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th scope="col" className="w-12 border border-slate-300 px-2 py-1.5 text-center font-semibold">#</th>
                            <th scope="col" className="w-[18%] border border-slate-300 px-2 py-1.5 text-left font-semibold">Makine No</th>
                            <th scope="col" className="w-[23%] border border-slate-300 px-2 py-1.5 text-left font-semibold">Makine Operatörü</th>
                            <th scope="col" className="w-[19%] border border-slate-300 px-2 py-1.5 text-left font-semibold">Ağırlık</th>
                            <th scope="col" className="w-[15%] border border-slate-300 px-2 py-1.5 text-left font-semibold">Kumaş Türü</th>
                            <th scope="col" className="w-32 border border-slate-300 px-2 py-1.5 text-center font-semibold">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDetails.map(({ detail, index }, visibleIndex) => (
                            <tr key={`fabric-detail-${index}`} className="odd:bg-white even:bg-slate-50/70">
                              <td className="border border-slate-300 bg-slate-100 px-2 py-1 text-center font-semibold text-slate-600">{visibleIndex + 1}</td>
                              <td className="border border-slate-300 p-0">
                                <select id={`fabricMovementMachine-${index}`} aria-label={`Top ${index + 1} Makine No`} value={detail.Makine ?? ''} onChange={(event) => handleDetailMachineChange(index, event.target.value)} disabled={detail.isLocked || savingDetailIndex !== null} className={SHEET_INPUT_CLASSES}>
                                  <option value="">Makine seçin</option>
                                  {machines.map((machine) => <option key={machine.machineId} value={machine.machineId}>{machine.makineNo}</option>)}
                                </select>
                              </td>
                              <td className="border border-slate-300 p-0">
                                <select id={`fabricMovementOperator-${index}`} aria-label={`Top ${index + 1} Makine Operatörü`} value={detail.Operator ?? ''} onChange={(event) => onDetailFieldChange(index, 'Operator', event.target.value)} disabled={detail.isLocked || savingDetailIndex !== null} className={SHEET_INPUT_CLASSES}>
                                  <option value="">Operatör seçin</option>
                                  {operatorOptions.map((operator, operatorIndex) => <option key={`${operator}-${operatorIndex}`} value={operator}>{operator}</option>)}
                                </select>
                              </td>
                              <td className="border border-slate-300 p-0">
                                <input id={`fabricMovementWeight-${index}`} aria-label={`Top ${index + 1} Ağırlık`} type="number" min="0" step="0.01" value={detail.Weight ?? ''} onFocus={() => readWeight(index)} onChange={(event) => handleWeightChange(index, event.target.value)} disabled={detail.isLocked || savingDetailIndex !== null} className={SHEET_INPUT_CLASSES} placeholder={weightReadStates[index] === 'loading' ? 'Terazi okunuyor...' : 'Tartım için odaklanın'} />
                                {weightReadStates[index] && weightReadStates[index] !== 'loading' ? <p className="mt-0.5 px-1.5 text-[10px] text-red-600">{weightReadStates[index]}</p> : null}
                                {detail.remainingWeight !== undefined && detail.remainingWeight !== null ? (
                                  <p className="border-t border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                                    Kalan üretim ağırlığı: <span className="font-medium text-slate-700">{detail.remainingWeight} kg</span>
                                  </p>
                                ) : null}
                              </td>
                              <td className="border border-slate-300 p-0">
                                <select id={`fabricMovementType-${index}`} aria-label={`Top ${index + 1} Kumaş Türü`} value={detail.fabricType ?? 1} onChange={(event) => onDetailFieldChange(index, 'fabricType', Number(event.target.value))} disabled={detail.isLocked || savingDetailIndex !== null} className={SHEET_INPUT_CLASSES}>
                                  <option value={1}>Sağlam</option>
                                  <option value={2}>Hata</option>
                                </select>
                              </td>
                              <td className="border border-slate-300 px-1 py-1">
                                <div className="flex items-center justify-center gap-1">
                                  <button type="button" className="inline-flex h-6 min-w-8 w-auto items-center justify-center rounded border border-emerald-200 bg-emerald-50 px-1.5 text-xs leading-none text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={detail.isLocked || savingDetailIndex !== null} onClick={() => onSaveDetail(index)} title={savingDetailIndex === index ? 'Kaydediliyor...' : detail.isSaved ? 'Değişiklikleri kaydet' : 'Kaydet'} aria-label={`Top ${index + 1} kaydet`}>{savingDetailIndex === index ? '…' : '💾'}</button>
                                  <button type="button" className="inline-flex h-6 min-w-8 w-auto items-center justify-center rounded border border-slate-300 bg-white px-1.5 text-xs leading-none text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={!detail.isSaved || savingDetailIndex !== null} onClick={() => onToggleDetailLock(index)} title={detail.isLocked ? 'Kilidi aç' : 'Kilitle'} aria-label={`Top ${index + 1} kilit durumu`}>{detail.isLocked ? '🔒' : '🔓'}</button>
                                  <button type="button" className="inline-flex h-6 min-w-8 w-auto items-center justify-center rounded border border-blue-200 bg-blue-50 px-1.5 text-xs leading-none text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={!detail.isSaved || savingDetailIndex !== null} onClick={() => onPrintDetail(detail.printData ?? detail)} title="Top etiketini yeniden yazdır" aria-label={`Top ${index + 1} yeniden yazdır`}>🖨️</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  {!machines.length ? <p className="text-xs text-slate-500">Aktif planlı makine bulunamadı.</p> : null}
                </div>
              </div>
            ) : null}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
            <button type="button" className={buildButtonClasses('secondary')} onClick={handleCloseRequest} disabled={isLoading || savingDetailIndex !== null}>KAPAT</button>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default AddFabricTransactionModal
