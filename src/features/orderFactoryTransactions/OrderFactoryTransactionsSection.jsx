import { useCallback, useEffect, useState } from 'react'
import OrderFactoryTransactionsModal from './OrderFactoryTransactionsModal'
import { buildButtonClasses, buildInputClasses } from '../../styles/designSystem'

const ORDER_FACTORY_TRANSACTIONS_URL = '/api/order-factory-transactions'
const getTodayDate = () => new Date().toISOString().slice(0, 10)

function OrderFactoryTransactionsSection({ apiRequest, showNotice, isActive }) {
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
  const [fabricTypesOptions, setFabricTypesOptions] = useState([])
  const [transactionForm, setTransactionForm] = useState({
    Id: 0,
    OrderNo: '',
    FactoryId: '',
    Date: getTodayDate(),
    TransactionStatus: 1,
    Details: [
      {
        Id: 0,
        Etiket_Basligi: '',
        FabricGender: '',
        En: '',
        Gr: '',
        Renk: '',
        RenkCode: '',
        SiparisMiktari: '',
        Fiyat: 0,
      },
    ],
  })

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

      const response = await apiRequest(`${ORDER_FACTORY_TRANSACTIONS_URL}?${query.toString()}`)
      const data = response.data || {}

      setTransactions(Array.isArray(data.items) ? data.items : [])
      setTotalCount(data.totalRecords ?? 0)
    } catch (requestError) {
      const message = requestError.message || 'Hareket verileri alınırken bir hata oluştu.'
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

      const confirmed = window.confirm('Bu hareketi silmek istediğinizden emin misiniz?')
      if (!confirmed) {
        return
      }

      try {
        await apiRequest(`${ORDER_FACTORY_TRANSACTIONS_URL}/${id}`, {
          method: 'DELETE',
        })

        showNotice('success', 'Hareket başarıyla silindi.')
        loadTransactions()
      } catch (requestError) {
        const message = requestError.message || 'Hareket silinirken bir hata oluştu.'
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
    setFabricTypesOptions([])
    setTransactionForm({
      Id: 0,
      OrderNo: '',
      FactoryId: '',
      Date: getTodayDate(),
      TransactionStatus: 1,
      Details: [
        {
          Id: 0,
          Etiket_Basligi: '',
          FabricGender: '',
          En: '',
          Gr: '',
          Renk: '',
          RenkCode: '',
          SiparisMiktari: '',
          Fiyat: 0,
        },
      ],
    })

    try {
      const response = await apiRequest('/api/fill-options?requestedValues=1')
      const data = response.data || {}
      setCustomerOrdersOptions(Array.isArray(data.customerOrders) ? data.customerOrders : [])
      setBoyaFactoriesOptions(Array.isArray(data.boyaFactories) ? data.boyaFactories : [])
      setFabricTypesOptions(Array.isArray(data.items) ? data.items.map((it) => it.value ?? it) : [])
    } catch (requestError) {
      const message = requestError.message || 'Hareket seçenekleri alınırken bir hata oluştu.'
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
      

      try {
        const [optionsResponse, transactionResponse] = await Promise.all([
          apiRequest('/api/fill-options?requestedValues=1'),
          apiRequest(`${ORDER_FACTORY_TRANSACTIONS_URL}/${id}`),
        ])

        const optionsData = optionsResponse.data || {}
        const transactionData = transactionResponse.data || {}

        setCustomerOrdersOptions(Array.isArray(optionsData.customerOrders) ? optionsData.customerOrders : [])
        setBoyaFactoriesOptions(Array.isArray(optionsData.boyaFactories) ? optionsData.boyaFactories : [])
        setFabricTypesOptions(Array.isArray(optionsData.items) ? optionsData.items.map((it) => it.value ?? it) : [])
        setTransactionForm({
          Id: transactionData.id || 0,
          OrderNo: transactionData.orderNo ?? transactionData.OrderNo ?? '',
          FactoryId: transactionData.factoryId ?? '',
          Date: transactionData.date ? transactionData.date.split('T')[0] : getTodayDate(),
          TransactionStatus: transactionData.transactionStatus ?? 1,
          Details: Array.isArray(transactionData.details)
            ? transactionData.details.map((detail) => ({
                Id: detail.id || 0,
                Etiket_Basligi: detail.etiket_Basligi ?? detail.Etiket_Basligi ?? '',
                FabricGender: detail.fabricGender ?? detail.FabricGender ?? '',
                En: detail.en ?? '',
                Gr: detail.gr ?? '',
                Renk: detail.renk ?? detail.Renk ?? '',
                RenkCode: detail.renkCode ?? detail.RenkCode ?? '',
                SiparisMiktari: detail.siparisMiktari ?? detail.SiparisMiktari ?? '',
                Fiyat: detail.fiyat ?? detail.Fiyat ?? detail.price ?? detail.Price ?? 0,
              }))
            : [
                {
                  Id: 0,
                  Etiket_Basligi: '',
                  FabricGender: '',
                  En: '',
                  Gr: '',
                  Renk: '',
                  RenkCode: '',
                  SiparisMiktari: '',
                  Fiyat: 0,
                },
              ],
        })

        // previously we loaded available sent fabrics per factory; removed per-request fabric fetching
      } catch (requestError) {
        const message = requestError.message || 'Hareket verileri alınırken bir hata oluştu.'
        setModalError(message)
        showNotice('error', message)
        setIsModalOpen(false)
      } finally {
        setIsModalLoading(false)
      }
    }, [apiRequest, showNotice])

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
          Etiket_Basligi: '',
          FabricGender: '',
          En: '',
          Gr: '',
          Renk: '',
          RenkCode: '',
          SiparisMiktari: '',
          Fiyat: 0,
        },
      ],
    }))
  }, [])

  const copyDetailRow = useCallback((index) => {
    setTransactionForm((prev) => {
      const detailToCopy = prev.Details[index]
      if (!detailToCopy) {
        return prev
      }
      
      // إنشاء نسخة من الصف مع تعيين Id إلى 0 (للإشارة أنه صف جديد)
      const copiedDetail = {
        ...detailToCopy,
        Id: 0,
      }
      
      return {
        ...prev,
        Details: [...prev.Details, copiedDetail],
      }
    })
  }, [])

  const removeDetailRow = useCallback((index) => {
    setTransactionForm((prev) => ({
      ...prev,
      Details: prev.Details.filter((_, rowIndex) => rowIndex !== index),
    }))
  }, [])

  const saveTransaction = useCallback(async () => {
    setModalError('')

    if (!transactionForm.Details.length) {
      setModalError('En az bir detay satırı eklenmelidir.')
      return
    }

    const hasInvalidDetailRow = transactionForm.Details.some(
      (detail) =>
        !String(detail.FabricGender ?? '').trim() ||
        !String(detail.Renk ?? '').trim() ||
        String(detail.SiparisMiktari ?? '').trim() === '',
    )

    if (hasInvalidDetailRow) {
      setModalError('Her detay satırı için KUMAŞ CİNSİ, Renk ve Sipariş Miktarı alanları zorunludur.')
      return
    }

    setIsModalSaving(true)

    try {
      const payload = {
        id: Number(transactionForm.Id) || 0,
        orderNo: String(transactionForm.OrderNo ?? '').trim(),
        factoryId: Number(transactionForm.FactoryId) || 0,
        date: transactionForm.Date,
        transactionStatus: Number(transactionForm.TransactionStatus) || 1,
        details: transactionForm.Details.map((detail) => ({
          id: Number(detail.Id) || 0,
          etiket_Basligi: detail.Etiket_Basligi || '',
          fabricGender: detail.FabricGender || '',
          en: Number(detail.En) || 0,
          gr: Number(detail.Gr) || 0,
          renk: detail.Renk || '',
          renkCode: detail.RenkCode || '',
          siparisMiktari: Number(detail.SiparisMiktari) || 0,
          Fiyat: Number(detail.Fiyat ?? detail.Price ?? 0) || 0,
        })),
      }

      await apiRequest(`${ORDER_FACTORY_TRANSACTIONS_URL}/upsert`, {
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
      const message = transactionForm.Id ? 'Hareket başarıyla güncellendi.' : 'Yeni hareket başarıyla kaydedildi.'
      showNotice('success', message)
    } catch (requestError) {
      const message = requestError.message || 'Hareket kaydedilirken bir hata oluştu.'
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

  return (
    <div className="space-y-6" dir="ltr" style={{ direction: 'ltr' }}>
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm ring-1 ring-slate-100 sm:px-6" dir="ltr">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-200 pb-4" dir="ltr">
          <div className="text-left">
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Boyalı Sipariş</h3>
          </div>
          <button type="button" className={buildButtonClasses('primary')} onClick={openCreateModal}>
            Yeni Sipariş
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-4" dir="ltr">
          <div className="min-w-[220px] flex-1 space-y-2" dir="ltr">
            <label htmlFor="orderFactorySearch" className="block text-sm font-medium text-slate-700 text-left">Ara</label>
            <input
              id="orderFactorySearch"
              type="text"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value)
                setPageNumber(1)
              }}
              placeholder="Sipariş veya fabrika numarasına göre ara"
              className={`${buildInputClasses(false)} w-full`}
              dir="ltr"
              style={{ unicodeBidi: 'plaintext', textAlign: 'left', fontSize: '11px' }}
            />
          </div>

          <div className="min-w-[150px] space-y-2" dir="ltr">
            <label htmlFor="orderFactoryPageSize" className="block text-sm font-medium text-slate-700 text-left">Sayfa boyutu</label>
            <select
              id="orderFactoryPageSize"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPageNumber(1)
              }}
              className={`${buildInputClasses(false)} w-full`}
              dir="ltr"
              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 text-left" dir="ltr">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100" dir="ltr">
        <div className="overflow-x-auto" dir="ltr">
          <table className="w-full text-sm" dir="ltr" style={{ direction: 'ltr' }}>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Sipariş No</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Fabrika</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Tarih</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Hareket Durumu</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Detay Sayısı</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Renkler</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">İşlemler</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200" dir="ltr">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-left">Hareketler yükleniyor...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-left">Eşleşen veri bulunamadı.</td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id ?? transaction.orderNo} className="hover:bg-slate-50" dir="ltr">
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-900 font-medium">{transaction.orderNo ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{transaction.factoryName ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{transaction.date ? transaction.date.split('T')[0] : '-'}</span></td>
                    <td className="px-6 py-4 text-left">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(transaction.transactionStatus)}`}>
                        {transaction.transactionStatusName ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{transaction.detailsCount ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{transaction.colors ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-start gap-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(transaction.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-300 bg-blue-50 text-blue-600 text-base transition hover:bg-blue-100"
                          title="Düzenle"
                          aria-label={`Düzenle ${transaction.orderNo ?? ''}`}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(transaction.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-300 bg-red-50 text-red-600 text-base transition hover:bg-red-100"
                          title="Sil"
                          aria-label={`Sil ${transaction.orderNo ?? ''}`}
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

      <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between sm:px-6" dir="ltr">
        <div className="text-left text-sm text-slate-700" dir="ltr">
          <p className="text-left">Sonuç sayısı: <strong className="text-slate-900">{totalCount}</strong></p>
        </div>
        <div className="flex items-center justify-end gap-2" dir="ltr">
          <button
            type="button"
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1 || isLoading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Önceki
          </button>
          <span className="text-sm text-slate-600">
            Sayfa {pageNumber} / {Math.max(Math.ceil(totalCount / pageSize), 1)}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, Math.max(Math.ceil(totalCount / pageSize), 1)))}
            disabled={pageNumber >= Math.max(Math.ceil(totalCount / pageSize), 1) || isLoading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      </footer>

      <OrderFactoryTransactionsModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSaving={isModalSaving}
        error={modalError}
        form={transactionForm}
        customerOrdersOptions={customerOrdersOptions}
        boyaFactoriesOptions={boyaFactoriesOptions}
        fabricTypesOptions={fabricTypesOptions}
        onFieldChange={updateTransactionField}
        onDetailFieldChange={updateDetailField}
        onAddDetailRow={addDetailRow}
        onCopyDetailRow={copyDetailRow}
        onRemoveDetailRow={removeDetailRow}
        onClose={closeModal}
        onSave={saveTransaction}
      />
    </div>
  )
}

function getStatusClass(status) {
  switch (status) {
    case 1:
      return 'bg-blue-100 text-blue-800'
    case 2:
      return 'bg-green-100 text-green-800'
    case 3:
      return 'bg-slate-100 text-slate-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

export default OrderFactoryTransactionsSection
