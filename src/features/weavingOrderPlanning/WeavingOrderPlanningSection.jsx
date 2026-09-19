import { useCallback, useEffect, useState } from 'react'
import WeavingOrderPlanningModal from './WeavingOrderPlanningModal'
import ProductionPlanningModal from './ProductionPlanningModal'
import AddMachineYarnsModal from './AddMachineYarnsModal'

const WEAVING_ORDERS_URL = '/api/WeavingOrder'
const getTodayDate = () => new Date().toISOString().slice(0, 10)

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 })
}

const escapePrintHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

function WeavingOrderPlanningSection({ apiRequest, showNotice, isActive }) {
  const [orders, setOrders] = useState([])
  const [searchText, setSearchText] = useState('')
  const today = getTodayDate()
  const [optionDate, setOptionDate] = useState(false)
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isProductionReportLoading, setIsProductionReportLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isPlanningLoading, setIsPlanningLoading] = useState(false)
  const [planningError, setPlanningError] = useState('')
  const [isProductionPlanningOpen, setIsProductionPlanningOpen] = useState(false)
  const [isProductionPlanningLoading, setIsProductionPlanningLoading] = useState(false)
  const [productionPlanningError, setProductionPlanningError] = useState('')
  const [selectedFabric, setSelectedFabric] = useState(null)
  const [isMachineYarnsOpen, setIsMachineYarnsOpen] = useState(false)
  const [isMachineYarnsLoading, setIsMachineYarnsLoading] = useState(false)
  const [machineYarnsError, setMachineYarnsError] = useState('')
  const [machines, setMachines] = useState([])
  const [availableYarns, setAvailableYarns] = useState([])
  const [machineActionLoadingId, setMachineActionLoadingId] = useState(null)
  const [replacementYarns, setReplacementYarns] = useState([])
  const [replacementYarnLoadingId, setReplacementYarnLoadingId] = useState(null)
  const [replacementYarnChangingId, setReplacementYarnChangingId] = useState(null)
  const [selectedReplacementYarnId, setSelectedReplacementYarnId] = useState(null)
  const [selectedReplacementYarnValue, setSelectedReplacementYarnValue] = useState('')
  const [machineYarnForm, setMachineYarnForm] = useState({ machinePlans: [{ key: 0, machineId: '', yarnPlans: [{ key: 1, yarnId: '' }] }] })
  const [isAddingMachinePlan, setIsAddingMachinePlan] = useState(false)

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const query = new URLSearchParams({
        PageNumber: String(pageNumber),
        PageSize: String(pageSize),
        OptionDate: String(optionDate),
        DateFrom: optionDate && dateFrom ? dateFrom : today,
        DateTo: optionDate && dateTo ? dateTo : today,
      })

      if (searchText.trim()) {
        query.set('SearchText', searchText.trim())
      }

      const response = await apiRequest(`${WEAVING_ORDERS_URL}?${query.toString()}`)
      const data = response?.data || {}
      const items = Array.isArray(data.items) ? data.items : []

      setOrders(items)
      setTotalCount(Number(data.totalRecords ?? data.totalCount ?? items.length))
    } catch (requestError) {
      const message = requestError.message || 'Dokuma siparişleri yüklenemedi.'
      setError(message)
      setOrders([])
      setTotalCount(0)
      showNotice('error', message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, dateFrom, dateTo, optionDate, pageNumber, pageSize, searchText, showNotice, today])

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const timer = setTimeout(loadOrders, 300)
    return () => clearTimeout(timer)
  }, [isActive, loadOrders])

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)

  const handlePlanOrder = useCallback(async (order) => {
    if (!order?.id) {
      return
    }

    setSelectedOrder(null)
    setPlanningError('')
    setIsPlanningLoading(true)

    try {
      const response = await apiRequest(`${WEAVING_ORDERS_URL}/${order.id}`)
      setSelectedOrder(response?.data || {})
    } catch (requestError) {
      const message = requestError.message || 'Dokuma siparişi detayları yüklenemedi.'
      setPlanningError(message)
      showNotice('error', message)
    } finally {
      setIsPlanningLoading(false)
    }
  }, [apiRequest, showNotice])

  const closePlanningModal = useCallback(() => {
    if (isPlanningLoading) {
      return
    }

    setSelectedOrder(null)
    setPlanningError('')
  }, [isPlanningLoading])

  const openProductionPlanningModal = useCallback(async (detail) => {
    const detailId = detail?.id ?? detail?.Id

    setIsProductionPlanningOpen(true)
    setIsProductionPlanningLoading(true)
    setProductionPlanningError('')
    setSelectedFabric(detail || null)

    if (!detailId) {
      setProductionPlanningError('Kumaş detay bilgisi bulunamadı.')
      setIsProductionPlanningLoading(false)
      return
    }

    try {
      const response = await apiRequest(`${WEAVING_ORDERS_URL}/weavingOrderDetailMachinesGetByDetail/${detailId}`)
      setSelectedFabric(response?.data || {})
    } catch (requestError) {
      const message = requestError.message || 'Üretim planı detayları yüklenemedi.'
      setProductionPlanningError(message)
      showNotice('error', message)
    } finally {
      setIsProductionPlanningLoading(false)
    }
  }, [apiRequest, showNotice])

  const closeProductionPlanningModal = useCallback(() => {
    if (isProductionPlanningLoading) {
      return
    }

    setIsProductionPlanningOpen(false)
    setProductionPlanningError('')
    setSelectedFabric(null)
    setReplacementYarns([])
    setReplacementYarnLoadingId(null)
    setReplacementYarnChangingId(null)
    setSelectedReplacementYarnId(null)
    setSelectedReplacementYarnValue('')
  }, [isProductionPlanningLoading])

  const loadReplacementYarns = useCallback(async (yarn, machine) => {
    const machineYarnId = yarn?.machineYarnId
    const yarnGender = String(yarn?.yarnGender || '').trim()
    if (Number(machine?.isActive) !== 1 || !machineYarnId || !yarnGender || replacementYarnLoadingId) {
      return
    }

    setSelectedReplacementYarnId(machineYarnId)
    setSelectedReplacementYarnValue('')
    setReplacementYarnLoadingId(machineYarnId)
    setReplacementYarns([])

    try {
      const response = await apiRequest(`${WEAVING_ORDERS_URL}/yarnsGetAvailable?YarnGender=${encodeURIComponent(yarnGender)}`)
      setReplacementYarns(Array.isArray(response?.data) ? response.data : [])
    } catch (requestError) {
      setSelectedReplacementYarnId(null)
      showNotice('error', requestError.message || 'Uygun iplikler yüklenemedi.')
    } finally {
      setReplacementYarnLoadingId(null)
    }
  }, [apiRequest, replacementYarnLoadingId, showNotice])

  const selectReplacementYarn = useCallback((yarnId) => {
    setSelectedReplacementYarnValue(yarnId)
  }, [])

  const changeMachineYarn = useCallback(async (machine, yarn) => {
    const machineYarnId = Number(yarn?.machineYarnId)
    const newYarnId = Number(selectedReplacementYarnValue)
    if (Number(machine?.isActive) !== 1 || !machineYarnId || !newYarnId || replacementYarnChangingId) {
      return
    }

    const replacementYarn = replacementYarns.find((item) => Number(item.id) === newYarnId)
    if (!replacementYarn || !window.confirm('Bu makinedeki çalışan ipliği değiştirmek istediğinizden emin misiniz?')) {
      return
    }

    setReplacementYarnChangingId(machineYarnId)

    try {
      await apiRequest(`${WEAVING_ORDERS_URL}/weavingOrderDetailMachineYarnChangeYarn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          id: machineYarnId,
          newYarnId,
          reason: 'Kullanıcı tarafından iplik lotu değiştirildi.',
        }),
      })

      setSelectedFabric((previous) => previous ? {
        ...previous,
        machines: Array.isArray(previous.machines)
          ? previous.machines.map((item) => Number(item.machinePlanId) === Number(machine.machinePlanId) ? {
            ...item,
            yarns: Array.isArray(item.yarns) ? item.yarns.map((itemYarn) => Number(itemYarn.machineYarnId) === machineYarnId ? {
              ...itemYarn,
              yarnId: replacementYarn.id,
              yarnGender: replacementYarn.yarnGender,
              yarnLot: replacementYarn.lot,
              yarnPrice: replacementYarn.yarnPrice ?? itemYarn.yarnPrice,
              remainNetKg: replacementYarn.remainNetKg,
            } : itemYarn) : item.yarns,
          } : item)
          : previous.machines,
      } : previous)
      setSelectedReplacementYarnId(null)
      setSelectedReplacementYarnValue('')
      setReplacementYarns([])
      showNotice('success', 'Makinedeki iplik başarıyla değiştirildi.')
    } catch (requestError) {
      showNotice('error', requestError.message || 'Makinedeki iplik değiştirilemedi.')
    } finally {
      setReplacementYarnChangingId(null)
    }
  }, [apiRequest, replacementYarnChangingId, replacementYarns, selectedReplacementYarnValue, showNotice])

  const toggleMachinePause = useCallback(async (machine) => {
    const machinePlanId = Number(machine?.machinePlanId)
    if (Number(machine?.isActive) !== 1 || !machinePlanId || machineActionLoadingId) {
      return
    }

    const isPaused = Number(machine.isPaused) === 1
    const action = isPaused ? 'çalıştırma' : 'durdurma'
    if (!window.confirm(`Bu makineyi ${action} işlemini onaylıyor musunuz?`)) {
      return
    }

    setMachineActionLoadingId(machinePlanId)

    try {
      if (isPaused) {
        await apiRequest(`${WEAVING_ORDERS_URL}/weavingOrderDetailMachineResume/${machinePlanId}`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
        })
      } else {
        await apiRequest(`${WEAVING_ORDERS_URL}/weavingOrderDetailMachinePause`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            id: machinePlanId,
            pauseReason: 'Kullanıcı tarafından duraklatıldı.',
          }),
        })
      }

      setSelectedFabric((previous) => previous ? {
        ...previous,
        machines: Array.isArray(previous.machines)
          ? previous.machines.map((item) => Number(item.machinePlanId) === machinePlanId ? { ...item, isPaused: isPaused ? 0 : 1 } : item)
          : previous.machines,
      } : previous)
      showNotice('success', isPaused ? 'Makine çalıştırıldı.' : 'Makine duraklatıldı.')
    } catch (requestError) {
      showNotice('error', requestError.message || 'Makine durumu güncellenemedi.')
    } finally {
      setMachineActionLoadingId(null)
    }
  }, [apiRequest, machineActionLoadingId, showNotice])

  const removeMachine = useCallback(async (machine) => {
    const machinePlanId = Number(machine?.machinePlanId)
    if (Number(machine?.isActive) !== 1 || !machinePlanId || machineActionLoadingId) {
      return
    }

    if (!window.confirm('Bu makineyi üretim planından kaldırmak istediğinizden emin misiniz?')) {
      return
    }

    setMachineActionLoadingId(machinePlanId)

    try {
      await apiRequest(`${WEAVING_ORDERS_URL}/weavingOrderDetailMachineRemove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          id: machinePlanId,
          reason: 'Kullanıcı tarafından üretim planından kaldırıldı.',
        }),
      })

      setSelectedFabric((previous) => previous ? {
        ...previous,
        machines: Array.isArray(previous.machines)
          ? previous.machines.filter((item) => Number(item.machinePlanId) !== machinePlanId)
          : previous.machines,
      } : previous)
      showNotice('success', 'Makine üretim planından kaldırıldı.')
    } catch (requestError) {
      showNotice('error', requestError.message || 'Makine üretim planından kaldırılamadı.')
    } finally {
      setMachineActionLoadingId(null)
    }
  }, [apiRequest, machineActionLoadingId, showNotice])

  const openMachineYarnsModal = useCallback(async (detail) => {
    const factoryId = detail?.factoryId ?? detail?.FactoryId

    setIsMachineYarnsOpen(true)
    setIsMachineYarnsLoading(true)
    setMachineYarnsError('')
    setMachines([])
    setAvailableYarns([])
    setMachineYarnForm({ machinePlans: [{ key: Date.now(), machineId: '', yarnPlans: [{ key: Date.now() + 1, yarnId: '' }] }] })

    if (!factoryId) {
      setMachineYarnsError('Fabrika bilgisi bulunamadı.')
      setIsMachineYarnsLoading(false)
      return
    }

    try {
      const response = await apiRequest(`${WEAVING_ORDERS_URL}/getAllMachines?FactoryId=${factoryId}&IsAvailable=true`)
      const data = response?.data || {}
      setMachines(Array.isArray(data.machines) ? data.machines : [])
      setAvailableYarns(Array.isArray(data.availableYarns) ? data.availableYarns : [])
    } catch (requestError) {
      const message = requestError.message || 'Makineler ve iplikler yüklenemedi.'
      setMachineYarnsError(message)
      showNotice('error', message)
    } finally {
      setIsMachineYarnsLoading(false)
    }
  }, [apiRequest, showNotice])

  const closeMachineYarnsModal = useCallback(() => {
    if (isMachineYarnsLoading) {
      return
    }

    setIsMachineYarnsOpen(false)
    setMachineYarnsError('')
  }, [isMachineYarnsLoading])

  const addMachinePlan = useCallback(async (detail) => {
    const factoryId = detail?.factoryId ?? detail?.FactoryId
    if (!factoryId || isAddingMachinePlan) {
      return
    }

    setIsAddingMachinePlan(true)

    try {
      const response = await apiRequest(`${WEAVING_ORDERS_URL}/getAllMachines?FactoryId=${factoryId}&IsAvailable=true`)
      const data = response?.data || {}
      setMachines(Array.isArray(data.machines) ? data.machines : [])
      setAvailableYarns(Array.isArray(data.availableYarns) ? data.availableYarns : availableYarns)
      setMachineYarnForm((previous) => ({
        ...previous,
        machinePlans: [...previous.machinePlans, { key: Date.now(), machineId: '', yarnPlans: [{ key: Date.now() + 1, yarnId: '' }] }],
      }))
    } catch (requestError) {
      const message = requestError.message || 'Makineler yüklenemedi.'
      setMachineYarnsError(message)
      showNotice('error', message)
    } finally {
      setIsAddingMachinePlan(false)
    }
  }, [apiRequest, availableYarns, isAddingMachinePlan, showNotice])

  const removeMachinePlan = useCallback((index) => {
    setMachineYarnForm((previous) => ({
      ...previous,
      machinePlans: previous.machinePlans.filter((_, planIndex) => planIndex !== index),
    }))
  }, [])

  const updateMachineYarnField = useCallback((index, field, value, yarnIndex = null) => {
    setMachineYarnForm((previous) => ({
      ...previous,
      machinePlans: previous.machinePlans.map((plan, planIndex) => {
        if (planIndex !== index) {
          return plan
        }

        if (yarnIndex !== null) {
          return {
            ...plan,
            yarnPlans: plan.yarnPlans.map((yarnPlan, itemIndex) => itemIndex === yarnIndex ? { ...yarnPlan, [field]: value } : yarnPlan),
          }
        }

        return { ...plan, [field]: value }
      }),
    }))
  }, [])

  const linkMachine = useCallback(async (index) => {
    const plan = machineYarnForm.machinePlans[index]
    const detailId = selectedFabric?.weavingOrderDetailId ?? selectedFabric?.id

    if (!plan?.machineId || !detailId) {
      return
    }

    setMachineYarnForm((previous) => ({
      ...previous,
      machinePlans: previous.machinePlans.map((item, itemIndex) => itemIndex === index ? { ...item, machineLinkLoading: true, machineLinkError: '' } : item),
    }))

    try {
      const response = await apiRequest(`${WEAVING_ORDERS_URL}/weavingOrderDetailMachineAdd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          weavingOrderDetailId: Number(detailId) || 0,
          machineId: Number(plan.machineId) || 0,
          notes: 'plan test',
        }),
      })
      const machineLinkId = response?.data?.id
      setMachineYarnForm((previous) => ({
        ...previous,
        machinePlans: previous.machinePlans.map((item, itemIndex) => itemIndex === index ? { ...item, machineLinkId, machineLinkLoading: false } : item),
      }))
      showNotice('success', 'Makine kumaşa başarıyla bağlandı.')
    } catch (requestError) {
      const message = requestError.message || 'Makine kumaşa bağlanamadı.'
      setMachineYarnForm((previous) => ({
        ...previous,
        machinePlans: previous.machinePlans.map((item, itemIndex) => itemIndex === index ? { ...item, machineLinkLoading: false, machineLinkError: message } : item),
      }))
      showNotice('error', message)
    }
  }, [apiRequest, machineYarnForm.machinePlans, selectedFabric, showNotice])

  const addYarnPlan = useCallback((machineIndex) => {
    setMachineYarnForm((previous) => ({
      ...previous,
      machinePlans: previous.machinePlans.map((plan, planIndex) => planIndex === machineIndex ? {
        ...plan,
        yarnPlans: [...(plan.yarnPlans ?? []), { key: Date.now(), yarnId: '' }],
      } : plan),
    }))
  }, [])

  const removeYarnPlan = useCallback((machineIndex, yarnIndex) => {
    setMachineYarnForm((previous) => ({
      ...previous,
      machinePlans: previous.machinePlans.map((plan, planIndex) => planIndex === machineIndex ? {
        ...plan,
        yarnPlans: plan.yarnPlans.filter((_, itemIndex) => itemIndex !== yarnIndex),
      } : plan),
    }))
  }, [])

  const linkYarn = useCallback(async (machineIndex, yarnIndex) => {
    const plan = machineYarnForm.machinePlans[machineIndex]
    const yarnPlan = plan?.yarnPlans?.[yarnIndex]

    if (!plan?.machineLinkId || !yarnPlan?.yarnId) {
      return
    }

    setMachineYarnForm((previous) => ({
      ...previous,
      machinePlans: previous.machinePlans.map((item, itemIndex) => itemIndex === machineIndex ? {
        ...item,
        yarnPlans: item.yarnPlans.map((itemYarn, itemYarnIndex) => itemYarnIndex === yarnIndex ? { ...itemYarn, yarnLinkLoading: true, yarnLinkError: '' } : itemYarn),
      } : item),
    }))

    try {
      await apiRequest(`${WEAVING_ORDERS_URL}/weavingOrderDetailMachineYarnAdd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          weavingOrderDetailMachineId: Number(plan.machineLinkId) || 0,
          yarnId: Number(yarnPlan.yarnId) || 0,
        }),
      })
      setMachineYarnForm((previous) => ({
        ...previous,
        machinePlans: previous.machinePlans.map((item, itemIndex) => itemIndex === machineIndex ? {
          ...item,
          yarnPlans: item.yarnPlans.map((itemYarn, itemYarnIndex) => itemYarnIndex === yarnIndex ? { ...itemYarn, yarnLinkId: yarnPlan.yarnId, yarnLinkLoading: false } : itemYarn),
        } : item),
      }))
      showNotice('success', 'İplik makineye başarıyla bağlandı.')
    } catch (requestError) {
      const message = requestError.message || 'İplik makineye bağlanamadı.'
      setMachineYarnForm((previous) => ({
        ...previous,
        machinePlans: previous.machinePlans.map((item, itemIndex) => itemIndex === machineIndex ? {
          ...item,
          yarnPlans: item.yarnPlans.map((itemYarn, itemYarnIndex) => itemYarnIndex === yarnIndex ? { ...itemYarn, yarnLinkLoading: false, yarnLinkError: message } : itemYarn),
        } : item),
      }))
      showNotice('error', message)
    }
  }, [apiRequest, machineYarnForm.machinePlans, showNotice])

  const printProductionReport = useCallback(async () => {
    if (isProductionReportLoading) {
      return
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) {
      showNotice('error', 'Yazdırma penceresi açılamadı. Tarayıcı açılır pencere iznini kontrol edin.')
      return
    }

    setIsProductionReportLoading(true)

    try {
      const response = await apiRequest(`${WEAVING_ORDERS_URL}/weavingOrderProductionReport/0`)
      const reports = Array.isArray(response?.data) ? response.data : []
      const reportSections = reports.map((report) => {
        const fabricDetails = Array.isArray(report?.fabricDetails) ? report.fabricDetails : []
        const fabricRows = fabricDetails.map((detail) => {
          const machines = Array.isArray(detail?.machines) ? detail.machines : []
          const machineNumbers = machines
            .map((machine) => machine?.machineNo ?? machine?.makineNo ?? '')
            .filter(Boolean)
            .join(', ') || '-'

          return `<tr><td>${escapePrintHtml(detail?.fabricGender || '-')}</td><td>${escapePrintHtml(machineNumbers)}</td></tr>`
        }).join('') || '<tr><td colspan="2">Kumaş bilgisi bulunamadı.</td></tr>'

        return `<section class="order-section">
          <h2>${escapePrintHtml(report?.weavingOrderName || '-')}</h2>
          <table>
            <thead><tr><th>Kumaş Cinsi</th><th>Makineler</th></tr></thead>
            <tbody>${fabricRows}</tbody>
          </table>
        </section>`
      }).join('')

      const reportHtml = `<!doctype html>
        <html lang="tr">
          <head>
            <meta charset="UTF-8" />
            <title>Üretim Raporu</title>
            <style>
              @page { margin: 14mm; }
              * { box-sizing: border-box; }
              body { margin: 0; color: #111827; font-family: Arial, sans-serif; }
              main { max-width: 900px; margin: 0 auto; }
              .report-header { margin-bottom: 24px; text-align: center; }
              .logo { width: 320px; max-height: 135px; object-fit: contain; margin-bottom: 16px; }
              h1 { margin: 0; color: #0f4c81; font-size: 22px; text-align: center; }
              .order-section { margin-bottom: 24px; page-break-inside: avoid; }
              h2 { margin: 0 0 8px; padding: 8px 10px; background: #e0f2fe; color: #075985; font-size: 16px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
              th { background: #e2e8f0; color: #334155; font-size: 12px; }
              td { font-size: 13px; }
            </style>
          </head>
          <body>
            <main>
              <header class="report-header">
                <img class="logo" src="/logo.png" alt="Judi Mensucat" />
                <h1>PLANLAMA</h1>
              </header>
              ${reportSections || '<p>Kumaş ve makine bilgisi bulunamadı.</p>'}
            </main>
          </body>
        </html>`

      printWindow.document.write(reportHtml)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    } catch (requestError) {
      printWindow.close()
      showNotice('error', requestError.message || 'Üretim raporu alınamadı.')
    } finally {
      setIsProductionReportLoading(false)
    }
  }, [apiRequest, isProductionReportLoading, showNotice])

  return (
    <div className="space-y-4" dir="ltr">
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-2xl font-bold text-sky-900">DOKUMA SİPARİŞİ PLANLAMA</h3>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="weavingOrderPlanningSearch" className="mb-1 block text-xs font-medium text-slate-600">Arama</label>
            <input
              id="weavingOrderPlanningSearch"
              type="text"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value)
                setPageNumber(1)
              }}
              placeholder="Sipariş numarası veya isim"
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white"
            />
          </div>
          <div className="min-w-[120px]">
            <label htmlFor="weavingOrderPlanningDateToggle" className="mb-1 block text-xs font-medium text-slate-600">Tarih filtresi</label>
            <div className="flex h-10 items-center gap-2 rounded-lg bg-slate-100 px-3">
              <input
                id="weavingOrderPlanningDateToggle"
                type="checkbox"
                checked={optionDate}
                onChange={(event) => {
                  setOptionDate(event.target.checked)
                  setPageNumber(1)
                }}
                className="h-4 w-4 rounded border-slate-300 text-sky-700"
              />
              <label htmlFor="weavingOrderPlanningDateToggle" className="text-sm text-slate-700">Tarih aralığı</label>
            </div>
          </div>
          <div className="min-w-[140px]">
            <label htmlFor="weavingOrderPlanningDateFrom" className="mb-1 block text-xs font-medium text-slate-600">Başlangıç</label>
            <input
              id="weavingOrderPlanningDateFrom"
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value)
                setPageNumber(1)
              }}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white"
            />
          </div>
          <div className="min-w-[140px]">
            <label htmlFor="weavingOrderPlanningDateTo" className="mb-1 block text-xs font-medium text-slate-600">Bitiş</label>
            <input
              id="weavingOrderPlanningDateTo"
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value)
                setPageNumber(1)
              }}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white"
            />
          </div>
          <div className="w-24">
            <label htmlFor="weavingOrderPlanningPageSize" className="mb-1 block text-xs font-medium text-slate-600">Sayfa</label>
            <select
              id="weavingOrderPlanningPageSize"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPageNumber(1)
              }}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </header>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Sipariş No</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">İsim</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Tarih</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Durum</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Gerekli</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Üretilen</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Kalan</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">İlerleme</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">Dokuma siparişleri yükleniyor...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">Eşleşen sipariş bulunamadı.</td></tr>
              ) : orders.map((order, index) => (
                <tr key={order.id ?? `${order.orderNo ?? 'row'}-${index}`} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-900">{(pageNumber - 1) * pageSize + index + 1}</td>
                  <td className="px-4 py-4 text-slate-700">{order.orderNo || '-'}</td>
                  <td className="px-4 py-4 text-slate-700">{order.name || '-'}</td>
                  <td className="px-4 py-4 text-slate-700">{order.date || '-'}</td>
                  <td className="px-4 py-4 text-slate-700">{order.weavingOrderStatusName || '-'}</td>
                  <td className="px-4 py-4 text-right text-slate-700">{formatNumber(order.totalRequiredWeight)}</td>
                  <td className="px-4 py-4 text-right text-slate-700">{formatNumber(order.totalProducedWeight)}</td>
                  <td className="px-4 py-4 text-right text-slate-700">{formatNumber(order.totalRemainingWeight)}</td>
                  <td className="px-4 py-4 text-right font-medium text-slate-700">{formatNumber(order.progressPercent)}%</td>
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handlePlanOrder(order)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-lg text-emerald-700 transition hover:bg-emerald-100"
                      aria-label={`Planla ${order.orderNo || order.name || ''}`}
                      title="Planla"
                    >
                      ⛭
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">Toplam hareket: <strong className="text-slate-900">{totalCount}</strong></div>
        <button
          type="button"
          onClick={printProductionReport}
          disabled={isProductionReportLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">🖨️</span>
          {isProductionReportLoading ? 'Rapor hazırlanıyor...' : 'Üretim Raporunu Yazdır'}
        </button>
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={pageNumber <= 1 || isLoading} onClick={() => setPageNumber((page) => page - 1)}>Önceki</button>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">Sayfa {pageNumber} / {totalPages}</span>
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={pageNumber >= totalPages || isLoading} onClick={() => setPageNumber((page) => page + 1)}>Sonraki</button>
        </div>
      </footer>

      <WeavingOrderPlanningModal
        order={selectedOrder}
        isLoading={isPlanningLoading}
        error={planningError}
        onClose={closePlanningModal}
        onOpenProductionPlanning={openProductionPlanningModal}
      />

      <ProductionPlanningModal
        isOpen={isProductionPlanningOpen}
        isLoading={isProductionPlanningLoading}
        error={productionPlanningError}
        order={selectedOrder}
        detail={selectedFabric}
        onClose={closeProductionPlanningModal}
        onOpenMachineYarns={openMachineYarnsModal}
        onToggleMachinePause={toggleMachinePause}
        onRemoveMachine={removeMachine}
        machineActionLoadingId={machineActionLoadingId}
        onLoadReplacementYarns={loadReplacementYarns}
        onSelectReplacementYarn={selectReplacementYarn}
        onChangeMachineYarn={changeMachineYarn}
        replacementYarns={replacementYarns}
        replacementYarnLoadingId={replacementYarnLoadingId}
        replacementYarnChangingId={replacementYarnChangingId}
        selectedReplacementYarnId={selectedReplacementYarnId}
        selectedReplacementYarnValue={selectedReplacementYarnValue}
      />

      <AddMachineYarnsModal
        isOpen={isMachineYarnsOpen}
        isLoading={isMachineYarnsLoading}
        error={machineYarnsError}
        order={selectedOrder}
        detail={selectedFabric}
        machines={machines}
        availableYarns={availableYarns}
        form={machineYarnForm}
        isAddingMachinePlan={isAddingMachinePlan}
        onFieldChange={updateMachineYarnField}
        onAddMachinePlan={addMachinePlan}
        onRemoveMachinePlan={removeMachinePlan}
        onLinkMachine={linkMachine}
        onAddYarnPlan={addYarnPlan}
        onRemoveYarnPlan={removeYarnPlan}
        onLinkYarn={linkYarn}
        onClose={closeMachineYarnsModal}
      />
    </div>
  )
}

export default WeavingOrderPlanningSection
