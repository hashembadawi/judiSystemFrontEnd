import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './OrdersSection.css'
import OrderModal from './OrderModal'

const CUSTOMER_ORDERS_URL = '/api/customer-orders'
const FILL_OPTIONS_URL = '/api/fill-options?requestedValues=1'
const UPSERT_ORDER_URL = '/api/customer-orders/upsert'

const ORDER_STATUS_OPTIONS = [
  { value: 1, label: 'مفتوحة' },
  { value: 2, label: 'جاري العمل' },
  { value: 3, label: 'ملغاة بالكامل' },
  { value: 4, label: 'ملغاة بشكل جزئي' },
  { value: 5, label: 'مكتملة' },
]

const ORDER_STATUS_LABELS = {
  1: 'مفتوحة',
  2: 'جاري العمل',
  3: 'ملغاة بالكامل',
  4: 'ملغاة بشكل جزئي',
  5: 'مكتملة',
}

const createEmptyOrderDetail = () => ({
  id: 0,
  fabricGender: '',
  fabricGSM: '',
  fabricWeightKg: '',
  description: '',
  status: 1,
})

const createEmptyOrderForm = () => ({
  id: 0,
  orderNo: '',
  customerName: '',
  orderDate: new Date().toISOString().slice(0, 10),
  status: 1,
  notes: '',
  details: [createEmptyOrderDetail()],
})

const getOrderValue = (order, keys) => {
  for (const key of keys) {
    const value = order?.[key]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  return '-'
}

const formatDisplayNumber = (value) => {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return value ?? '-'
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericValue)
}

const getOrderStatusLabel = (statusValue) => {
  if (statusValue === null || statusValue === undefined || statusValue === '') {
    return '-'
  }

  const numericStatus = Number(statusValue)
  return ORDER_STATUS_LABELS[numericStatus] || String(statusValue)
}

const calculateOrderProgressPercent = (order) => {
  const explicitProgress = Number(order?.progressPercent)
  if (Number.isFinite(explicitProgress)) {
    return Math.min(100, Math.max(0, explicitProgress))
  }

  const totalWeight = Number(order?.totalWeight)
  const producedWeight = Number(order?.producedWeight)

  if (!Number.isFinite(totalWeight) || !Number.isFinite(producedWeight) || totalWeight <= 0) {
    return 0
  }

  const percent = (producedWeight / totalWeight) * 100
  return Math.min(100, Math.max(0, percent))
}

const extractFabricOptions = (fillOptionsData) => {
  if (!fillOptionsData) {
    return []
  }

  const optionArrays = []

  if (Array.isArray(fillOptionsData)) {
    optionArrays.push(fillOptionsData)
  }

  Object.values(fillOptionsData).forEach((value) => {
    if (Array.isArray(value)) {
      optionArrays.push(value)
    }
  })

  const normalized = optionArrays.flatMap((arrayItem) =>
    arrayItem
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim()
        }

        if (item && typeof item === 'object') {
          return (
            item.label ||
            item.name ||
            item.text ||
            item.valueName ||
            item.value ||
            item.title ||
            ''
          )
        }

        return ''
      })
      .filter(Boolean),
  )

  return [...new Set(normalized)]
}

function OrdersSection({ apiRequest, showNotice, isActive, currentUserName = '' }) {
  const [searchText, setSearchText] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [orders, setOrders] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isModalSaving, setIsModalSaving] = useState(false)
  const [isFabricOptionsLoading, setIsFabricOptionsLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [form, setForm] = useState(createEmptyOrderForm())
  const [fabricOptions, setFabricOptions] = useState([])
  const [expandedData, setExpandedData] = useState({})

  const totalPages = useMemo(() => {
    const rawPages = Math.ceil(totalCount / pageSize)
    return rawPages > 0 ? rawPages : 1
  }, [pageSize, totalCount])

  const fetchOrders = useCallback(async () => {
    setError('')
    setIsLoading(true)

    try {
      const query = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        status: orderStatus,
        searchText: searchText.trim(),
      })

      const response = await apiRequest(`${CUSTOMER_ORDERS_URL}?${query.toString()}`)
      const data = response.data || {}

      setOrders(Array.isArray(data.items) ? data.items : [])
      setTotalCount(data.totalRecords ?? data.totalCount ?? 0)
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError('تعذر الاتصال بالخادم. تأكد أن API متاحة على judimensucat.runasp.net وأن الخادم يسمح بطلبات CORS.')
      } else {
        setError(requestError.message || 'تعذر جلب الطلبيات.')
      }
      setOrders([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, orderStatus, pageNumber, pageSize, searchText])

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'judi mensucat'

    if (!isActive) {
      return () => {
        document.title = previousTitle
      }
    }

    const timer = setTimeout(() => {
      fetchOrders()
    }, 350)

    return () => {
      clearTimeout(timer)
      document.title = previousTitle
    }
  }, [fetchOrders, isActive])

  const resetModalState = () => {
    setIsModalOpen(false)
    setIsModalLoading(false)
    setModalError('')
    setIsFabricOptionsLoading(false)
    setFabricOptions([])
    setForm(createEmptyOrderForm())
  }

  const openCreateModal = async () => {
    setModalError('')
    setForm(createEmptyOrderForm())
    setFabricOptions([])
    setIsModalOpen(true)
    setIsModalLoading(false)
    setIsFabricOptionsLoading(true)

    try {
      const response = await apiRequest(FILL_OPTIONS_URL)
      setFabricOptions(extractFabricOptions(response.data))
    } catch (requestError) {
      setModalError(requestError.message || 'تعذر جلب أنواع الأقمشة.')
      showNotice('error', requestError.message || 'تعذر جلب أنواع الأقمشة.')
    } finally {
      setIsFabricOptionsLoading(false)
    }
  }

  const openEditModal = async (id) => {
    if (!id) {
      return
    }

    setModalError('')
    setFabricOptions([])
    setIsModalOpen(true)
    setIsModalLoading(true)
    setIsFabricOptionsLoading(true)

    try {
      const [fillOptionsResponse, orderResponse] = await Promise.all([
        apiRequest(FILL_OPTIONS_URL),
        apiRequest(`${CUSTOMER_ORDERS_URL}/${id}`),
      ])

      setFabricOptions(extractFabricOptions(fillOptionsResponse.data))

      const orderData = orderResponse.data || {}
      const normalizedDetails = Array.isArray(orderData.details) && orderData.details.length
        ? orderData.details.map((detail) => ({
            id: detail.id || 0,
            fabricGender: detail.fabricGender || '',
            fabricGSM: detail.fabricGSM ?? '',
            fabricWeightKg: detail.fabricWeightKg ?? '',
            description: detail.description || '',
            status: detail.status || 1,
          }))
        : [createEmptyOrderDetail()]

      setForm({
        id: orderData.id || 0,
        orderNo: orderData.orderNo || '',
        customerName: orderData.customerName || '',
        orderDate: orderData.orderDate || new Date().toISOString().slice(0, 10),
        status: orderData.status || 1,
        notes: orderData.notes || '',
        details: normalizedDetails,
      })
    } catch (requestError) {
      setModalError(requestError.message || 'تعذر جلب بيانات الطلبية للتعديل.')
      showNotice('error', requestError.message || 'تعذر جلب بيانات الطلبية للتعديل.')
    } finally {
      setIsModalLoading(false)
      setIsFabricOptionsLoading(false)
    }
  }

  const closeModal = () => {
    if (isModalSaving) {
      return
    }

    resetModalState()
  }

  const onFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const onDetailChange = (detailIndex, field, value) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.map((detail, index) => {
        if (index !== detailIndex) {
          return detail
        }

        return {
          ...detail,
          [field]: value,
        }
      }),
    }))
  }

  const addDetail = () => {
    setForm((prev) => ({
      ...prev,
      details: [...prev.details, createEmptyOrderDetail()],
    }))
  }

  const removeDetail = (detailIndex) => {
    setForm((prev) => {
      if (prev.details.length <= 1) {
        return prev
      }

      return {
        ...prev,
        details: prev.details.filter((_, index) => index !== detailIndex),
      }
    })
  }

  const saveOrder = async () => {
    setModalError('')

    if (!form.orderNo.trim() || !form.customerName.trim() || !form.orderDate) {
      setModalError('رقم الطلبية واسم الزبون وتاريخ الطلبية حقول مطلوبة.')
      return
    }

    if (!form.details.length) {
      setModalError('يجب إضافة نوع قماش واحد على الأقل.')
      return
    }

    const hasInvalidDetail = form.details.some(
      (detail) => !detail.fabricGender.trim() || !detail.fabricWeightKg,
    )

    if (hasInvalidDetail) {
      setModalError('لكل سطر قماش يجب إدخال النوع والوزن.')
      return
    }

    setIsModalSaving(true)
    const isEditMode = Boolean(form.id)

    try {
      const payload = {
        id: form.id,
        orderNo: form.orderNo.trim(),
        customerName: form.customerName.trim(),
        orderDate: form.orderDate,
        status: Number(form.status),
        notes: form.notes,
        details: form.details.map((detail) => ({
          id: detail.id || 0,
          fabricGender: detail.fabricGender.trim(),
          fabricGSM: Number(detail.fabricGSM) || 0,
          fabricWeightKg: Number(detail.fabricWeightKg),
          description: detail.description,
          status: Number(detail.status) || 1,
        })),
      }

      await apiRequest(UPSERT_ORDER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setIsModalSaving(false)
      resetModalState()
      fetchOrders()
      showNotice('success', isEditMode ? 'تم تعديل الطلبية بنجاح.' : 'تم حفظ الطلبية بنجاح.')
    } catch (requestError) {
      setModalError(requestError.message || 'تعذر حفظ الطلبية.')
      showNotice('error', requestError.message || 'تعذر حفظ الطلبية.')
      setIsModalSaving(false)
    }
  }

  const deleteOrder = async (id) => {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه الطلبية؟')
    if (!confirmed) {
      return
    }

    try {
      await apiRequest(`${CUSTOMER_ORDERS_URL}/${id}`, {
        method: 'DELETE',
      })

      fetchOrders()
      showNotice('success', 'تم حذف الطلبية بنجاح.')
    } catch (requestError) {
      setError(requestError.message || 'تعذر حذف الطلبية.')
      showNotice('error', requestError.message || 'تعذر حذف الطلبية.')
    }
  }

  const handlePrintOrders = useCallback(() => {
    const totalWeight = orders.reduce((sum, order) => sum + (Number(order.totalWeight) || 0), 0)
    const reportHtml = `<!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta name="robots" content="noindex,nofollow" />
          <title>judi mensucat</title>
          <style>
            @page { margin: 8mm; }
            html, body { height: auto; }
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
            .report-company { font-size: 1.05rem; color: #1f5f81; }
            .report-body { display: grid; gap: 12px; }
            .summary { font-size: 13px; color: #2e5166; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d3e4ed; padding: 8px; text-align: right; }
            th { background: #edf6fb; }
            @media print {
              body { padding: 0; }
              .report-header { margin-bottom: 12px; }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="report-date">${new Date().toISOString().split('T')[0]}</div>
            <div class="report-user">${currentUserName || 'المستخدم'}</div>
            <div class="report-company">judi mensucat</div>
          </div>
          <div class="report-body">
            <div class="summary">عدد النتائج: ${totalCount} | الوزن الكلي: ${totalWeight}</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>رقم الطلبية</th>
                  <th>اسم الزبون</th>
                  <th>التاريخ</th>
                  <th>حالة الطلبية</th>
                  <th>عدد التفاصيل</th>
                  <th>الوزن الكلي</th>
                  <th>الوزن المنتج</th>
                  <th>الوزن المتبقي</th>
                  <th>التقدم</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>${orders
                .map((order, index) => {
                  const orderNo = getOrderValue(order, ['orderNo', 'orderNumber', 'code'])
                  const customerName = getOrderValue(order, ['customerName', 'clientName'])
                  const orderDate = getOrderValue(order, ['orderDate', 'createdAt'])
                  const status = getOrderStatusLabel(order.status)
                  const detailsCount = getOrderValue(order, ['detailsCount'])
                  const totalWeight = getOrderValue(order, ['totalWeight'])
                  const producedWeight = getOrderValue(order, ['producedWeight', 'produced'])
                  const remainingWeight = getOrderValue(order, ['remainingWeight', 'remaining'])
                  const progressPercent = calculateOrderProgressPercent(order)
                  const notes = getOrderValue(order, ['notes'])

                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${orderNo}</td>
                      <td>${customerName}</td>
                      <td>${orderDate}</td>
                      <td>${status}</td>
                      <td>${detailsCount}</td>
                      <td>${formatDisplayNumber(totalWeight)}</td>
                      <td>${formatDisplayNumber(producedWeight)}</td>
                      <td>${formatDisplayNumber(remainingWeight)}</td>
                      <td>${progressPercent.toFixed(2)}%</td>
                      <td>${notes}</td>
                    </tr>
                  `
                })
                .join('')}</tbody>
            </table>
          </div>
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
      printWindow.focus()
      printWindow.print()
      URL.revokeObjectURL(reportUrl)
      printWindow.close()
    }, 250)
  }, [currentUserName, orders, showNotice, totalCount])

  return (
    <>
      <header className="content-header">
        <div>
          <h3>ادارة الطلبيات</h3>
          <p>جلب وعرض الطلبيات مع خيارات البحث.</p>
        </div>
        <button type="button" className="add-button" onClick={openCreateModal}>
          + اضافة طلبية
        </button>
      </header>

      <div className="print-report-header">
        <div className="print-report-title">judi mensucat</div>
        <div className="print-report-user">{currentUserName || 'المستخدم'}</div>
      </div>

      <section className="filters-panel" aria-label="فلترة الطلبيات">
        <div className="field-group">
          <label htmlFor="ordersSearch">بحث نصي</label>
          <input
            id="ordersSearch"
            type="text"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value)
              setPageNumber(1)
            }}
            placeholder="رقم الطلبية، اسم الزبون، او أي نص"
          />
        </div>

        <div className="field-group">
          <label htmlFor="orderStatus">حالة الطلبية</label>
          <select
            id="orderStatus"
            value={orderStatus}
            onChange={(event) => {
              setOrderStatus(event.target.value)
              setPageNumber(1)
            }}
          >
            <option value="">الكل</option>
            {ORDER_STATUS_OPTIONS.map((statusOption) => (
              <option key={statusOption.value} value={statusOption.value}>
                {statusOption.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group page-size-group">
          <label htmlFor="ordersPageSize">حجم الصفحة</label>
          <select
            id="ordersPageSize"
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

      <div className="table-wrap orders-table-wrap" style={{ direction: 'rtl' }}>
        <table style={{ direction: 'rtl' }}>
          <thead>
            <tr>
              <th>رقم الطلبية</th>
              <th>اسم الزبون</th>
              <th>التاريخ</th>
              <th>حالة الطلبية</th>
              <th>عدد التفاصيل</th>
              <th>الوزن الكلي</th>
              <th>الوزن المنتج</th>
              <th>الوزن المتبقي</th>
              <th>التقدم</th>
              <th>ملاحظات</th>
              <th>الاجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} className="table-state">جاري تحميل الطلبيات...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={11} className="table-state">لا توجد طلبيات مطابقة.</td>
              </tr>
            ) : (
              orders.map((order, index) => {
                const progressPercent = calculateOrderProgressPercent(order)
                const producedWeight = getOrderValue(order, ['producedWeight', 'produced'])
                const remainingWeight = getOrderValue(order, ['remainingWeight', 'remaining'])
                const orderKey = order.id || order.orderId || order.orderNumber || index

                const toggleExpand = async (orderObj, key) => {
                  // collapse if already loaded and not currently loading
                  if (expandedData[key] && !expandedData[key].isLoading) {
                    setExpandedData((prev) => {
                      const next = { ...prev }
                      delete next[key]
                      return next
                    })
                    return
                  }

                  // start loading
                  setExpandedData((prev) => ({
                    ...prev,
                    [key]: { ...(prev[key] || {}), isLoading: true, error: '' },
                  }))

                  try {
                    const idForRequest = orderObj?.id || orderObj?.orderId || key

                    const response = await apiRequest(`${CUSTOMER_ORDERS_URL}/expand/${idForRequest}`)
                    const data = response.data || {}
                    const fabrics = Array.isArray(data.fabrics) ? data.fabrics : []

                    setExpandedData((prev) => ({
                      ...prev,
                      [key]: { isLoading: false, fabrics, error: '' },
                    }))
                  } catch (err) {
                    setExpandedData((prev) => ({
                      ...prev,
                      [key]: { isLoading: false, fabrics: [], error: err?.message || 'تعذر جلب تفاصيل الطلبية.' },
                    }))
                    showNotice('error', err?.message || 'تعذر جلب تفاصيل الطلبية.')
                  }
                }

                return (
                  <React.Fragment key={orderKey}>
                    <tr
                      className={`expandable-row ${expandedData[orderKey] ? 'expanded-parent' : ''}`}
                      onClick={() => toggleExpand(order, orderKey)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{getOrderValue(order, ['orderNo', 'orderNumber', 'code'])}</td>
                      <td>{getOrderValue(order, ['customerName', 'clientName'])}</td>
                      <td>{getOrderValue(order, ['orderDate', 'createdAt'])}</td>
                      <td>{getOrderStatusLabel(order.status)}</td>
                      <td>{getOrderValue(order, ['detailsCount'])}</td>
                      <td>{formatDisplayNumber(getOrderValue(order, ['totalWeight']))}</td>
                      <td>{formatDisplayNumber(producedWeight)}</td>
                      <td>{formatDisplayNumber(remainingWeight)}</td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-track" aria-label={`نسبة التقدم ${progressPercent.toFixed(1)}%`}>
                            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                          </div>
                          <span className="progress-text">{progressPercent.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>{getOrderValue(order, ['notes'])}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="action-btn edit"
                            disabled={!order.id}
                            onClick={(e) => { e.stopPropagation(); openEditModal(order.id) }}
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            className="action-btn delete"
                            disabled={!order.id}
                            onClick={(e) => { e.stopPropagation(); deleteOrder(order.id) }}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedData[orderKey] && expandedData[orderKey].isLoading ? (
                      <tr className="expanded-row">
                        <td colSpan={11} className="table-state">جاري تحميل تفاصيل الطلبية...</td>
                      </tr>
                    ) : expandedData[orderKey] && expandedData[orderKey].fabrics && expandedData[orderKey].fabrics.length ? (
                      <tr className="expanded-row">
                        <td colSpan={11}>
                          <div className="nested-table-wrapper">
                            <table className="nested-table">
                              <thead>
                                  <tr>
                                    <th>النوع</th>
                                    <th>GSM</th>
                                    <th>الوزن المطلوب</th>
                                    <th>الوزن المنتج</th>
                                    <th>الوزن المتبقي</th>
                                    <th>التقدم %</th>
                                  </tr>
                              </thead>
                              <tbody>
                                {expandedData[orderKey].fabrics.map((fab, i) => (
                                  <tr key={i}>
                                    <td>{fab.fabricGender || '-'}</td>
                                    <td>{fab.fabricGSM ?? '-'}</td>
                                    <td>{formatDisplayNumber(fab.requiredWeight)}</td>
                                    <td>{formatDisplayNumber(fab.producedWeight)}</td>
                                    <td>{formatDisplayNumber(fab.remainingWeight)}</td>
                                    <td>{(Number(fab.progressPercent) || 0).toFixed(2)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="table-footer">
        <div className="table-footer-summary">
          <p>
            عدد النتائج: <strong>{totalCount}</strong>
          </p>
          <p>
            الوزن الكلي: <strong>{orders.reduce((sum, order) => sum + (Number(order.totalWeight) || 0), 0)}</strong>
          </p>
          <button type="button" className="print-btn" onClick={handlePrintOrders}>
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
            الصفحة {pageNumber} من {totalPages}
          </span>
          <button
            type="button"
            className="pager-btn"
            disabled={pageNumber >= totalPages || isLoading}
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, totalPages))}
          >
            التالي
          </button>
        </div>
      </footer>

      <OrderModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSaving={isModalSaving}
        isFabricOptionsLoading={isFabricOptionsLoading}
        error={modalError}
        form={form}
        fabricOptions={fabricOptions}
        onFieldChange={onFieldChange}
        onDetailChange={onDetailChange}
        onAddDetail={addDetail}
        onRemoveDetail={removeDetail}
        onClose={closeModal}
        onSave={saveOrder}
      />
    </>
  )
}

export default OrdersSection
