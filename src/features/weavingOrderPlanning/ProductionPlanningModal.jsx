import { useEffect } from 'react'

function ProductionPlanningModal({ isOpen, isLoading, error, machines = [], order, form, onFieldChange, onClose }) {
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
      <section className="relative w-full max-w-xl overflow-hidden rounded-xl bg-white text-left shadow-[0_24px_50px_rgba(15,23,42,0.22)] ring-1 ring-slate-200" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
        <header className="flex items-center justify-between border-b border-slate-200 bg-emerald-50 px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold text-emerald-900">ÜRETİM PLANI EKLE</h4>
            <p className="mt-0.5 text-[10px] text-slate-500">{order?.orderNo || order?.name || '-'}</p>
          </div>
          <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-500 hover:bg-slate-50" onClick={onClose} aria-label="Kapat">×</button>
        </header>

        <div className="p-4" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
          {isLoading ? <p className="py-8 text-center text-xs text-slate-500">Makineler yükleniyor...</p> : null}
          {error ? <p className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">{error}</p> : null}

          {!isLoading && !error ? (
            <div className="space-y-1.5">
              <label htmlFor="productionPlanningMachine" className="block text-[11px] font-medium text-slate-600">Makine</label>
              <select
                id="productionPlanningMachine"
                value={form.machineId}
                onChange={(event) => onFieldChange('machineId', event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
              >
                <option value="">Makine seçin</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.makineNo || machine.machineNo || machine.name || machine.id} - {machine.makineStatusName || ''}
                  </option>
                ))}
              </select>
              {!machines.length ? <p className="text-[10px] text-slate-500">Uygun makine bulunamadı.</p> : null}
            </div>
          ) : null}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100" onClick={onClose} disabled={isLoading}>İptal</button>
          <button type="button" className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoading || !form.machineId}>Ekle</button>
        </footer>
      </section>
    </div>
  )
}

export default ProductionPlanningModal
