import { useEffect } from 'react'

function AddMachineYarnsModal({ isOpen, isLoading, error, order, detail, machines = [], availableYarns = [], form, isAddingMachinePlan, onFieldChange, onAddMachinePlan, onRemoveMachinePlan, onLinkMachine, onAddYarnPlan, onRemoveYarnPlan, onLinkYarn, onClose }) {
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
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-5" role="dialog" aria-modal="true" dir="ltr" style={{ direction: 'ltr' }}>
      <section className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-white text-left shadow-[0_24px_50px_rgba(15,23,42,0.22)] ring-1 ring-slate-200" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
        <header className="flex items-center justify-between border-b border-slate-200 bg-sky-50 px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold text-sky-900">MAKİNE VE İPLİK EKLE</h4>
            <p className="mt-0.5 text-[10px] text-slate-500">{order?.orderNo || order?.name || '-'} · {detail?.fabricGender || '-'}</p>
          </div>
          <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-500 hover:bg-slate-50" onClick={onClose} aria-label="Kapat">×</button>
        </header>

        <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
          {isLoading ? <p className="py-8 text-center text-xs text-slate-500">Makineler ve iplikler yükleniyor...</p> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">{error}</p> : null}

          {!isLoading && !error ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h5 className="text-xs font-semibold text-slate-800">Makineler</h5>
                <button type="button" className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[10px] font-medium text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onAddMachinePlan(detail)} disabled={isAddingMachinePlan}>
                  {isAddingMachinePlan ? 'Makineler yükleniyor...' : '+ Makine ekle'}
                </button>
              </div>

              {(form.machinePlans ?? []).map((plan, index) => (
                <div key={plan.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-700">Makine {index + 1}</span>
                    <button type="button" className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onRemoveMachinePlan(index)} disabled={(form.machinePlans ?? []).length === 1}>Kaldır</button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="space-y-1.5">
                      <label htmlFor={`productionMachineSelect-${index}`} className="block text-[11px] font-medium text-slate-600">Makine</label>
                      <select id={`productionMachineSelect-${index}`} value={plan.machineId} onChange={(event) => onFieldChange(index, 'machineId', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200">
                        <option value="">Makine seçin</option>
                        {machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.makineNo || machine.machineNo || machine.id} - {machine.makineStatusName || ''}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button type="button" className="rounded-md bg-sky-700 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onLinkMachine(index)} disabled={isLoading || !plan.machineId || Boolean(plan.machineLinkId) || plan.machineLinkLoading}>
                        {plan.machineLinkLoading ? 'Bağlanıyor...' : plan.machineLinkId ? 'Makine bağlandı' : 'Makineyi bağla'}
                      </button>
                    </div>
                  </div>

                  {plan.machineLinkError ? <p className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-[10px] text-red-800">{plan.machineLinkError}</p> : null}

                  {plan.machineLinkId ? (
                    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-2">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-emerald-900">İplikler</span>
                        <button type="button" className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100" onClick={() => onAddYarnPlan(index)}>+ İplik ekle</button>
                      </div>
                      <div className="space-y-2">
                        {(plan.yarnPlans ?? []).map((yarnPlan, yarnIndex) => (
                          <div key={yarnPlan.key} className="rounded-md border border-emerald-100 bg-white p-2">
                            <div className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-end">
                              <div className="space-y-1.5">
                                <label htmlFor={`productionYarnSelect-${index}-${yarnIndex}`} className="block text-[11px] font-medium text-slate-600">İplik</label>
                                <select id={`productionYarnSelect-${index}-${yarnIndex}`} value={yarnPlan.yarnId} onChange={(event) => onFieldChange(index, 'yarnId', event.target.value, yarnIndex)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200">
                                  <option value="">İplik seçin</option>
                                  {availableYarns.map((yarn) => <option key={yarn.id} value={yarn.id}>{yarn.yarnGender || '-'} - Lot: {yarn.lot || '-'} - Net: {yarn.remainNetKg ?? 0} kg / Brut: {yarn.remainBrutKg ?? 0} kg</option>)}
                                </select>
                              </div>
                              <button type="button" className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onRemoveYarnPlan(index, yarnIndex)} disabled={(plan.yarnPlans ?? []).length === 1}>Kaldır</button>
                              <button type="button" className="rounded-md bg-emerald-700 px-2 py-1.5 text-[10px] font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onLinkYarn(index, yarnIndex)} disabled={isLoading || !yarnPlan.yarnId || yarnPlan.yarnLinkId || yarnPlan.yarnLinkLoading}>
                                {yarnPlan.yarnLinkLoading ? 'Bağlanıyor...' : yarnPlan.yarnLinkId ? 'Bağlandı' : 'İpliği bağla'}
                              </button>
                            </div>
                            {yarnPlan.yarnLinkError ? <p className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-[10px] text-red-800">{yarnPlan.yarnLinkError}</p> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              {!machines.length ? <p className="text-[10px] text-slate-500">Uygun makine bulunamadı.</p> : null}
              {!availableYarns.length ? <p className="text-[10px] text-slate-500">Uygun iplik bulunamadı.</p> : null}
            </>
          ) : null}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100" onClick={onClose} disabled={isLoading}>Kapat</button>
        </footer>
      </section>
    </div>
  )
}

export default AddMachineYarnsModal
