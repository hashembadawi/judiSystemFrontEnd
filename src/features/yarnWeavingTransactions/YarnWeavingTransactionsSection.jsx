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
    <>
      <header className="content-header">
        <div>
          <h3>ادارة حركات الحياكة</h3>
          <p>عرض جميع حركات الحياكة مع البحث والتصفح.</p>
        </div>
        <button type="button" className="add-button" onClick={handleAddTransaction}>
          + اضافة حركة جديدة
        </button>
      </header>

      <section className="filters-panel weaving-filters" aria-label="بحث حركات الحياكة">
        <div className="field-group">
          <label htmlFor="weavingSearch">بحث</label>
          <input
            id="weavingSearch"
            type="text"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value)
              setPageNumber(1)
            }}
            placeholder="ابحث بالفاتورة أو اسم المعمل"
          />
        </div>

        <div className="field-group">
          <label htmlFor="weavingPageSize">حجم الصفحة</label>
          <select
            id="weavingPageSize"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              setPageNumber(1)
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </section>

      {error ? <p className="error-box inline-error">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>المصنع</th>
              <th>التاريخ</th>
              <th>الكاتب</th>
              <th>لوحة السيارة</th>
              <th>صاحب السيارة</th>
              <th>عدد التفاصيل</th>
              <th>الصافي KG</th>
              <th>القائم KG</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="table-state">
                  جاري تحميل بيانات الحركات...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="table-state">
                  لا توجد بيانات مطابقة.
                </td>
              </tr>
            ) : (
              transactions.map((transaction, index) => (
                <tr key={transaction.id ?? `${transaction.faturaNo ?? 'row'}-${index}`}>
                  <td>{transaction.faturaNo ?? '-'}</td>
                  <td>{transaction.factoryName ?? '-'}</td>
                  <td>{transaction.date ?? '-'}</td>
                  <td>{transaction.writer ?? '-'}</td>
                  <td>{transaction.carBLK ?? '-'}</td>
                  <td>{transaction.carOwner ?? '-'}</td>
                  <td>{transaction.detailsCount ?? '-'}</td>
                  <td>{transaction.totalNetKg ?? '-'}</td>
                  <td>{transaction.totalBrutKg ?? '-'}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="action-btn edit"
                        onClick={() => handleEditTransaction(transaction.id)}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="action-btn delete"
                        onClick={() => handleDeleteTransaction(transaction.id)}
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

      <footer className="table-footer">
        <div className="table-footer-summary">
          <p style={{ fontSize: '0.84rem', lineHeight: 1.6 }}>
            <span>عدد النتائج: <strong>{totalCount}</strong></span> ·
            <span>صافي: <strong>{totalNetKg}</strong></span> ·
            <span>قائم: <strong>{totalBrutKg}</strong></span>
          </p>
          <button type="button" className="print-btn" onClick={handlePrintTransactions}>
            طباعة
          </button>
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className="pager-btn"
            disabled={pageNumber <= 1 || isLoading}
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
          >
            السابق
          </button>
          <span>
            الصفحة {pageNumber} من {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            className="pager-btn"
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
    </>
  )
}

export default YarnWeavingTransactionsSection
