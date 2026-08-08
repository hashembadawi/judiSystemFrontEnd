import { useCallback, useEffect, useMemo, useState } from 'react'
import WeavingOrdersModal from './WeavingOrdersModal'

const WEAVING_ORDERS_URL = '/api/WeavingOrder'
const getTodayDate = () => new Date().toISOString().slice(0, 10)

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
  const [selectedOrderDetails, setSelectedOrderDetails] = useState([])
  const [form, setForm] = useState({
    Id: 0,
    OrderId: '',
    Name: '',
    Date: getTodayDate(),
    Details: [
      {
        FabricGender: '',
        FabricGr: '',
        FabricLot: '',
        Weight: '',
        Description: '',
        FactoryId: '',
      },
    ],
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
      Id: 0,
      OrderId: '',
      Name: '',
      Date: getTodayDate(),
      Details: [
        {
          FabricGender: '',
          FabricGr: '',
          FabricLot: '',
          pus: '',
          fain: '',
          iplik_Uzunu: '',
          denye: '',
          Weight: '',
          Description: '',
          FactoryId: '',
        },
      ],
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
              Id: Number(detail?.Id ?? detail?.id ?? 0) || 0,
              FabricGender: normalizeText(detail?.FabricGender ?? detail?.fabricGender ?? ''),
              FabricGr: Number(detail?.FabricGr ?? detail?.fabricGr ?? detail?.fabricWeight ?? 0) || '',
              FabricLot: normalizeText(detail?.FabricLot ?? detail?.fabricLot ?? ''),
              pus: detail?.pus ?? detail?.Pus ?? '',
              fain: detail?.fain ?? detail?.Fain ?? '',
              iplik_Uzunu: detail?.iplik_Uzunu ?? detail?.Iplik_Uzunu ?? detail?.IplikUzunu ?? '',
              denye: detail?.denye ?? detail?.Denye ?? '',
              Weight: Number(detail?.Weight ?? detail?.weight ?? 0) || '',
              Description: normalizeText(detail?.Description ?? detail?.description ?? ''),
              FactoryId: Number(detail?.FactoryId ?? detail?.factoryId ?? 0) || '',
            }))
          : [
              {
                FabricGender: '',
                FabricGr: '',
                FabricLot: '',
                Weight: '',
                Description: '',
                FactoryId: '',
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
    resetForm()

    try {
      const response = await apiRequest('/api/fill-options?requestedValues=1')
      const data = getResponseData(response)
      setOrderOptions(Array.isArray(data.customerOrders) ? data.customerOrders : [])
      setFabricOptions([])
      setFactoryOptions(Array.isArray(data.fasonFactories) ? data.fasonFactories : [])
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
      Details: prev.Details.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, [field]: value } : detail,
      ),
    }))
  }, [])

  const addDetailRow = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      Details: [
        ...prev.Details,
        {
          FabricGender: '',
          FabricGr: '',
          FabricLot: '',
          pus: '',
          fain: '',
          iplik_Uzunu: '',
          denye: '',
          Weight: '',
          Description: '',
          FactoryId: '',
        },
      ],
    }))
  }, [])

  const removeDetailRow = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      Details: prev.Details.filter((_, detailIndex) => detailIndex !== index),
    }))
  }, [])

  const handleOrderSelection = useCallback(
    async (selectedOrderId) => {
      const normalizedId = String(selectedOrderId ?? '').trim()
      updateFormField('OrderId', normalizedId)

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
        setFabricOptions(nextFabricOptions)

        setForm({
          Id: orderData?.id ?? 0,
          OrderId: orderData?.orderId ?? orderData?.OrderId ?? '',
          Name: orderData?.name ?? orderData?.Name ?? '',
          Date: normalizeDateValue(orderData?.date ?? orderData?.Date),
          Details: details.length
            ? details.map((detail) => ({
                Id: detail?.id ?? 0,
                FabricGender: normalizeTextValue(detail?.fabricGender ?? detail?.FabricGender ?? ''),
                FabricGr: detail?.fabricGr ?? detail?.FabricGr ?? '',
                FabricLot: normalizeTextValue(detail?.fabricLot ?? detail?.FabricLot ?? ''),
                pus: detail?.pus ?? detail?.Pus ?? '',
                fain: detail?.fain ?? detail?.Fain ?? '',
                iplik_Uzunu: detail?.iplik_Uzunu ?? detail?.Iplik_Uzunu ?? detail?.IplikUzunu ?? '',
                denye: detail?.denye ?? detail?.Denye ?? '',
                Weight: detail?.weight ?? detail?.Weight ?? '',
                Description: normalizeTextValue(detail?.description ?? detail?.Description ?? ''),
                FactoryId: detail?.factoryId ?? detail?.FactoryId ?? '',
              }))
            : [
                {
                  FabricGender: '',
                  FabricGr: '',
                  FabricLot: '',
                  Weight: '',
                  Description: '',
                  FactoryId: '',
                },
              ],
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
    setIsModalSaving(true)

    try {
      const payload = {
        Id: Number(form.Id) || 0,
        OrderId: Number(form.OrderId) || 0,
        Name: String(form.Name ?? '').trim(),
        Date: String(form.Date ?? '').trim(),
        Details: form.Details.map((detail) => ({
          Id: Number(detail.Id) || 0,
          FabricGender: String(detail.FabricGender ?? '').trim(),
          FabricGr: Number(detail.FabricGr) || 0,
          FabricLot: String(detail.FabricLot ?? '').trim(),
          pus: Number(detail.pus ?? detail.Pus ?? 0) || 0,
          fain: Number(detail.fain ?? detail.Fain ?? 0) || 0,
          iplik_Uzunu: Number(detail.iplik_Uzunu ?? detail.Iplik_Uzunu ?? detail.IplikUzunu ?? 0) || 0,
          denye: Number(detail.denye ?? detail.Denye ?? 0) || 0,
          Weight: Number(detail.Weight) || 0,
          Description: String(detail.Description ?? '').trim(),
          FactoryId: Number(detail.FactoryId) || 0,
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
    <div className="weaving-orders-section" dir="rtl">
      <header className="content-header">
        <div>
          <h3>Dokuma Siparişleri Yönetimi</h3>
          <p>API üzerinden siparişleri listeleyin, arayın ve yönetin.</p>
        </div>
        <button type="button" className="add-button" onClick={openCreateModal}>
          + Ekle
        </button>
      </header>

      <section className="filters-panel weaving-orders-filters" aria-label="Dokuma siparişleri filtresi">
        <div className="field-group">
          <label htmlFor="weavingOrdersSearch">Arama metni</label>
          <input
            id="weavingOrdersSearch"
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Sipariş numarası, isim veya tarih"
          />
        </div>

        <div className="field-group">
          <label htmlFor="weavingOrdersDateToggle">Tarih filtresi</label>
          <div className="toggle-row">
            <input
              id="weavingOrdersDateToggle"
              type="checkbox"
              checked={optionDate}
              onChange={(event) => setOptionDate(event.target.checked)}
            />
            <label htmlFor="weavingOrdersDateToggle">Tarih aralığı kullan</label>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="weavingOrdersPageSize">Sayfa boyutu</label>
          <select
            id="weavingOrdersPageSize"
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

        <div className="field-group">
          <label htmlFor="weavingOrdersDateFrom">Başlangıç tarihi</label>
          <input
            id="weavingOrdersDateFrom"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            disabled={!optionDate}
          />
        </div>

        <div className="field-group">
          <label htmlFor="weavingOrdersDateTo">Bitiş tarihi</label>
          <input
            id="weavingOrdersDateTo"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            disabled={!optionDate}
          />
        </div>

        <button type="button" className="add-button" onClick={handleSearch}>
          Ara
        </button>
      </section>

      {error ? <p className="error-box inline-error">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Sipariş No</th>
              <th>İsim</th>
              <th>Tarih</th>
              <th>Detay Sayısı</th>
              <th>Toplam Ağırlık</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="table-state">
                  Dokuma siparişleri yükleniyor...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-state">
                  Eşleşen sipariş bulunamadı.
                </td>
              </tr>
            ) : (
              orders.map((order, index) => (
                <tr key={order.id ?? `${order.orderNo ?? 'row'}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{order.orderNo || '-'}</td>
                  <td>{order.name || '-'}</td>
                  <td>{order.date || '-'}</td>
                  <td>{order.detailsCount ?? '-'}</td>
                  <td>{order.totalWeight ?? '-'}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="action-btn edit"
                        onClick={() => handleEditOrder(order)}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className="action-btn delete"
                        onClick={() => deleteOrder(order.id)}
                      >
                        Sil
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
            Toplam sonuç: <strong>{totalCount}</strong>
          </p>
          <button type="button" className="secondary-btn" onClick={() => fetchOrders(1)}>
            Yenile
          </button>
        </div>

        <div className="pagination-controls">
          <button
            type="button"
            className="pager-btn"
            disabled={pageNumber <= 1 || isLoading}
            onClick={() => changePage('prev')}
          >
            Önceki
          </button>
          <span>
            Sayfa {pageNumber} / {totalPages}
          </span>
          <button
            type="button"
            className="pager-btn"
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
        selectedOrderDetails={selectedOrderDetails}
        isEditMode={isEditMode}
        onFieldChange={updateFormField}
        onDetailChange={updateDetailField}
        onAddDetail={addDetailRow}
        onRemoveDetail={removeDetailRow}
        onClose={closeModal}
        onSave={saveOrder}
        onOrderSelect={handleOrderSelection}
      />
    </div>
  )
}

export default WeavingOrdersSection
