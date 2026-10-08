import { useCallback, useEffect, useState } from 'react'
import './BoyahaneScrapModal.css'

const FILL_OPTIONS_URL = '/api/fill-options?requestedValues=1'
const AVAILABLE_PARTI_NOS_URL = '/api/fabricShipment/getAvailablePartiNos'
const UPSERT_SCRAP_URL = '/api/boyaHaneScrap/upsert'

const createKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const createEmptyDetail = () => ({
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
  scrapType: 1,
  notes: '',
})
const createEmptyForm = () => ({
  id: 0,
  scrapDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  factoryId: '',
  availablePartiNos: [],
  isLoadingPartiNos: false,
  details: [createEmptyDetail()],
})

const getFactoryId = (factory) => factory?.id ?? factory?.factoryId ?? factory?.FactoryId ?? factory?.value ?? ''
const getFactoryName = (factory) => factory?.name ?? factory?.factoryName ?? factory?.FactoryName ?? factory?.Name ?? factory?.label ?? factory?.valueName ?? '-'
const getValue = (item, key) => item?.[key] ?? item?.[key[0].toUpperCase() + key.slice(1)]

function BoyahaneScrapModal({ isOpen, apiRequest, showNotice, onClose, onSaved }) {
  const [form, setForm] = useState(createEmptyForm)
  const [factoryOptions, setFactoryOptions] = useState([])
  const [isLoadingFactories, setIsLoadingFactories] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const closeModal = useCallback(() => {
    if (isSaving) return
    setForm(createEmptyForm())
    setError('')
    onClose()
  }, [isSaving, onClose])

  const loadFactories = useCallback(async () => {
    setIsLoadingFactories(true)
    try {
      const response = await apiRequest(FILL_OPTIONS_URL)
      const options = response?.data?.boyaFactories
      setFactoryOptions(Array.isArray(options) ? options : [])
    } catch (requestError) {
      const message = requestError.message || 'Boyahane listesi yüklenemedi.'
      setError(message)
      showNotice('error', message)
    } finally {
      setIsLoadingFactories(false)
    }
  }, [apiRequest, showNotice])

  useEffect(() => {
    if (!isOpen) return undefined
    let isCancelled = false
    void Promise.resolve().then(() => {
      if (!isCancelled) void loadFactories()
    })
    return () => { isCancelled = true }
  }, [isOpen, loadFactories])

  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeModal, isOpen])

  const updateScrapDate = (event) => {
    setForm((current) => ({ ...current, scrapDate: event.target.value }))
  }

  const updateFactory = async (factoryId) => {
    setError('')
    setForm((current) => ({
      ...current,
      factoryId,
      availablePartiNos: [],
      isLoadingPartiNos: Boolean(factoryId),
      details: current.details.map(() => createEmptyDetail()),
    }))

    if (!factoryId) return

    try {
      const query = new URLSearchParams({ id: factoryId })
      const response = await apiRequest(`${AVAILABLE_PARTI_NOS_URL}?${query.toString()}`)
      const options = Array.isArray(response?.data?.items) ? response.data.items : []
      setForm((current) => String(current.factoryId) === String(factoryId)
        ? { ...current, availablePartiNos: options, isLoadingPartiNos: false }
        : current)
    } catch (requestError) {
      const message = requestError.message || 'Parti numaraları yüklenemedi.'
      setForm((current) => String(current.factoryId) === String(factoryId)
        ? { ...current, isLoadingPartiNos: false }
        : current)
      setError(message)
      showNotice('error', message)
    }
  }

  const updateDetail = (detailKey, field, value) => {
    setForm((current) => ({
      ...current,
      details: current.details.map((detail) => detail.key === detailKey ? { ...detail, [field]: value } : detail),
    }))
  }

  const selectPartiNo = (detailKey, value) => {
    setForm((current) => {
      const selected = current.availablePartiNos.find((item) => String(getValue(item, 'partiNo')) === value)
      return {
        ...current,
        details: current.details.map((detail) => detail.key !== detailKey ? detail : selected ? ({
          ...detail,
          partiNo: String(getValue(selected, 'partiNo') ?? ''),
          readyFabricId: getValue(selected, 'readyFabricId') ?? 0,
          fabricGender: getValue(selected, 'fabricGender') ?? '',
          proses: getValue(selected, 'proses') ?? '',
          renk: getValue(selected, 'renk') ?? '',
          renkCode: getValue(selected, 'renkCode') ?? '',
          kazanGiris: getValue(selected, 'remainingGirisWeight') ?? '',
          girisTopSayisi: getValue(selected, 'remainingGirisTopCount') ?? '',
          kazanCikis: getValue(selected, 'remainingWeight') ?? '',
          cikisTopSayisi: getValue(selected, 'remainingTopCount') ?? '',
        }) : ({
          ...detail,
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
        })),
      }
    })
  }

  const addDetail = () => {
    setForm((current) => ({ ...current, details: [...current.details, createEmptyDetail()] }))
  }

  const removeDetail = (detailKey) => {
    setForm((current) => current.details.length <= 1 ? current : {
      ...current,
      details: current.details.filter((detail) => detail.key !== detailKey),
    })
  }

  const saveScrap = async () => {
    setError('')
    if (!form.scrapDate || !form.factoryId) {
      setError('Lütfen hareket tarihini ve boyahaneyi seçin.')
      return
    }
    if (!form.details.length || form.details.some((detail) => !detail.partiNo || !detail.readyFabricId)) {
      setError('Her detay satırında listeden geçerli bir parti numarası seçin.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        id: Number(form.id) || 0,
        scrapDate: new Date(form.scrapDate).toISOString(),
        factoryId: Number(form.factoryId),
        details: form.details.map((detail) => ({
          id: Number(detail.id) || 0,
          partiNo: detail.partiNo,
          fabricGender: detail.fabricGender,
          proses: detail.proses,
          renk: detail.renk,
          renkCode: detail.renkCode,
          kazanGiris: Number(detail.kazanGiris) || 0,
          girisTopSayisi: Number(detail.girisTopSayisi) || 0,
          kazanCikis: Number(detail.kazanCikis) || 0,
          cikisTopSayisi: Number(detail.cikisTopSayisi) || 0,
          scrapType: Number(detail.scrapType) || 1,
          notes: detail.notes.trim(),
        })),
      }

      await apiRequest(UPSERT_SCRAP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: '*/*' },
        body: JSON.stringify(payload),
      })
      showNotice('success', 'Hata hareketi başarıyla kaydedildi.')
      setForm(createEmptyForm())
      onSaved()
    } catch (requestError) {
      const message = requestError.message || 'Hata hareketi kaydedilemedi.'
      setError(message)
      showNotice('error', message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const partiListId = 'scrap-available-parti-list'

  return (
    <div className="scrap-modal fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="scrapModalTitle" dir="ltr" lang="tr">
      <button type="button" aria-label="Kapat" className="scrap-modal__backdrop absolute inset-0 h-full w-full cursor-default bg-slate-900/50" onClick={closeModal} />
      <div className="relative flex min-h-full items-start justify-center p-2 pt-4 sm:p-5 sm:pt-8">
        <section className="scrap-modal__panel flex max-h-[92vh] w-full max-w-[1440px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_30px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200">
          <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
            <h2 id="scrapModalTitle" className="text-lg font-bold text-slate-900">YENİ HATA HAREKETİ</h2>
            <button type="button" onClick={closeModal} disabled={isSaving} aria-label="Kapat" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-2xl leading-none text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">×</button>
          </header>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
            <section className="space-y-4">
              <h3 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">HAREKET BİLGİLERİ</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  <span>Hareket Tarihi</span>
                  <input type="datetime-local" value={form.scrapDate} onChange={(event) => updateScrapDate(event)} disabled={isSaving} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100" />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  <span>Boyahane</span>
                  <select value={form.factoryId} onChange={(event) => updateFactory(event.target.value)} disabled={isLoadingFactories || isSaving} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100">
                    <option value="">Boyahane seçin</option>
                    {factoryOptions.map((factory, index) => <option key={getFactoryId(factory) || index} value={getFactoryId(factory)}>{getFactoryName(factory)}</option>)}
                  </select>
                </label>
              </div>
              {isLoadingFactories ? <p className="text-xs text-slate-500">Boyahaneler yükleniyor...</p> : null}
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900">HAREKET DETAYLARI</h3>
                <button type="button" onClick={addDetail} disabled={!form.factoryId || form.isLoadingPartiNos || isSaving} className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">+ Satır Ekle</button>
              </div>
              {form.isLoadingPartiNos ? <p className="text-xs text-slate-500">Parti numaraları yükleniyor...</p> : null}
              {form.factoryId && !form.isLoadingPartiNos && form.availablePartiNos.length === 0 ? <p className="text-xs text-slate-500">Sevk edilebilir parti bulunamadı.</p> : null}

              <div className="scrap-modal__table-scroll overflow-x-auto rounded-lg border border-slate-200">
                <table className="scrap-modal__details-table w-full min-w-[1800px] table-fixed text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr className="border-b border-slate-200">
                      <th className="w-[180px] px-2 py-2 text-left font-semibold">Parti No</th>
                      <th className="w-[230px] px-2 py-2 text-left font-semibold">Kumaş Cinsi</th>
                      <th className="w-[150px] px-2 py-2 text-left font-semibold">Proses</th>
                      <th className="w-[100px] px-2 py-2 text-left font-semibold">Renk</th>
                      <th className="w-[100px] px-2 py-2 text-left font-semibold">Renk Kodu</th>
                      <th className="w-[115px] px-2 py-2 text-left font-semibold">Kazan Giriş</th>
                      <th className="w-[115px] px-2 py-2 text-left font-semibold">Giriş Top Sayısı</th>
                      <th className="w-[115px] px-2 py-2 text-left font-semibold">Kazan Çıkış</th>
                      <th className="w-[115px] px-2 py-2 text-left font-semibold">Çıkış Top Sayısı</th>
                      <th className="w-[110px] px-2 py-2 text-left font-semibold">Hata Türü</th>
                      <th className="w-[200px] px-2 py-2 text-left font-semibold">Notlar</th>
                      <th className="w-[50px] px-2 py-2 text-center font-semibold">Sil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form.details.map((detail, index) => (
                      <tr key={detail.key} className="align-top hover:bg-slate-50/70">
                        <td className="px-2 py-2">
                          <input type="search" list={partiListId} value={detail.partiNo} onChange={(event) => selectPartiNo(detail.key, event.target.value)} disabled={!form.factoryId || form.isLoadingPartiNos || isSaving} placeholder="Parti ara/seç" className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-sky-500 disabled:bg-slate-100" />
                          <datalist id={partiListId}>{form.availablePartiNos.map((item, optionIndex) => <option key={`${getValue(item, 'partiNo')}-${optionIndex}`} value={getValue(item, 'partiNo')}>{getValue(item, 'etiket_Basligi')} · {getValue(item, 'renk')} · {getValue(item, 'fabricLot')}</option>)}</datalist>
                          {detail.partiNo ? <p className="mt-1 text-[10px] text-slate-500">Etiket: {getValue(form.availablePartiNos.find((item) => String(getValue(item, 'partiNo')) === detail.partiNo), 'etiket_Basligi') ?? '-'}</p> : null}
                        </td>
                        <td className="px-2 py-2"><input readOnly value={detail.fabricGender} className="w-full rounded border border-slate-100 bg-slate-50 px-2 py-2 text-xs text-slate-700" /></td>
                        <td className="px-2 py-2"><input readOnly value={detail.proses} className="w-full rounded border border-slate-100 bg-slate-50 px-2 py-2 text-xs text-slate-700" /></td>
                        <td className="px-2 py-2"><input readOnly value={detail.renk} className="w-full rounded border border-slate-100 bg-slate-50 px-2 py-2 text-xs text-slate-700" /></td>
                        <td className="px-2 py-2"><input readOnly value={detail.renkCode} className="w-full rounded border border-slate-100 bg-slate-50 px-2 py-2 text-xs text-slate-700" /></td>
                        <td className="px-2 py-2"><input type="number" min="0" step="0.01" value={detail.kazanGiris} onChange={(event) => updateDetail(detail.key, 'kazanGiris', event.target.value)} disabled={!detail.readyFabricId || isSaving} className="w-full rounded border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 disabled:bg-slate-100" /></td>
                        <td className="px-2 py-2"><input type="number" min="0" step="1" value={detail.girisTopSayisi} onChange={(event) => updateDetail(detail.key, 'girisTopSayisi', event.target.value)} disabled={!detail.readyFabricId || isSaving} className="w-full rounded border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 disabled:bg-slate-100" /></td>
                        <td className="px-2 py-2">
                          <input type="number" min="0" step="0.01" max={getValue(form.availablePartiNos.find((item) => String(getValue(item, 'partiNo')) === detail.partiNo), 'remainingWeight') ?? undefined} value={detail.kazanCikis} onChange={(event) => updateDetail(detail.key, 'kazanCikis', event.target.value)} disabled={!detail.readyFabricId || isSaving} className="w-full rounded border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 disabled:bg-slate-100" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min="0" step="1" max={getValue(form.availablePartiNos.find((item) => String(getValue(item, 'partiNo')) === detail.partiNo), 'remainingTopCount') ?? undefined} value={detail.cikisTopSayisi} onChange={(event) => updateDetail(detail.key, 'cikisTopSayisi', event.target.value)} disabled={!detail.readyFabricId || isSaving} className="w-full rounded border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 disabled:bg-slate-100" />
                        </td>
                        <td className="px-2 py-2"><select value={detail.scrapType} onChange={(event) => updateDetail(detail.key, 'scrapType', Number(event.target.value))} disabled={isSaving} className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-xs"><option value={1}>BOYAHANE HATASI</option><option value={2}>ÖRGÜ HATASI</option></select></td>
                        <td className="px-2 py-2"><input value={detail.notes} onChange={(event) => updateDetail(detail.key, 'notes', event.target.value)} disabled={isSaving} className="w-full rounded border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 disabled:bg-slate-100" /></td>
                        <td className="px-2 py-2 text-center"><button type="button" onClick={() => removeDetail(detail.key)} disabled={form.details.length <= 1 || isSaving} title="Detay satırını sil" aria-label={`Detay satırı ${index + 1} sil`} className="inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 bg-red-50 text-sm text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">🗑️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button type="button" onClick={closeModal} disabled={isSaving} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">İptal</button>
            <button type="button" onClick={saveScrap} disabled={isSaving || isLoadingFactories} className="h-10 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">{isSaving ? 'Kaydediliyor...' : 'Hareketi Kaydet'}</button>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default BoyahaneScrapModal