import { useCallback, useEffect, useMemo, useState } from 'react'
import YarnModal from './YarnModal'

const YARNS_URL = '/api/yarns'
const UPSERT_YARN_URL = '/api/yarns/upsert'

const getTodayDate = () => new Date().toISOString().slice(0, 10)

function YarnsSection({ apiRequest, showNotice, isActive, currentUserName = '' }) {
  const [searchText, setSearchText] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [yarns, setYarns] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalSaving, setIsModalSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [form, setForm] = useState({
    id: 0,
    yarnGender: '',
    lot: '',
    count: '',
    yarnType: 1,
    netKg: '',
    brutKg: '',
    loss: '',
    ne: '',
    company: '',
    price: '',
    faturaNo: '',
    incomDate: '',
  })

  const totalNetKg = useMemo(
    () => yarns.reduce((sum, yarn) => sum + Number(yarn.netKg || 0), 0),
    [yarns],
  )
  const totalBrutKg = useMemo(
    () => yarns.reduce((sum, yarn) => sum + Number(yarn.brutKg || 0), 0),
    [yarns],
  )
  const totalRemainNetKg = useMemo(
    () => yarns.reduce((sum, yarn) => sum + Number(yarn.remainNetKg || 0), 0),
    [yarns],
  )
  const totalRemainBrutKg = useMemo(
    () => yarns.reduce((sum, yarn) => sum + Number(yarn.remainBrutKg || 0), 0),
    [yarns],
  )

  const loadYarns = useCallback(async () => {
    setError('')
    setIsLoading(true)

    try {
      const query = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        searchText: searchText.trim(),
      })

      const response = await apiRequest(`${YARNS_URL}?${query.toString()}`)
      const data = response.data || {}
      setYarns(Array.isArray(data.items) ? data.items : [])
      setTotalCount(data.totalRecords ?? data.totalCount ?? 0)
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError('Sunucuya bağlanılamadı. API’nin kullanılabilir ve erişim izinlerinin uygun olduğundan emin olun.')
      } else {
        setError(requestError.message || 'İplik verileri alınırken bir hata oluştu.')
      }
      setYarns([])
      setTotalCount(0)
      showNotice('error', requestError.message || 'İplik verileri alınırken bir hata oluştu.')
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, pageNumber, pageSize, searchText, showNotice])

  const handleAddYarn = () => {
    setModalError('')
    setForm({
      id: 0,
      yarnGender: '',
      lot: '',
      count: '',
      yarnType: 1,
      netKg: '',
      brutKg: '',
      loss: '',
      ne: '',
      company: '',
      price: '',
      faturaNo: '',
      incomDate: getTodayDate(),
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isModalSaving) {
      return
    }

    setIsModalOpen(false)
    setModalError('')
  }

  const onFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const saveYarn = async () => {
    setModalError('')
    setIsModalSaving(true)

    try {
      const payload = {
        id: Number(form.id) || 0,
        yarnGender: form.yarnGender,
        lot: form.lot,
        count: Number(form.count) || 0,
        yarnType: Number(form.yarnType) || 1,
        netKg: Number(form.netKg) || 0,
        brutKg: Number(form.brutKg) || 0,
        loss: Number(form.loss) || 0,
        ne: Number(form.ne) || 0,
        company: form.company,
        price: Number(form.price) || 0,
        faturaNo: form.faturaNo,
        incomDate: form.incomDate || getTodayDate(),
      }

      await apiRequest(UPSERT_YARN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setIsModalOpen(false)
      setIsModalSaving(false)
      loadYarns()
      showNotice('success', 'İplik başarıyla kaydedildi.')
    } catch (requestError) {
      setModalError(requestError.message || 'İplik kaydedilirken bir hata oluştu.')
      showNotice('error', requestError.message || 'İplik kaydedilirken bir hata oluştu.')
      setIsModalSaving(false)
    }
  }

  const handleEditYarn = async (id) => {
    if (!id) {
      return
    }

    setModalError('')
    setIsModalOpen(true)
    setIsModalSaving(false)

    try {
      const response = await apiRequest(`${YARNS_URL}/${id}`)
      const data = response.data || {}

      setForm({
        id: data.id || 0,
        yarnGender: data.yarnGender || '',
        lot: data.lot ?? '',
        count: data.count ?? '',
        yarnType: data.yarntype ?? data.yarnType ?? 1,
        netKg: data.netKg ?? '',
        brutKg: data.brutKg ?? '',
        loss: data.loss ?? data.Loss ?? '',
        ne: data.ne ?? data.NE ?? '',
        company: data.company || '',
        price: data.price ?? '',
        faturaNo: data.faturaNo || '',
        incomDate: data.incomDate || getTodayDate(),
      })
    } catch (requestError) {
      const message = requestError.message || 'İplik bilgileri alınırken bir hata oluştu.'
      setModalError(message)
      showNotice('error', message)
      setIsModalOpen(false)
    }
  }

  const handleDeleteYarn = async (id) => {
    if (!id) {
      return
    }

    const confirmed = window.confirm('Bu ipliği silmek istediğinizden emin misiniz?')
    if (!confirmed) {
      return
    }

    try {
      await apiRequest(`${YARNS_URL}/${id}`, {
        method: 'DELETE',
      })

      loadYarns()
      showNotice('success', 'İplik başarıyla silindi.')
    } catch (requestError) {
      const message = requestError.message || 'İplik silinirken bir hata oluştu.'
      setError(message)
      showNotice('error', message)
    }
  }

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const timer = setTimeout(() => {
      loadYarns()
    }, 300)

    return () => clearTimeout(timer)
  }, [isActive, loadYarns])

  const handlePrintYarns = useCallback(() => {
    const rows = yarns
      .map((yarn, index) => {
        const yarnGender = yarn.yarnGender ?? '-'
        const lot = yarn.lot ?? '-'
        const count = yarn.count ?? '-'
        const netKg = yarn.netKg ?? '-'
        const brutKg = yarn.brutKg ?? '-'
        const remainCount = yarn.remainCount ?? '-'
        const remainNetKg = yarn.remainNetKg ?? '-'
        const remainBrutKg = yarn.remainBrutKg ?? '-'
        const company = yarn.company ?? '-'
        const price = yarn.price ?? '-'
        const faturaNo = yarn.faturaNo ?? '-'
        const incomDate = yarn.incomDate ?? '-'

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${yarnGender}</td>
            <td>${lot}</td>
            <td>${count}</td>
            <td>${netKg}</td>
            <td>${brutKg}</td>
            <td>${remainCount}</td>
            <td>${remainNetKg}</td>
            <td>${remainBrutKg}</td>
            <td>${company}</td>
            <td>${price}</td>
            <td>${faturaNo}</td>
            <td>${incomDate}</td>
          </tr>
        `
      })
      .join('')

    const reportHtml = `<!DOCTYPE html>
      <html lang="tr" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta name="robots" content="noindex,nofollow" />
          <title>İplik Stok Raporu</title>
          <style>
            @page { margin: 8mm; }
            body {
              font-family: Arial, sans-serif;
              color: #1f2d3d;
              margin: 0;
              padding: 18px;
            }
            .report-header {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 4px;
              margin-bottom: 18px;
              font-weight: 700;
              color: #1f5f81;
            }
            .report-date { font-size: 0.95rem; color: #2e5166; }
            .report-user { font-size: 0.95rem; color: #2e5166; }
            .report-title { font-size: 1.05rem; color: #1f5f81; }
            .summary { font-size: 13px; color: #2e5166; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d3e4ed; padding: 8px; text-align: right; }
            th { background: #edf6fb; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="report-date">${new Date().toISOString().split('T')[0]}</div>
            <div class="report-user">${currentUserName || 'Kullanıcı'}</div>
            <div class="report-title">İplik Stok Raporu</div>
          </div>
          <div class="summary">Toplam kayıt: ${totalCount} | Net: ${totalNetKg} | Brüt: ${totalBrutKg} | Kalan net: ${totalRemainNetKg} | Kalan brüt: ${totalRemainBrutKg}</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>İplik türü</th>
                <th>LOT</th>
                <th>Adet</th>
                <th>Net KG</th>
                <th>Brüt KG</th>
                <th>Kalan adet</th>
                <th>Kalan net KG</th>
                <th>Kalan brüt KG</th>
                <th>Firma</th>
                <th>Fiyat</th>
                <th>Fatura No</th>
                <th>Giriş tarihi</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`

    const reportBlob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' })
    const reportUrl = URL.createObjectURL(reportBlob)
    const printWindow = window.open(reportUrl, '_blank', 'width=1000,height=800')

    if (!printWindow) {
      URL.revokeObjectURL(reportUrl)
      showNotice('error', 'Yazdırma penceresi açılamadı.')
      return
    }

    setTimeout(() => {
      printWindow.document.write(reportHtml)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      URL.revokeObjectURL(reportUrl)
      printWindow.close()
    }, 250)
  }, [currentUserName, showNotice, totalBrutKg, totalCount, totalNetKg, totalRemainBrutKg, totalRemainNetKg, yarns])

  return (
    <>
      <div className="space-y-6" dir="rtl">
        <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-right">
              <h3 className="text-2xl font-bold text-sky-900">İplik Stok Yönetimi</h3>
            </div>

            <button
              type="button"
              onClick={handleAddYarn}
              className="inline-flex items-center justify-center rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-800 active:bg-sky-900"
            >
              + Yeni İplik Ekle
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2 text-right">
              <label htmlFor="yarnsSearch" className="text-xs font-medium text-slate-600">Ara</label>
              <input
                id="yarnsSearch"
                type="text"
                value={searchText}
                onChange={(event) => {
                  setSearchText(event.target.value)
                  setPageNumber(1)
                }}
                placeholder="Tür, LOT veya firmaya göre ara"
                className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-slate-50"
                dir="ltr"
                style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
              />
            </div>

            <div className="flex flex-col gap-2 text-right">
              <label htmlFor="yarnsPageSize" className="text-xs font-medium text-slate-600">Sayfa başına kayıt</label>
              <select
                id="yarnsPageSize"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setPageNumber(1)
                }}
                className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
                dir="ltr"
                style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm" dir="ltr">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">İplik türü</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">LOT</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Adet</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Net KG</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Brüt KG</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Kalan adet</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Kalan net KG</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Kalan brüt KG</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Firma</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Fiyat</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Fatura No</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Giriş tarihi</span></th>
                  <th className="px-6 py-3 text-center"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">İşlemler</span></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-12 text-center text-slate-500">İplik verileri yükleniyor...</td>
                  </tr>
                ) : yarns.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-12 text-center text-slate-500">Eşleşen kayıt bulunamadı.</td>
                  </tr>
                ) : (
                  yarns.map((yarn, index) => (
                    <tr key={yarn.id ?? index} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4 text-left"><span className="text-sm text-slate-900">{yarn.yarnGender ?? '-'}</span></td>
                      <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{yarn.lot ?? '-'}</span></td>
                      <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{yarn.count ?? '-'}</span></td>
                      <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{yarn.netKg ?? '-'}</span></td>
                      <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{yarn.brutKg ?? '-'}</span></td>
                      <td className="px-6 py-4 text-left"><span className="text-sm font-semibold text-slate-800">{yarn.remainCount ?? '-'}</span></td>
                      <td className="px-6 py-4 text-left"><span className="text-sm font-semibold text-slate-800">{yarn.remainNetKg ?? '-'}</span></td>
                      <td className="px-6 py-4 text-left"><span className="text-sm font-semibold text-slate-800">{yarn.remainBrutKg ?? '-'}</span></td>
                      <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{yarn.company ?? '-'}</span></td>
                      <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{yarn.price ?? '-'}</span></td>
                      <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{yarn.faturaNo ?? '-'}</span></td>
                      <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{yarn.incomDate ?? '-'}</span></td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            title="Düzenle"
                            onClick={() => handleEditYarn(yarn.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100 hover:border-slate-400"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            title="Sil"
                            onClick={() => handleDeleteYarn(yarn.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-300 bg-red-50 text-red-600 transition hover:bg-red-100 hover:border-red-400"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-slate-500">İplik verileri yükleniyor...</div>
            ) : yarns.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-500">Eşleşen kayıt bulunamadı.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {yarns.map((yarn, index) => (
                  <div key={yarn.id ?? index} className="p-4 text-right">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-900">{yarn.yarnGender ?? '-'}</span>
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{yarn.lot ?? '-'}</span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="flex items-center justify-between gap-3"><span>Adet:</span><span className="font-medium text-slate-900">{yarn.count ?? '-'}</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Net KG:</span><span className="font-medium text-slate-900">{yarn.netKg ?? '-'}</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Brüt KG:</span><span className="font-medium text-slate-900">{yarn.brutKg ?? '-'}</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Kalan net:</span><span className="font-medium text-slate-900">{yarn.remainNetKg ?? '-'}</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Firma:</span><span className="font-medium text-slate-900">{yarn.company ?? '-'}</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Giriş tarihi:</span><span className="font-medium text-slate-900">{yarn.incomDate ?? '-'}</span></div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditYarn(yarn.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteYarn(yarn.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-300 bg-red-50 text-red-600 transition hover:bg-red-100"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-1 text-sm text-slate-700 text-right">
              <p>Toplam kayıt: <strong className="text-slate-900">{totalCount}</strong></p>
            <p>Net: <strong className="text-slate-900">{totalNetKg}</strong> | Brüt: <strong className="text-slate-900">{totalBrutKg}</strong></p>
            <p>Kalan net: <strong className="text-slate-900">{totalRemainNetKg}</strong> | Kalan brüt: <strong className="text-slate-900">{totalRemainBrutKg}</strong></p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handlePrintYarns}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Yazdır
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pageNumber <= 1 || isLoading}
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
            >
              Önceki
            </button>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
              Sayfa {pageNumber}
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pageNumber >= Math.max(Math.ceil(totalCount / pageSize), 1) || isLoading}
              onClick={() =>
                setPageNumber((prev) =>
                  Math.min(prev + 1, Math.max(Math.ceil(totalCount / pageSize), 1)),
                )
              }
            >
              Sonraki
            </button>
          </div>
        </footer>
      </div>

      <YarnModal
        isOpen={isModalOpen}
        isSaving={isModalSaving}
        error={modalError}
        form={form}
        onFieldChange={onFormChange}
        onClose={closeModal}
        onSave={saveYarn}
      />
    </>
  )
}

export default YarnsSection
