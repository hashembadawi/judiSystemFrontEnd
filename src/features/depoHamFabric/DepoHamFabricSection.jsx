import { useCallback, useEffect, useMemo, useState } from 'react'
import './DepoHamFabricSection.css'

const DEPOT_HAM_FABRIC_URL = '/api/DepoHamFabric/getDepoFabrics'

function DepoHamFabricSection({ apiRequest, showNotice, isActive }) {
  const [searchText, setSearchText] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadItems = useCallback(async () => {
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

      const response = await apiRequest(`${DEPOT_HAM_FABRIC_URL}?${query.toString()}`)
      const payload = response.data || {}

      setItems(Array.isArray(payload.items) ? payload.items : [])
      setTotalCount(payload.totalRecords ?? 0)
    } catch (requestError) {
      const message = requestError.message || 'Ham fabric stok verileri alınırken hata oluştu.'
      setError(message)
      setItems([])
      setTotalCount(0)
      showNotice('error', message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, pageNumber, pageSize, searchText, showNotice])

  const handleSearchChange = (value) => {
    setSearchText(value)
    setPageNumber(1)
  }

  useEffect(() => {
    if (!isActive) {
      return
    }

    loadItems()
  }, [searchText, pageSize, pageNumber, isActive, loadItems])

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const fabricType = String(item.fabricType ?? '').trim().toLowerCase()
        const count = Number(item.count ?? 0)
        const weight = Number(item.weight ?? 0)

        if (fabricType === 'saglam') {
          acc.saglamCount += count
          acc.saglamWeight += weight
        }

        if (fabricType === 'hata') {
          acc.hataCount += count
          acc.hataWeight += weight
        }

        acc.totalCount += count
        acc.totalWeight += weight
        return acc
      },
      {
        saglamCount: 0,
        saglamWeight: 0,
        hataCount: 0,
        hataWeight: 0,
        totalCount: 0,
        totalWeight: 0,
      },
    )
  }, [items])

  return (
    <div className="depo-ham-fabric-section" dir="ltr">
      <header className="content-header">
        <div>
          <h3>DEPO HAM KUMAŞ</h3>
          <p>Ham kumaş stoklarını sayfalandırılmış şekilde görüntüleyin.</p>
        </div>
      </header>

      <section className="filters-panel fabrics-filters" aria-label="Depo ham kumaş filtreleme">
        <div className="field-group">
          <label htmlFor="depoHamSearch">Arama</label>
          <input
            id="depoHamSearch"
            type="text"
            value={searchText}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Sipariş, kumaş adı veya fabrika ile ara"
          />
        </div>

        <div className="date-row">
          <div className="field-group">
            <label htmlFor="depoHamPageSize">Sayfa boyutu</label>
            <select
              id="depoHamPageSize"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </section>

      {error ? <p className="error-box inline-error">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kumaş Cinsiyeti</th>
              <th>GR</th>
              <th>LOT</th>
              <th>Adet</th>
              <th>Ağırlık</th>
              <th>Fabrika</th>
              <th>Sipariş No</th>
              <th>Kumaş Türü</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="table-state">Veriler yükleniyor...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-state">Eşleşen veri bulunamadı.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id ?? `${item.orderId}-${item.factoryId}-${item.fabricLOT}`}>
                  <td>{item.fabricGender ?? '-'}</td>
                  <td>{item.fabricGSM ?? '-'}</td>
                  <td>{item.fabricLOT ?? '-'}</td>
                  <td>{item.count ?? '-'}</td>
                  <td>{item.weight ?? '-'}</td>
                  <td>{item.factoryName ?? '-'}</td>
                  <td>{item.orderNo ?? '-'}</td>
                  <td>{item.fabricType ?? '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="table-footer">
        <div className="table-footer-summary">
          <p>
            Toplam sonuç: <strong>{totalCount}</strong> | Sayfa: <strong>{pageNumber}</strong> / <strong>{Math.max(Math.ceil(totalCount / pageSize), 1)}</strong>
          </p>
          <p>
            Toplam Adet: <strong>{totals.totalCount}</strong> | Toplam Ağırlık: <strong>{totals.totalWeight}</strong>
          </p>
          <p>
            Sağlam: <strong>{totals.saglamCount}</strong> adet, <strong>{totals.saglamWeight}</strong> ağırlık
          </p>
          <p>
            Hata: <strong>{totals.hataCount}</strong> adet, <strong>{totals.hataWeight}</strong> ağırlık
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
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, Math.max(Math.ceil(totalCount / pageSize), 1)))}
          >
            Sonraki
          </button>
        </div>
      </footer>
    </div>
  )
}

export default DepoHamFabricSection
