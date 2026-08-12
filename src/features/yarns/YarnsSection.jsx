import { useCallback, useEffect, useMemo, useState } from 'react'
import './YarnsSection.css'
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
        setError('تعذر الاتصال بالخادم. تأكد أن API متاحة على judimensucat.runasp.net وأن الخادم يسمح بطلبات CORS.')
      } else {
        setError(requestError.message || 'حدث خطأ عند جلب بيانات الخيط.')
      }
      setYarns([])
      setTotalCount(0)
      showNotice('error', requestError.message || 'حدث خطأ عند جلب بيانات الخيط.')
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
      showNotice('success', 'تم حفظ الخيط بنجاح.')
    } catch (requestError) {
      setModalError(requestError.message || 'حدث خطأ عند حفظ الخيط.')
      showNotice('error', requestError.message || 'حدث خطأ عند حفظ الخيط.')
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
        company: data.company || '',
        price: data.price ?? '',
        faturaNo: data.faturaNo || '',
        incomDate: data.incomDate || getTodayDate(),
      })
    } catch (requestError) {
      const message = requestError.message || 'حدث خطأ عند جلب بيانات الخيط.'
      setModalError(message)
      showNotice('error', message)
      setIsModalOpen(false)
    }
  }

  const handleDeleteYarn = async (id) => {
    if (!id) {
      return
    }

    const confirmed = window.confirm('هل أنت متأكد من حذف هذا الخيط؟')
    if (!confirmed) {
      return
    }

    try {
      await apiRequest(`${YARNS_URL}/${id}`, {
        method: 'DELETE',
      })

      loadYarns()
      showNotice('success', 'تم حذف الخيط بنجاح.')
    } catch (requestError) {
      const message = requestError.message || 'حدث خطأ عند حذف الخيط.'
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
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta name="robots" content="noindex,nofollow" />
          <title>تقرير مخزون الخيط</title>
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
            <div class="report-title">تقرير مخزون الخيط</div>
          </div>
          <div class="summary">عدد النتائج: ${totalCount} | صافي: ${totalNetKg} | قائم: ${totalBrutKg} | متبقي صافي: ${totalRemainNetKg} | متبقي قائم: ${totalRemainBrutKg}</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>النوع</th>
                <th>LOT</th>
                <th>العدد</th>
                <th>الصافي KG</th>
                <th>القائم KG</th>
                <th>العدد المتبقي</th>
                <th>صافي متبقي KG</th>
                <th>قائم متبقي KG</th>
                <th>الشركة</th>
                <th>السعر</th>
                <th>رقم الفاتورة</th>
                <th>تاريخ الاستلام</th>
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
  }, [currentUserName, showNotice, totalBrutKg, totalCount, totalNetKg, totalRemainBrutKg, totalRemainNetKg, yarns])

  return (
    <div className="yarns-section" dir="rtl">
      <header className="content-header">
        <div>
          <h3>ادارة مخزون الخيط</h3>
          <p>عرض المخزون الحالي مع البحث والتصفح.</p>
        </div>
        <button type="button" className="add-button" onClick={handleAddYarn}>
          + اضافة خيط جديد
        </button>
      </header>

      <section className="filters-panel" aria-label="بحث مخزون الخيط">
        <div className="field-group">
          <label htmlFor="yarnsSearch">بحث</label>
          <input
            id="yarnsSearch"
            type="text"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value)
              setPageNumber(1)
            }}
            placeholder="ابحث بالنوع أو LOT أو الشركة"
          />
        </div>

        <div className="field-group page-size-group">
          <label htmlFor="yarnsPageSize">حجم الصفحة</label>
          <select
            id="yarnsPageSize"
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
              <th>النوع</th>
              <th>LOT</th>
              <th>العدد</th>
              <th>الصافي KG</th>
              <th>القائم KG</th>
              <th style={{ backgroundColor: '#d4edda' }}>العدد المتبقي</th>
              <th style={{ backgroundColor: '#d4edda' }}>صافي متبقي KG</th>
              <th style={{ backgroundColor: '#d4edda' }}>قائم متبقي KG</th>
              <th>الشركة</th>
              <th>السعر</th>
              <th>رقم الفاتورة</th>
              <th>تاريخ الاستلام</th>
              <th>الاجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={14} className="table-state">
                  جاري تحميل بيانات الخيط...
                </td>
              </tr>
            ) : yarns.length === 0 ? (
              <tr>
                <td colSpan={14} className="table-state">
                  لا توجد بيانات مطابقة.
                </td>
              </tr>
            ) : (
              yarns.map((yarn, index) => (
                <tr key={yarn.id ?? index}>
                  <td>{yarn.yarnGender ?? '-'}</td>
                  <td>{yarn.lot ?? '-'}</td>
                  <td>{yarn.count ?? '-'}</td>
                  <td>{yarn.netKg ?? '-'}</td>
                  <td>{yarn.brutKg ?? '-'}</td>
                  <td style={{ backgroundColor: '#d4edda', fontWeight: 'bold' }}>{yarn.remainCount ?? '-'}</td>
                  <td style={{ backgroundColor: '#d4edda', fontWeight: 'bold' }}>{yarn.remainNetKg ?? '-'}</td>
                  <td style={{ backgroundColor: '#d4edda', fontWeight: 'bold' }}>{yarn.remainBrutKg ?? '-'}</td>
                  <td>{yarn.company ?? '-'}</td>
                  <td>{yarn.price ?? '-'}</td>
                  <td>{yarn.faturaNo ?? '-'}</td>
                  <td>{yarn.incomDate ?? '-'}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="action-btn edit" onClick={() => handleEditYarn(yarn.id)}>
                        تعديل
                      </button>
                      <button type="button" className="action-btn delete" onClick={() => handleDeleteYarn(yarn.id)}>
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
            <span>قائم: <strong>{totalBrutKg}</strong></span> ·
            <span>متبقي صافي: <strong>{totalRemainNetKg}</strong></span> ·
            <span>متبقي قائم: <strong>{totalRemainBrutKg}</strong></span>
          </p>
          <button type="button" className="print-btn" onClick={handlePrintYarns}>
            طباعة
          </button>
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className="pager-btn"
            disabled={pageNumber >= Math.max(Math.ceil(totalCount / pageSize), 1) || isLoading}
            onClick={() =>
              setPageNumber((prev) =>
                Math.min(prev + 1, Math.max(Math.ceil(totalCount / pageSize), 1)),
              )
            }
          >
            التالي
          </button>
          <span>
            الصفحة {pageNumber} من {Math.max(Math.ceil(totalCount / pageSize), 1)}
          </span>
          <button
            type="button"
            className="pager-btn"
            disabled={pageNumber <= 1 || isLoading}
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
          >
            السابق
          </button>
        </div>
      </footer>

      <YarnModal
        isOpen={isModalOpen}
        isSaving={isModalSaving}
        error={modalError}
        form={form}
        onFieldChange={onFormChange}
        onClose={closeModal}
        onSave={saveYarn}
      />
    </div>
  )
}

export default YarnsSection
