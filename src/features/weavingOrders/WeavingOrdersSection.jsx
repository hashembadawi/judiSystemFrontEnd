import { useCallback, useEffect, useMemo, useState } from 'react'
import WeavingOrdersModal from './WeavingOrdersModal'

const WEAVING_ORDERS_URL = '/api/WeavingOrder'
const getTodayDate = () => new Date().toISOString().slice(0, 10)

const createEmptyYarnDetail = () => ({
  id: 0,
  parentId: 0,
  yarnId: 0,
  yarnGender: '',
  yarnLot: '',
  percentage: '',
  weight: '',
})

const createEmptyDetailRow = () => ({
  id: 0,
  fabricGender: '',
  fabricGr: '',
  fabricLot: '',
  pus: '',
  fain: '',
  iplik_Uzunu: '',
  denye: '',
  weight: '',
  price: '',
  description: '',
  factoryId: '',
  yarnDetails: [createEmptyYarnDetail()],
})

const normalizeDateValue = (value) => {
  if (typeof value !== 'string') {
    return getTodayDate()
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return getTodayDate()
  }

  if (trimmedValue.includes('T')) {
    return trimmedValue.split('T')[0]
  }

  return trimmedValue.slice(0, 10)
}

const normalizeTextValue = (value) => String(value ?? '').replace(/\u0000/g, '').trim()

function WeavingOrdersSection({ apiRequest, showNotice, isActive }) {
  const today = new Date().toISOString().slice(0, 10)

  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [searchText, setSearchText] = useState('')
  const [optionDate, setOptionDate] = useState(false)
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [orders, setOrders] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isModalSaving, setIsModalSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [orderOptions, setOrderOptions] = useState([])
  const [fabricOptions, setFabricOptions] = useState([])
  const [factoryOptions, setFactoryOptions] = useState([])
  const [yarnOptions, setYarnOptions] = useState([])
  const [selectedOrderDetails, setSelectedOrderDetails] = useState([])
  const [form, setForm] = useState({
    id: 0,
    orderId: '',
    name: '',
    date: getTodayDate(),
    details: [createEmptyDetailRow()],
  })

  const totalPages = useMemo(() => {
    const rawPages = Math.ceil(totalCount / pageSize)
    return rawPages > 0 ? rawPages : 1
  }, [pageSize, totalCount])

  const getResponseData = useCallback((payload) => payload?.Data ?? payload?.data ?? payload ?? {}, [])

  const normalizeText = useCallback((value) => String(value ?? '').replace(/\u0000/g, '').trim(), [])

  const fetchOrders = useCallback(
    async (requestedPage = pageNumber) => {
      setError('')
      setIsLoading(true)

      try {
        const queryParams = {
          PageNumber: String(requestedPage),
          PageSize: String(pageSize),
          OptionDate: String(optionDate),
          DateFrom: optionDate && dateFrom ? dateFrom : today,
          DateTo: optionDate && dateTo ? dateTo : today,
        }

        const trimmedSearchText = searchText.trim()
        if (trimmedSearchText) {
          queryParams.SearchText = trimmedSearchText
        }

        const query = new URLSearchParams(queryParams)

        const response = await apiRequest(`${WEAVING_ORDERS_URL}?${query.toString()}`)
        const data = response?.data || {}
        const items = Array.isArray(data.items) ? data.items : []

        setOrders(items)
        setTotalCount(Number(data.totalCount ?? data.totalRecords ?? items.length ?? 0))
      } catch (requestError) {
        const message = requestError.message || 'Dokuma siparişleri yüklenirken bir hata oluştu.'
        setError(message)
        setOrders([])
        setTotalCount(0)
        showNotice('error', message)
      } finally {
        setIsLoading(false)
      }
    },
    [apiRequest, dateFrom, dateTo, optionDate, pageSize, searchText, pageNumber, showNotice, today],
  )

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const timer = setTimeout(() => {
      fetchOrders(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchOrders, isActive])

  const resetForm = useCallback(() => {
    setForm({
      id: 0,
      orderId: '',
      name: '',
      date: getTodayDate(),
      details: [createEmptyDetailRow()],
    })
  }, [])

  const mapOrderToForm = useCallback(
    (orderItem) => {
      const details = Array.isArray(orderItem?.Details) ? orderItem.Details : []

      return {
        Id: Number(orderItem?.Id ?? orderItem?.id ?? 0) || 0,
        OrderId: orderItem?.OrderId ?? orderItem?.orderId ?? '',
        Name: normalizeText(orderItem?.Name ?? orderItem?.name ?? ''),
        Date: normalizeText(orderItem?.Date ?? orderItem?.date ?? getTodayDate()),
        Details: details.length
          ? details.map((detail) => ({
              id: Number(detail?.id ?? detail?.Id ?? 0) || 0,
              fabricGender: normalizeText(detail?.fabricGender ?? detail?.FabricGender ?? ''),
              fabricGr: Number(detail?.fabricGr ?? detail?.FabricGr ?? detail?.fabricWeight ?? 0) || '',
              fabricLot: normalizeText(detail?.fabricLot ?? detail?.FabricLot ?? ''),
              pus: detail?.pus ?? detail?.Pus ?? '',
              fain: detail?.fain ?? detail?.Fain ?? '',
              iplik_Uzunu: detail?.iplik_Uzunu ?? detail?.Iplik_Uzunu ?? detail?.IplikUzunu ?? '',
              denye: detail?.denye ?? detail?.Denye ?? '',
              weight: Number(detail?.weight ?? detail?.Weight ?? 0) || '',
              description: normalizeText(detail?.description ?? detail?.Description ?? ''),
              factoryId: Number(detail?.factoryId ?? detail?.FactoryId ?? 0) || '',
            }))
          : [
              {
                fabricGender: '',
                fabricGr: '',
                fabricLot: '',
                weight: '',
                description: '',
                factoryId: '',
              },
            ],
      }
    },
    [normalizeText],
  )

  const handleSearch = useCallback(
    (event) => {
      event?.preventDefault?.()
      setPageNumber(1)
      fetchOrders(1)
    },
    [fetchOrders],
  )

  const openCreateModal = useCallback(async () => {
    setIsEditMode(false)
    setEditingOrderId(null)
    setModalError('')
    setIsModalOpen(true)
    setIsModalLoading(true)
    setOrderOptions([])
    setFabricOptions([])
    setFactoryOptions([])
    setYarnOptions([])
    resetForm()

    try {
      const response = await apiRequest('/api/fill-options?requestedValues=1')
      const data = getResponseData(response)
      setOrderOptions(Array.isArray(data.customerOrders) ? data.customerOrders : [])
      setFabricOptions([])
      setFactoryOptions(Array.isArray(data.fasonFactories) ? data.fasonFactories : [])
      setYarnOptions(Array.isArray(data.yarns) ? data.yarns : [])
      setSelectedOrderDetails([])
    } catch (requestError) {
      const message = requestError.message || 'Seçenekler yüklenirken bir hata oluştu.'
      setModalError(message)
      showNotice('error', message)
      setIsModalOpen(false)
    } finally {
      setIsModalLoading(false)
    }
  }, [apiRequest, getResponseData, resetForm, showNotice])

  const closeModal = useCallback(() => {
    if (isModalSaving) {
      return
    }

    setIsModalOpen(false)
    setModalError('')
    setIsEditMode(false)
    setEditingOrderId(null)
  }, [isModalSaving])

  const updateFormField = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const updateDetailField = useCallback((index, field, value) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, [field]: value } : detail,
      ),
    }))
  }, [])

  const updateYarnDetailField = useCallback((detailIndex, yarnIndex, field, value) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.map((detail, index) => {
        if (index !== detailIndex) {
          return detail
        }

        return {
          ...detail,
          yarnDetails: (detail.yarnDetails ?? [createEmptyYarnDetail()]).map((yarnDetail, yarnDetailIndex) => {
            if (yarnDetailIndex !== yarnIndex) {
              return yarnDetail
            }

            const updatedYarnDetail = { ...yarnDetail, [field]: value }

            if (field === 'yarnId' && value) {
              const selectedYarn = yarnOptions.find((yarn) => String(yarn.id ?? yarn.yarnId) === String(value))
              if (selectedYarn) {
                updatedYarnDetail.yarnGender = selectedYarn.yarnGender ?? selectedYarn.YarnGender ?? ''
              }
            }

            if (field === 'percentage' && value) {
              const percentage = parseFloat(value)
              const fabricWeight = parseFloat(detail.weight) || 0

              if (percentage >= 0 && fabricWeight > 0) {
                const calculatedWeight = (fabricWeight * percentage) / 100
                updatedYarnDetail.weight = calculatedWeight.toFixed(2)
              }
            }

            return updatedYarnDetail
          }),
        }
      }),
    }))
  }, [yarnOptions])

  const addDetailRow = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      details: [...prev.details, createEmptyDetailRow()],
    }))
  }, [])

  const addYarnDetailRow = useCallback((detailIndex) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.map((detail, index) =>
        index === detailIndex
          ? { ...detail, yarnDetails: [...(detail.yarnDetails ?? []), createEmptyYarnDetail()] }
          : detail,
      ),
    }))
  }, [])

  const removeDetailRow = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.filter((_, detailIndex) => detailIndex !== index),
    }))
  }, [])

  const removeYarnDetailRow = useCallback((detailIndex, yarnIndex) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.map((detail, index) => {
        if (index !== detailIndex) {
          return detail
        }

        const nextYarnDetails = (detail.yarnDetails ?? []).filter((_, itemIndex) => itemIndex !== yarnIndex)

        return {
          ...detail,
          yarnDetails: nextYarnDetails.length ? nextYarnDetails : [createEmptyYarnDetail()],
        }
      }),
    }))
  }, [])

  const handleOrderSelection = useCallback(
    async (selectedOrderId) => {
      const normalizedId = String(selectedOrderId ?? '').trim()
      updateFormField('orderId', normalizedId)

      if (!normalizedId) {
        setFabricOptions([])
        return
      }

      try {
        setIsModalLoading(true)
        const response = await apiRequest(`${WEAVING_ORDERS_URL}/getCustomerOrders?Id=${normalizedId}`)
        const data = response?.data || {}
        const customerOrders = Array.isArray(data?.customerOrders) ? data.customerOrders : []
        const matchedOrder = customerOrders.find(
          (order) => String(order?.id ?? order?.orderId ?? order?.value ?? '') === normalizedId,
        )
        const details = Array.isArray(matchedOrder?.details)
          ? matchedOrder.details
          : Array.isArray(data?.details)
          ? data.details
          : []
        const nextFabricOptions = details
          .map((item) => item?.fabricGender || item?.FabricGender || item?.name || item?.value || '')
          .filter(Boolean)

          setFabricOptions(nextFabricOptions)
        setSelectedOrderDetails(details)
      } catch (requestError) {
        const message = requestError.message || 'Siparişe ait kumaş seçenekleri yüklenemedi.'
        setModalError(message)
        showNotice('error', message)
      } finally {
        setIsModalLoading(false)
      }
    },
    [apiRequest, showNotice, updateFormField],
  )

  const openEditModal = useCallback(
    async (orderId) => {
      if (!orderId) {
        return
      }

      setIsEditMode(true)
      setEditingOrderId(orderId)
      setModalError('')
      setIsModalOpen(true)
      setIsModalLoading(true)
      setOrderOptions([])
      setFabricOptions([])
      setFactoryOptions([])
      setYarnOptions([])
      resetForm()

      try {
        const [optionsResponse, orderResponse] = await Promise.all([
          apiRequest('/api/fill-options?requestedValues=1'),
          apiRequest(`${WEAVING_ORDERS_URL}/${orderId}`),
        ])

        const optionsData = optionsResponse?.data || {}
        const orderData = orderResponse?.data || {}
        const details = Array.isArray(orderData?.details) ? orderData.details : []
        const nextFabricOptions = details
          .map((detail) => detail?.fabricGender || detail?.FabricGender || detail?.name || detail?.value || '')
          .filter(Boolean)

        setOrderOptions(Array.isArray(optionsData.customerOrders) ? optionsData.customerOrders : [])
        setFactoryOptions(Array.isArray(optionsData.fasonFactories) ? optionsData.fasonFactories : [])
        setYarnOptions(Array.isArray(optionsData.yarns) ? optionsData.yarns : [])
        setFabricOptions(nextFabricOptions)

        setForm({
          id: orderData?.id ?? 0,
          orderId: orderData?.orderId ?? orderData?.OrderId ?? '',
          name: orderData?.name ?? orderData?.Name ?? '',
          date: normalizeDateValue(orderData?.date ?? orderData?.Date),
          details: details.length
            ? details.map((detail) => ({
                id: detail?.id ?? 0,
                fabricGender: normalizeTextValue(detail?.fabricGender ?? detail?.FabricGender ?? ''),
                fabricGr: detail?.fabricGr ?? detail?.FabricGr ?? '',
                fabricLot: normalizeTextValue(detail?.fabricLot ?? detail?.FabricLot ?? ''),
                pus: detail?.pus ?? detail?.Pus ?? '',
                fain: detail?.fain ?? detail?.Fain ?? '',
                iplik_Uzunu: detail?.iplik_Uzunu ?? detail?.Iplik_Uzunu ?? detail?.IplikUzunu ?? '',
                denye: detail?.denye ?? detail?.Denye ?? '',
                weight: detail?.weight ?? detail?.Weight ?? '',
                price: detail?.price ?? detail?.Price ?? '',
                description: normalizeTextValue(detail?.description ?? detail?.Description ?? ''),
                factoryId: detail?.factoryId ?? detail?.FactoryId ?? '',
                yarnDetails: Array.isArray(detail?.yarnDetails)
                  ? detail.yarnDetails.map((yarn) => ({
                      id: yarn?.id ?? 0,
                      parentId: yarn?.parentId ?? 0,
                      yarnId: yarn?.yarnId ?? 0,
                      yarnGender: normalizeTextValue(yarn?.yarnGender ?? yarn?.YarnGender ?? ''),
                      yarnLot: normalizeTextValue(yarn?.yarnLot ?? yarn?.YarnLot ?? ''),
                      percentage: yarn?.percentage ?? yarn?.Percentage ?? '',
                      weight: yarn?.weight ?? yarn?.Weight ?? '',
                    }))
                  : [createEmptyYarnDetail()],
              }))
            : [createEmptyDetailRow()],
        })
      } catch (requestError) {
        const message = requestError.message || 'Hareket verileri yüklenirken bir hata oluştu.'
        setModalError(message)
        showNotice('error', message)
        setIsModalOpen(false)
      } finally {
        setIsModalLoading(false)
      }
    },
    [apiRequest, resetForm, showNotice],
  )

  const saveOrder = useCallback(async () => {
    setModalError('')

    const isEmpty = (value) => value === null || value === undefined || String(value).trim() === ''
    const showValidationWarning = (message) => {
      setModalError(message)
      showNotice('warning', message)
    }

    if (isEmpty(form.orderId) || isEmpty(form.name) || isEmpty(form.date)) {
      showValidationWarning('Lütfen kaydetmeden önce sipariş, isim ve tarih alanlarını doldurun.')
      return
    }

    for (let detailIndex = 0; detailIndex < form.details.length; detailIndex += 1) {
      const detail = form.details[detailIndex]
      const detailFields = [
        ['Kumaş cinsi', detail.fabricGender],
        ['GR', detail.fabricGr],
        ['Kumaş LOT', detail.fabricLot],
        ['Pus', detail.pus],
        ['Fain', detail.fain],
        ['İplik uzunluğu', detail.iplik_Uzunu],
        ['Denye', detail.denye],
        ['Ağırlık', detail.weight],
        ['Fiyat', detail.price],
        ['Fabrika', detail.factoryId],
      ]
      const missingField = detailFields.find(([, value]) => isEmpty(value))

      if (missingField) {
        showValidationWarning(`${detailIndex + 1}. kumaş detayında ${missingField[0]} alanını doldurun.`)
        return
      }

      const yarnDetails = Array.isArray(detail.yarnDetails) ? detail.yarnDetails : []
      if (yarnDetails.length === 0) {
        showValidationWarning(`${detailIndex + 1}. kumaş için iplik detayı ekleyin.`)
        return
      }

      const missingYarnField = yarnDetails.some((yarn) => (
        isEmpty(yarn.yarnId) || isEmpty(yarn.yarnLot) || isEmpty(yarn.percentage) || isEmpty(yarn.weight)
      ))
      if (missingYarnField) {
        showValidationWarning(`${detailIndex + 1}. kumaşın iplik detaylarındaki tüm alanları doldurun.`)
        return
      }

      const percentageTotal = yarnDetails.reduce((sum, yarn) => sum + Number(yarn.percentage), 0)
      if (Math.abs(percentageTotal - 100) > 0.01) {
        showValidationWarning(`${detailIndex + 1}. kumaşın iplik detaylarındaki yüzde toplamı %100 olmalıdır. Mevcut toplam: %${percentageTotal}.`)
        return
      }
    }

    setIsModalSaving(true)

    try {
      const payload = {
        id: Number(form.id) || 0,
        orderId: Number(form.orderId) || 0,
        name: String(form.name ?? '').trim(),
        date: String(form.date ?? '').trim(),
        details: form.details.map((detail) => ({
          id: Number(detail.id) || 0,
          fabricGender: String(detail.fabricGender ?? '').trim(),
          fabricGr: Number(detail.fabricGr) || 0,
          fabricLot: String(detail.fabricLot ?? '').trim(),
          pus: Number(detail.pus ?? 0) || 0,
          fain: Number(detail.fain ?? 0) || 0,
          iplik_Uzunu: Number(detail.iplik_Uzunu ?? 0) || 0,
          denye: Number(detail.denye ?? 0) || 0,
          weight: Number(detail.weight) || 0,
          price: Number(detail.price ?? 0) || 0,
          description: String(detail.description ?? '').trim(),
          factoryId: Number(detail.factoryId) || 0,
          yarnDetails: Array.isArray(detail.yarnDetails) ? detail.yarnDetails.map((yarn) => ({
            id: Number(yarn.id ?? 0) || 0,
            parentId: Number(detail.id) || 0,
            yarnId: Number(yarn.yarnId ?? 0) || 0,
            yarnGender: String(yarn.yarnGender ?? '').trim(),
            yarnLot: String(yarn.yarnLot ?? '').trim(),
            percentage: Number(yarn.percentage ?? 0) || 0,
            weight: Number(yarn.weight ?? 0) || 0,
          })) : [],
        })),
      }

      await apiRequest(`${WEAVING_ORDERS_URL}/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setIsModalSaving(false)
      setIsModalOpen(false)
      fetchOrders(pageNumber)
      showNotice('success', 'Dokuma hareketi başarıyla kaydedildi.')
    } catch (requestError) {
      const message = requestError.message || 'Dokuma hareketi kaydedilemedi.'
      setModalError(message)
      showNotice('error', message)
      setIsModalSaving(false)
    }
  }, [apiRequest, fetchOrders, form, pageNumber, showNotice])

  const changePage = useCallback(
    (direction) => {
      const nextPage = direction === 'next' ? Math.min(pageNumber + 1, totalPages) : Math.max(pageNumber - 1, 1)

      if (nextPage === pageNumber) {
        return
      }

      setPageNumber(nextPage)
      fetchOrders(nextPage)
    },
    [fetchOrders, pageNumber, totalPages],
  )

  const deleteOrder = useCallback(
    async (id) => {
      if (!id) {
        return
      }

      const confirmed = window.confirm('Bu dokuma siparişini silmek istediğinizden emin misiniz?')
      if (!confirmed) {
        return
      }

      try {
        await apiRequest(`${WEAVING_ORDERS_URL}/${id}`, {
          method: 'DELETE',
        })

        showNotice('success', 'Sipariş başarıyla silindi.')
        fetchOrders(pageNumber)
      } catch (requestError) {
        const message = requestError.message || 'Sipariş silinemedi.'
        showNotice('error', message)
      }
    },
    [apiRequest, fetchOrders, pageNumber, showNotice],
  )

  const handleEditOrder = useCallback(
    (order) => {
      openEditModal(order?.id)
    },
    [openEditModal],
  )

  return (
    <div className="space-y-4" dir="ltr" style={{ direction: 'ltr' }}>
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
            <h3 className="text-2xl font-bold text-sky-900">Dokuma Siparişleri Yönetimi</h3>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-800 active:bg-sky-900"
          >
            + Ekle
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-2">
          <div className="min-w-[180px] flex-1">
            <label htmlFor="weavingOrdersSearch" className="mb-1 block text-xs font-medium text-slate-600 text-left">Arama metni</label>
            <input
              id="weavingOrdersSearch"
              type="text"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value)
                setPageNumber(1)
              }}
              placeholder="Sipariş numarası, isim veya tarih"
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-slate-50"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>

          <div className="min-w-[120px]">
            <label htmlFor="weavingOrdersDateToggle" className="mb-1 block text-xs font-medium text-slate-600 text-left">Tarih filtresi</label>
            <div className="flex h-10 items-center gap-2 rounded-lg bg-slate-100 px-3">
              <input
                id="weavingOrdersDateToggle"
                type="checkbox"
                checked={optionDate}
                onChange={(event) => setOptionDate(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-700"
              />
              <label htmlFor="weavingOrdersDateToggle" className="text-sm text-slate-700">Tarih aralığı</label>
            </div>
          </div>

          <div className="min-w-[90px]">
            <label htmlFor="weavingOrdersPageSize" className="mb-1 block text-xs font-medium text-slate-600 text-left">Sayfa</label>
            <select
              id="weavingOrdersPageSize"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPageNumber(1)
              }}
              className="h-11 w-full rounded-lg border-0 bg-slate-100 px-3 text-center text-sm text-slate-900 outline-none transition focus:bg-slate-50"
              style={{ direction: 'ltr', textAlign: 'center' }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="min-w-[120px]">
            <label htmlFor="weavingOrdersDateFrom" className="mb-1 block text-xs font-medium text-slate-600 text-left">Başlangıç</label>
            <input
              id="weavingOrdersDateFrom"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>

          <div className="min-w-[120px]">
            <label htmlFor="weavingOrdersDateTo" className="mb-1 block text-xs font-medium text-slate-600 text-left">Bitiş</label>
            <input
              id="weavingOrdersDateTo"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>
        </div>
      </header>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 text-left">{error}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm" style={{ direction: 'ltr' }}>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Sipariş No</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">İsim</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Tarih</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Detay Sayısı</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Toplam Ağırlık</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">Dokuma siparişleri yükleniyor...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">Eşleşen sipariş bulunamadı.</td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order.id ?? `${order.orderNo ?? 'row'}-${index}`} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4 text-left text-slate-900">{index + 1}</td>
                    <td className="px-4 py-4 text-left text-slate-700">{order.orderNo || '-'}</td>
                    <td className="px-4 py-4 text-left text-slate-700">{order.name || '-'}</td>
                    <td className="px-4 py-4 text-left text-slate-700">{order.date || '-'}</td>
                    <td className="px-4 py-4 text-left text-slate-700">{order.detailsCount ?? '-'}</td>
                    <td className="px-4 py-4 text-left text-slate-700">{order.totalWeight ?? '-'}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditOrder(order)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                          aria-label="Düzenle"
                          title="Düzenle"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOrder(order.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          aria-label="Sil"
                          title="Sil"
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
            <div className="px-4 py-12 text-center text-slate-500">Dokuma siparişleri yükleniyor...</div>
          ) : orders.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-500">Eşleşen sipariş bulunamadı.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {orders.map((order, index) => (
                <div key={order.id ?? `${order.orderNo ?? 'row'}-${index}`} className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{order.orderNo || '-'}</span>
                    <span className="text-sm font-semibold text-slate-900">{order.name || '-'}</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-center justify-between gap-3"><span>Tarih:</span><span className="font-medium text-slate-900">{order.date || '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Detay sayısı:</span><span className="font-medium text-slate-900">{order.detailsCount ?? '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Toplam ağırlık:</span><span className="font-medium text-slate-900">{order.totalWeight ?? '-'}</span></div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button type="button" onClick={() => handleEditOrder(order)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600" aria-label="Düzenle" title="Düzenle">✏️</button>
                    <button type="button" onClick={() => deleteOrder(order.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600" aria-label="Sil" title="Sil">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-4">
          <p>Toplam sonuç: <strong className="text-slate-900">{totalCount}</strong></p>
          <button type="button" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={() => fetchOrders(1)}>
            Yenile
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pageNumber <= 1 || isLoading}
            onClick={() => changePage('prev')}
          >
            Önceki
          </button>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">Sayfa {pageNumber} / {totalPages}</span>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pageNumber >= totalPages || isLoading}
            onClick={() => changePage('next')}
          >
            Sonraki
          </button>
        </div>
      </footer>

      <WeavingOrdersModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSaving={isModalSaving}
        error={modalError}
        form={form}
        orderOptions={orderOptions}
        fabricOptions={fabricOptions}
        factoryOptions={factoryOptions}
        yarnOptions={yarnOptions}
        selectedOrderDetails={selectedOrderDetails}
        isEditMode={isEditMode}
        onFieldChange={updateFormField}
        onDetailChange={updateDetailField}
        onYarnDetailChange={updateYarnDetailField}
        onAddDetail={addDetailRow}
        onAddYarnDetail={addYarnDetailRow}
        onRemoveDetail={removeDetailRow}
        onRemoveYarnDetail={removeYarnDetailRow}
        onClose={closeModal}
        onSave={saveOrder}
        onOrderSelect={handleOrderSelection}
      />
    </div>
  )
}

export default WeavingOrdersSection
