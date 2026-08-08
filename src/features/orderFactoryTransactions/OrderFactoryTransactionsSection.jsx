import { useCallback, useEffect, useState } from 'react'
import OrderFactoryTransactionsModal from './OrderFactoryTransactionsModal'

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
    <div style={{ direction: 'ltr', textAlign: 'left' }}>
      <header className="content-header">
        <div>
          <h3>BOYALI SİPARİŞ</h3>
          <p>Boya hareketlerini görüntüle ve sayfa kontrollerini yönet.</p>
        </div>
        <button type="button" className="add-button" onClick={openCreateModal}>
          YENİ SİPARİŞ
        </button>
      </header>

      <section className="filters-panel" aria-label="بحث حركة المصبغة">
        <div className="field-group">
          <label htmlFor="orderFactorySearch">Ara</label>
          <input
            id="orderFactorySearch"
            type="text"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value)
              setPageNumber(1)
            }}
            placeholder="Sipariş veya fabrika numarasına göre ara"
            dir="ltr"
            style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
          />
        </div>

        <div className="field-group page-size-group">
          <label htmlFor="orderFactoryPageSize">Sayfa boyutu</label>
          <select
            id="orderFactoryPageSize"
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
              <th style={{ textAlign: 'left' }}>Sipariş No</th>
              <th style={{ textAlign: 'left' }}>Fabrika</th>
              <th style={{ textAlign: 'left' }}>Tarih</th>
              <th style={{ textAlign: 'left' }}>Hareket Durumu</th>
              <th style={{ textAlign: 'left' }}>Detay Sayısı</th>
              <th style={{ textAlign: 'left' }}>Renkler</th>
              <th style={{ textAlign: 'left' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="table-state">
                  Hareketler yükleniyor...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-state">
                  Eşleşen veri bulunamadı.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id ?? transaction.orderNo}>
                  <td style={{ textAlign: 'left' }}>{transaction.orderNo ?? '-'}</td>
                  <td style={{ textAlign: 'left' }}>{transaction.factoryName ?? '-'}</td>
                  <td style={{ textAlign: 'left' }}>{transaction.date ? transaction.date.split('T')[0] : '-'}</td>
                  <td style={{ textAlign: 'left' }}>
                    <span className={`status-badge ${getStatusClass(transaction.transactionStatus)}`}>
                      {transaction.transactionStatusName ?? '-'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'left' }}>{transaction.detailsCount ?? '-'}</td>
                  <td style={{ textAlign: 'left' }}>{transaction.colors ?? '-'}</td>
                  <td style={{ textAlign: 'left' }}>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="action-btn edit"
                        onClick={() => openEditModal(transaction.id)}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className="action-btn delete"
                        onClick={() => deleteTransaction(transaction.id)}
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
            Sonuç sayısı: <strong>{totalCount}</strong>
          </p>
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className="pager-btn"
            disabled={pageNumber <= 1 || isLoading}
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
          >
            Önceki
          </button>
          <span>
            Sayfa {pageNumber} / {Math.max(Math.ceil(totalCount / pageSize), 1)}
          </span>
          <button
            type="button"
            className="pager-btn"
            disabled={pageNumber >= Math.max(Math.ceil(totalCount / pageSize), 1) || isLoading}
            onClick={() =>
              setPageNumber((prev) => Math.min(prev + 1, Math.max(Math.ceil(totalCount / pageSize), 1)))
            }
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
      return 'open'
    case 2:
      return 'completed'
    case 3:
      return 'closed'
    default:
      return 'default'
  }
}

export default OrderFactoryTransactionsSection
