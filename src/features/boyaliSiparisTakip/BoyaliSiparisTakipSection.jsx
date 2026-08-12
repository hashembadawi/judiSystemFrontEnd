import { useCallback, useEffect, useRef, useState } from 'react'
import BoyaliSiparisTakipModal from './BoyaliSiparisTakipModal'
import './BoyaliSiparisTakip.css'

const FILL_OPTIONS_URL = '/api/fill-options?requestedValues=1'
const BOYALI_SIPARIS_URL = '/api/order-factory-transaction-takip/fillBoyaliSiparis'
const TRANSACTION_DETAIL_URL = '/api/order-factory-transaction-takip'
const UPSERT_TRANSACTION_URL = '/api/order-factory-transaction-takip/upsert'

function BoyaliSiparisTakipSection({ apiRequest, showNotice, isActive }) {
  const latestRequestIdRef = useRef(0)
  const hasLoadedOptionsRef = useRef(false)
  const [factoryOptions, setFactoryOptions] = useState([])
  const [selectedFactoryId, setSelectedFactoryId] = useState('0')
  const [orders, setOrders] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [statusOptions, setStatusOptions] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderForm, setOrderForm] = useState({
    id: 0,
    orderNo: '',
    factoryId: 0,
    factoryName: '',
    date: '',
    details: [],
  })
  const [error, setError] = useState('')

  const loadOrders = useCallback(
    async (factoryId = 0) => {
      const normalizedFactoryId = factoryId === '0' || factoryId === 0 ? 0 : Number(factoryId)
      const requestId = ++latestRequestIdRef.current

      setError('')
      setIsLoadingOrders(true)

      try {
        const response = await apiRequest(`${BOYALI_SIPARIS_URL}?BoyahaneId=${normalizedFactoryId}`)
        const data = response.data || {}
        const boyaliOrders = Array.isArray(data.boyaliSiparis) ? data.boyaliSiparis : []

        if (requestId !== latestRequestIdRef.current) {
          return
        }

        setOrders(boyaliOrders)
      } catch (requestError) {
        if (requestId !== latestRequestIdRef.current) {
          return
        }

        const message = requestError.message || 'Sipariş verileri alınırken bir hata oluştu.'
        setError(message)
        setOrders([])
        showNotice('error', message)
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsLoadingOrders(false)
        }
      }
    },
    [apiRequest, showNotice],
  )

  const loadFactoryOptions = useCallback(async () => {
    if (hasLoadedOptionsRef.current) {
      return
    }

    hasLoadedOptionsRef.current = true
    setError('')
    setIsLoadingOptions(true)

    try {
      const response = await apiRequest(FILL_OPTIONS_URL)
      const data = response.data || {}
      const options = Array.isArray(data.boyaFactories) ? data.boyaFactories : []

      const nextOptions = [{ id: 0, name: 'Tümü' }, ...options]
      setFactoryOptions(nextOptions)
      setSelectedFactoryId('0')
      await loadOrders(0)
    } catch (requestError) {
      const message = requestError.message || 'Boya fabrikası seçenekleri alınırken bir hata oluştu.'
      setError(message)
      setFactoryOptions([{ id: 0, name: 'Tümü' }])
      setOrders([])
      showNotice('error', message)
    } finally {
      setIsLoadingOptions(false)
    }
  }, [apiRequest, loadOrders, showNotice])

  useEffect(() => {
    if (!isActive) {
      hasLoadedOptionsRef.current = false
      return
    }

    void loadFactoryOptions()
  }, [isActive, loadFactoryOptions])

  const handleFactoryChange = async (event) => {
    const nextFactoryId = event.target.value
    const normalizedFactoryId = nextFactoryId === '0' ? 0 : Number(nextFactoryId)

    setSelectedFactoryId(String(normalizedFactoryId))
    await loadOrders(normalizedFactoryId)
  }

  const getFactoryName = (factoryId) => {
    const selectedFactory = factoryOptions.find((factory) => String(factory.id) === String(factoryId))
    return selectedFactory?.name || '-'
  }

  const openOrderDetails = useCallback(async (order) => {
    if (!order?.id) {
      return
    }

    setModalError('')
    setIsModalOpen(true)
    setIsModalLoading(true)
    setSelectedOrder(order)
    setOrderForm({
      id: order.id,
      orderNo: order.orderNo ?? '',
      factoryId: order.factoryId ?? 0,
      factoryName: order.factoryName ?? '',
      date: order.date ? order.date.split('T')[0] : '',
      details: [],
    })

    try {
      const [detailsResponse, optionsResponse] = await Promise.all([
        apiRequest(`${TRANSACTION_DETAIL_URL}?Id=${order.id}`),
        apiRequest(FILL_OPTIONS_URL),
      ])

      const detailsData = detailsResponse.data || {}
      const optionsData = optionsResponse.data || {}
      const nextStatusOptions = Array.isArray(optionsData.siparisDurum)
        ? optionsData.siparisDurum
        : []

      setStatusOptions(nextStatusOptions)
      setOrderForm({
        id: detailsData.id ?? order.id,
        orderNo: detailsData.orderNo ?? order.orderNo ?? '',
        factoryId: detailsData.factoryId ?? order.factoryId ?? 0,
        factoryName: detailsData.factoryName ?? order.factoryName ?? '',
        date: detailsData.date ? detailsData.date.split('T')[0] : order.date ? order.date.split('T')[0] : '',
        details: Array.isArray(detailsData.details)
          ? detailsData.details.map((detail) => ({
              id: detail.id ?? 0,
              etiket_Basligi: detail.etiket_Basligi ?? '',
              fabricGender: detail.fabricGender ?? '',
              lot: detail.fabricLot ?? detail.lot ?? detail.FabricLot ?? '',
              en: detail.en ?? 0,
              gr: detail.gr ?? 0,
              renk: detail.renk ?? '',
              renkCode: detail.renkCode ?? '',
              siparisMiktari: detail.siparisMiktari ?? 0,
              PartiNo: detail.partiNo ?? detail.PartiNo ?? '',
              KazanGiris: detail.kazanGiris ?? detail.KazanGiris ?? 0,
              Status: detail.status ?? detail.Status ?? 1,
              SevkHazir: detail.sevkHazir ?? detail.SevkHazir ?? 0,
            }))
          : [],
      })
    } catch (requestError) {
      const message = requestError.message || 'Sipariş detayı alınırken bir hata oluştu.'
      setModalError(message)
      showNotice('error', message)
      setIsModalOpen(false)
    } finally {
      setIsModalLoading(false)
    }
  }, [apiRequest, showNotice])

  const closeModal = useCallback(() => {
    if (isSaving) {
      return
    }

    setIsModalOpen(false)
    setModalError('')
    setSelectedOrder(null)
    setOrderForm({
      id: 0,
      orderNo: '',
      factoryId: 0,
      factoryName: '',
      date: '',
      details: [],
    })
  }, [isSaving])

  useEffect(() => {
    if (!isModalOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeModal, isModalOpen, isSaving])

  const updateDetailField = useCallback((index, field, value) => {
    setOrderForm((prev) => ({
      ...prev,
      details: prev.details.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, [field]: value } : detail,
      ),
    }))
  }, [])

  const addDetailRow = useCallback(() => {
    setOrderForm((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        {
          id: null,
          etiket_Basligi: '',
          fabricGender: '',
          lot: '',
          en: '',
          gr: '',
          renk: '',
          renkCode: '',
          siparisMiktari: '',
          PartiNo: '',
          KazanGiris: '',
          Status: 1,
          SevkHazir: 0,
        },
      ],
    }))
  }, [])

  const deleteDetailRow = useCallback((index) => {
    setOrderForm((prev) => ({
      ...prev,
      details: prev.details.filter((_, detailIndex) => detailIndex !== index),
    }))
  }, [])

  const copyDetailRow = useCallback((index) => {
    setOrderForm((prev) => {
      const detailToCopy = prev.details[index]
      if (!detailToCopy) {
        return prev
      }

      const copiedDetail = {
        ...detailToCopy,
        id: null,
      }

      return {
        ...prev,
        details: [
          ...prev.details.slice(0, index + 1),
          copiedDetail,
          ...prev.details.slice(index + 1),
        ],
      }
    })
  }, [])

  const handleSave = useCallback(async () => {
    setModalError('')
    setIsSaving(true)

    try {
      const payload = {
        id: orderForm.id,
        orderNo: orderForm.orderNo,
        factoryId: orderForm.factoryId,
        date: orderForm.date,
        details: orderForm.details.map((detail) => ({
          id: detail.id ?? 0,
          etiket_Basligi: detail.etiket_Basligi ?? '',
          fabricGender: detail.fabricGender ?? '',
          fabricLot: detail.lot ?? detail.fabricLot ?? detail.FabricLot ?? '',
          en: Number(detail.en ?? 0),
          gr: Number(detail.gr ?? 0),
          renk: detail.renk ?? '',
          renkCode: detail.renkCode ?? '',
          siparisMiktari: Number(detail.siparisMiktari ?? 0),
          PartiNo: detail.PartiNo ?? '',
          KazanGiris: Number(detail.KazanGiris ?? 0),
          Status: Number(detail.Status ?? 1),
          SevkHazir: Number(detail.SevkHazir ?? 0),
        })),
      }

      await apiRequest(UPSERT_TRANSACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      showNotice('success', 'Sipariş başarıyla kaydedildi.')
      closeModal()
      await loadOrders(selectedFactoryId)
    } catch (requestError) {
      const message = requestError.message || 'Sipariş kaydedilirken bir hata oluştu.'
      setModalError(message)
      showNotice('error', message)
    } finally {
      setIsSaving(false)
    }
  }, [apiRequest, closeModal, loadOrders, orderForm, selectedFactoryId, showNotice])

  return (
    <section className="boyali-siparis-section" dir="ltr">
      <div className="content-header">
        <div>
          <h3>BOYALI SİPARİŞ TAKİP</h3>
          <p>Seçilen boya fabrikasına ait siparişleri listeleyin.</p>
        </div>
      </div>

      <div className="boyali-controls">
        <div className="field-group">
          <label htmlFor="boyali-factory-select">Boya Fabrikası</label>
          <select
            id="boyali-factory-select"
            value={selectedFactoryId}
            onChange={handleFactoryChange}
            disabled={isLoadingOptions}
          >
            {factoryOptions.map((factory) => (
              <option key={factory.id} value={factory.id}>
                {factory.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="inline-error error-box">{error}</p> : null}

      {isLoadingOrders ? (
        <p className="table-state">Siparişler yükleniyor...</p>
      ) : null}

      {!isLoadingOrders && orders.length === 0 && !error ? (
        <p className="table-state">Seçilen fabrika için sipariş bulunamadı.</p>
      ) : null}

      {orders.length > 0 ? (
        <div className="table-wrapper">
          <table className="boyali-orders-table">
            <thead>
              <tr>
                <th>Sipariş No</th>
                <th>Fabrika</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr
                  key={order.id ?? `${order.orderNo}-${index}`}
                  onClick={() => openOrderDetails(order)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{order.orderNo ?? '-'}</td>
                  <td>{getFactoryName(order.factoryId)}</td>
                  <td>{order.date ? new Date(order.date).toLocaleDateString('tr-TR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <BoyaliSiparisTakipModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSaving={isSaving}
        error={modalError}
        orderForm={orderForm}
        statusOptions={statusOptions}
        factoryNameLabel={orderForm.factoryName || getFactoryName(orderForm.factoryId)}
        onClose={closeModal}
        onSave={handleSave}
        onDetailFieldChange={updateDetailField}
        onAddDetailRow={addDetailRow}
        onDeleteDetailRow={deleteDetailRow}
        onCopyDetailRow={copyDetailRow}
        apiRequest={apiRequest}
        showNotice={showNotice}
      />
    </section>
  )
}

export default BoyaliSiparisTakipSection
