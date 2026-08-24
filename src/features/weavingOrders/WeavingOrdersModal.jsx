import { useEffect } from 'react'

function WeavingOrdersModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  statusOptions = [],
  orderOptions,
  fabricOptions,
  factoryOptions,
  yarnOptions = [],
  selectedOrderDetails = [],
  isEditMode = false,
  onFieldChange,
  onDetailChange,
  onYarnDetailChange,
  onAddDetail,
  onAddYarnDetail,
  onRemoveDetail,
  onRemoveYarnDetail,
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:p-5" role="dialog" aria-modal="true" dir="ltr" style={{ direction: 'ltr' }}>
      <section className="relative w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_50px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-3 sm:px-5">
          <div className="text-left">
            <h4 className="text-lg font-semibold text-sky-900">
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

        <div className="max-h-[86vh] overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Seçenekler yükleniyor...</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-1.5">
                  <label htmlFor="weavingOrderSelect" className="block text-left text-[11px] font-medium text-slate-600">Sipariş</label>
                  <select
                    id="weavingOrderSelect"
                    value={form.orderId ?? ''}
                    onChange={(event) => onOrderSelect(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
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
                    value={form.name ?? ''}
                    onChange={(event) => onFieldChange('name', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="weavingOrderDate" className="block text-left text-[11px] font-medium text-slate-600">Tarih</label>
                  <input
                    id="weavingOrderDate"
                    type="date"
                    value={form.date ?? ''}
                    onChange={(event) => onFieldChange('date', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="weavingOrderStatus" className="block text-left text-[11px] font-medium text-slate-600">Durum</label>
                  <select
                    id="weavingOrderStatus"
                    value={form.weavingOrderStatus ?? ''}
                    onChange={(event) => onFieldChange('weavingOrderStatus', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  >
                    <option value="">Durum seçin</option>
                    {statusOptions.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.text}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedOrderDetails?.length ? (
                <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
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
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={onAddDetail}
                >
                  + Satır ekle
                </button>
              </div>

              <div className="mt-2 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                {form.details.map((detail, detailIndex) => (
                  <div className={`rounded-xl border p-2.5 shadow-sm ${detailIndex % 2 === 0 ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`} key={`${detail.id ?? detailIndex}-detail`}>
                    <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-[2.2fr_0.8fr_0.9fr_0.7fr_0.7fr_0.9fr]">
                      <div className="space-y-0.5">
                        <label htmlFor={`fabricGender-${detailIndex}`} className="block text-left text-[9px] font-medium text-slate-600">Kumaş cinsi</label>
                        <select
                          id={`fabricGender-${detailIndex}`}
                          value={detail.fabricGender ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'fabricGender', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
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

                      <div className="space-y-0.5">
                        <label htmlFor={`fabricGr-${detailIndex}`} className="block text-left text-[9px] font-medium text-slate-600">GR</label>
                        <input
                          id={`fabricGr-${detailIndex}`}
                          type="number"
                          value={detail.fabricGr ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'fabricGr', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label htmlFor={`fabricLot-${detailIndex}`} className="block text-left text-[9px] font-medium text-slate-600">LOT</label>
                        <input
                          id={`fabricLot-${detailIndex}`}
                          type="text"
                          value={detail.fabricLot ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'fabricLot', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label htmlFor={`pus-${detailIndex}`} className="block text-left text-[9px] font-medium text-slate-600">Pus</label>
                        <input
                          id={`pus-${detailIndex}`}
                          type="number"
                          value={detail.pus ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'pus', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label htmlFor={`fain-${detailIndex}`} className="block text-left text-[9px] font-medium text-slate-600">Fain</label>
                        <input
                          id={`fain-${detailIndex}`}
                          type="number"
                          value={detail.fain ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'fain', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label htmlFor={`factoryId-${detailIndex}`} className="block text-left text-[9px] font-medium text-slate-600">Fabrika</label>
                        <select
                          id={`factoryId-${detailIndex}`}
                          value={detail.factoryId ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'factoryId', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
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

                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_1fr_1fr_1fr]">
                      <div className="space-y-0.5">
                        <label htmlFor={`iplikUzunu-${detailIndex}`} className="block text-left text-[9px] font-medium text-slate-600">İplik Uzunu</label>
                        <input
                          id={`iplikUzunu-${detailIndex}`}
                          type="number"
                          value={detail.iplik_Uzunu ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'iplik_Uzunu', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label htmlFor={`denye-${detailIndex}`} className="block text-left text-[9px] font-medium text-slate-600">Denye</label>
                        <input
                          id={`denye-${detailIndex}`}
                          type="number"
                          value={detail.denye ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'denye', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label htmlFor={`weight-${detailIndex}`} className="block text-left text-[9px] font-medium text-slate-600">Ağırlık</label>
                        <input
                          id={`weight-${detailIndex}`}
                          type="number"
                          step="0.01"
                          value={detail.weight ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'weight', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label htmlFor={`price-${detailIndex}`} className="block text-left text-[9px] font-medium text-slate-600">Fiyat</label>
                        <input
                          id={`price-${detailIndex}`}
                          type="number"
                          step="0.01"
                          value={detail.price ?? ''}
                          onChange={(event) => onDetailChange(detailIndex, 'price', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>

                      <div className="space-y-0.5 flex items-end">
                        <button
                          type="button"
                          className="w-full rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[9px] font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={form.details.length === 1}
                          onClick={() => onRemoveDetail(detailIndex)}
                        >
                          Satırı sil
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50 p-2">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h6 className="text-[11px] font-semibold text-sky-800">İplik detayları</h6>
                        <button
                          type="button"
                          className="rounded-md border border-sky-200 bg-white px-2 py-1 text-[10px] font-medium text-sky-700 transition hover:bg-sky-100"
                          onClick={() => onAddYarnDetail(detailIndex)}
                        >
                          + İplik ekle
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(detail.yarnDetails ?? [{ id: 0, parentId: 0, yarnId: 0, yarnGender: '', yarnLot: '', percentage: '', weight: '' }]).map((yarnDetail, yarnIndex) => (
                          <div key={`${detailIndex}-yarn-${yarnIndex}`} className={`rounded-lg border p-2 ${yarnIndex % 2 === 0 ? 'border-purple-200 bg-purple-50' : 'border-pink-200 bg-pink-50'}`}>
                            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-[1.6fr_1.2fr_0.7fr_0.9fr_0.8fr]">
                              <div className="space-y-0.5">
                                <label className="block text-left text-[9px] font-medium text-slate-600">Yarn Cinsi</label>
                                <select
                                  value={yarnDetail.yarnId ?? ''}
                                  onChange={(event) => onYarnDetailChange(detailIndex, yarnIndex, 'yarnId', event.target.value)}
                                  className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                                  style={{ direction: 'ltr', textAlign: 'left' }}
                                >
                                  <option value="">Seçin</option>
                                  {yarnOptions.map((yarn) => {
                                    const yarnId = yarn.id ?? yarn.yarnId ?? ''
                                    const yarnLabel = yarn.yarnGender ?? yarn.YarnGender ?? String(yarnId)
                                    return (
                                      <option key={yarnId} value={yarnId}>
                                        {yarnLabel}
                                      </option>
                                    )
                                  })}
                                </select>
                              </div>

                              <div className="space-y-0.5">
                                <label className="block text-left text-[9px] font-medium text-slate-600">Lot</label>
                                <input
                                  type="text"
                                  value={yarnDetail.yarnLot ?? ''}
                                  onChange={(event) => onYarnDetailChange(detailIndex, yarnIndex, 'yarnLot', event.target.value)}
                                  className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                                  style={{ direction: 'ltr', textAlign: 'left' }}
                                />
                              </div>

                              <div className="space-y-0.5">
                                <label className="block text-left text-[9px] font-medium text-slate-600">%</label>
                                <input
                                  type="number"
                                  value={yarnDetail.percentage ?? ''}
                                  onChange={(event) => onYarnDetailChange(detailIndex, yarnIndex, 'percentage', event.target.value)}
                                  className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                                  style={{ direction: 'ltr', textAlign: 'left' }}
                                />
                              </div>

                              <div className="space-y-0.5">
                                <label className="block text-left text-[9px] font-medium text-slate-600">Ağırlık</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={yarnDetail.weight ?? ''}
                                  onChange={(event) => onYarnDetailChange(detailIndex, yarnIndex, 'weight', event.target.value)}
                                  className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                                  style={{ direction: 'ltr', textAlign: 'left' }}
                                />
                              </div>

                              <div className="space-y-0.5 flex items-end">
                                <button
                                  type="button"
                                  className="w-full rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[9px] font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={(detail.yarnDetails ?? []).length === 1}
                                  onClick={() => onRemoveYarnDetail(detailIndex, yarnIndex)}
                                >
                                  Sil
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <label htmlFor={`description-${detailIndex}`} className="block text-left text-[10px] font-medium text-slate-600">Not / Açıklama</label>
                      <input
                        id={`description-${detailIndex}`}
                        type="text"
                        value={detail.description ?? ''}
                        onChange={(event) => onDetailChange(detailIndex, 'description', event.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                        style={{ direction: 'ltr', textAlign: 'left' }}
                      />
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
            className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default WeavingOrdersModal
