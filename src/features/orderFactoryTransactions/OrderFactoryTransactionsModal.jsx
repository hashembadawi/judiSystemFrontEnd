import { useEffect } from 'react'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

function OrderFactoryTransactionsModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  boyaFactoriesOptions,
  fabricTypesOptions,
  onFieldChange,
  onDetailFieldChange,
  onAddDetailRow,
  onCopyDetailRow,
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

  const handleRemoveDetailRow = (index) => {
    const confirmed = window.confirm('Bu detay satırını silmek istediğinizden emin misiniz?')
    if (!confirmed) {
      return
    }

    onRemoveDetailRow(index)
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" dir="ltr" style={{ direction: 'ltr' }}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative flex min-h-full items-start justify-center p-0 pt-4 sm:p-4 sm:pt-8">
        <section className="w-full max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200 sm:max-w-6xl" dir="ltr" style={{ direction: 'ltr', maxWidth: '95vw' }}>
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6" dir="ltr">
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 text-left">Yeni Hareket</p>
              <h4 className="mt-1 text-xl font-semibold text-slate-900 text-left">Yeni Sipariş Ekle</h4>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-2xl leading-none text-slate-400 transition hover:text-slate-600"
                onClick={onClose}
                aria-label="Kapat"
              >
                ×
              </button>
            </div>
          </header>

          <div className="px-4 py-5 sm:px-6">
            {isLoading ? (
              <p className="py-8 text-center text-slate-500">Seçenekler yükleniyor...</p>
            ) : (
              <>
                <section className="mb-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3" dir="ltr">
                  <h5 className="pb-2 border-b border-slate-200 text-lg font-semibold text-slate-900 text-left">Hareket Bilgisi</h5>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" dir="ltr">
                    <div className="space-y-1.5" dir="ltr">
                      <label htmlFor="OrderNo" className="block text-xs font-medium text-slate-700 text-left">Sipariş No</label>
                      <input
                        id="OrderNo"
                        type="text"
                        value={form.OrderNo ?? ''}
                        onChange={(event) => onFieldChange('OrderNo', event.target.value)}
                        className={`${buildInputClasses(false)} h-9 text-sm`}
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px' }}
                      />
                    </div>

                    <div className="space-y-1.5" dir="ltr">
                      <label htmlFor="FactoryId" className="block text-xs font-medium text-slate-700 text-left">Boya Fabrikası</label>
                      <select
                        id="FactoryId"
                        value={form.FactoryId}
                        onChange={(event) => onFieldChange('FactoryId', event.target.value)}
                        className={`${buildInputClasses(false)} h-9 text-sm`}
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px',lineHeight: '36px',padding: '0 8px'}}
                      >
                        <option value="">Boya fabrikasını seçin</option>
                        {boyaFactoriesOptions.map((factory) => (
                          <option key={factory.id} value={factory.id}>
                            {factory.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5" dir="ltr">
                      <label htmlFor="Date" className="block text-xs font-medium text-slate-700 text-left">Tarih</label>
                      <input
                        id="Date"
                        type="date"
                        value={form.Date}
                        onChange={(event) => onFieldChange('Date', event.target.value)}
                        className={`${buildInputClasses(false)} h-9 text-sm`}
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px' }}
                      />
                    </div>

                    <div className="space-y-1.5" dir="ltr">
                      <label htmlFor="TransactionStatus" className="block text-xs font-medium text-slate-700 text-left">Hareket Durumu</label>
                      <select
                        id="TransactionStatus"
                        value={form.TransactionStatus}
                        onChange={(event) => onFieldChange('TransactionStatus', event.target.value)}
                        className={`${buildInputClasses(false)} h-9 text-sm`}
                        dir="ltr"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px',lineHeight: '36px',padding: '0 8px'}}
                      >
                        <option value={1}>Açık</option>
                        <option value={2}>Tamamlandı</option>
                        <option value={3}>Kapalı</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-3 border-t border-slate-200 pt-4" dir="ltr">
                  <div className="flex items-center justify-between pb-1" dir="ltr">
                    <h5 className="text-lg font-semibold text-slate-900 text-left">Hareket Detayları</h5>
                    <button type="button" className={buildButtonClasses('secondary')} onClick={onAddDetailRow}>
                      + Satır Ekle
                    </button>
                  </div>

                  {form.Details.map((detail, index) => {
                    const selectedFabricType = String(detail.FabricGender ?? '').trim()
                    const hasSelectedFabricTypeInOptions =
                      selectedFabricType !== '' &&
                      fabricTypesOptions.some((fabric) => String(fabric ?? '') === selectedFabricType)

                    return (
                      <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm" dir="ltr">
                        <div className="overflow-x-auto" dir="ltr">
                          <div className="grid w-full grid-cols-[0.7fr_1.8fr_0.5fr_0.5fr_0.9fr_0.9fr_1fr_0.9fr_0.75fr] gap-1.5" dir="ltr">
                            <div className="space-y-1" dir="ltr">
                              <label htmlFor={`etiket-${index}`} className="block text-[10px] font-medium text-slate-700 text-left">Etiket</label>
                              <input
                                id={`etiket-${index}`}
                                type="text"
                                value={detail.Etiket_Basligi}
                                onChange={(event) =>
                                  onDetailFieldChange(index, 'Etiket_Basligi', event.target.value)
                                }
                                className={`${buildInputClasses(false)} w-full h-9 text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px' }}
                              />
                            </div>

                            <div className="space-y-1" dir="ltr">
                              <label htmlFor={`fabric-${index}`} className="block text-[10px] font-medium text-slate-700 text-left">KUMAŞ CİNSİ</label>
                              <select
                                id={`fabric-${index}`}
                                value={selectedFabricType}
                                onChange={(event) =>
                                  onDetailFieldChange(index, 'FabricGender', event.target.value)
                                }
                                className={`${buildInputClasses(false)} w-full h-9 text-xs`}
                                required
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px',lineHeight: '36px',padding: '0 8px' }}
                              >
                                <option value="">-- Seçin --</option>
                                {!hasSelectedFabricTypeInOptions && selectedFabricType ? (
                                  <option value={selectedFabricType}>{selectedFabricType}</option>
                                ) : null}
                                {fabricTypesOptions.map((fabric, idx) => (
                                  <option key={idx} value={fabric || ''}>
                                    {fabric}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1" dir="ltr">
                              <label htmlFor={`en-${index}`} className="block text-[10px] font-medium text-slate-700 text-left">En</label>
                              <input
                                id={`en-${index}`}
                                type="number"
                                value={detail.En}
                                onChange={(event) => onDetailFieldChange(index, 'En', event.target.value)}
                                className={`${buildInputClasses(false)} w-full h-9 text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px' }}
                              />
                            </div>

                            <div className="space-y-1" dir="ltr">
                              <label htmlFor={`gr-${index}`} className="block text-[10px] font-medium text-slate-700 text-left">Gr</label>
                              <input
                                id={`gr-${index}`}
                                type="number"
                                value={detail.Gr}
                                onChange={(event) => onDetailFieldChange(index, 'Gr', event.target.value)}
                                className={`${buildInputClasses(false)} w-full h-9 text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px' }}
                              />
                            </div>

                            <div className="space-y-1" dir="ltr">
                              <label htmlFor={`renk-${index}`} className="block text-[10px] font-medium text-slate-700 text-left">Renk</label>
                              <input
                                id={`renk-${index}`}
                                type="text"
                                value={detail.Renk}
                                onChange={(event) => onDetailFieldChange(index, 'Renk', event.target.value)}
                                className={`${buildInputClasses(false)} w-full h-9 text-xs`}
                                required
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px' }}
                              />
                            </div>

                            <div className="space-y-1" dir="ltr">
                              <label htmlFor={`renkcode-${index}`} className="block text-[10px] font-medium text-slate-700 text-left">Renk Kodu</label>
                              <input
                                id={`renkcode-${index}`}
                                type="text"
                                value={detail.RenkCode}
                                onChange={(event) => onDetailFieldChange(index, 'RenkCode', event.target.value)}
                                className={`${buildInputClasses(false)} w-full h-9 text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px' }}
                              />
                            </div>

                            <div className="space-y-1" dir="ltr">
                              <label htmlFor={`siparis-${index}`} className="block text-[10px] font-medium text-slate-700 text-left">Sipariş Miktarı</label>
                              <input
                                id={`siparis-${index}`}
                                type="number"
                                value={detail.SiparisMiktari ?? ''}
                                onChange={(event) =>
                                  onDetailFieldChange(index, 'SiparisMiktari', event.target.value)
                                }
                                className={`${buildInputClasses(false)} w-full h-9 text-xs`}
                                required
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px' }}
                              />
                            </div>

                            <div className="space-y-1" dir="ltr">
                              <label htmlFor={`fiyat-${index}`} className="block text-[10px] font-medium text-slate-700 text-left">FİYAT</label>
                              <input
                                id={`fiyat-${index}`}
                                type="number"
                                step="0.01"
                                value={detail.Fiyat ?? detail.Price ?? 0}
                                onChange={(event) => onDetailFieldChange(index, 'Fiyat', event.target.value)}
                                className={`${buildInputClasses(false)} w-full h-9 text-xs`}
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px' }}
                              />
                            </div>

                            <div className="space-y-1" dir="ltr">
                              <label className="block text-[10px] font-medium text-slate-700 text-left">İşlemler</label>
                              <div className="flex h-9 items-end gap-1.5" dir="ltr">
                                <button
                                  type="button"
                                  onClick={() => onCopyDetailRow(index)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-slate-50 text-slate-600 text-[10px] transition hover:bg-slate-100"
                                  title="Satırı kopyala"
                                >
                                  📋
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDetailRow(index)}
                                  disabled={form.Details.length === 1}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-300 bg-red-50 text-red-600 text-[10px] transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Satırı sil"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </section>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 mt-6 text-left" dir="ltr">{error}</div>
                ) : null}
              </>
            )}
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6" dir="ltr">
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

export default OrderFactoryTransactionsModal
