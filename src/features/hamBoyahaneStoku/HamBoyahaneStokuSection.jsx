import { useCallback, useEffect, useState } from 'react'

const FILL_OPTIONS_URL = '/api/fill-options?requestedValues=1'
const DEPOT_FABRICS_URL = '/api/order-factory-transactions/getDepoFabrics'

function HamBoyahaneStokuSection({ apiRequest, showNotice, isActive }) {
  const [factoryOptions, setFactoryOptions] = useState([{ id: 0, name: 'Tümü' }])
  const [selectedFactoryId, setSelectedFactoryId] = useState('0')
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadStock = useCallback(
    async (factoryId = '0') => {
      setError('')
      setIsLoading(true)

      try {
        const response = await apiRequest(`${DEPOT_FABRICS_URL}/${factoryId}`)
        const payload = response?.data || {}
        setItems(Array.isArray(payload.items) ? payload.items : [])
      } catch (requestError) {
        const message = requestError.message || 'Ham boyahane stok verileri alınamadı.'
        setItems([])
        setError(message)
        showNotice('error', message)
      } finally {
        setIsLoading(false)
      }
    },
    [apiRequest, showNotice],
  )

  const loadOptions = useCallback(async () => {
    try {
      const response = await apiRequest(FILL_OPTIONS_URL)
      const options = Array.isArray(response?.data?.boyaFactories) ? response.data.boyaFactories : []
      setFactoryOptions([{ id: 0, name: 'Tümü' }, ...options])
    } catch (requestError) {
      const message = requestError.message || 'Boya fabrikaları alınamadı.'
      setError(message)
      showNotice('error', message)
    }
  }, [apiRequest, showNotice])

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    void loadOptions()
    void loadStock('0')
    return undefined
  }, [isActive, loadOptions, loadStock])

  const handleFactoryChange = async (event) => {
    const nextFactoryId = event.target.value
    setSelectedFactoryId(nextFactoryId)
    await loadStock(nextFactoryId)
  }

  const totalWeight = items.reduce((total, item) => total + (Number(item.totalWeight) || 0), 0)

  return (
    <div className="space-y-6" dir="ltr">
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-sky-900">BOYAHANE HAM STOK</h3>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="hamBoyahaneFactory" className="text-xs font-medium text-slate-600">Boya Fabrikası</label>
            <select
              id="hamBoyahaneFactory"
              value={selectedFactoryId}
              onChange={handleFactoryChange}
              disabled={isLoading}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
              dir="ltr"
              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
            >
              {factoryOptions.map((factory) => (
                <option key={factory.id} value={factory.id}>
                  {factory.name ?? factory.label ?? factory.value ?? '-'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm" dir="ltr" style={{ direction: 'ltr' }}>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Kumaş Cinsi</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">GR</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">LOT</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Toplam Ağırlık</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">BoyaHane</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Veriler yükleniyor...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Eşleşen stok bulunamadı.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-left text-slate-900">{item.fabricGender ?? '-'}</td>
                    <td className="px-6 py-4 text-left text-slate-700">{item.fabricGr ?? '-'}</td>
                    <td className="px-6 py-4 text-left text-slate-700">{item.fabricLot ?? '-'}</td>
                    <td className="px-6 py-4 text-left text-slate-700">{item.totalWeight ?? '-'}</td>
                    <td className="px-6 py-4 text-left text-slate-700">{item.factoryName ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 shadow-sm sm:px-6">
        Toplam kayıt: <strong className="text-slate-900">{items.length}</strong>
        <span className="mx-2">|</span>
        Toplam ağırlık: <strong className="text-slate-900">{totalWeight}</strong>
      </footer>
    </div>
  )
}

export default HamBoyahaneStokuSection
