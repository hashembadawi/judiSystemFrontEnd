import { useCallback, useEffect, useMemo, useState } from 'react'
import YarnWeavingTransactionsModal from './YarnWeavingTransactionsModal'

const YARN_WEAVING_TRANSACTIONS_URL = '/api/yarn-weaving-transactions'
const YARN_WEAVING_UPSERT_URL = '/api/yarn-weaving-transactions/upsert'

function YarnWeavingTransactionsSection({ apiRequest, showNotice, isActive, currentUserName = '' }) {
  const [searchText, setSearchText] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isModalSaving, setIsModalSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [yarnOptions, setYarnOptions] = useState([])
  const [factoryOptions, setFactoryOptions] = useState([])
  const [form, setForm] = useState({
    id: 0,
    faturaNo: '',
    factoryId: '',
    date: '',
    writer: '',
    carBLK: '',
    carOwner: '',
    Details: [
      {
        YarnId: '',
        Lot: '',
        YarnType: 1,
        Count: '',
        NetKg: '',
        BrutKg: '',
      },
    ],
  })

  const totalNetKg = useMemo(
    () => transactions.reduce((sum, item) => sum + Number(item.totalNetKg || 0), 0),
    [transactions],
  )
  const totalBrutKg = useMemo(
    () => transactions.reduce((sum, item) => sum + Number(item.totalBrutKg || 0), 0),
    [transactions],
  )

  const loadTransactions = useCallback(async () => {
    setError('')
    setIsLoading(true)

    try {
      const query = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        searchText: searchText.trim(),
      })

      const response = await apiRequest(`${YARN_WEAVING_TRANSACTIONS_URL}?${query.toString()}`)
      const data = response.data || {}

      setTransactions(Array.isArray(data.items) ? data.items : [])
      setTotalCount(data.totalRecords ?? data.totalCount ?? 0)
      setTotalPages(
        data.totalPages ?? Math.max(Math.ceil((data.totalRecords ?? data.totalCount ?? 0) / pageSize), 1),
      )
    } catch (requestError) {
      const message = requestError.message || 'حدث خطأ عند جلب بيانات حركات الحياكة.'
      setError(message)
      setTransactions([])
      setTotalCount(0)
      setTotalPages(1)
      showNotice('error', message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, pageNumber, pageSize, searchText, showNotice])

  const resetForm = useCallback(() => {
    setForm({
      id: 0,
      faturaNo: '',
      factoryId: '',
      date: new Date().toISOString().slice(0, 10),
      writer: '',
      carBLK: '',
      carOwner: '',
      Details: [
        {
          YarnId: '',
          Lot: '',
          YarnType: 1,
          Count: '',
          NetKg: '',
          BrutKg: '',
        },
      ],
    })
  }, [])

  const handleAddTransaction = useCallback(async () => {
    setModalError('')
    setIsModalOpen(true)
    setIsModalLoading(true)
    setYarnOptions([])
    setFactoryOptions([])
    resetForm()

    try {
      const response = await apiRequest('/api/fill-options?requestedValues=1')
      const data = response.data || {}
      const nextYarns = Array.isArray(data.yarns) ? data.yarns : []
      const nextFactories = Array.isArray(data.fasonFactories) ? data.fasonFactories : []
      setYarnOptions(nextYarns)
      setFactoryOptions(nextFactories)
    } catch (requestError) {
      const message = requestError.message || 'حدث خطأ عند جلب الخيارات.'
      setModalError(message)
      showNotice('error', message)
    } finally {
      setIsModalLoading(false)
    }
  }, [apiRequest, resetForm, showNotice])

  const closeModal = useCallback(() => {
    if (isModalSaving) {
      return
    }

    setIsModalOpen(false)
    setModalError('')
  }, [isModalSaving])

  const onFormFieldChange = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const onDetailFieldChange = useCallback((index, field, value) => {
    setForm((prev) => ({
      ...prev,
      Details: prev.Details.map((detail, rowIndex) =>
        rowIndex === index ? { ...detail, [field]: value } : detail,
      ),
    }))
  }, [])

  const onAddDetailRow = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      Details: [
        ...prev.Details,
        {
          YarnId: '',
          Lot: '',
          YarnType: 1,
          Count: '',
          NetKg: '',
          BrutKg: '',
        },
      ],
    }))
  }, [])

  const onRemoveDetailRow = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      Details: prev.Details.filter((_, rowIndex) => rowIndex !== index),
    }))
  }, [])

  const saveTransaction = useCallback(async () => {
    setModalError('')
    setIsModalSaving(true)

    try {
      const payload = {
        id: Number(form.id) || 0,
        faturaNo: form.faturaNo,
        factoryId: Number(form.factoryId) || 0,
        date: form.date || new Date().toISOString().slice(0, 10),
        writer: form.writer,
        carBLK: form.carBLK,
        carOwner: form.carOwner,
        Details: form.Details.map((detail) => ({
          YarnId: Number(detail.YarnId) || 0,
          Lot: detail.Lot,
          YarnType: Number(detail.YarnType) || 1,
          Count: Number(detail.Count) || 0,
          NetKg: Number(detail.NetKg) || 0,
          BrutKg: Number(detail.BrutKg) || 0,
        })),
      }

      await apiRequest(YARN_WEAVING_UPSERT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setIsModalOpen(false)
      setIsModalSaving(false)
      loadTransactions()
      showNotice('success', 'تم حفظ الحركة بنجاح.')
    } catch (requestError) {
      const message = requestError.message || 'حدث خطأ عند حفظ الحركة.'
      setModalError(message)
      showNotice('error', message)
      setIsModalSaving(false)
    }
  }, [apiRequest, form, loadTransactions, showNotice])

  const handleEditTransaction = useCallback(async (id) => {
    if (!id) {
      return
    }

    setModalError('')
    setIsModalOpen(true)
    setIsModalLoading(true)
    setYarnOptions([])
    setFactoryOptions([])

    try {
      const [optionsResponse, transactionResponse] = await Promise.all([
        apiRequest('/api/fill-options?requestedValues=1'),
        apiRequest(`${YARN_WEAVING_TRANSACTIONS_URL}/${id}`),
      ])

      const optionsData = optionsResponse.data || {}
      const transactionData = transactionResponse.data || {}
      const nextYarns = Array.isArray(optionsData.yarns) ? optionsData.yarns : []
      const nextFactories = Array.isArray(optionsData.fasonFactories) ? optionsData.fasonFactories : []

      setYarnOptions(nextYarns)
      setFactoryOptions(nextFactories)
      setForm({
        id: transactionData.id || 0,
        faturaNo: transactionData.faturaNo || '',
        factoryId: transactionData.factoryId ?? '',
        date: transactionData.date || new Date().toISOString().slice(0, 10),
        writer: transactionData.writer || '',
        carBLK: transactionData.carBLK || '',
        carOwner: transactionData.carOwner || '',
        Details: Array.isArray(transactionData.details)
          ? transactionData.details.map((detail) => ({
              YarnId: detail.yarnId ?? detail.YarnId ?? '',
              Lot: detail.lot ?? detail.Lot ?? '',
              YarnType: detail.yarnType ?? detail.YarnType ?? 1,
              Count: detail.count ?? detail.Count ?? '',
              NetKg: detail.netKg ?? detail.NetKg ?? '',
              BrutKg: detail.brutKg ?? detail.BrutKg ?? '',
            }))
          : [
              {
                YarnId: '',
                Lot: '',
                YarnType: 1,
                Count: '',
                NetKg: '',
                BrutKg: '',
              },
            ],
      })
    } catch (requestError) {
      const message = requestError.message || 'حدث خطأ عند جلب بيانات الحركة.'
      setModalError(message)
      showNotice('error', message)
      setIsModalOpen(false)
    } finally {
      setIsModalLoading(false)
    }
  }, [apiRequest, showNotice])

  const handleDeleteTransaction = async (id) => {
    if (!id) {
      return
    }

    const confirmed = window.confirm('هل أنت متأكد من حذف هذه الحركة؟')
    if (!confirmed) {
      return
    }

    try {
      await apiRequest(`${YARN_WEAVING_TRANSACTIONS_URL}/${id}`, {
        method: 'DELETE',
      })

      showNotice('success', 'تم حذف الحركة بنجاح.')
      loadTransactions()
    } catch (requestError) {
      const message = requestError.message || 'حدث خطأ عند حذف الحركة.'
      showNotice('error', message)
    }
  }

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const timer = setTimeout(() => {
      loadTransactions()
    }, 300)

    return () => clearTimeout(timer)
  }, [isActive, loadTransactions])

  const handlePrintTransactions = useCallback(() => {
    const rows = transactions
      .map((transaction, index) => {
        const faturaNo = transaction.faturaNo ?? '-'
        const factoryName = transaction.factoryName ?? '-'
        const date = transaction.date ?? '-'
        const writer = transaction.writer ?? '-'
        const carBLK = transaction.carBLK ?? '-'
        const carOwner = transaction.carOwner ?? '-'
        const detailsCount = transaction.detailsCount ?? '-'
        const totalNetKg = transaction.totalNetKg ?? '-'
        const totalBrutKg = transaction.totalBrutKg ?? '-'

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${faturaNo}</td>
            <td>${factoryName}</td>
            <td>${date}</td>
            <td>${writer}</td>
            <td>${carBLK}</td>
            <td>${carOwner}</td>
            <td>${detailsCount}</td>
            <td>${totalNetKg}</td>
            <td>${totalBrutKg}</td>
          </tr>
        `
      })
      .join('')

    const reportHtml = `<!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta name="robots" content="noindex,nofollow" />
          <title>تقرير حركات الحياكة</title>
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
            <div class="report-user">${currentUserName || 'المستخدم'}</div>
            <div class="report-title">تقرير حركات الحياكة</div>
          </div>
          <div class="summary">عدد النتائج: ${totalCount} | صافي: ${totalNetKg} | قائم: ${totalBrutKg}</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>رقم الفاتورة</th>
                <th>المصنع</th>
                <th>التاريخ</th>
                <th>الكاتب</th>
                <th>لوحة السيارة</th>
                <th>صاحب السيارة</th>
                <th>عدد التفاصيل</th>
                <th>الصافي KG</th>
                <th>القائم KG</th>
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
      showNotice('error', 'تعذر فتح نافذة الطباعة.')
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
  }, [currentUserName, showNotice, totalBrutKg, totalCount, totalNetKg, transactions])

  return (
    <div className="space-y-6" dir="rtl">
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-sky-900">إدارة حركات الحياكة</h3>
          </div>

          <button
            type="button"
            onClick={handleAddTransaction}
            className="inline-flex items-center justify-center rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-800 active:bg-sky-900"
          >
            إضافة حركة جديدة
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="weavingSearch" className="text-xs font-medium text-slate-600">بحث</label>
            <input
              id="weavingSearch"
              type="text"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value)
                setPageNumber(1)
              }}
              placeholder="ابحث بالفاتورة أو اسم المعمل"
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-slate-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="weavingPageSize" className="text-xs font-medium text-slate-600">حجم الصفحة</label>
            <select
              id="weavingPageSize"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPageNumber(1)
              }}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">رقم الفاتورة</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">المصنع</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">الكاتب</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">لوحة السيارة</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">صاحب السيارة</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">عدد التفاصيل</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">الصافي KG</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">القائم KG</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">جاري تحميل بيانات الحركات...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">لا توجد بيانات مطابقة.</td>
                </tr>
              ) : (
                transactions.map((transaction, index) => (
                  <tr key={transaction.id ?? `${transaction.faturaNo ?? 'row'}-${index}`} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4 text-right text-slate-900">{transaction.faturaNo ?? '-'}</td>
                    <td className="px-4 py-4 text-right text-slate-700">{transaction.factoryName ?? '-'}</td>
                    <td className="px-4 py-4 text-right text-slate-700">{transaction.date ?? '-'}</td>
                    <td className="px-4 py-4 text-right text-slate-700">{transaction.writer ?? '-'}</td>
                    <td className="px-4 py-4 text-right text-slate-700">{transaction.carBLK ?? '-'}</td>
                    <td className="px-4 py-4 text-right text-slate-700">{transaction.carOwner ?? '-'}</td>
                    <td className="px-4 py-4 text-right text-slate-700">{transaction.detailsCount ?? '-'}</td>
                    <td className="px-4 py-4 text-right text-slate-700">{transaction.totalNetKg ?? '-'}</td>
                    <td className="px-4 py-4 text-right text-slate-700">{transaction.totalBrutKg ?? '-'}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditTransaction(transaction.id)}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 px-3 text-sm font-medium text-red-600 transition hover:bg-red-100"
                        >
                          حذف
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
            <div className="px-4 py-12 text-center text-slate-500">جاري تحميل بيانات الحركات...</div>
          ) : transactions.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-500">لا توجد بيانات مطابقة.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {transactions.map((transaction, index) => (
                <div key={transaction.id ?? `${transaction.faturaNo ?? 'row'}-${index}`} className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{transaction.faturaNo ?? '-'}</span>
                    <span className="text-sm font-semibold text-slate-900">{transaction.factoryName ?? '-'}</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-center justify-between gap-3"><span>التاريخ:</span><span className="font-medium text-slate-900">{transaction.date ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>الكاتب:</span><span className="font-medium text-slate-900">{transaction.writer ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>لوحة السيارة:</span><span className="font-medium text-slate-900">{transaction.carBLK ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>صاحب السيارة:</span><span className="font-medium text-slate-900">{transaction.carOwner ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>عدد التفاصيل:</span><span className="font-medium text-slate-900">{transaction.detailsCount ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>الصافي KG:</span><span className="font-medium text-slate-900">{transaction.totalNetKg ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>القائم KG:</span><span className="font-medium text-slate-900">{transaction.totalBrutKg ?? '-'}</span></div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditTransaction(transaction.id)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-4">
          <p>عدد النتائج: <strong className="text-slate-900">{totalCount}</strong></p>
          <p>الصافي: <strong className="text-slate-900">{totalNetKg}</strong></p>
          <p>القائم: <strong className="text-slate-900">{totalBrutKg}</strong></p>
          <button type="button" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={handlePrintTransactions}>
            طباعة
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pageNumber <= 1 || isLoading}
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
          >
            السابق
          </button>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">الصفحة {pageNumber} من {Math.max(totalPages, 1)}</span>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pageNumber >= Math.max(totalPages, 1) || isLoading}
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, Math.max(totalPages, 1)))}
          >
            التالي
          </button>
        </div>
      </footer>

      <YarnWeavingTransactionsModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSaving={isModalSaving}
        error={modalError}
        form={form}
        yarnOptions={yarnOptions}
        factoryOptions={factoryOptions}
        onFieldChange={onFormFieldChange}
        onDetailFieldChange={onDetailFieldChange}
        onAddDetailRow={onAddDetailRow}
        onRemoveDetailRow={onRemoveDetailRow}
        onClose={closeModal}
        onSave={saveTransaction}
      />
    </div>
  )
}

export default YarnWeavingTransactionsSection
