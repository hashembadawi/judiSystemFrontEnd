import { useCallback, useEffect, useMemo, useState } from 'react'
import HamBoyaTransactionsModal from './HamBoyaTransactionsModal'

const HAM_BOYA_TRANSACTIONS_URL = '/api/ham-boya-transactions'

const getTodayDate = () => new Date().toISOString().slice(0, 10)

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
                FabricLot: detail.FabricLot ?? detail.fabricLot ?? detail.lot ?? '',
              }))
            : [
                {
                  Id: 0,
                  OrderNo: '',
                  FabricGender: '',
                  FabricWeight: '',
                  FabricTopCount: '',
                  FabricLot: '',
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
      const message = transactionForm.Id ? 'تم تحديث الحركة بنجاح.' : 'تم حفظ الحركة الجديدة بنجاح.'
      showNotice('success', message)
    } catch (requestError) {
      const message = requestError.message || 'حدث خطأ عند حفظ الحركة.'
      setModalError(message)
      showNotice('error', message)
      setIsModalSaving(false)
    }
  }, [apiRequest, loadTransactions, showNotice, transactionForm])

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
        const totalWeight = transaction.totalWeight ?? '-'
        const totalTopCount = transaction.totalTopCount ?? '-'

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
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta name="robots" content="noindex,nofollow" />
          <title>تقرير حركات خام المرسل للمصابغ</title>
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
            <div class="report-title">تقرير حركات خام المرسل للمصابغ</div>
          </div>
          <div class="summary">عدد النتائج: ${totalCount} | الوزن الكلي: ${totalWeight}</div>
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
                <th>الوزن الكلي</th>
                <th>عدد الأثواب</th>
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
    <>
      <header className="content-header">
        <div>
          <h3>ادارة خام مرسل للمصابغ</h3>
          <p>عرض حركات الخام المرسلة للمصابغ مع التحكم في الصفحات.</p>
        </div>
        <button type="button" className="add-button" onClick={openCreateModal}>
          + إضافة حركة جديدة
        </button>
      </header>

      <section className="filters-panel" aria-label="بحث حركة خام المرسل للمصابغ">
        <div className="field-group">
          <label htmlFor="hamBoyaSearch">بحث</label>
          <input
            id="hamBoyaSearch"
            type="text"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value)
              setPageNumber(1)
            }}
            placeholder="ابحث برقم الفاتورة أو المصنع أو السائق"
            dir="ltr"
            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
          />
        </div>

        <div className="field-group page-size-group">
          <label htmlFor="hamBoyaPageSize">حجم الصفحة</label>
          <select
            id="hamBoyaPageSize"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              setPageNumber(1)
            }}
            dir="ltr"
            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
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
              <th>الوزن الكلي</th>
              <th>عدد الأثواب</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="table-state">
                  جاري تحميل الحركات...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="table-state">
                  لا توجد بيانات مطابقة.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id ?? transaction.faturaNo}>
                  <td>{transaction.faturaNo ?? '-'}</td>
                  <td>{transaction.factoryName ?? '-'}</td>
                  <td style={{ textAlign: 'left' }}>{transaction.date ?? '-'}</td>
                  <td>{transaction.writer ?? '-'}</td>
                  <td style={{ textAlign: 'left' }}>{transaction.carBLK ?? '-'}</td>
                  <td>{transaction.carOwner ?? '-'}</td>
                  <td>{transaction.detailsCount ?? '-'}</td>
                  <td>{transaction.totalWeight ?? '-'}</td>
                  <td>{transaction.totalTopCount ?? '-'}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="action-btn edit"
                        onClick={() => openEditModal(transaction.id)}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="action-btn delete"
                        onClick={() => deleteTransaction(transaction.id)}
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
          <p>
            عدد النتائج: <strong>{totalCount}</strong> | الوزن الكلي: <strong>{totalWeight}</strong>
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
            الصفحة {pageNumber} من {Math.max(Math.ceil(totalCount / pageSize), 1)}
          </span>
          <button
            type="button"
            className="pager-btn"
            disabled={pageNumber >= Math.max(Math.ceil(totalCount / pageSize), 1) || isLoading}
            onClick={() =>
              setPageNumber((prev) => Math.min(prev + 1, Math.max(Math.ceil(totalCount / pageSize), 1)))
            }
          >
            التالي
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
    </>
  )
}

export default HamBoyaTransactionsSection
