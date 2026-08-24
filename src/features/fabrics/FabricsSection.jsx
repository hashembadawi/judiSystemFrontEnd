import React, { useCallback, useEffect, useState } from 'react'

const DAILY_FABRICS_URL = '/api/DailyHamFabricsTransaction'

function FabricsSection({ apiRequest, showNotice, isActive }) {
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
    <>
      <div className="space-y-6" dir="ltr">
        <section className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6" aria-label="Günlük kumaş hareketleri arama">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-sky-900">Günlük Kumaş Hareketi</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-5">
            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="fabricsSearch" className="text-xs font-medium text-slate-600">Arama</label>
              <input
                id="fabricsSearch"
                type="text"
                value={searchText}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Sipariş, kumaş türü veya kişi ile arayın"
                className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-slate-50"
                dir="ltr"
                style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
              />
            </div>

            <div className="flex items-center gap-2 text-left">
              <label htmlFor="optionDate" className="text-sm font-medium text-slate-700">Tarihi Uygula</label>
              <input
                id="optionDate"
                type="checkbox"
                checked={optionDate}
                onChange={(event) => handleOptionDateChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="dateFrom" className="text-xs font-medium text-slate-600">Başlangıç Tarihi</label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(event) => handleDateFromChange(event.target.value)}
                className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
                dir="ltr"
                style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="dateTo" className="text-xs font-medium text-slate-600">Bitiş Tarihi</label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(event) => handleDateToChange(event.target.value)}
                className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
                dir="ltr"
                style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="fabricsPageSize" className="text-xs font-medium text-slate-600">Sayfa Boyutu</label>
              <select
                id="fabricsPageSize"
                value={pageSize}
                onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block" dir="ltr">
            <table className="w-full text-sm" style={{ direction: 'ltr' }} dir="ltr">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Vardiya</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Tarih</span></th>
                  <th className="px-6 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Sorumlu Personel</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">Hareketler yükleniyor...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">Eşleşen veri bulunamadı.</td>
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
                          onClick={() => handleToggleExpand(transactionId)}
                          className="cursor-pointer transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 text-left"><span className="text-sm text-slate-900">{transaction.shift ?? '-'}</span></td>
                          <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '-'}</span></td>
                          <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{transaction.personal ?? '-'}</span></td>
                        </tr>
                        {isExpanded ? (
                          <tr className="bg-slate-50">
                            <td colSpan={3} className="px-6 py-4">
                              {isDetailLoading(transactionId) ? (
                                <p className="py-8 text-center text-sm text-slate-500">Alt satırlar yükleniyor...</p>
                              ) : details.length > 0 ? (
                                <div className="overflow-x-auto" dir="ltr">
                                  <table className="w-full text-sm" style={{ direction: 'ltr' }} dir="ltr">
                                    <thead>
                                      <tr className="border-b border-slate-200 bg-white">
                                        {detailColumns.map((column) => (
                                          <th key={column} className="px-4 py-2 text-left"><span className="text-xs font-semibold text-slate-600">{getDetailColumnTitle(column)}</span></th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                      {details.map((detail, detailIndex) => (
                                        <tr key={detail.id ?? detailIndex} className="hover:bg-slate-100">
                                          {detailColumns.map((column) => (
                                            <td key={column} className="px-4 py-2 text-left"><span className="text-xs text-slate-700">{detail[column] ?? '-'}</span></td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="py-4 text-center text-sm text-slate-500">Bu hareket için alt veri yok.</p>
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

          <div className="md:hidden" dir="ltr">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-slate-500">Hareketler yükleniyor...</div>
            ) : transactions.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-500">Eşleşen veri bulunamadı.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {transactions.map((transaction, index) => {
                  const transactionId = transaction.id
                  const isExpanded = isTransactionExpanded(transactionId)
                  const details = detailRows[transactionId] || []

                  return (
                    <div key={`transaction-${transactionId ?? index}`} className="border-b border-slate-200 p-4">
                      <div
                        onClick={() => handleToggleExpand(transactionId)}
                        className="cursor-pointer space-y-2 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">{transaction.shift ?? '-'}</span>
                          <span className="text-sm text-slate-500">{isExpanded ? '▼' : '▶'}</span>
                        </div>
                        <div className="text-sm text-slate-600">{transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '-'}</div>
                        <div className="text-xs text-slate-600">Personel: {transaction.personal ?? '-'}</div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                          {isDetailLoading(transactionId) ? (
                            <p className="text-center text-sm text-slate-500">Alt satırlar yükleniyor...</p>
                          ) : details.length > 0 ? (
                            details.map((detail, detailIndex) => (
                              <div key={detail.id ?? detailIndex} className="rounded-lg bg-slate-50 p-3 text-xs">
                                {Object.entries(detail).map(([key, value]) => (
                                  <div key={key} className="flex justify-between gap-2 text-slate-700">
                                    <span className="font-medium">{getDetailColumnTitle(key)}:</span>
                                    <span>{value ?? '-'}</span>
                                  </div>
                                ))}
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-sm text-slate-500">Alt veri yok</p>
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

        <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-left text-sm text-slate-700">
            <p>Toplam sonuç: <strong className="text-slate-900">{totalCount}</strong> | Sayfa: <strong className="text-slate-900">{pageNumber}</strong> / <strong className="text-slate-900">{Math.max(Math.ceil(totalCount / pageSize), 1)}</strong></p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pageNumber <= 1 || isLoading}
              onClick={() => handlePageChange(Math.max(pageNumber - 1, 1))}
            >
              Önceki
            </button>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
              Sayfa {pageNumber}
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pageNumber >= Math.max(Math.ceil(totalCount / pageSize), 1) || isLoading}
              onClick={() => handlePageChange(Math.min(pageNumber + 1, Math.max(Math.ceil(totalCount / pageSize), 1)))}
            >
              Sonraki
            </button>
          </div>
        </footer>
      </div>
    </>
  )
}

export default FabricsSection
