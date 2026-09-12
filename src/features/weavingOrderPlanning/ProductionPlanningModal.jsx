import { useEffect } from 'react'

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 })
}

function ProductionPlanningModal({ isOpen, isLoading, error, order, detail, onClose, onOpenMachineYarns, onToggleMachinePause, onRemoveMachine, machineActionLoadingId }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isLoading, isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-5" role="dialog" aria-modal="true" dir="ltr" style={{ direction: 'ltr' }}>
      <section className="relative w-full max-w-5xl overflow-hidden rounded-xl bg-white text-left shadow-[0_24px_50px_rgba(15,23,42,0.22)] ring-1 ring-slate-200" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
        <header className="flex items-center justify-between border-b border-slate-200 bg-emerald-50 px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold text-emerald-900">ÜRETİM PLANI</h4>
            <p className="mt-0.5 text-[10px] text-slate-500">{detail?.weavingOrderName || order?.orderNo || order?.name || '-'}</p>
            <p className="mt-1 text-xs font-medium text-slate-700">{detail?.fabricGender || '-'}</p>
          </div>
          <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-500 hover:bg-slate-50" onClick={onClose} aria-label="Kapat">×</button>
        </header>

        <div className="p-4" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
          {isLoading ? <p className="py-8 text-center text-xs text-slate-500">Üretim planı yükleniyor...</p> : null}
          {error ? <p className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">{error}</p> : null}

          {!isLoading && !error && detail ? (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 p-2 text-[10px]"><span className="block text-slate-500">Plan durumu</span><strong className="text-slate-900">{Number(detail.isPlanned) === 1 ? 'Planlandı' : 'Planlanmadı'}</strong></div>
                <div className="rounded-md bg-slate-50 p-2 text-[10px]"><span className="block text-slate-500">İlerleme</span><strong className="text-slate-900">{formatNumber(detail.progressPercent)}%</strong></div>
                <div className="rounded-md bg-slate-50 p-2 text-[10px]"><span className="block text-slate-500">Makine sayısı</span><strong className="text-slate-900">{Array.isArray(detail.machines) ? detail.machines.length : 0}</strong></div>
              </div>

              {Array.isArray(detail.machines) && detail.machines.length ? detail.machines.map((machine, index) => (
                <article key={machine.machinePlanId ?? machine.machineId ?? index} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <h5 className="text-xs font-semibold text-slate-800">{machine.makineNo || machine.machineId || `Makine ${index + 1}`}</h5>
                      <p className="text-[10px] text-slate-500">Plan ID: {machine.machinePlanId ?? '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${Number(machine.isActive) === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {Number(machine.isActive) === 1 ? 'Aktif' : 'Pasif'}
                      </span>
                      <button
                        type="button"
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${Number(machine.isPaused) === 1 ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                        onClick={() => onToggleMachinePause(machine)}
                        disabled={isLoading || !machine.machinePlanId || machineActionLoadingId === Number(machine.machinePlanId)}
                        aria-label={Number(machine.isPaused) === 1 ? 'Makineyi çalıştır' : 'Makineyi durdur'}
                        title={Number(machine.isPaused) === 1 ? 'Makineyi çalıştır' : 'Makineyi durdur'}
                      >
                        {machineActionLoadingId === Number(machine.machinePlanId) ? '…' : Number(machine.isPaused) === 1 ? '▶' : '⏸'}
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-sm text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => onRemoveMachine(machine)}
                        disabled={isLoading || !machine.machinePlanId || machineActionLoadingId === Number(machine.machinePlanId)}
                        aria-label="Makineyi üretim planından kaldır"
                        title="Makineyi üretim planından kaldır"
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-3 text-[10px]">
                    <div><span className="block text-slate-500">Durum</span><strong>{machine.makineStatusName || '-'}</strong></div>
                    <div><span className="block text-slate-500">Üretilen ağırlık</span><strong>{formatNumber(machine.machineProducedWeight)}</strong></div>
                    <div><span className="block text-slate-500">Not</span><strong>{machine.notes || '-'}</strong></div>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white">
                    <table className="w-full table-fixed text-left text-[10px]" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                      <thead className="bg-slate-100 text-slate-600"><tr><th className="px-2 py-1.5 text-left">Yarn Cinsi</th><th className="px-2 py-1.5 text-left">Lot</th><th className="px-2 py-1.5 text-left">Fiyat</th><th className="px-2 py-1.5 text-left">Net</th><th className="px-2 py-1.5 text-left">Durum</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {Array.isArray(machine.yarns) && machine.yarns.length ? machine.yarns.map((yarn, yarnIndex) => (
                          <tr key={yarn.machineYarnId ?? yarn.yarnId ?? yarnIndex}>
                            <td className="break-words px-2 py-1.5">{yarn.yarnGender || '-'}</td>
                            <td className="px-2 py-1.5">{yarn.yarnLot || '-'}</td>
                            <td className="px-2 py-1.5">{formatNumber(yarn.yarnPrice)}</td>
                            <td className="px-2 py-1.5">{formatNumber(yarn.remainNetKg)}</td>
                            <td className="px-2 py-1.5">{Number(yarn.isActive) === 1 ? 'Aktif' : 'Pasif'}</td>
                          </tr>
                        )) : <tr><td colSpan={5} className="px-2 py-2 text-center text-slate-500">Bu makineye bağlı iplik bulunamadı.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </article>
              )) : <p className="rounded-md border border-slate-200 p-4 text-center text-xs text-slate-500">Bu kumaşa bağlı makine bulunamadı.</p>}
            </div>
          ) : null}
        </div>

        <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex w-full justify-between gap-2">
            <button type="button" className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onOpenMachineYarns(detail)} disabled={isLoading || !detail}>Makine ve İplik Ekle</button>
            <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100" onClick={onClose} disabled={isLoading}>Kapat</button>
          </div>
        </footer>
      </section>
    </div>
  )
}

export default ProductionPlanningModal
