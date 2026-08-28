import { useCallback, useEffect, useMemo, useState } from 'react'
import HamBoyaTransactionsModal from './HamBoyaTransactionsModal'
import { buildButtonClasses } from '../../styles/designSystem'

const HAM_BOYA_TRANSACTIONS_URL = '/api/ham-boya-transactions'

const getTodayDate = () => new Date().toISOString().slice(0, 10)

const escapeHtml = (value) => String(value ?? '-').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;',
}[character]))

const formatReportNumber = (value) => Number(value || 0).toLocaleString('en-US', {
  maximumFractionDigits: 2,
})

const formatReportDate = (value) => new Date(value).toLocaleDateString('tr-TR-u-nu-latn')

const formatReportValue = (value) => String(value ?? '-').replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))

const getOptionDisplayText = (item) => {
  if (item == null) {
    return ''
  }

  if (typeof item === 'string') {
    return item
  }

  if (typeof item === 'object') {
    const candidate =
      item.label ??
      item.text ??
      item.name ??
      item.displayName ??
      item.value ??
      item.fabricName ??
      item.fabricGender ??
      item.FabricGender ??
      item.displayText

    return typeof candidate === 'string' ? candidate : String(candidate ?? '')
  }

  return String(item)
}

function HamBoyaTransactionsSection({ apiRequest, showNotice, isActive, currentUserName = '' }) {
  const [searchText, setSearchText] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isModalSaving, setIsModalSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [customerOrdersOptions, setCustomerOrdersOptions] = useState([])
  const [boyaFactoriesOptions, setBoyaFactoriesOptions] = useState([])
  const [hamFabricsOptions, setHamFabricsOptions] = useState([])
  const [transactionForm, setTransactionForm] = useState({
    Id: 0,
    FaturaNo: '',
    FactoryId: '',
    Date: '',
    Writer: '',
    CarBLK: '',
    CarOwner: '',
    Details: [
      {
        Id: 0,
        OrderNo: '',
        FabricGender: '',
        FabricWeight: '',
        FabricTopCount: '',
        FabricLot: '',
        FabricGr: '',
      },
    ],
  })

  const totalWeight = useMemo(
    () => transactions.reduce((sum, item) => sum + Number(item.totalWeight || 0), 0),
    [transactions],
  )

  const loadTransactions = useCallback(async () => {
    setError('')
    setIsLoading(true)

    try {
      const query = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
      })

      if (searchText.trim() !== '') {
        query.set('searchText', searchText.trim())
      }

      const response = await apiRequest(`${HAM_BOYA_TRANSACTIONS_URL}?${query.toString()}`)
      const data = response.data || {}

      setTransactions(Array.isArray(data.items) ? data.items : [])
      setTotalCount(data.totalRecords ?? 0)
    } catch (requestError) {
      const message = requestError.message || 'حدث خطأ عند جلب بيانات الحركات.'
      setError(message)
      setTransactions([])
      setTotalCount(0)
      showNotice('error', message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, pageNumber, pageSize, searchText, showNotice])

  const deleteTransaction = useCallback(
    async (id) => {
      if (!id) {
        return
      }

      const confirmed = window.confirm('هل أنت متأكد من حذف هذه الحركة؟')
      if (!confirmed) {
        return
      }

      try {
        await apiRequest(`${HAM_BOYA_TRANSACTIONS_URL}/${id}`, {
          method: 'DELETE',
        })

        showNotice('success', 'تم حذف الحركة بنجاح.')
        loadTransactions()
      } catch (requestError) {
        const message = requestError.message || 'حدث خطأ عند حذف الحركة.'
        showNotice('error', message)
      }
    },
    [apiRequest, loadTransactions, showNotice],
  )

  const openCreateModal = useCallback(async () => {
    setModalError('')
    setIsModalOpen(true)
    setIsModalLoading(true)
    setCustomerOrdersOptions([])
    setBoyaFactoriesOptions([])
    setHamFabricsOptions([])
    setTransactionForm({
      Id: 0,
      FaturaNo: '',
      FactoryId: '',
      Date: getTodayDate(),
      Writer: '',
      CarBLK: '',
      CarOwner: '',
      Details: [
        {
          Id: 0,
          OrderNo: '',
          FabricGender: '',
          FabricWeight: '',
          FabricTopCount: '',
          FabricLot: '',
          FabricGr: '',
        },
      ],
    })
    try {
      const response = await apiRequest('/api/fill-options?requestedValues=1')
      const data = response.data || {}
      setCustomerOrdersOptions(Array.isArray(data.customerOrders) ? data.customerOrders : [])
      setBoyaFactoriesOptions(Array.isArray(data.boyaFactories) ? data.boyaFactories : [])
      setHamFabricsOptions(Array.isArray(data.items) ? data.items.map((item) => getOptionDisplayText(item)) : [])
    } catch (requestError) {
      const message = requestError.message || 'حدث خطأ عند جلب خيارات الحركة.'
      setModalError(message)
      showNotice('error', message)
    } finally {
      setIsModalLoading(false)
    }
  }, [apiRequest, showNotice])

  const openEditModal = useCallback(
    async (id) => {
      if (!id) {
        return
      }

      setModalError('')
      setIsModalOpen(true)
      setIsModalLoading(true)
      setCustomerOrdersOptions([])
      setBoyaFactoriesOptions([])
      setHamFabricsOptions([])

      try {
        const [optionsResponse, transactionResponse] = await Promise.all([
          apiRequest('/api/fill-options?requestedValues=1'),
          apiRequest(`${HAM_BOYA_TRANSACTIONS_URL}/${id}`),
        ])

        const optionsData = optionsResponse.data || {}
        const transactionData = transactionResponse.data || {}

        setCustomerOrdersOptions(Array.isArray(optionsData.customerOrders) ? optionsData.customerOrders : [])
        setBoyaFactoriesOptions(Array.isArray(optionsData.boyaFactories) ? optionsData.boyaFactories : [])
        setHamFabricsOptions(Array.isArray(optionsData.items) ? optionsData.items.map((item) => getOptionDisplayText(item)) : [])

        setTransactionForm({
          Id: transactionData.id || 0,
          FaturaNo: transactionData.faturaNo || '',
          FactoryId: transactionData.factoryId ?? '',
          Date: transactionData.date || getTodayDate(),
          Writer: transactionData.writer || '',
          CarBLK: transactionData.carBLK ?? transactionData.CarBLK ?? '',
          CarOwner: transactionData.carOwner || '',
          Details: Array.isArray(transactionData.details)
            ? transactionData.details.map((detail) => ({
                Id: detail.id || 0,
                OrderNo: detail.orderNo ?? detail.OrderNo ?? detail.orderId ?? '',
                FabricGender: detail.fabricGender ?? detail.FabricGender ?? '',
                FabricWeight: detail.fabricWeight ?? '',
                FabricTopCount: detail.fabricTopCount ?? '',
                FabricLot: detail.FabricLot ?? detail.fabricLot ?? detail.lot ?? detail.Lot ?? '',
                FabricGr: detail.fabricGr ?? detail.FabricGr ?? '',
              }))
            : [
                {
                  Id: 0,
                  OrderNo: '',
                  FabricGender: '',
                  FabricWeight: '',
                  FabricTopCount: '',
                  FabricLot: '',
                  FabricGr: '',
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
    },
    [apiRequest, showNotice],
  )

  const closeModal = useCallback(() => {
    if (isModalSaving) {
      return
    }
    setIsModalOpen(false)
    setModalError('')
  }, [isModalSaving])

  const updateTransactionField = useCallback((field, value) => {
    setTransactionForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const updateDetailField = useCallback((index, field, value) => {
    setTransactionForm((prev) => ({
      ...prev,
      Details: prev.Details.map((detail, rowIndex) =>
        rowIndex === index ? { ...detail, [field]: value } : detail,
      ),
    }))
  }, [])

  const addDetailRow = useCallback(() => {
    setTransactionForm((prev) => ({
      ...prev,
      Details: [
        ...prev.Details,
        {
          Id: 0,
          OrderNo: '',
          FabricGender: '',
          FabricWeight: '',
          FabricTopCount: '',
          FabricLot: '',
          FabricGr: '',
        },
      ],
    }))
  }, [])

  const removeDetailRow = useCallback((index) => {
    setTransactionForm((prev) => ({
      ...prev,
      Details: prev.Details.filter((_, rowIndex) => rowIndex !== index),
    }))
  }, [])

  const printSavedTransaction = useCallback((transaction) => {
    const factory = boyaFactoriesOptions.find((option) => String(option.id) === String(transaction.FactoryId))
    const factoryName = factory?.name ?? factory?.label ?? transaction.FactoryId
    const totalWeight = transaction.Details.reduce((sum, detail) => sum + Number(detail.FabricWeight || 0), 0)
    const totalTopCount = transaction.Details.reduce((sum, detail) => sum + Number(detail.FabricTopCount || 0), 0)
    const detailRows = transaction.Details.map((detail, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(detail.FabricGender)}</td>
        <td>${escapeHtml(detail.FabricLot)}</td>
        <td>${escapeHtml(detail.FabricGr)}</td>
        <td>${formatReportNumber(detail.FabricWeight)}</td>
        <td>${formatReportNumber(detail.FabricTopCount)}</td>
        <td>${escapeHtml(detail.OrderNo)}</td>
      </tr>
    `).join('')

    const reportHtml = `<!DOCTYPE html>
      <html lang="tr" dir="ltr">
        <head>
          <meta charset="UTF-8" />
          <meta name="robots" content="noindex,nofollow" />
          <title>Boyahane Ham Kumaş Sevkiyat Raporu</title>
          <style>
            @page { size: A4; margin: 12mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #17212b; font-family: Arial, Tahoma, sans-serif; font-size: 13px; direction: ltr; }
            .report { max-width: 900px; margin: 0 auto; }
            .top-line { height: 5px; background: #0f766e; margin-bottom: 22px; }
            header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 16px; }
            .brand { color: #0f766e; font-size: 14px; font-weight: 700; }
            h1 { margin: 7px 0 0; color: #0f172a; font-size: 24px; }
            .meta { color: #475569; line-height: 1.8; text-align: right; white-space: nowrap; }
            .meta strong { color: #0f172a; }
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
            .info-item { border: 1px solid #dbe4ea; background: #f8fafc; padding: 10px 12px; }
            .label { display: block; color: #64748b; font-size: 11px; margin-bottom: 4px; }
            .value { color: #0f172a; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 9px 8px; text-align: right; }
            th { background: #e6fffb; color: #115e59; font-weight: 700; }
            tbody tr:nth-child(even) { background: #f8fafc; }
            .section-title { color: #0f172a; font-size: 15px; font-weight: 700; margin-top: 22px; }
            footer { display: flex; justify-content: flex-start; gap: 12px; margin-top: 24px; }
            .stat { min-width: 180px; border: 1px solid #99f6e4; background: #f0fdfa; padding: 12px 16px; }
            .stat strong { display: block; color: #0f766e; font-size: 19px; margin-top: 4px; }
            @media print { .report { max-width: none; } }
          </style>
        </head>
        <body>
          <main class="report">
            <div class="top-line"></div>
            <header>
              <div><div class="brand">judi mensucat</div><h1>Boyahane Ham Kumaş Sevkiyat Raporu</h1></div>
              <div class="meta"><div><strong>Yazdırma Tarihi:</strong> ${escapeHtml(formatReportDate(new Date()))}</div><div><strong>Hazırlayan:</strong> ${escapeHtml(transaction.Writer)}</div></div>
            </header>
            <div class="info-grid">
              <div class="info-item"><span class="label">Fatura No</span><span class="value">${escapeHtml(transaction.FaturaNo)}</span></div>
              <div class="info-item"><span class="label">Atanan Boyahane</span><span class="value">${escapeHtml(factoryName)}</span></div>
              <div class="info-item"><span class="label">İşlem Tarihi</span><span class="value">${escapeHtml(transaction.Date)}</span></div>
              <div class="info-item"><span class="label">Araç Plakası</span><span class="value">${escapeHtml(transaction.CarBLK)}</span></div>
              <div class="info-item"><span class="label">Araç Sahibi</span><span class="value">${escapeHtml(transaction.CarOwner)}</span></div>
            </div>
            <div class="section-title">Gönderilen Kumaş Detayları</div>
            <table>
              <thead><tr><th>#</th><th>Kumaş Cinsi</th><th>Kumaş Lotu</th><th>GR</th><th>Ağırlık</th><th>Top Sayısı</th><th>Sipariş No</th></tr></thead>
              <tbody>${detailRows}</tbody>
            </table>
            <footer>
              <div class="stat"><span class="label">Toplam Top Sayısı</span><strong>${formatReportNumber(totalTopCount)}</strong></div>
              <div class="stat"><span class="label">Toplam Ağırlık</span><strong>${formatReportNumber(totalWeight)}</strong></div>
            </footer>
          </main>
        </body>
      </html>`

    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) {
      showNotice('error', 'تعذر فتح نافذة الطباعة.')
      return
    }

    printWindow.document.write(reportHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }, [boyaFactoriesOptions, showNotice])

  const saveTransaction = useCallback(async () => {
    setModalError('')
    setIsModalSaving(true)

    try {
      const payload = {
        Id: Number(transactionForm.Id) || 0,
        FaturaNo: transactionForm.FaturaNo,
        FactoryId: Number(transactionForm.FactoryId) || 0,
        Date: transactionForm.Date,
        Writer: transactionForm.Writer,
        CarBLK: transactionForm.CarBLK ?? '',
        CarOwner: transactionForm.CarOwner,
        Details: transactionForm.Details.map((detail) => ({
          Id: Number(detail.Id) || 0,
          OrderNo: String(detail.OrderNo ?? '').trim(),
          FabricGender: String(detail.FabricGender ?? '').trim(),
          FabricWeight: Number(detail.FabricWeight) || 0,
          FabricTopCount: Number(detail.FabricTopCount) || 0,
          FabricLot: String(detail.FabricLot ?? detail.fabricLot ?? detail.lot ?? '').trim(),
          FabricGr: Number(detail.FabricGr ?? detail.fabricGr ?? 0) || 0,
        })),
      }

      await apiRequest('/api/ham-boya-transactions/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setIsModalSaving(false)
      setIsModalOpen(false)
      loadTransactions()
      printSavedTransaction(payload)
      const message = transactionForm.Id ? 'تم تحديث الحركة بنجاح.' : 'تم حفظ الحركة الجديدة بنجاح.'
      showNotice('success', message)
    } catch (requestError) {
      const message = requestError.message || 'حدث خطأ عند حفظ الحركة.'
      setModalError(message)
      showNotice('error', message)
      setIsModalSaving(false)
    }
  }, [apiRequest, loadTransactions, printSavedTransaction, showNotice, transactionForm])

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const timer = setTimeout(loadTransactions, 300)
    return () => clearTimeout(timer)
  }, [isActive, loadTransactions])

  const handlePrintTransactions = useCallback(() => {
    const rows = transactions
      .map((transaction, index) => {
        const faturaNo = transaction.faturaNo ?? '-'
        const factoryName = transaction.factoryName ?? '-'
        const date = transaction.date ?? '-'
        const writer = transaction.writer ?? '-'
        const carBLK = transaction.carBLK ?? transaction.CarBLK ?? '-'
        const carOwner = transaction.carOwner ?? '-'
        const detailsCount = transaction.detailsCount ?? '-'
        const totalWeight = formatReportValue(transaction.totalWeight)
        const totalTopCount = formatReportValue(transaction.totalTopCount)

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
            <td>${totalWeight}</td>
            <td>${totalTopCount}</td>
          </tr>
        `
      })
      .join('')

    const reportHtml = `<!DOCTYPE html>
      <html lang="tr" dir="ltr">
        <head>
          <meta charset="UTF-8" />
          <meta name="robots" content="noindex,nofollow" />
          <title>Boyahanelere Gönderilen Ham Kumaş İşlemleri Raporu</title>
          <style>
            @page { margin: 8mm; }
            body {
              font-family: Arial, Tahoma, sans-serif;
              direction: ltr;
              color: #1f2d3d;
              margin: 0;
              padding: 18px;
            }
            .report-header {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
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
            th, td { border: 1px solid #d3e4ed; padding: 8px; text-align: left; }
            th { background: #edf6fb; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="report-date">${formatReportDate(new Date())}</div>
            <div class="report-user">${currentUserName || 'Kullanıcı'}</div>
            <div class="report-title">Boyahanelere Gönderilen Ham Kumaş İşlemleri Raporu</div>
          </div>
          <div class="summary">Sonuç Sayısı: ${formatReportValue(totalCount)} | Toplam Ağırlık: ${formatReportValue(totalWeight)}</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Fatura No</th>
                <th>Boyahane</th>
                <th>Tarih</th>
                <th>Hazırlayan</th>
                <th>Araç Plakası</th>
                <th>Araç Sahibi</th>
                <th>Detay Sayısı</th>
                <th>Toplam Ağırlık</th>
                <th>Top Sayısı</th>
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
  }, [currentUserName, showNotice, totalCount, totalWeight, transactions])

  return (
    <div className="space-y-6" dir="rtl" style={{ direction: 'rtl' }}>
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6" dir="rtl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-sky-900">إدارة خام مرسل للمصابغ</h3>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-800 active:bg-sky-900"
          >
            إضافة حركة جديدة
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="hamBoyaSearch" className="text-xs font-medium text-slate-600 text-right">البحث</label>
            <input
              id="hamBoyaSearch"
              type="text"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value)
                setPageNumber(1)
              }}
              placeholder="رقم الفاتورة، المصنع، أو السائق"
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-slate-50"
              dir="ltr"
              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="hamBoyaPageSize" className="text-xs font-medium text-slate-600 text-right">حجم الصفحة</label>
            <select
              id="hamBoyaPageSize"
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 text-right" dir="rtl">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" dir="rtl">
        <div className="overflow-x-auto" dir="rtl">
          <table className="w-full text-xs" dir="rtl" style={{ direction: 'rtl' }}>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-right"><span className="font-semibold text-slate-600">رقم الفاتورة</span></th>
                <th className="px-3 py-2 text-right"><span className="font-semibold text-slate-600">المصنع</span></th>
                <th className="px-3 py-2 text-right"><span className="font-semibold text-slate-600">التاريخ</span></th>
                <th className="px-3 py-2 text-right"><span className="font-semibold text-slate-600">الكاتب</span></th>
                <th className="px-3 py-2 text-right"><span className="font-semibold text-slate-600">لوحة السيارة</span></th>
                <th className="px-3 py-2 text-right"><span className="font-semibold text-slate-600">صاحب السيارة</span></th>
                <th className="px-3 py-2 text-center"><span className="font-semibold text-slate-600">التفاصيل</span></th>
                <th className="px-3 py-2 text-right"><span className="font-semibold text-slate-600">الوزن</span></th>
                <th className="px-3 py-2 text-right"><span className="font-semibold text-slate-600">الأثواب</span></th>
                <th className="px-3 py-2 text-center"><span className="font-semibold text-slate-600">الإجراءات</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200" dir="rtl">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-slate-500 text-right" dir="rtl">جاري تحميل الحركات...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-slate-500 text-right" dir="rtl">لا توجد بيانات مطابقة.</td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id ?? transaction.faturaNo} className="hover:bg-slate-50" dir="rtl">
                    <td className="px-3 py-2 text-right"><span className="text-xs text-slate-900 font-medium truncate">{transaction.faturaNo ?? '-'}</span></td>
                    <td className="px-3 py-2 text-right"><span className="text-xs text-slate-700 truncate">{transaction.factoryName ?? '-'}</span></td>
                    <td className="px-3 py-2 text-right"><span className="text-xs text-slate-700 whitespace-nowrap">{transaction.date ?? '-'}</span></td>
                    <td className="px-3 py-2 text-right"><span className="text-xs text-slate-700 truncate">{transaction.writer ?? '-'}</span></td>
                    <td className="px-3 py-2 text-right"><span className="text-xs text-slate-700 whitespace-nowrap">{transaction.carBLK ?? '-'}</span></td>
                    <td className="px-3 py-2 text-right"><span className="text-xs text-slate-700 truncate">{transaction.carOwner ?? '-'}</span></td>
                    <td className="px-3 py-2 text-center"><span className="text-xs text-slate-700">{transaction.detailsCount ?? '-'}</span></td>
                    <td className="px-3 py-2 text-right"><span className="text-xs text-slate-700">{transaction.totalWeight ?? '-'}</span></td>
                    <td className="px-3 py-2 text-right"><span className="text-xs text-slate-700">{transaction.totalTopCount ?? '-'}</span></td>
                    <td className="px-3 py-2 text-center" dir="rtl">
                      <div className="flex items-center justify-center gap-1" dir="rtl">
                        <button
                          type="button"
                          title="تعديل الحركة"
                          disabled={!transaction.id}
                          onClick={() => openEditModal(transaction.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          title="حذف الحركة"
                          disabled={!transaction.id}
                          onClick={() => deleteTransaction(transaction.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-600 text-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>

      <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6" dir="rtl">
        <div className="text-right text-sm text-slate-700" dir="rtl">
          <p className="text-right">عدد النتائج: <strong className="text-slate-900">{totalCount}</strong> | الوزن الكلي: <strong className="text-slate-900">{totalWeight}</strong></p>
        </div>
        <div className="flex items-center justify-start gap-2" dir="rtl">
          <button
            type="button"
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1 || isLoading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            السابق
          </button>
          <span className="text-sm text-slate-600">
            الصفحة {pageNumber} من {Math.max(Math.ceil(totalCount / pageSize), 1)}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, Math.max(Math.ceil(totalCount / pageSize), 1)))}
            disabled={pageNumber >= Math.max(Math.ceil(totalCount / pageSize), 1) || isLoading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            التالي
          </button>
          <button
            type="button"
            onClick={handlePrintTransactions}
            className={buildButtonClasses('secondary')}
          >
            طباعة
          </button>
        </div>
      </footer>

      <HamBoyaTransactionsModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSaving={isModalSaving}
        error={modalError}
        form={transactionForm}
        customerOrdersOptions={customerOrdersOptions}
        boyaFactoriesOptions={boyaFactoriesOptions}
        hamFabricsOptions={hamFabricsOptions}
        onFieldChange={updateTransactionField}
        onDetailFieldChange={updateDetailField}
        onAddDetailRow={addDetailRow}
        onRemoveDetailRow={removeDetailRow}
        onClose={closeModal}
        onSave={saveTransaction}
      />
    </div>
  )
}

export default HamBoyaTransactionsSection
