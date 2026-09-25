import { useCallback, useEffect, useRef, useState } from 'react'
import BoyaliSiparisTakipModal from './BoyaliSiparisTakipModal'
import BoyaliSiparisDetailsModal from './BoyaliSiparisDetailsModal'

const FILL_OPTIONS_URL = '/api/fill-options?requestedValues=1'
const BOYALI_SIPARIS_URL = '/api/order-factory-transaction-takip/fillBoyaliSiparis'
const TRANSACTION_DETAIL_URL = '/api/order-factory-transaction-takip'
const ORDER_DETAILS_URL = '/api/order-factory-transactions/getDetails'
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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [detailsModalError, setDetailsModalError] = useState('')
  const [selectedOrderDetails, setSelectedOrderDetails] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalError, setModalError] = useState('')
  const [statusOptions, setStatusOptions] = useState([])
  const [orderForm, setOrderForm] = useState({
    id: 0,
    detailId: 0,
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

  const openOrderDetails = useCallback(
    async (order) => {
      if (!order?.id) {
        return
      }

      setSelectedOrder(order)
      setSelectedOrderDetails([])
      setDetailsModalError('')
      setIsDetailsModalOpen(true)
      setIsDetailsLoading(true)

      try {
        const response = await apiRequest(`${ORDER_DETAILS_URL}/${order.id}`)
        const details = Array.isArray(response?.data) ? response.data : []
        setSelectedOrderDetails(details)
      } catch (requestError) {
        const message = requestError.message || 'Sipariş detayları alınamadı.'
        setDetailsModalError(message)
        showNotice('error', message)
      } finally {
        setIsDetailsLoading(false)
      }
    },
    [apiRequest, showNotice],
  )

  const closeOrderDetails = useCallback(() => {
    if (isDetailsLoading) {
      return
    }

    setIsDetailsModalOpen(false)
    setDetailsModalError('')
    setSelectedOrderDetails([])
    setSelectedOrder(null)
  }, [isDetailsLoading])

  const openTrackingDetailModal = useCallback(
    async (detail) => {
      if (!detail?.id) {
        return
      }

      setModalError('')
      setIsModalOpen(true)
      setIsModalLoading(true)
      setStatusOptions([])
      setOrderForm({
        id: 0,
        detailId: detail.id,
        orderNo: selectedOrder?.orderNo ?? '',
        factoryId: selectedOrder?.factoryId ?? 0,
        factoryName: selectedOrder?.factoryName ?? '',
        date: selectedOrder?.date ? selectedOrder.date.split('T')[0] : '',
        details: [],
      })

      try {
        const [detailResponse, optionsResponse] = await Promise.all([
          apiRequest(`${TRANSACTION_DETAIL_URL}?Id=${detail.id}`),
          apiRequest(FILL_OPTIONS_URL),
        ])
        const trackingDetails = Array.isArray(detailResponse?.data) ? detailResponse.data : []
        const optionsData = optionsResponse?.data || {}
        const existingTrackingDetail = trackingDetails[0]

        setStatusOptions(Array.isArray(optionsData.siparisDurum) ? optionsData.siparisDurum : [])

        setOrderForm((prev) => ({
          ...prev,
          id: existingTrackingDetail?.id ?? 0,
          detailId: detail.id,
          details: trackingDetails.map((trackingDetail) => ({
            id: trackingDetail.id ?? 0,
            etiket_Basligi: trackingDetail.etiket_Basligi ?? '',
            fabricGender: trackingDetail.fabricGender ?? '',
            lot: trackingDetail.fabricLot ?? trackingDetail.lot ?? trackingDetail.FabricLot ?? '',
            en: trackingDetail.en ?? 0,
            gr: trackingDetail.gr ?? 0,
            renk: trackingDetail.renk ?? '',
            renkCode: trackingDetail.renkCode ?? '',
            siparisMiktari: trackingDetail.siparisMiktari ?? 0,
            partiNo: trackingDetail.partiNo ?? trackingDetail.PartiNo ?? '',
            kazanGiris: trackingDetail.kazanGiris ?? trackingDetail.KazanGiris ?? 0,
            status: trackingDetail.status ?? trackingDetail.Status ?? 1,
            statusName: trackingDetail.statusName ?? '',
            durum: trackingDetail.durum ?? '',
            sevkHazir: trackingDetail.sevkHazir ?? trackingDetail.SevkHazir ?? 0,
            girisTopSayisi: trackingDetail.girisTopSayisi ?? trackingDetail.GirisTopSayisi ?? 0,
            cikisTopSayisi: trackingDetail.cikisTopSayisi ?? trackingDetail.CikisTopSayisi ?? 0,
          })),
        }))
        setIsDetailsModalOpen(false)
      } catch (requestError) {
        const message = requestError.message || 'تفاصيل المتابعة غير متوفرة.'
        setModalError(message)
        showNotice('error', message)
        setIsModalOpen(false)
      } finally {
        setIsModalLoading(false)
      }
    },
    [apiRequest, selectedOrder, showNotice],
  )

  const closeModal = useCallback(() => {
    if (isSaving) {
      return
    }

    setIsModalOpen(false)
    setModalError('')
    setIsDetailsModalOpen(Boolean(selectedOrder))
    setOrderForm({
      id: 0,
      detailId: 0,
      orderNo: '',
      factoryId: 0,
      factoryName: '',
      date: '',
      details: [],
    })
  }, [isSaving, selectedOrder])

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
          partiNo: '',
          kazanGiris: '',
          status: 1,
          sevkHazir: 0,
          girisTopSayisi: 0,
          cikisTopSayisi: 0,
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
        detailId: orderForm.detailId ?? 0,
        orderNo: orderForm.orderNo,
        factoryId: orderForm.factoryId,
        details: orderForm.details.map((detail) => ({
          etiket_Basligi: detail.etiket_Basligi ?? '',
          fabricGender: detail.fabricGender ?? '',
          fabricLot: detail.lot ?? detail.fabricLot ?? detail.FabricLot ?? '',
          en: Number(detail.en ?? 0),
          gr: Number(detail.gr ?? 0),
          renk: detail.renk ?? '',
          renkCode: detail.renkCode ?? '',
          siparisMiktari: Number(detail.siparisMiktari ?? 0),
          partiNo: detail.partiNo ?? detail.PartiNo ?? '',
          kazanGiris: Number(detail.kazanGiris ?? detail.KazanGiris ?? 0),
          status: Number(detail.status ?? detail.Status ?? 1),
          sevkHazir: Number(detail.sevkHazir ?? detail.SevkHazir ?? 0),
          girisTopSayisi: Number(detail.girisTopSayisi ?? detail.GirisTopSayisi ?? detail.topSayi ?? detail.TopSayi ?? 0),
          cikisTopSayisi: Number(detail.cikisTopSayisi ?? detail.CikisTopSayisi ?? 0),
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
    <section className="space-y-6" dir="ltr" style={{ direction: 'ltr' }}>
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6" dir="ltr">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-sky-900">Boyalı Sipariş Takip</h3>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="boyali-factory-select" className="text-xs font-medium text-slate-600 text-left">
              Boya Fabrikası
            </label>
            <select
              id="boyali-factory-select"
              value={selectedFactoryId}
              onChange={handleFactoryChange}
              disabled={isLoadingOptions}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
              dir="ltr"
              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
            >
              {factoryOptions.map((factory) => (
                <option key={factory.id} value={factory.id}>
                  {factory.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 text-left" dir="ltr">
          {error}
        </div>
      ) : null}

      {isLoadingOrders ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          Siparişler yükleniyor...
        </div>
      ) : null}

      {!isLoadingOrders && orders.length === 0 && !error ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          Seçilen fabrika için sipariş bulunamadı.
        </div>
      ) : null}

      {orders.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100" dir="ltr">
          <div className="overflow-x-auto" dir="ltr">
            <table className="w-full text-sm" dir="ltr" style={{ direction: 'ltr' }}>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Sipariş No</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Fabrika</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Tarih</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200" dir="ltr">
                {orders.map((order, index) => (
                  <tr
                    key={order.id ?? `${order.orderNo}-${index}`}
                    onClick={() => openOrderDetails(order)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-left"><span className="text-sm font-medium text-slate-900">{order.orderNo ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{getFactoryName(order.factoryId)}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{order.date ? new Date(order.date).toLocaleDateString('tr-TR') : '-'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      <BoyaliSiparisDetailsModal
        isOpen={isDetailsModalOpen}
        isLoading={isDetailsLoading}
        error={detailsModalError}
        order={selectedOrder}
        details={selectedOrderDetails}
        onClose={closeOrderDetails}
        onDetailClick={openTrackingDetailModal}
      />
    </section>
  )
}

export default BoyaliSiparisTakipSection
