import { useEffect } from 'react'

function WeavingOrdersModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  orderOptions,
  fabricOptions,
  factoryOptions,
  selectedOrderDetails = [],
  isEditMode = false,
  onFieldChange,
  onDetailChange,
  onAddDetail,
  onRemoveDetail,
  onClose,
  onSave,
  onOrderSelect,
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-6" role="dialog" aria-modal="true" dir="ltr" style={{ direction: 'ltr' }}>
      <section className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_50px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="text-left">
            <h4 className="mt-2 text-lg font-semibold text-slate-900">
              {isEditMode ? 'Dokuma hareketini düzenle' : 'Yeni dokuma hareketi ekle'}
            </h4>
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            onClick={onClose}
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Seçenekler yükleniyor...</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="weavingOrderSelect" className="block text-left text-[11px] font-medium text-slate-600">Sipariş</label>
                  <select
                    id="weavingOrderSelect"
                    value={form.OrderId ?? ''}
                    onChange={(event) => onOrderSelect(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  >
                    <option value="">Sipariş seçin</option>
                    {orderOptions.map((order) => {
                      const orderId = order.id ?? order.orderId ?? order.value ?? ''
                      const orderLabel =
                        order.orderNo ?? order.OrderNo ?? order.orderNumber ?? order.orderNumberText ?? order.name ?? order.label ?? order.text ?? ''

                      return (
                        <option key={orderId ?? orderLabel} value={orderId}>
                          {orderLabel}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="weavingOrderName" className="block text-left text-[11px] font-medium text-slate-600">İsim</label>
                  <input
                    id="weavingOrderName"
                    type="text"
                    value={form.Name ?? ''}
                    onChange={(event) => onFieldChange('Name', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="weavingOrderDate" className="block text-left text-[11px] font-medium text-slate-600">Tarih</label>
                  <input
                    id="weavingOrderDate"
                    type="date"
                    value={form.Date ?? ''}
                    onChange={(event) => onFieldChange('Date', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>
              </div>

              {selectedOrderDetails?.length ? (
                <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h6 className="text-[11px] font-semibold text-sky-800">İlgili kumaşlar</h6>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                      {selectedOrderDetails.length} ürün
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {selectedOrderDetails.map((detail, index) => (
                      <div
                        key={`${detail.fabricGender ?? detail.FabricGender ?? index}`}
                        className="rounded-md border border-sky-100 bg-white px-2 py-1.5 text-[11px] text-slate-700 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">kumaş cinsi</span>
                          <span className="font-medium text-slate-900">{detail.fabricGender ?? detail.FabricGender ?? '-'}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-slate-500">Ağırlık</span>
                          <span className="font-medium text-slate-900">{detail.fabricWeight ?? detail.fabricWeight ?? '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between gap-3">
                <h5 className="text-sm font-semibold text-slate-800">Detaylar</h5>
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={onAddDetail}
                >
                  + Satır ekle
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {form.Details.map((detail, detailIndex) => (
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm" key={`${detail.id || detailIndex}-detail`}>
                    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-7">
                      <div className="space-y-1 lg:col-span-1">
                        <label htmlFor={`fabricGender-${detailIndex}`} className="block text-left text-[10px] font-medium text-slate-600">Kumaş cinsi</label>
                        <select
                          id={`fabricGender-${detailIndex}`}
                          value={detail.FabricGender ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'FabricGender', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        >
                          <option value="">Kumaş seçin</option>
                          {fabricOptions.map((fabricOption) => (
                            <option key={fabricOption} value={fabricOption}>
                              {fabricOption}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 lg:col-span-1">
                        <label htmlFor={`fabricGr-${detailIndex}`} className="block text-left text-[10px] font-medium text-slate-600">GR</label>
                        <input
                          id={`fabricGr-${detailIndex}`}
                          type="number"
                          value={detail.FabricGr ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'FabricGr', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-1 lg:col-span-1">
                        <label htmlFor={`fabricLot-${detailIndex}`} className="block text-left text-[10px] font-medium text-slate-600">LOT</label>
                        <input
                          id={`fabricLot-${detailIndex}`}
                          type="text"
                          value={detail.FabricLot ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'FabricLot', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-1 lg:col-span-1">
                        <label htmlFor={`pus-${detailIndex}`} className="block text-left text-[10px] font-medium text-slate-600">Pus</label>
                        <input
                          id={`pus-${detailIndex}`}
                          type="number"
                          value={detail.Pus ?? detail.pus ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'pus', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-1 lg:col-span-1">
                        <label htmlFor={`fain-${detailIndex}`} className="block text-left text-[10px] font-medium text-slate-600">Fain</label>
                        <input
                          id={`fain-${detailIndex}`}
                          type="number"
                          value={detail.Fain ?? detail.fain ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'fain', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-1 lg:col-span-1">
                        <label htmlFor={`weight-${detailIndex}`} className="block text-left text-[10px] font-medium text-slate-600">Ağırlık</label>
                        <input
                          id={`weight-${detailIndex}`}
                          type="number"
                          step="0.01"
                          value={detail.Weight ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'Weight', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-1 lg:col-span-1">
                        <label htmlFor={`factoryId-${detailIndex}`} className="block text-left text-[10px] font-medium text-slate-600">Fabrika</label>
                        <select
                          id={`factoryId-${detailIndex}`}
                          value={detail.FactoryId ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'FactoryId', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        >
                          <option value="">Fabrika seçin</option>
                          {factoryOptions.map((factoryOption) => {
                            const factoryId = factoryOption.id ?? factoryOption.value ?? factoryOption.factoryId ?? ''
                            const factoryLabel =
                              factoryOption.name ??
                              factoryOption.factoryName ??
                              factoryOption.valueName ??
                              factoryOption.label ??
                              factoryOption.text ??
                              ''

                            return (
                              <option key={factoryId ?? factoryLabel} value={factoryId}>
                                {factoryLabel}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      <label htmlFor={`description-${detailIndex}`} className="block text-left text-[10px] font-medium text-slate-600">Not / Açıklama</label>
                      <input
                        id={`description-${detailIndex}`}
                        type="text"
                        value={detail.Description ?? ''}
                        onChange={(event) => onDetailChange(detailIndex, 'Description', event.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
                    </div>

                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={form.Details.length === 1}
                        onClick={() => onRemoveDetail(detailIndex)}
                      >
                        Satırı sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
            disabled={isSaving || isLoading}
          >
            İptal
          </button>
          <button
            type="button"
            disabled={isSaving || isLoading}
            onClick={onSave}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default WeavingOrdersModal
