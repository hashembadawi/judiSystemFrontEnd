import { useCallback, useEffect, useState } from 'react'

const FILL_OPTIONS_URL = '/api/fill-options?requestedValues=1'
const AVAILABLE_PARTI_NOS_URL = '/api/fabricShipment/getAvailablePartiNos'
const SHIPMENT_BY_ID_URL = '/api/fabricShipment/getById'
const UPSERT_SHIPMENT_URL = '/api/fabricShipment/upsert'

const createKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const createEmptyRow = () => ({
  key: createKey(),
  partiNo: '',
  readyFabricId: 0,
  fabricGender: '',
  proses: '',
  renk: '',
  renkCode: '',
  kazanGiris: '',
  girisTopSayisi: '',
  kazanCikis: '',
  cikisTopSayisi: '',
  remainingWeight: null,
  remainingTopCount: null,
})
const createEmptyGroup = () => ({
  key: createKey(),
  factoryId: '',
  availablePartiNos: [],
  isLoadingPartiNos: false,
  error: '',
  rows: [createEmptyRow()],
})
const createEmptyForm = () => ({
  id: 0,
  shipmentNo: '',
  shipmentDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  customerName: '',
  notes: '',
  carBLK: '',
  driverTcNo: '',
  groups: [createEmptyGroup()],
})

const toDateTimeLocal = (value) => {
  if (!value) {
    return createEmptyForm().shipmentDate
  }

  const dateText = String(value)
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(dateText)) {
    return dateText.slice(0, 16)
  }

  const date = new Date(dateText)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const mapShipmentToForm = (shipment) => {
  const groupsByFactory = new Map()

  for (const detail of shipment.details ?? []) {
    const factoryId = String(detail.factoryId ?? '')
    if (!groupsByFactory.has(factoryId)) {
      groupsByFactory.set(factoryId, {
        ...createEmptyGroup(),
        factoryId,
        rows: [],
      })
    }

    const group = groupsByFactory.get(factoryId)
    const row = {
      ...createEmptyRow(),
      id: detail.id ?? 0,
      partiNo: String(detail.partiNo ?? ''),
      readyFabricId: detail.readyFabricId ?? 0,
      fabricGender: detail.fabricGender ?? '',
      proses: detail.proses ?? '',
      renk: detail.renk ?? '',
      renkCode: detail.renkCode ?? '',
      kazanGiris: detail.girisWeight ?? detail.kazanGiris ?? '',
      girisTopSayisi: detail.girisTopSayisi ?? '',
      kazanCikis: detail.kazanCikis ?? '',
      cikisTopSayisi: detail.cikisTopSayisi ?? '',
      remainingWeight: detail.remainingWeight ?? null,
      remainingTopCount: detail.remainingTopCount ?? null,
    }

    group.rows.push(row)
    group.availablePartiNos.push({ ...detail, readyFabricId: detail.readyFabricId ?? 0 })
  }

  return {
    id: shipment.id ?? 0,
    shipmentNo: shipment.shipmentNo ?? '',
    shipmentDate: toDateTimeLocal(shipment.shipmentDate),
    customerName: shipment.customerName ?? '',
    notes: shipment.notes ?? '',
    carBLK: shipment.carBlk ?? shipment.carBLK ?? '',
    driverTcNo: shipment.driverTcNo ?? '',
    groups: groupsByFactory.size ? [...groupsByFactory.values()] : [createEmptyGroup()],
  }
}

const getFactoryId = (factory) => factory?.id ?? factory?.factoryId ?? factory?.FactoryId ?? factory?.value ?? ''
const getFactoryName = (factory) => factory?.name ?? factory?.factoryName ?? factory?.FactoryName ?? factory?.Name ?? factory?.label ?? factory?.valueName ?? '-'

function FabricShipmentModal({ isOpen, shipmentId, apiRequest, showNotice, onClose, onSaved }) {
  const [form, setForm] = useState(createEmptyForm)
  const [factoryOptions, setFactoryOptions] = useState([])
  const [isLoadingFactories, setIsLoadingFactories] = useState(false)
  const [isLoadingShipment, setIsLoadingShipment] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const closeModal = useCallback(() => {
    if (isSaving) {
      return
    }

    setForm(createEmptyForm())
    setError('')
    setIsLoadingShipment(false)
    onClose()
  }, [isSaving, onClose])

  const loadFactoryOptions = useCallback(async () => {
    setIsLoadingFactories(true)
    try {
      const response = await apiRequest(FILL_OPTIONS_URL)
      const options = response?.data?.boyaFactories
      setFactoryOptions(Array.isArray(options) ? options : [])
    } catch (requestError) {
      const message = requestError.message || 'Boyahane seçenekleri yüklenemedi.'
      setError(message)
      showNotice('error', message)
    } finally {
      setIsLoadingFactories(false)
    }
  }, [apiRequest, showNotice])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    let isCancelled = false
    void Promise.resolve().then(() => {
      if (!isCancelled) {
        void loadFactoryOptions()
      }
    })

    return () => {
      isCancelled = true
    }
  }, [isOpen, loadFactoryOptions])

  useEffect(() => {
    if (!isOpen || !shipmentId) {
      return undefined
    }

    let isCancelled = false
    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return
      }

      setIsLoadingShipment(true)
      setError('')

      try {
        const query = new URLSearchParams({ id: String(shipmentId) })
        const response = await apiRequest(`${SHIPMENT_BY_ID_URL}?${query.toString()}`)
        if (!isCancelled) {
          setForm(mapShipmentToForm(response?.data ?? {}))
        }
      } catch (requestError) {
        if (!isCancelled) {
          const message = requestError.message || 'Sevkiyat bilgileri yüklenemedi.'
          setError(message)
          showNotice('error', message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingShipment(false)
        }
      }
    })

    return () => {
      isCancelled = true
    }
  }, [apiRequest, isOpen, shipmentId, showNotice])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeModal, isOpen])

  const updateMainField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const addGroup = () => {
    setForm((current) => ({ ...current, groups: [...current.groups, createEmptyGroup()] }))
  }

  const removeGroup = (groupKey) => {
    setForm((current) => ({ ...current, groups: current.groups.filter((group) => group.key !== groupKey) }))
  }

  const updateGroupFactory = async (groupKey, factoryId) => {
    setForm((current) => ({
      ...current,
      groups: current.groups.map((group) => group.key === groupKey
        ? { ...group, factoryId, availablePartiNos: [], error: '', rows: group.rows.map(() => createEmptyRow()), isLoadingPartiNos: Boolean(factoryId) }
        : group),
    }))

    if (!factoryId) {
      return
    }

    try {
      const query = new URLSearchParams({ id: factoryId })
      const response = await apiRequest(`${AVAILABLE_PARTI_NOS_URL}?${query.toString()}`)
      const options = Array.isArray(response?.data?.items) ? response.data.items : []
      setForm((current) => ({
        ...current,
        groups: current.groups.map((group) => group.key === groupKey && String(group.factoryId) === String(factoryId)
          ? { ...group, availablePartiNos: options, isLoadingPartiNos: false }
          : group),
      }))
    } catch (requestError) {
      const message = requestError.message || 'Parti numaraları yüklenemedi.'
      setForm((current) => ({
        ...current,
        groups: current.groups.map((group) => group.key === groupKey && String(group.factoryId) === String(factoryId)
          ? { ...group, isLoadingPartiNos: false, error: message }
          : group),
      }))
      showNotice('error', message)
    }
  }

  const updateRowField = (groupKey, rowKey, field, value) => {
    setForm((current) => ({
      ...current,
      groups: current.groups.map((group) => group.key !== groupKey ? group : {
        ...group,
        rows: group.rows.map((row) => row.key === rowKey ? { ...row, [field]: value } : row),
      }),
    }))
  }

  const selectPartiNo = (groupKey, rowKey, value) => {
    setForm((current) => ({
      ...current,
      groups: current.groups.map((group) => {
        if (group.key !== groupKey) {
          return group
        }

        const selectedFabric = group.availablePartiNos.find((item) => String(item.partiNo) === value)
        return {
          ...group,
          rows: group.rows.map((row) => row.key !== rowKey ? row : selectedFabric ? {
            ...row,
            partiNo: String(selectedFabric.partiNo ?? ''),
            readyFabricId: selectedFabric.readyFabricId ?? 0,
            fabricGender: selectedFabric.fabricGender ?? '',
            proses: selectedFabric.proses ?? '',
            renk: selectedFabric.renk ?? '',
            renkCode: selectedFabric.renkCode ?? '',
            kazanGiris: selectedFabric.girisWeight ?? selectedFabric.kazanGiris ?? '',
            girisTopSayisi: selectedFabric.girisTopSayisi ?? '',
            kazanCikis: selectedFabric.kazanCikis ?? selectedFabric.remainingWeight ?? '',
            cikisTopSayisi: selectedFabric.remainingTopCount ?? selectedFabric.cikisTopSayisi ?? '',
            remainingWeight: selectedFabric.remainingWeight ?? null,
            remainingTopCount: selectedFabric.remainingTopCount ?? null,
          } : {
            ...row,
            partiNo: value,
            readyFabricId: 0,
            fabricGender: '',
            proses: '',
            renk: '',
            renkCode: '',
            kazanGiris: '',
            girisTopSayisi: '',
            kazanCikis: '',
            cikisTopSayisi: '',
            remainingWeight: null,
            remainingTopCount: null,
          }),
        }
      }),
    }))
  }

  const addRow = (groupKey) => {
    setForm((current) => ({
      ...current,
      groups: current.groups.map((group) => group.key === groupKey ? { ...group, rows: [...group.rows, createEmptyRow()] } : group),
    }))
  }

  const removeRow = (groupKey, rowKey) => {
    setForm((current) => ({
      ...current,
      groups: current.groups.map((group) => group.key === groupKey && group.rows.length > 1
        ? { ...group, rows: group.rows.filter((row) => row.key !== rowKey) }
        : group),
    }))
  }

  const saveShipment = async () => {
    setError('')
    const rows = form.groups.flatMap((group) => group.rows.map((row) => ({ group, row })))

    if (!form.shipmentNo.trim() || !form.shipmentDate || !form.customerName.trim()) {
      setError('Sevkiyat numarası, tarihi ve müşteri adı zorunludur.')
      return
    }

    if (!rows.length || rows.some(({ group, row }) => !group.factoryId || !row.partiNo || (!form.id && !row.readyFabricId))) {
      setError('Her detay satırında boyahane seçip listeden geçerli bir parti numarası seçin.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        id: Number(form.id) || 0,
        shipmentNo: form.shipmentNo.trim(),
        shipmentDate: new Date(form.shipmentDate).toISOString(),
        customerName: form.customerName.trim(),
        notes: form.notes.trim(),
        carBLK: form.carBLK.trim(),
        driverTcNo: form.driverTcNo.trim(),
        details: rows.map(({ group, row }) => ({
          id: Number(row.id) || 0,
          partiNo: row.partiNo,
          factoryId: Number(group.factoryId),
          fabricGender: row.fabricGender,
          proses: row.proses,
          renk: row.renk,
          renkCode: row.renkCode,
          kazanGiris: Number(row.kazanGiris) || 0,
          girisTopSayisi: Number(row.girisTopSayisi) || 0,
          kazanCikis: Number(row.kazanCikis) || 0,
          cikisTopSayisi: Number(row.cikisTopSayisi) || 0,
        })),
      }

      await apiRequest(UPSERT_SHIPMENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: '*/*' },
        body: JSON.stringify(payload),
      })

      showNotice('success', 'Sevkiyat başarıyla kaydedildi.')
      setForm(createEmptyForm())
      onSaved()
    } catch (requestError) {
      const message = requestError.message || 'Sevkiyat kaydedilemedi.'
      setError(message)
      showNotice('error', message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="fabricShipmentModalTitle" dir="ltr" lang="tr">
      <button type="button" aria-label="Kapat" className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50" onClick={closeModal} />
      <div className="relative flex min-h-full items-start justify-center p-2 pt-4 sm:p-5 sm:pt-8">
        <section className="flex max-h-[92vh] w-full max-w-[1440px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200">
          <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div>
              <h2 id="fabricShipmentModalTitle" className="mt-1 text-lg font-bold text-slate-900">{shipmentId ? 'BOYALI KUMAŞ SEVKİYATINI DÜZENLE' : 'YENİ BOYALI KUMAŞ SEVKİYATI'}</h2>
            </div>
            <button type="button" onClick={closeModal} disabled={isSaving} aria-label="Kapat" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">
              <span className="text-2xl leading-none" aria-hidden="true">×</span>
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
            {isLoadingShipment ? <p className="py-12 text-center text-sm text-slate-500">Sevkiyat bilgileri yükleniyor...</p> : <>
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900">SEVKİYAT BİLGİLERİ</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  <span>Sevkiyat No <span className="text-red-600">*</span></span>
                  <input name="shipmentNo" value={form.shipmentNo} onChange={updateMainField} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  <span>Sevkiyat Tarihi <span className="text-red-600">*</span></span>
                  <input name="shipmentDate" type="datetime-local" value={form.shipmentDate} onChange={updateMainField} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  <span>Müşteri Adı <span className="text-red-600">*</span></span>
                  <input name="customerName" value={form.customerName} onChange={updateMainField} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  <span>Araç Plakası (CarBLK)</span>
                  <input name="carBLK" value={form.carBLK} onChange={updateMainField} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  <span>Sürücü TC Kimlik No</span>
                  <input name="driverTcNo" inputMode="numeric" value={form.driverTcNo} onChange={updateMainField} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                  <span>Notlar</span>
                  <input name="notes" value={form.notes} onChange={updateMainField} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900">SEVKİYAT DETAYLARI</h3>
                <button type="button" onClick={addGroup} disabled={isLoadingFactories} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                  + Boyahane kartı ekle
                </button>
              </div>

              {isLoadingFactories ? <p className="py-4 text-center text-sm text-slate-500">Boyahaneler yükleniyor...</p> : null}
              {!isLoadingFactories && factoryOptions.length === 0 ? <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">Boyahane seçenekleri bulunamadı.</p> : null}

              <div className="space-y-4">
                {form.groups.map((group) => {
                  const listId = `shipment-parti-options-${group.key}`
                  return (
                    <section key={group.key} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
                        <label className="grid w-full max-w-md gap-1.5 text-xs font-semibold text-slate-700">
                          <select value={group.factoryId} onChange={(event) => updateGroupFactory(group.key, event.target.value)} disabled={isLoadingFactories || isSaving} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100">
                            <option value="">Boyahane seçin</option>
                            {factoryOptions.map((factory, index) => (
                              <option key={getFactoryId(factory) || index} value={getFactoryId(factory)}>{getFactoryName(factory)}</option>
                            ))}
                          </select>
                        </label>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => addRow(group.key)} disabled={!group.factoryId || group.isLoadingPartiNos || isSaving} className="inline-flex h-9 items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50">
                            + Satır ekle
                          </button>
                          <button type="button" onClick={() => removeGroup(group.key)} disabled={form.groups.length <= 1 || isSaving} title="Boyahane kartını sil" aria-label="Boyahane kartını sil" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">
                            <span className="text-sm leading-none" aria-hidden="true">🗑️</span>
                          </button>
                        </div>
                      </header>

                      {group.error ? <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{group.error}</p> : null}
                      {group.isLoadingPartiNos ? <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">Parti numaraları yükleniyor...</p> : null}
                      {group.factoryId && !group.isLoadingPartiNos && group.availablePartiNos.length === 0 ? <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">Sevk edilebilir parti numarası bulunamadı.</p> : null}

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1620px] table-fixed text-xs">
                          <thead className="bg-white text-slate-600">
                            <tr className="border-b border-slate-200">
                              <th className="w-[190px] px-2 py-2 text-left font-semibold">Parti No</th>
                              <th className="w-[230px] px-2 py-2 text-left font-semibold">Kumaş Cinsi</th>
                              <th className="w-[150px] px-2 py-2 text-left font-semibold">Proses</th>
                              <th className="w-[110px] px-2 py-2 text-left font-semibold">Renk</th>
                              <th className="w-[110px] px-2 py-2 text-left font-semibold">Renk Kodu</th>
                              <th className="w-[120px] px-2 py-2 text-left font-semibold">Kazan Giriş</th>
                              <th className="w-[120px] px-2 py-2 text-left font-semibold">Giriş Top Sayısı</th>
                              <th className="w-[120px] px-2 py-2 text-left font-semibold">Kazan Çıkış</th>
                              <th className="w-[120px] px-2 py-2 text-left font-semibold">Çıkış Top Sayısı</th>
                              <th className="w-[54px] px-2 py-2 text-center font-semibold">Sil</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.rows.map((row, rowIndex) => (
                              <tr key={row.key} className="align-top hover:bg-slate-50/70">
                                <td className="px-2 py-2">
                                  <input
                                    type="search"
                                    list={listId}
                                    value={row.partiNo}
                                    onChange={(event) => selectPartiNo(group.key, row.key, event.target.value)}
                                    disabled={!group.factoryId || group.isLoadingPartiNos || isSaving}
                                    placeholder="Parti ara/seç"
                                    className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-sky-500 disabled:bg-slate-100"
                                  />
                                  <datalist id={listId}>
                                    {group.availablePartiNos.map((option, index) => <option key={`${option.partiNo}-${index}`} value={option.partiNo}>{option.etiket_Basligi} · {option.renk} · {option.fabricLot}</option>)}
                                  </datalist>
                                  {row.partiNo ? <p className="mt-1 text-[10px] text-slate-500">Etiket: {group.availablePartiNos.find((option) => String(option.partiNo) === row.partiNo)?.etiket_Basligi ?? '-'}</p> : null}
                                </td>
                                <td className="px-2 py-2"><input readOnly value={row.fabricGender} placeholder="Parti seçildiğinde dolar" className="w-full rounded border border-slate-100 bg-slate-50 px-2 py-2 text-xs text-slate-700" /></td>
                                <td className="px-2 py-2"><input readOnly value={row.proses} className="w-full rounded border border-slate-100 bg-slate-50 px-2 py-2 text-xs text-slate-700" /></td>
                                <td className="px-2 py-2"><input readOnly value={row.renk} className="w-full rounded border border-slate-100 bg-slate-50 px-2 py-2 text-xs text-slate-700" /></td>
                                <td className="px-2 py-2"><input readOnly value={row.renkCode} className="w-full rounded border border-slate-100 bg-slate-50 px-2 py-2 text-xs text-slate-700" /></td>
                                <td className="px-2 py-2"><input type="number" min="0" step="0.01" value={row.kazanGiris} onChange={(event) => updateRowField(group.key, row.key, 'kazanGiris', event.target.value)} disabled={(!row.readyFabricId && !form.id) || isSaving} className="w-full rounded border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 disabled:bg-slate-100" /></td>
                                <td className="px-2 py-2"><input type="number" min="0" step="1" value={row.girisTopSayisi} onChange={(event) => updateRowField(group.key, row.key, 'girisTopSayisi', event.target.value)} disabled={(!row.readyFabricId && !form.id) || isSaving} className="w-full rounded border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 disabled:bg-slate-100" /></td>
                                <td className="px-2 py-2">
                                  <input type="number" min="0" step="0.01" max={row.remainingWeight ?? undefined} value={row.kazanCikis} onChange={(event) => updateRowField(group.key, row.key, 'kazanCikis', event.target.value)} disabled={(!row.readyFabricId && !form.id) || isSaving} className="w-full rounded border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 disabled:bg-slate-100" />
                                  {row.remainingWeight !== null ? <span className="mt-1 block text-[10px] text-slate-500">Kalan: {row.remainingWeight} kg</span> : null}
                                </td>
                                <td className="px-2 py-2">
                                  <input type="number" min="0" step="1" max={row.remainingTopCount ?? undefined} value={row.cikisTopSayisi} onChange={(event) => updateRowField(group.key, row.key, 'cikisTopSayisi', event.target.value)} disabled={(!row.readyFabricId && !form.id) || isSaving} className="w-full rounded border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 disabled:bg-slate-100" />
                                  {row.remainingTopCount !== null ? <span className="mt-1 block text-[10px] text-slate-500">Kalan: {row.remainingTopCount}</span> : null}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <button type="button" onClick={() => removeRow(group.key, row.key)} disabled={group.rows.length <= 1 || isSaving} title="Detay satırını sil" aria-label={`Detay satırı ${rowIndex + 1} sil`} className="inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">
                                    <span className="text-sm leading-none" aria-hidden="true">🗑️</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )
                })}
              </div>
            </section>

            {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
            </>}
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button type="button" onClick={closeModal} disabled={isSaving} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">İptal</button>
            <button type="button" onClick={saveShipment} disabled={isSaving || isLoadingFactories || isLoadingShipment || Boolean(shipmentId && !form.id)} className="h-10 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">{isSaving ? 'Kaydediliyor...' : shipmentId ? 'Değişiklikleri kaydet' : 'Sevkiyatı kaydet'}</button>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default FabricShipmentModal