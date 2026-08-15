import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { buildButtonClasses, buildInputClasses, SECTION_STYLES } from '../../styles/designSystem'
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
      <div className="space-y-6" style={{ direction: 'rtl' }}>
        <header className={`${SECTION_STYLES.container} overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">ادارة الطلبيات</h3>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 active:bg-slate-950"
            >
              إضافة طلبية
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="ordersSearch" className="text-xs font-medium text-slate-600">البحث</label>
              <input
                id="ordersSearch"
                type="text"
                value={searchText}
                onChange={(event) => {
                  setSearchText(event.target.value)
                  setPageNumber(1)
                }}
                placeholder="رقم الطلبية، اسم الزبون، أو أي نص"
                className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-slate-50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="orderStatus" className="text-xs font-medium text-slate-600">حالة الطلبية</label>
              <select
                id="orderStatus"
                value={orderStatus}
                onChange={(event) => {
                  setOrderStatus(event.target.value)
                  setPageNumber(1)
                }}
                className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
              >
                <option value="">الكل</option>
                {ORDER_STATUS_OPTIONS.map((statusOption) => (
                  <option key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="ordersPageSize" className="text-xs font-medium text-slate-600">حجم الصفحة</label>
              <select
                id="ordersPageSize"
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

        <div className="hidden print:flex flex-col items-end gap-1 text-sm font-medium text-slate-700">
          <div>judi mensucat</div>
          <div>{currentUserName || 'المستخدم'}</div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">إجمالي الطلبيات</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{totalCount}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="rounded-md bg-slate-200 px-2.5 py-1 font-medium text-slate-700">صفحة {pageNumber} من {totalPages}</span>
              <span className="rounded-md bg-slate-200 px-2.5 py-1 font-medium text-slate-700">{pageSize} لكل صفحة</span>
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">رقم الطلبية</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">اسم الزبون</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">التاريخ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">حالة الطلبية</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">عدد التفاصيل</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">الوزن الكلي</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">الوزن المنتج</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">الوزن المتبقي</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">التقدم</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">ملاحظات</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-slate-500">جاري تحميل الطلبيات...</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-slate-500">لا توجد طلبيات مطابقة.</td>
                  </tr>
                ) : (
                  orders.map((order, index) => {
                    const progressPercent = calculateOrderProgressPercent(order)
                    const producedWeight = getOrderValue(order, ['producedWeight', 'produced'])
                    const remainingWeight = getOrderValue(order, ['remainingWeight', 'remaining'])
                    const orderKey = order.id || order.orderId || order.orderNumber || index

                    const toggleExpand = async (orderObj, key) => {
                      if (expandedData[key] && !expandedData[key].isLoading) {
                        setExpandedData((prev) => {
                          const next = { ...prev }
                          delete next[key]
                          return next
                        })
                        return
                      }

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
                          className={`cursor-pointer transition hover:bg-slate-50 ${expandedData[orderKey] ? 'bg-slate-50' : ''}`}
                          onClick={() => toggleExpand(order, orderKey)}
                        >
                          <td className="px-4 py-4 text-right font-medium text-slate-900">{getOrderValue(order, ['orderNo', 'orderNumber', 'code'])}</td>
                          <td className="px-4 py-4 text-right text-slate-700">{getOrderValue(order, ['customerName', 'clientName'])}</td>
                          <td className="px-4 py-4 text-right text-slate-700">{getOrderValue(order, ['orderDate', 'createdAt'])}</td>
                          <td className="px-4 py-4 text-right">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {getOrderStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-slate-700">{getOrderValue(order, ['detailsCount'])}</td>
                          <td className="px-4 py-4 text-right text-slate-700">{formatDisplayNumber(getOrderValue(order, ['totalWeight']))}</td>
                          <td className="px-4 py-4 text-right text-slate-700">{formatDisplayNumber(producedWeight)}</td>
                          <td className="px-4 py-4 text-right text-slate-700">{formatDisplayNumber(remainingWeight)}</td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-200" aria-label={`نسبة التقدم ${progressPercent.toFixed(1)}%`}>
                                <div className="h-full rounded-full bg-slate-900" style={{ width: `${progressPercent}%` }} />
                              </div>
                              <span className="text-xs font-medium text-slate-700">{progressPercent.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right text-slate-700">{getOrderValue(order, ['notes'])}</td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                title="تعديل الطلبية"
                                disabled={!order.id}
                                onClick={(e) => { e.stopPropagation(); openEditModal(order.id) }}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                title="حذف الطلبية"
                                disabled={!order.id}
                                onClick={(e) => { e.stopPropagation(); deleteOrder(order.id) }}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>

                        {expandedData[orderKey] && expandedData[orderKey].isLoading ? (
                          <tr>
                            <td colSpan={11} className="px-4 py-6 text-center text-slate-500">جاري تحميل تفاصيل الطلبية...</td>
                          </tr>
                        ) : expandedData[orderKey] && expandedData[orderKey].fabrics && expandedData[orderKey].fabrics.length ? (
                          <tr className="bg-slate-50">
                            <td colSpan={11} className="px-4 py-4">
                              <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-200">
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">النوع</th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">GSM</th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">الوزن المطلوب</th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">الوزن المنتج</th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">الوزن المتبقي</th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">التقدم %</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {expandedData[orderKey].fabrics.map((fab, i) => (
                                      <tr key={i} className="border-b border-slate-100 last:border-b-0">
                                        <td className="px-3 py-2 text-right text-slate-700" dir="ltr">{fab.fabricGender || '-'}</td>
                                        <td className="px-3 py-2 text-right text-slate-700">{fab.fabricGSM ?? '-'}</td>
                                        <td className="px-3 py-2 text-right text-slate-700">{formatDisplayNumber(fab.requiredWeight)}</td>
                                        <td className="px-3 py-2 text-right text-slate-700">{formatDisplayNumber(fab.producedWeight)}</td>
                                        <td className="px-3 py-2 text-right text-slate-700">{formatDisplayNumber(fab.remainingWeight)}</td>
                                        <td className="px-3 py-2 text-right text-slate-700">{(Number(fab.progressPercent) || 0).toFixed(2)}%</td>
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

          <div className="md:hidden">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-slate-500">جاري تحميل الطلبيات...</div>
            ) : orders.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-500">لا توجد طلبيات مطابقة.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {orders.map((order, index) => {
                  const progressPercent = calculateOrderProgressPercent(order)
                  const orderKey = order.id || order.orderId || order.orderNumber || index

                  return (
                    <div key={orderKey} className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-500">رقم الطلبية</div>
                          <div className="mt-1 text-base font-semibold text-slate-900">{getOrderValue(order, ['orderNo', 'orderNumber', 'code'])}</div>
                        </div>
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex justify-between gap-4">
                          <span>الزبون</span>
                          <span className="font-medium text-slate-900">{getOrderValue(order, ['customerName', 'clientName'])}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>التاريخ</span>
                          <span className="font-medium text-slate-900">{getOrderValue(order, ['orderDate', 'createdAt'])}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>الوزن الكلي</span>
                          <span className="font-medium text-slate-900">{formatDisplayNumber(getOrderValue(order, ['totalWeight']))}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>التقدم</span>
                          <span className="font-medium text-slate-900">{progressPercent.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpand(order, orderKey)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          {expandedData[orderKey] ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            title="تعديل الطلبية"
                            onClick={() => openEditModal(order.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            title="حذف الطلبية"
                            onClick={() => deleteOrder(order.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-600"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {expandedData[orderKey] && expandedData[orderKey].fabrics && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          {expandedData[orderKey].isLoading ? (
                            <div className="text-xs text-slate-500">جاري تحميل تفاصيل الطلبية...</div>
                          ) : expandedData[orderKey].fabrics.length ? (
                            <div className="space-y-2 text-xs">
                              {expandedData[orderKey].fabrics.map((fab, i) => (
                                <div key={i} className="rounded-lg border border-slate-200 bg-white p-2">
                                  <div className="flex justify-between gap-2">
                                    <span className="text-slate-500">النوع</span>
                                    <span className="font-medium text-slate-900">{fab.fabricGender || '-'}</span>
                                  </div>
                                  <div className="mt-1 flex justify-between gap-2">
                                    <span className="text-slate-500">GSM</span>
                                    <span className="font-medium text-slate-900">{fab.fabricGSM ?? '-'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">لا توجد تفاصيل.</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-4">
            <p>عدد النتائج: <strong className="text-slate-900">{totalCount}</strong></p>
            <p>الوزن الكلي: <strong className="text-slate-900">{orders.reduce((sum, order) => sum + (Number(order.totalWeight) || 0), 0)}</strong></p>
            <button type="button" className={buildButtonClasses('secondary')} onClick={handlePrintOrders}>طباعة</button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`${buildButtonClasses('secondary')} disabled:cursor-not-allowed disabled:opacity-50`}
              disabled={pageNumber <= 1 || isLoading}
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
            >
              السابق
            </button>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">الصفحة {pageNumber} من {totalPages}</span>
            <button
              type="button"
              className={`${buildButtonClasses('secondary')} disabled:cursor-not-allowed disabled:opacity-50`}
              disabled={pageNumber >= totalPages || isLoading}
              onClick={() => setPageNumber((prev) => Math.min(prev + 1, totalPages))}
            >
              التالي
            </button>
          </div>
        </footer>
      </div>

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
