import { useEffect } from 'react'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

const formatFabricGenderDisplay = (value) => {
  if (value == null) {
    return ''
  }

  const text = String(value).trim()
  const ratioMatch = text.match(/^(.*?)(\d+\s*\/\s*\d+(?:\s*\/\s*\d+)?)\s*$/)

  if (ratioMatch && ratioMatch[1].trim()) {
    return `${ratioMatch[2].trim()} ${ratioMatch[1].trim()}`
  }

  return text
}

function FasonHamEntryModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  factoryOptions,
  weavingOrders,
  fabrics,
  fabricTypeOptions,
  onFieldChange,
  onDetailFieldChange,
  onFactorySelect,
  onWeavingOrderSelect,
  onFabricSelect,
  onAddDetailRow,
  onRemoveDetailRow,
  onClose,
  onSave,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && !isSaving) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative flex min-h-full items-start justify-center p-0 pt-4 sm:p-4 sm:pt-8">
        <section className="max-h-[88vh] w-full overflow-y-auto rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200" style={{ maxWidth: '95vw' }} dir="ltr">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
            <h4 className="text-xl font-semibold text-slate-900">Yeni Hareketi</h4>
            <button type="button" className="text-2xl leading-none text-slate-400 transition hover:text-slate-600" onClick={onClose} aria-label="Kapat">×</button>
          </header>

          <div className="px-4 py-5 sm:px-6">
            {isLoading ? <p className="py-8 text-center text-slate-500">Seçenekler yükleniyor...</p> : (
              <>
                <div className="mb-6 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <label htmlFor="fasonHamEntryModalFactory" className="block text-sm font-medium text-slate-700">Fabrika</label>
                    <select id="fasonHamEntryModalFactory" value={form.factoryId ?? ''} onChange={(event) => onFactorySelect(event.target.value)} className={`${buildInputClasses(false)} w-full`}>
                      <option value="">Fabrika seçin</option>
                      {factoryOptions.map((factory) => (
                        <option key={factory.id ?? factory.value ?? factory} value={factory.id ?? factory.value ?? factory}>
                          {factory.name ?? factory.factoryName ?? factory.valueName ?? factory.value ?? factory}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fasonHamEntryModalOrder" className="block text-sm font-medium text-slate-700">Dokuma Sipariş</label>
                    <select id="fasonHamEntryModalOrder" value={form.weavingOrderId ?? ''} onChange={(event) => onWeavingOrderSelect(event.target.value)} disabled={!form.factoryId} className={`${buildInputClasses(false)} w-full`}>
                      <option value="">Sipariş seçin</option>
                      {weavingOrders.map((order) => (
                        <option key={order.id ?? order.value ?? order.name} value={order.id ?? order.value ?? order.name}>
                          {order.name ?? order.label ?? String(order.id ?? order.value ?? order.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fasonHamEntryModalDate" className="block text-sm font-medium text-slate-700">Tarih</label>
                    <input id="fasonHamEntryModalDate" type="datetime-local" value={form.entryDate ?? ''} onChange={(event) => onFieldChange('entryDate', event.target.value)} className={`${buildInputClasses(false)} w-full`} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fasonHamEntryModalPersonal" className="block text-sm font-medium text-slate-700">Personel</label>
                    <input id="fasonHamEntryModalPersonal" type="text" value={form.personalName ?? ''} onChange={(event) => onFieldChange('personalName', event.target.value)} className={`${buildInputClasses(false)} w-full`} />
                  </div>
                </div>

                <section className="space-y-4 border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between">
                    <h5 className="text-lg font-semibold text-slate-900">Detaylar</h5>
                    <button type="button" className={buildButtonClasses('secondary')} onClick={onAddDetailRow}>+ Satır Ekle</button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm" style={{ minWidth: '780px', direction: 'ltr', tableLayout: 'fixed' }}>
                      <thead><tr className="border-b border-slate-200 bg-slate-50">
                        <th className="w-[50%] px-3 py-3 text-left text-xs font-semibold text-slate-600">Kumaş Cinsi</th>
                        <th className="w-[15%] px-2 py-3 text-left text-xs font-semibold text-slate-600">GR</th>
                        <th className="w-[15%] px-2 py-3 text-left text-xs font-semibold text-slate-600">LOT</th>
                        <th className="w-[15%] px-2 py-3 text-left text-xs font-semibold text-slate-600">Top Sayısı</th>
                        <th className="w-[15%] px-2 py-3 text-left text-xs font-semibold text-slate-600">Ağırlık</th>
                        <th className="w-[15%] px-3 py-3 text-left text-xs font-semibold text-slate-600">Tip</th>
                        <th className="w-[15%] px-3 py-3 text-center text-xs font-semibold text-slate-600">İşlemler</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-200">
                        {(form.details ?? []).map((detail, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-3 py-3"><select value={detail.fabricGender ?? ''} onChange={(event) => onFabricSelect(index, event.target.value)} disabled={!form.weavingOrderId} className={`${buildInputClasses(false)} w-full text-xs`}>
                              <option value="">Kumaş seçin</option>
                              {fabrics.map((item, itemIndex) => { const value = item?.fabricGender ?? item?.FabricGender ?? ''; return <option key={`${value}-${itemIndex}`} value={value}>{formatFabricGenderDisplay(value)}</option> })}
                            </select></td>
                            <td className="px-3 py-3"><input type="number" value={detail.fabricGr ?? ''} onChange={(event) => onDetailFieldChange(index, 'fabricGr', event.target.value)} className={`${buildInputClasses(false)} w-full text-xs`} /></td>
                            <td className="px-3 py-3"><input type="text" value={detail.fabricLot ?? ''} onChange={(event) => onDetailFieldChange(index, 'fabricLot', event.target.value)} className={`${buildInputClasses(false)} w-full text-xs`} /></td>
                            <td className="px-3 py-3"><input type="number" value={detail.rollCount ?? ''} onChange={(event) => onDetailFieldChange(index, 'rollCount', event.target.value)} className={`${buildInputClasses(false)} w-full text-xs`} /></td>
                            <td className="px-3 py-3"><input type="number" step="0.01" value={detail.weight ?? ''} onChange={(event) => onDetailFieldChange(index, 'weight', event.target.value)} className={`${buildInputClasses(false)} w-full text-xs`} /></td>
                            <td className="px-3 py-3"><select value={detail.fabricType ?? 1} onChange={(event) => onDetailFieldChange(index, 'fabricType', Number(event.target.value))} className={`${buildInputClasses(false)} w-full text-xs`}>{(fabricTypeOptions ?? []).map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}</select></td>
                            <td className="px-3 py-3 text-center"><button type="button" onClick={() => onRemoveDetailRow(index)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-300 bg-red-50 text-red-600 transition hover:bg-red-100" title="Satırı sil">✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                {error ? <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
              </>
            )}
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button type="button" className={buildButtonClasses('secondary')} onClick={onClose} disabled={isSaving || isLoading}>İptal</button>
            <button type="button" className={buildButtonClasses('primary')} onClick={onSave} disabled={isSaving || isLoading}>{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default FasonHamEntryModal
