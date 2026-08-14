import { useEffect } from 'react'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

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

function FasonFabricTransactionModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  factoryOptions,
  weavingOrdersByRow,
  fabricsByRow,
  fabricTypeOptions,
  apiRequest,
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

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSaving, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative flex min-h-full items-start justify-center p-0 pt-4 sm:p-4 sm:pt-8">
        <section className="w-full max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200 sm:max-w-full" style={{ maxWidth: '95vw' }} dir="ltr">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Fason Kumaş Hareketi</p>
              <h4 className="mt-1 text-xl font-semibold text-slate-900">Fason Kumaş Hareketi Ekle</h4>
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
              <p className="py-8 text-center text-slate-500">Seçenekler yükleniyor...</p>
            ) : (
              <>
                <div className="mb-6 grid gap-4 sm:grid-cols-3 text-left">
                  <div className="space-y-2">
                    <label htmlFor="fasonShift" className="block text-sm font-medium text-slate-700">Vardiya</label>
                    <select
                      id="fasonShift"
                      value={form.Shift ?? 'A'}
                      onChange={(event) => onFieldChange('Shift', event.target.value)}
                      className={`${buildInputClasses(false)} w-full`}
                      dir="ltr"
                      style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="fasonDate" className="block text-sm font-medium text-slate-700">Tarih</label>
                    <input
                      id="fasonDate"
                      type="date"
                      value={form.Date ?? ''}
                      onChange={(event) => onFieldChange('Date', event.target.value)}
                      className={`${buildInputClasses(false)} w-full`}
                      dir="ltr"
                      style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="fasonPersonal" className="block text-sm font-medium text-slate-700">Personel</label>
                    <input
                      id="fasonPersonal"
                      type="text"
                      value={form.Personal ?? ''}
                      onChange={(event) => onFieldChange('Personal', event.target.value)}
                      className={`${buildInputClasses(false)} w-full`}
                      dir="ltr"
                      style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
                    />
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
                          <th className="px-3 py-3 text-left" style={{ minWidth: '100px' }}><span className="text-sm font-semibold text-slate-600">Fabrika</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '140px' }}><span className="text-sm font-semibold text-slate-600">Dokuma Sipariş</span></th>
                          <th className="px-4 py-3 text-left" style={{ minWidth: '300px' }}><span className="text-sm font-semibold text-slate-600">Kumaş Cinsi</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '60px' }}><span className="text-sm font-semibold text-slate-600">GR</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '60px' }}><span className="text-sm font-semibold text-slate-600">LOT</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '65px' }}><span className="text-sm font-semibold text-slate-600">Adet</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '70px' }}><span className="text-sm font-semibold text-slate-600">Ağırlık</span></th>
                          <th className="px-3 py-3 text-left" style={{ minWidth: '100px' }}><span className="text-xs font-semibold text-slate-600">Tip</span></th>
                          <th className="px-3 py-3 text-center"><span className="text-xs font-semibold text-slate-600">İşlemler</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(form.Details ?? []).map((detail, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-3 py-3">
                              <select
                                value={detail.FactoryId ?? ''}
                                onChange={(event) => onFactorySelect(index, event.target.value)}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '10px' }}
                              >
                                <option value="">Fabrika seçin</option>
                                {factoryOptions.map((factory) => (
                                  <option key={factory.id ?? factory.value ?? factory} value={factory.id ?? factory.value ?? factory}>
                                    {factory.name ?? factory.factoryName ?? factory.valueName ?? factory.value ?? factory}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-3">
                              <select
                                value={detail.OrderId ?? ''}
                                onChange={(event) => onWeavingOrderSelect(index, event.target.value)}
                                disabled={!detail.FactoryId}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '10px' }}
                              >
                                <option value="">Sipariş seçin</option>
                                {(weavingOrdersByRow[index] ?? []).map((order) => (
                                  <option key={order.id ?? order.value ?? order.name} value={order.id ?? order.value ?? order.name}>
                                    {order.name ?? order.label ?? String(order.id ?? order.value ?? order.name)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={detail.FabricGender ?? ''}
                                onChange={(event) => onFabricSelect(index, event.target.value)}
                                disabled={!detail.OrderId}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '10px' }}
                              >
                                <option value="">Kumaş seçin</option>
                                {(fabricsByRow[index] ?? []).map((item, itemIndex) => {
                                  const fabricGender = item?.fabricGender ?? item?.FabricGender ?? ''
                                  const displayValue = formatFabricGenderDisplay(fabricGender)
                                  return (
                                    <option key={`${fabricGender}-${itemIndex}`} value={fabricGender}>
                                      {displayValue}
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
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left' , fontSize: '10px' }}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={detail.FabricLot ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'FabricLot', event.target.value)}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '10px' }}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                value={detail.Count ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'Count', event.target.value)}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '10px' }}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={detail.Weight ?? ''}
                                onChange={(event) => onDetailFieldChange(index, 'Weight', event.target.value)}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '10px' }}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <select
                                value={detail.FabricType ?? 1}
                                onChange={(event) => onDetailFieldChange(index, 'FabricType', Number(event.target.value))}
                                className={`${buildInputClasses(false)} w-full text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '10px' }}
                              >
                                {(fabricTypeOptions ?? []).map((option) => (
                                  <option key={option.id ?? option.value ?? option.text} value={option.id ?? option.value ?? option.text}>
                                    {option.text ?? option.label ?? option.name ?? option.id ?? option.value ?? option.text}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => onRemoveDetailRow(index)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-300 bg-red-50 text-red-600 transition hover:bg-red-100"
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

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
                ) : null}
              </>
            )}
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button type="button" className={buildButtonClasses('secondary')} onClick={onClose} disabled={isSaving || isLoading}>
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

export default FasonFabricTransactionModal
