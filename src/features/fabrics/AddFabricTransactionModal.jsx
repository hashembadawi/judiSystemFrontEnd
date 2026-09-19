import { useCallback, useEffect } from 'react'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

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
  const details = form?.Details ?? []

  const handleCloseRequest = useCallback(() => {
    if (savingDetailIndex !== null || isLoading) {
      return
    }

    if (window.confirm('Kaydetmeden önce pencereyi kapatmak istediğinize emin misiniz?')) {
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
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <button type="button" className={`${buildButtonClasses('secondary')} px-3 py-1.5 text-xs`} onClick={onAddDetail} disabled={!machines.length || isAddingDetail}>
                      {isAddingDetail ? 'Yükleniyor...' : '+ Yeni Top'}
                    </button>
                  </div>
                  {details.map((detail, index) => (
                    <div key={`fabric-detail-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="grid items-end gap-2 md:grid-cols-[minmax(2rem,auto)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <div className="space-y-1 text-center">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded bg-slate-200 px-1 text-xs font-semibold text-slate-600">{index + 1}</span>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`fabricMovementMachine-${index}`} className="block text-xs font-medium text-slate-700">Makine No</label>
                            <select id={`fabricMovementMachine-${index}`} value={detail.Makine ?? ''} onChange={(event) => onDetailFieldChange(index, 'Makine', event.target.value)} disabled={detail.isLocked || savingDetailIndex !== null} className={`${buildInputClasses(false)} w-full py-1.5 text-xs`}>
                            <option value="">Makine seçin</option>
                            {machines.map((machine) => <option key={machine.machineId} value={machine.machineId}>{machine.makineNo}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`fabricMovementOperator-${index}`} className="block text-xs font-medium text-slate-700">Makine Operatörü</label>
                            <select id={`fabricMovementOperator-${index}`} value={detail.Operator ?? ''} onChange={(event) => onDetailFieldChange(index, 'Operator', event.target.value)} disabled={detail.isLocked || savingDetailIndex !== null} className={`${buildInputClasses(false)} w-full py-1.5 text-xs`}>
                            <option value="">Operatör seçin</option>
                            {operatorOptions.map((operator, operatorIndex) => <option key={`${operator}-${operatorIndex}`} value={operator}>{operator}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`fabricMovementWeight-${index}`} className="block text-xs font-medium text-slate-700">Ağırlık</label>
                            <input id={`fabricMovementWeight-${index}`} type="number" min="0" step="0.01" value={detail.Weight ?? ''} onChange={(event) => onDetailFieldChange(index, 'Weight', event.target.value)} disabled={detail.isLocked || savingDetailIndex !== null} className={`${buildInputClasses(false)} w-full py-1.5 text-xs`} placeholder="Ağırlık girin" />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`fabricMovementType-${index}`} className="block text-xs font-medium text-slate-700">Kumaş Türü</label>
                            <select id={`fabricMovementType-${index}`} value={detail.fabricType ?? 1} onChange={(event) => onDetailFieldChange(index, 'fabricType', Number(event.target.value))} disabled={detail.isLocked || savingDetailIndex !== null} className={`${buildInputClasses(false)} w-full py-1.5 text-xs`}>
                            <option value={1}>Sağlam</option>
                            <option value={2}>Hata</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" className="inline-flex h-7 min-w-10 w-auto items-center justify-center rounded border border-emerald-200 bg-emerald-50 px-2 text-sm leading-none text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={detail.isLocked || savingDetailIndex !== null} onClick={() => onSaveDetail(index)} title={savingDetailIndex === index ? 'Kaydediliyor...' : detail.isSaved ? 'Değişiklikleri kaydet' : 'Kaydet'} aria-label={`Top ${index + 1} kaydet`}>{savingDetailIndex === index ? '…' : '💾'}</button>
                          <button type="button" className="inline-flex h-7 min-w-10 w-auto items-center justify-center rounded border border-slate-300 bg-white px-2 text-sm leading-none text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={!detail.isSaved || savingDetailIndex !== null} onClick={() => onToggleDetailLock(index)} title={detail.isLocked ? 'Kilidi aç' : 'Kilitle'} aria-label={`Top ${index + 1} kilit durumu`}>{detail.isLocked ? '🔒' : '🔓'}</button>
                          <button type="button" className="inline-flex h-7 min-w-10 w-auto items-center justify-center rounded border border-blue-200 bg-blue-50 px-2 text-sm leading-none text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={!detail.isSaved || savingDetailIndex !== null} onClick={() => onPrintDetail(detail.printData ?? detail)} title="Top etiketini yeniden yazdır" aria-label={`Top ${index + 1} yeniden yazdır`}>🖨️</button>
                        </div>
                      </div>
                      {detail.remainingWeight !== undefined && detail.remainingWeight !== null ? (
                        <p className="mt-1 pl-9 text-[11px] text-slate-500">
                          Kalan üretim ağırlığı: <span className="font-medium text-slate-700">{detail.remainingWeight} kg</span>
                        </p>
                      ) : null}
                    </div>
                  ))}
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
