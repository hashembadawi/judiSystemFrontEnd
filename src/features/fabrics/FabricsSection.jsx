import React, { useCallback, useEffect, useState } from 'react'
import './FabricsSection.css'

const DAILY_FABRICS_URL = '/api/DailyHamFabricsTransaction'

function FabricsSection({ apiRequest, showNotice, isActive, currentUserName = '' }) {
  const [searchText, setSearchText] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [optionDate, setOptionDate] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedTransactions, setExpandedTransactions] = useState([])
  const [loadingDetails, setLoadingDetails] = useState([])
  const [detailRows, setDetailRows] = useState({})

  const loadTransactions = useCallback(
    async ({ page = pageNumber, size = pageSize, search = searchText, dateOption = optionDate, from = dateFrom, to = dateTo } = {}) => {
      setError('')
      setIsLoading(true)

      try {
        const query = new URLSearchParams({
          pageNumber: String(page),
          pageSize: String(size),
          searchText: search.trim(),
          OptionDate: String(dateOption),
          DateFrom: from,
          DateTo: to,
        })

        const response = await apiRequest(`${DAILY_FABRICS_URL}?${query.toString()}`)
        const data = response.data || {}

        setTransactions(Array.isArray(data.items) ? data.items : [])
        setTotalCount(data.totalRecords ?? 0)
        setPageNumber(page)
        setPageSize(size)
      } catch (requestError) {
        if (requestError instanceof TypeError) {
          setError('تعذر الاتصال بالخادم. تأكد أن API متاحة على judimensucat.runasp.net وأن الخادم يسمح بطلبات CORS.')
        } else {
          setError(requestError.message || 'Günlük kumaş hareketleri alınırken bir hata oluştu.')
        }

        setTransactions([])
        setTotalCount(0)
        showNotice('error', requestError.message || 'Günlük kumaş hareketleri alınırken bir hata oluştu.')
      } finally {
        setIsLoading(false)
      }
    },
    [apiRequest, dateFrom, dateTo, optionDate, pageNumber, pageSize, searchText, showNotice],
  )

  const handleFetchTransactions = () => {
    loadTransactions({ page: 1, size: pageSize })
  }

  const handleSearchChange = (value) => {
    setSearchText(value)
    loadTransactions({ page: 1, size: pageSize, search: value })
  }

  const handleOptionDateChange = (value) => {
    setOptionDate(value)
    loadTransactions({ page: 1, size: pageSize, dateOption: value })
  }

  const handleDateFromChange = (value) => {
    setDateFrom(value)
    loadTransactions({ page: 1, size: pageSize, from: value })
  }

  const handleDateToChange = (value) => {
    setDateTo(value)
    loadTransactions({ page: 1, size: pageSize, to: value })
  }

  const handlePageChange = (newPage) => {
    loadTransactions({ page: newPage, size: pageSize })
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    loadTransactions({ page: 1, size: newSize })
  }

  useEffect(() => {
    if (isActive) {
      loadTransactions({ page: 1, size: pageSize })
    }
  }, [isActive, loadTransactions, pageSize])

  const isTransactionExpanded = (transactionId) => expandedTransactions.includes(transactionId)
  const isDetailLoading = (transactionId) => loadingDetails.includes(transactionId)

  const detailColumnTitles = {
    fabricName: 'Kumaş Adı',
    fabricGender: 'Kumaş Cinsiyeti',
    fabricGsm: 'GR',
    productionDate: 'Üretim Tarihi',
    quantity: 'Miktar',
    totalCount: 'Toplam Adet',
    unit: 'Birim',
    color: 'Renk',
    batchNumber: 'Parti No',
    machine: 'Makine',
    shift: 'Vardiya',
    personal: 'Personel',
    date: 'Tarih',
    price: 'Fiyat',
    totalWeight: 'Toplam Ağırlık',
    factoryName: 'Fabrika Adı',
    orderNo: 'Sipariş No',
    fabricType: 'Kumaş Cinsi',
    total: 'Toplam',
    weight: 'Ağırlık',
    width: 'En',
    length: 'Uzunluk',
    description: 'Açıklama',
  }

  const getDetailColumnTitle = (columnKey) => {
    if (detailColumnTitles[columnKey]) {
      return detailColumnTitles[columnKey]
    }

    const normalized = String(columnKey)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_\-]+/g, ' ')
      .trim()

    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }

  const handleToggleExpand = async (transactionId) => {
    if (isTransactionExpanded(transactionId)) {
      setExpandedTransactions((prev) => prev.filter((id) => id !== transactionId))
      return
    }

    if (detailRows[transactionId]) {
      setExpandedTransactions((prev) => [...prev, transactionId])
      return
    }

    setLoadingDetails((prev) => [...prev, transactionId])

    try {
      const response = await apiRequest(`${DAILY_FABRICS_URL}/getExpand?Id=${transactionId}`)
      const details = response?.data ?? response

      setDetailRows((prev) => ({
        ...prev,
        [transactionId]: Array.isArray(details) ? details : [],
      }))
      setExpandedTransactions((prev) => [...prev, transactionId])
    } catch (requestError) {
      const message = requestError instanceof TypeError
        ? 'Sunucuya bağlanılamadı. API 5018 portunda çalışıyor mu kontrol edin.'
        : requestError.message || 'Alt satırlar alınırken bir hata oluştu.'

      showNotice('error', message)
    } finally {
      setLoadingDetails((prev) => prev.filter((id) => id !== transactionId))
    }
  }

  return (
    <div className="fabrics-section" dir="ltr">
      <header className="content-header">
        <div>
          <h3>GÜNLÜK KUMAŞ HAREKETİ</h3>
          <p>Günlük kumaş hareketlerini görüntüleyin ve sunucudan verileri yükleyin.</p>
        </div>
      </header>

      <section className="filters-panel fabrics-filters" aria-label="Günlük kumaş hareketleri arama">
        <div className="field-group">
          <label htmlFor="fabricsSearch">Arama</label>
          <input
            id="fabricsSearch"
            type="text"
            value={searchText}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Sipariş numarası, kumaş türü veya kişi ile arayın"
          />
        </div>

        <div className="date-row">
          <div className="field-group">
            <label htmlFor="optionDate">Tarihi uygulayın</label>
            <input
              id="optionDate"
              type="checkbox"
              checked={optionDate}
              onChange={(event) => handleOptionDateChange(event.target.checked)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="dateFrom">Başlangıç tarihi</label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(event) => handleDateFromChange(event.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="dateTo">Bitiş tarihi</label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(event) => handleDateToChange(event.target.value)}
            />
          </div>
        </div>

        <div className="field-group page-size-group">
          <label htmlFor="fabricsPageSize">Sayfa boyutu</label>
          <select
            id="fabricsPageSize"
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
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
              <th>Vardiya</th>
              <th>Tarih</th>
              <th>Sorumlu personel</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="table-state">Hareketler yükleniyor...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={3} className="table-state">Eşleşen veri bulunamadı.</td>
              </tr>
            ) : (
              transactions.map((transaction, index) => {
                const transactionId = transaction.id
                const isExpanded = isTransactionExpanded(transactionId)
                const details = detailRows[transactionId] || []
                const detailColumns = details.length > 0 ? Object.keys(details[0]) : []

                return (
                  <React.Fragment key={`transaction-${transactionId ?? index}`}>
                    <tr
                      className={`expandable-row ${isExpanded ? 'expanded-parent' : ''}`}
                      onClick={() => handleToggleExpand(transactionId)}
                    >
                      <td>{transaction.shift ?? '-'}</td>
                      <td>{transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '-'}</td>
                      <td>{transaction.personal ?? '-'}</td>
                    </tr>
                    {isExpanded ? (
                      <tr className="expanded-row">
                        <td colSpan={3}>
                          {isDetailLoading(transactionId) ? (
                            <p className="table-state">Alt satırlar yükleniyor...</p>
                          ) : details.length > 0 ? (
                            <div className="nested-table-wrapper">
                              <table className="nested-table">
                                <thead>
                                  <tr>
                                    {detailColumns.map((column) => (
                                      <th key={column}>{getDetailColumnTitle(column)}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {details.map((detail, detailIndex) => (
                                    <tr key={detail.id ?? detailIndex}>
                                      {detailColumns.map((column) => (
                                        <td key={column}>{detail[column] ?? '-'}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="table-state">Bu hareket için alt veri yok.</p>
                          )}
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
            Toplam sonuç: <strong>{totalCount}</strong> | Sayfa: <strong>{pageNumber}</strong> / <strong>{Math.max(Math.ceil(totalCount / pageSize), 1)}</strong>
          </p>
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className="pager-btn"
            disabled={pageNumber <= 1 || isLoading}
            onClick={() => handlePageChange(Math.max(pageNumber - 1, 1))}
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
            onClick={() => handlePageChange(Math.min(pageNumber + 1, Math.max(Math.ceil(totalCount / pageSize), 1)))}
          >
            Sonraki
          </button>
        </div>
      </footer>
    </div>
  )
}

export default FabricsSection
