import { useCallback, useEffect, useMemo, useState } from 'react'
import JsBarcode from 'jsbarcode'
import './App.css'
import OrdersSection from './features/orders/OrdersSection'
import UsersSection from './features/users/UsersSection'
import FabricsSection from './features/fabrics/FabricsSection'
import AddFabricTransactionModal from './features/fabrics/AddFabricTransactionModal'
import HamBoyaTransactionsSection from './features/hamBoyaTransactions/HamBoyaTransactionsSection'
import YarnsSection from './features/yarns/YarnsSection'
import YarnWeavingTransactionsSection from './features/yarnWeavingTransactions/YarnWeavingTransactionsSection'
import OrderFactoryTransactionsSection from './features/orderFactoryTransactions/OrderFactoryTransactionsSection'
import BoyaliSiparisTakipSection from './features/boyaliSiparisTakip/BoyaliSiparisTakipSection'
import DepoHamFabricSection from './features/depoHamFabric/DepoHamFabricSection'
import WeavingOrdersSection from './features/weavingOrders/WeavingOrdersSection'
import WeavingOrderPlanningSection from './features/weavingOrderPlanning/WeavingOrderPlanningSection'
import FasonHamEntrySection from './features/fasonHamEntry/FasonHamEntrySection'
import FasonHamEntryModal from './features/fasonHamEntry/FasonHamEntryModal'
import { loginRequest, requestApi } from './services/api'

const TOKEN_KEY = 'judi_auth_token'
const DAILY_FABRICS_URL = '/api/DailyHamFabricsTransaction'
const FASON_HAM_ENTRY_URL = '/api/FasonHamEntry'
const getTodayDate = () => new Date().toISOString().slice(0, 10)
const getCurrentDateTime = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
const escapePrintHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const printSavedFabricRoll = (roll) => {
  const weight = roll?.weight ?? roll?.Weight ?? ''
  const barcodeElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  JsBarcode(barcodeElement, String(weight), {
    format: 'CODE128',
    displayValue: true,
    text: `${weight} kg`,
    height: 54,
    width: 2,
    margin: 8,
  })

  const printWindow = window.open('', '_blank', 'width=520,height=700')
  if (!printWindow) {
    return false
  }

  const value = (key, fallbackKey) => roll?.[key] ?? roll?.[fallbackKey] ?? ''
  const reportHtml = `<!doctype html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <title>Top Etiketi</title>
        <style>
          @page { size: 80mm 120mm; margin: 6mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111827; font-family: Arial, sans-serif; }
          main { width: 100%; text-align: center; }
          h1 { margin: 0 0 16px; font-size: 20px; }
          .info { width: 100%; border-collapse: collapse; text-align: left; }
          .info th, .info td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
          .info th { width: 38%; background: #f3f4f6; color: #4b5563; font-size: 12px; font-weight: 400; }
          .info td { font-size: 13px; font-weight: 700; overflow-wrap: anywhere; }
          .barcode { margin-top: 22px; width: 100%; }
        </style>
      </head>
      <body>
        <main>
          <h1>Top Bilgileri</h1>
          <table class="info">
            <tbody>
              <tr><th>Kumaş Cinsi</th><td>${escapePrintHtml(value('fabricGender', 'FabricGender'))}</td></tr>
              <tr><th>Lot</th><td>${escapePrintHtml(value('fabricLot', 'FabricLot'))}</td></tr>
              <tr><th>Kumaş Gramajı</th><td>${escapePrintHtml(value('fabricGr', 'FabricGr'))}</td></tr>
              <tr><th>Sipariş No</th><td>${escapePrintHtml(value('orderNo', 'OrderNo'))}</td></tr>
              <tr><th>Makine Operatörü</th><td>${escapePrintHtml(value('operator', 'Operator'))}</td></tr>
            </tbody>
          </table>
          <div class="barcode">${barcodeElement.outerHTML}</div>
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

  return true
}
const toDateTimeLocal = (value) => {
  if (!value) {
    return getCurrentDateTime()
  }

  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const formatFabricGenderDisplay = (value) => {
  if (value == null) {
    return ''
  }

  const text = String(value).trim()
  if (!text) {
    return ''
  }

  const ratioMatch = text.match(/^(.*?)(\d+\s*\/\s*\d+(?:\s*\/\s*\d+)?)\s*$/)
  if (ratioMatch) {
    const prefix = ratioMatch[1].trim()
    const ratio = ratioMatch[2].trim()

    if (prefix && ratio) {
      return `${ratio} ${prefix}`
    }
  }

  return text
}

const getOptionDisplayText = (item) => {
  if (item == null) {
    return ''
  }

  if (typeof item === 'string') {
    return formatFabricGenderDisplay(item)
  }

  if (typeof item === 'object') {
    const text = (
      item.label ||
      item.text ||
      item.name ||
      item.orderNo ||
      item.OrderNo ||
      item.orderNumber ||
      item.valueName ||
      item.value ||
      item.factoryName ||
      ''
    )

    return formatFabricGenderDisplay(text)
  }

  return formatFabricGenderDisplay(String(item))
}

function App() {
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [authData, setAuthData] = useState(null)

  const [activeOperation, setActiveOperation] = useState('users')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [notice, setNotice] = useState(null)
  const currentUserType = Number(authData?.user?.userType ?? authData?.user?.userTypeValue ?? authData?.user?.UserType ?? authData?.user?.type ?? 0)
  const isRestrictedFabricInspectorUser = currentUserType === 6
  const isProductionManagerUser = currentUserType === 4
  const isDyeFollowUpUser = currentUserType === 5
  const [pendingRequests, setPendingRequests] = useState(0)
  const [isAddFabricModalOpen, setIsAddFabricModalOpen] = useState(false)
  const [isAddFabricModalLoading, setIsAddFabricModalLoading] = useState(false)
  const [isAddFabricMachineLoading, setIsAddFabricMachineLoading] = useState(false)
  const [savingAddFabricDetailIndex, setSavingAddFabricDetailIndex] = useState(null)
  const [addFabricModalError, setAddFabricModalError] = useState('')
  const [isFasonHamEntryModalOpen, setIsFasonHamEntryModalOpen] = useState(false)
  const [isFasonHamEntryModalLoading, setIsFasonHamEntryModalLoading] = useState(false)
  const [isFasonHamEntryModalSaving, setIsFasonHamEntryModalSaving] = useState(false)
  const [fasonHamEntryModalError, setFasonHamEntryModalError] = useState('')
  const [fasonHamEntryForm, setFasonHamEntryForm] = useState({
    id: 0,
    entryDate: getCurrentDateTime(),
    factoryId: '',
    personalName: '',
    details: [
      {
        id: 0,
          machineId: '',
        rollCount: '',
        weight: '',
        fabricType: 1,
      },
    ],
  })
  const [fasonHamEntryFactoryOptions, setFasonHamEntryFactoryOptions] = useState([])
  const [fasonAvailableMachines, setFasonAvailableMachines] = useState([])
  const [fasonHamEntryRefreshKey, setFasonHamEntryRefreshKey] = useState(0)
  const [operatorOptions, setOperatorOptions] = useState([])
  const [activeMachinePlans, setActiveMachinePlans] = useState([])
  const [addFabricForm, setAddFabricForm] = useState({
    Id: 0,
    Shift: 'A',
    Date: getTodayDate(),
    Personal: '',
    Details: [
      {
        Weight: '',
        Makine: '',
      },
    ],
  })

  const FABRIC_TYPE_OPTIONS = useMemo(
    () => [
      { id: 1, text: 'sağlam' },
      { id: 2, text: 'hata' },
    ],
    [],
  )

  const SHIFT_OPTIONS = useMemo(() => ['A', 'B'], [])

  const showNotice = useCallback((type, message) => {
    setNotice({ type, message })
  }, [])

  useEffect(() => {
    if (isRestrictedFabricInspectorUser) {
      if (activeOperation !== 'fabricEntry') {
        setActiveOperation('fabricEntry')
      }
      return
    }

    if (isProductionManagerUser) {
      const allowedOperations = ['depoHamFabric', 'weavingOrders', 'weavingOrderPlanning', 'fabrics', 'fasonHamEntry']
      if (!allowedOperations.includes(activeOperation)) {
        setActiveOperation('depoHamFabric')
      }
      return
    }

    if (isDyeFollowUpUser) {
      const allowedOperations = ['depoHamFabric', 'boyaliSiparis', 'orderFactory', 'fasonHamEntry']
      if (!allowedOperations.includes(activeOperation)) {
        setActiveOperation('depoHamFabric')
      }
      return
    }

    if (activeOperation === 'fabricEntry') {
      setActiveOperation('users')
    }
  }, [activeOperation, isDyeFollowUpUser, isProductionManagerUser, isRestrictedFabricInspectorUser])

  useEffect(() => {
    if (!notice) {
      return undefined
    }

    const timer = setTimeout(() => {
      setNotice(null)
    }, 3500)

    return () => clearTimeout(timer)
  }, [notice])

  const withGlobalLoading = useCallback(async (requestCallback) => {
    setPendingRequests((prev) => prev + 1)

    try {
      return await requestCallback()
    } finally {
      setPendingRequests((prev) => Math.max(prev - 1, 0))
    }
  }, [])

  const apiRequest = useCallback(
    async (url, options = {}) => {
      return requestApi({
        url,
        options,
        token: authData?.token,
        withLoading: withGlobalLoading,
      })
    },
    [authData?.token, withGlobalLoading],
  )

  const openAddFabricModal = useCallback(async () => {
    setAddFabricModalError('')
    setIsAddFabricModalOpen(true)
    setIsAddFabricModalLoading(true)
    setActiveMachinePlans([])
    setAddFabricForm({
      Id: 0,
      Shift: 'A',
      Date: getTodayDate(),
      Personal: authData?.user?.userName || authData?.user?.name || userName || '',
      Details: [
        {
          Weight: '',
          Makine: '',
          Operator: '',
          fabricType: 1,
          isSaved: false,
        },
      ],
    })

    try {
      const [optionsResponse, machinesResponse] = await Promise.all([
        apiRequest('/api/fill-options?requestedValues=1'),
        apiRequest('/api/DailyHamFabricsTransaction/GetMachinesActivePlans?FactoryId=1'),
      ])
      const data = optionsResponse.data || {}
      setOperatorOptions(Array.isArray(data.operatorsNames) ? data.operatorsNames.map((item) => item.operatorName ?? item.name ?? item) : [])
      setActiveMachinePlans(Array.isArray(machinesResponse?.data) ? machinesResponse.data : [])
    } catch (requestError) {
      const message = requestError.message || 'Seçenekler alınırken bir hata oluştu.'
      setAddFabricModalError(message)
      showNotice('error', message)
    } finally {
      setIsAddFabricModalLoading(false)
    }
  }, [apiRequest, authData, userName, showNotice])

  const closeAddFabricModal = useCallback(() => {
    setIsAddFabricModalOpen(false)
    setAddFabricModalError('')
  }, [])

  const openFasonHamEntryModal = useCallback(async (transactionId = null) => {
    setFasonHamEntryModalError('')
    setIsFasonHamEntryModalOpen(true)
    setIsFasonHamEntryModalLoading(true)
    setFasonHamEntryFactoryOptions([])
    setFasonAvailableMachines([])
    setFasonHamEntryForm({
      id: 0,
      entryDate: getCurrentDateTime(),
      factoryId: '',
      personalName: authData?.user?.userName || authData?.user?.name || userName || '',
      details: [
        {
          id: 0,
          machineId: '',
          rollCount: '',
          weight: '',
          fabricType: 1,
        },
      ],
    })

    try {
      const response = await apiRequest('/api/fill-options?requestedValues=1')
      const data = response.data || {}
      setFasonHamEntryFactoryOptions(Array.isArray(data.fasonFactories) ? data.fasonFactories : [])

      if (transactionId) {
        const transactionResponse = await apiRequest(`${FASON_HAM_ENTRY_URL}/${transactionId}`)
        const transaction = transactionResponse?.data ?? transactionResponse ?? {}
        const sourceDetails = Array.isArray(transaction.details ?? transaction.Details) ? (transaction.details ?? transaction.Details) : []
        const details = sourceDetails.length > 0 ? sourceDetails.map((detail) => ({
          id: detail.id ?? detail.Id ?? 0,
          machineId: detail.machineId ?? detail.MachineId ?? '',
          rollCount: detail.rollCount ?? detail.RollCount ?? '',
          weight: detail.weight ?? detail.Weight ?? '',
          fabricType: detail.fabricType ?? detail.FabricType ?? 1,
        })) : [{ id: 0, machineId: '', rollCount: '', weight: '', fabricType: 1 }]

        setFasonHamEntryForm({
          id: transaction.id ?? transaction.Id ?? transactionId,
          entryDate: toDateTimeLocal(transaction.entryDate ?? transaction.EntryDate),
          factoryId: transaction.factoryId ?? transaction.FactoryId ?? '',
          personalName: transaction.personalName ?? transaction.PersonalName ?? '',
          details,
        })

        const factoryId = transaction.factoryId ?? transaction.FactoryId
        if (factoryId) {
          const machinesResponse = await apiRequest(`${FASON_HAM_ENTRY_URL}/GetFasonAvailableMachines/${factoryId}`)
          setFasonAvailableMachines(Array.isArray(machinesResponse?.data) ? machinesResponse.data : [])
        }
      }
    } catch (requestError) {
      const message = requestError.message || 'Seçenekler alınırken bir hata oluştu.'
      setFasonHamEntryModalError(message)
      showNotice('error', message)
    } finally {
      setIsFasonHamEntryModalLoading(false)
    }
  }, [apiRequest, authData, showNotice, userName])

  const closeFasonHamEntryModal = useCallback(() => {
    if (isFasonHamEntryModalSaving) {
      return
    }

    setIsFasonHamEntryModalOpen(false)
    setFasonHamEntryModalError('')
  }, [isFasonHamEntryModalSaving])

  const updateFasonHamEntryField = useCallback((field, value) => {
    setFasonHamEntryForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const updateFasonHamEntryDetailField = useCallback((index, field, value) => {
    setFasonHamEntryForm((prev) => ({
      ...prev,
      details: prev.details.map((detail, detailIndex) => detailIndex === index ? { ...detail, [field]: value } : detail),
    }))
  }, [])

  const handleFasonHamEntryFactorySelect = useCallback(async (factoryId) => {
    setFasonHamEntryForm((prev) => ({
      ...prev,
      factoryId,
      details: prev.details.map((detail) => ({ ...detail, machineId: '' })),
    }))
    setFasonAvailableMachines([])

    if (!factoryId) {
      return
    }

    try {
      const response = await apiRequest(`${FASON_HAM_ENTRY_URL}/GetFasonAvailableMachines/${factoryId}`)
      setFasonAvailableMachines(Array.isArray(response?.data) ? response.data : [])
    } catch (requestError) {
      setFasonAvailableMachines([])
      showNotice('error', requestError.message || 'Uygun makineler alınamadı.')
    }
  }, [apiRequest, showNotice])

  const addFasonHamEntryDetailRow = useCallback(() => {
    setFasonHamEntryForm((prev) => ({
      ...prev,
      details: [...prev.details, { id: 0, machineId: '', rollCount: '', weight: '', fabricType: 1 }],
    }))
  }, [])

  const removeFasonHamEntryDetailRow = useCallback((index) => {
    setFasonHamEntryForm((prev) => ({
      ...prev,
      details: prev.details.filter((_, detailIndex) => detailIndex !== index),
    }))
  }, [])

  const saveFasonHamEntry = useCallback(async () => {
    setFasonHamEntryModalError('')
    setIsFasonHamEntryModalSaving(true)

    try {
      const details = (fasonHamEntryForm.details ?? []).map((detail) => ({
        machineId: Number(detail.machineId) || 0,
        rollCount: Number(detail.rollCount) || 0,
        weight: Number(detail.weight) || 0,
        fabricType: Number(detail.fabricType) || 1,
      })).filter((detail) => detail.machineId)

      if (!fasonHamEntryForm.factoryId || !details.length) {
        throw new Error('Lütfen fabrika ve en az bir makine seçin.')
      }

      await apiRequest('/api/FasonHamEntry/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          id: Number(fasonHamEntryForm.id) || 0,
          entryDate: new Date(fasonHamEntryForm.entryDate).toISOString(),
          factoryId: Number(fasonHamEntryForm.factoryId),
          personalName: fasonHamEntryForm.personalName ?? '',
          details,
        }),
      })

      showNotice('success', 'Fason giriş kumaş hareketi başarıyla kaydedildi.')
      setIsFasonHamEntryModalOpen(false)
      setFasonHamEntryRefreshKey((prev) => prev + 1)
    } catch (requestError) {
      const message = requestError.message || 'Fason giriş kumaş hareketi kaydedilirken hata oluştu.'
      setFasonHamEntryModalError(message)
      showNotice('error', message)
    } finally {
      setIsFasonHamEntryModalSaving(false)
    }
  }, [apiRequest, fasonHamEntryForm, showNotice])

  const deleteFasonHamEntry = useCallback(async (transactionId) => {
    if (!transactionId || !window.confirm('Bu hareketi silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      await apiRequest(`${FASON_HAM_ENTRY_URL}/${transactionId}`, { method: 'DELETE' })
      showNotice('success', 'Fason giriş kumaş hareketi silindi.')
      setFasonHamEntryRefreshKey((prev) => prev + 1)
    } catch (requestError) {
      const message = requestError.message || 'Fason giriş kumaş hareketi silinirken hata oluştu.'
      showNotice('error', message)
    }
  }, [apiRequest, showNotice])

  const updateAddFabricField = useCallback((field, value) => {
    setAddFabricForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const updateAddFabricDetailField = useCallback((index, field, value) => {
    setAddFabricForm((prev) => ({
      ...prev,
      Details: prev.Details.map((detail, detailIndex) =>
        detailIndex === index && !detail.isSaved ? { ...detail, [field]: value } : detail,
      ),
    }))
  }, [])

  const addAddFabricDetail = useCallback(async () => {
    if (isAddFabricMachineLoading) {
      return
    }

    setIsAddFabricMachineLoading(true)

    try {
      const machinesResponse = await apiRequest('/api/DailyHamFabricsTransaction/GetMachinesActivePlans?FactoryId=1')
      const machines = Array.isArray(machinesResponse?.data) ? machinesResponse.data : []

      setActiveMachinePlans(machines)
      setAddFabricForm((prev) => ({
        ...prev,
        Details: [...prev.Details, { Weight: '', Makine: '', Operator: '', fabricType: 1, isSaved: false }],
      }))
    } catch (requestError) {
      const message = requestError.message || 'Aktif makine planları alınamadı.'
      setAddFabricModalError(message)
      showNotice('error', message)
    } finally {
      setIsAddFabricMachineLoading(false)
    }
  }, [apiRequest, isAddFabricMachineLoading, showNotice])

  const saveAddFabricDetail = useCallback(async (index) => {
    const detail = addFabricForm.Details?.[index]

    if (!detail || detail.isSaved || savingAddFabricDetailIndex !== null) {
      return
    }

    setAddFabricModalError('')
    setSavingAddFabricDetailIndex(index)

    try {
      const payload = {
        id: Number(detail.id ?? detail.Id) || 0,
        machineId: Number(detail.Makine) || 0,
        weight: Number(detail.Weight) || 0,
        operator: detail.Operator || '',
        date: addFabricForm.Date ? `${addFabricForm.Date}T00:00:00.000Z` : new Date().toISOString(),
        shift: String(addFabricForm.Shift || '').toLowerCase(),
        fabricType: Number(detail.fabricType) || 1,
      }

      const response = await apiRequest(`${DAILY_FABRICS_URL}/DepoFabricRollsUpsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
        body: JSON.stringify(payload),
      })

      const savedRoll = response?.data ?? response
      setAddFabricForm((prev) => ({
        ...prev,
        Details: prev.Details.map((item, detailIndex) => detailIndex === index ? { ...item, isSaved: true } : item),
      }))
      const didOpenPrintWindow = printSavedFabricRoll(savedRoll)
      showNotice('success', 'Top başarıyla kaydedildi.')
      if (!didOpenPrintWindow) {
        showNotice('error', 'Top kaydedildi ancak yazdırma penceresi açılamadı.')
      }
    } catch (requestError) {
      const message = requestError.message || 'Top kaydedilirken bir hata oluştu.'
      setAddFabricModalError(message)
      showNotice('error', message)
    } finally {
      setSavingAddFabricDetailIndex(null)
    }
  }, [addFabricForm, apiRequest, savingAddFabricDetailIndex, showNotice])

  const onSubmitLogin = async (event) => {
    event.preventDefault()
    setLoginError('')
    setIsLoginLoading(true)

    try {
      const result = await loginRequest({
        userName,
        password,
        withLoading: withGlobalLoading,
      })

      const nextAuthData = {
        token: result.data.token,
        expiresAt: result.data.expiresAt,
        user: result.data.user,
      }

      localStorage.setItem(TOKEN_KEY, nextAuthData.token)
      setAuthData(nextAuthData)
      showNotice('success', 'Giriş başarılı.')
    } catch (error) {
      if (error instanceof TypeError) {
        setLoginError('Sunucuya bağlanılamadı. API adresini ve CORS ayarlarını kontrol edin.')
      } else {
        setLoginError(error.message || 'Beklenmeyen bir hata oluştu.')
      }
    } finally {
      setIsLoginLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setAuthData(null)
    setUserName('')
    setPassword('')
    setLoginError('')
    showNotice('success', 'تم تسجيل الخروج بنجاح.')
  }

  if (!authData) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(210,233,246,0.9)_28%,_rgba(184,219,236,0.98)_100%)] px-4 py-10" dir="rtl">
        {pendingRequests > 0 ? (
          <div className="global-loading-overlay" aria-live="polite" aria-busy="true">
            <div className="global-loading-content">
              <span className="spinner" aria-hidden="true"></span>
              <p>جاري تنفيذ الطلب...</p>
            </div>
          </div>
        ) : null}

        {notice ? (
          <div className={`toast ${notice.type === 'success' ? 'success' : 'error'}`}>
            {notice.message}
          </div>
        ) : null}

        <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center" aria-label="Giriş formu" dir="ltr">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-8 text-left shadow-[0_24px_48px_rgba(15,23,42,0.12)]">
            <div className="flex justify-center">
              <img src="/logo.png" alt="Judi Mensucat" className="h-auto w-56 object-contain" />
            </div>
            <p className="mt-2 text-sm text-slate-600">Sisteme devam etmek için hesap bilgilerinizi girin.</p>

            <form onSubmit={onSubmitLogin} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="username" className="text-sm font-medium text-slate-700">Kullanıcı adı</label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Şifre</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Şifrenizi girin"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
              </div>

              {loginError ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{loginError}</p> : null}

              <button
                type="submit"
                disabled={isLoginLoading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
              >
                {isLoginLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(214,234,245,0.9)_30%,_rgba(184,219,236,0.98)_100%)] px-4 py-6 text-slate-700" dir="rtl">
      {pendingRequests > 0 ? (
        <div className="global-loading-overlay" aria-live="polite" aria-busy="true">
          <div className="global-loading-content">
            <span className="spinner" aria-hidden="true"></span>
            <p>جاري تنفيذ الطلب...</p>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className={`toast ${notice.type === 'success' ? 'success' : 'error'}`}>
          {notice.message}
        </div>
      ) : null}

      <div className="mx-auto max-w-[1280px]">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm" aria-label="معلومات المستخدم">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <span className="text-base">{isSidebarOpen ? '☰' : '☰'}</span>
            <span>{isSidebarOpen ? 'إخفاء القائمة' : 'إظهار القائمة'}</span>
          </button>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-base" aria-hidden="true">👤</span>
            <span>{authData?.user?.userName || authData?.user?.name || 'المستخدم'}</span>
          </div>

          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-transparent text-lg text-slate-700 transition hover:bg-slate-100" onClick={handleLogout} aria-label="تسجيل الخروج">
            ⎋
          </button>
        </div>

        <div className={isSidebarOpen ? 'grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]' : 'grid gap-5 xl:grid-cols-1'}>
          {isSidebarOpen ? (
            <aside className="sticky top-5 h-fit rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-[0_16px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm" aria-label="قائمة العمليات">
              <div className="space-y-2">
              {isRestrictedFabricInspectorUser ? (
                <button
                  type="button"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  onClick={() => {
                    setActiveOperation('fabricEntry')
                    openAddFabricModal()
                  }}
                >
                  KUMAŞ HAREKETİ EKLE
                </button>
              ) : isProductionManagerUser ? (
                <>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'fasonHamEntry' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('fasonHamEntry')}
                  >
                    FASON GİRİŞ KUMAŞI
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'depoHamFabric' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('depoHamFabric')}
                  >
                    HAM KUMAŞ DEPO
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'weavingOrders' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('weavingOrders')}
                  >
                    Dokuma Siparişleri Yönetimi
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'weavingOrderPlanning' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('weavingOrderPlanning')}
                  >
                    DOKUMA SİPARİŞİ PLANLAMA
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'fabrics' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('fabrics')}
                  >
                    GÜNLÜK ÜRETİM TAKİBİ
                  </button>
                </>
              ) : isDyeFollowUpUser ? (
                <>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'depoHamFabric' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('depoHamFabric')}
                  >
                    HAM KUMAŞ DEPO
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'fasonHamEntry' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('fasonHamEntry')}
                  >
                    FASON GİRİŞ KUMAŞI
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'boyaliSiparis' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('boyaliSiparis')}
                  >
                    BOYALI SİPARİŞ TAKİP
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'orderFactory' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('orderFactory')}
                  >
                    BOYALI SİPARİŞ
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'users' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('users')}
                  >
                    ادارة المستخدمين
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'orders' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('orders')}
                  >
                    ادارة الطلبيات
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'depoHamFabric' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('depoHamFabric')}
                  >
                    HAM KUMAŞ DEPO
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'fasonHamEntry' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('fasonHamEntry')}
                  >
                    FASON GİRİŞ KUMAŞI
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'yarns' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('yarns')}
                  >
                    ادارة مخزون الخيط
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'fabrics' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('fabrics')}
                  >
                    GÜNLÜK ÜRETİM TAKİBİ
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    onClick={openAddFabricModal}
                  >
                    KUMAŞ HAREKETİ EKLE
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'hamBoya' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('hamBoya')}
                  >
                    ادارة خام مرسل للمصابغ
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'boyaliSiparis' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('boyaliSiparis')}
                  >
                    BOYALI SİPARİŞ TAKİP
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'orderFactory' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('orderFactory')}
                  >
                    BOYALI SİPARİŞ
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'yarnWeaving' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('yarnWeaving')}
                  >
                    ادارة حركات الحياكة
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'weavingOrders' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('weavingOrders')}
                  >
                    ÖRGÜ SİPARİŞLERİ YÖNETİMİ
                  </button>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${activeOperation === 'weavingOrderPlanning' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setActiveOperation('weavingOrderPlanning')}
                  >
                    DOKUMA SİPARİŞİ PLANLAMA
                  </button>
                </>
              )}
              </div>
            </aside>
          ) : null}

          <section className="min-h-[calc(100vh-8rem)] rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-[0_16px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            {isRestrictedFabricInspectorUser ? null : isProductionManagerUser ? (
              activeOperation === 'depoHamFabric' ? (
                <DepoHamFabricSection apiRequest={apiRequest} showNotice={showNotice} isActive />
              ) : activeOperation === 'fasonHamEntry' ? (
                <FasonHamEntrySection apiRequest={apiRequest} showNotice={showNotice} isActive refreshKey={fasonHamEntryRefreshKey} onNewTransaction={openFasonHamEntryModal} onEditTransaction={openFasonHamEntryModal} onDeleteTransaction={deleteFasonHamEntry} />
              ) : activeOperation === 'weavingOrders' ? (
                <WeavingOrdersSection apiRequest={apiRequest} showNotice={showNotice} isActive />
              ) : activeOperation === 'weavingOrderPlanning' ? (
                <WeavingOrderPlanningSection apiRequest={apiRequest} showNotice={showNotice} isActive />
              ) : activeOperation === 'fabrics' ? (
                <FabricsSection
                  apiRequest={apiRequest}
                  showNotice={showNotice}
                  isActive
                  currentUserName={authData?.user?.userName || authData?.user?.name || userName || 'المستخدم'}
                />
              ) : null
            ) : isDyeFollowUpUser ? (
              activeOperation === 'depoHamFabric' ? (
                <DepoHamFabricSection apiRequest={apiRequest} showNotice={showNotice} isActive />
              ) : activeOperation === 'boyaliSiparis' ? (
                <BoyaliSiparisTakipSection apiRequest={apiRequest} showNotice={showNotice} isActive />
              ) : activeOperation === 'orderFactory' ? (
                <OrderFactoryTransactionsSection apiRequest={apiRequest} showNotice={showNotice} isActive />
              ) : activeOperation === 'fasonHamEntry' ? (
                <FasonHamEntrySection apiRequest={apiRequest} showNotice={showNotice} isActive refreshKey={fasonHamEntryRefreshKey} onNewTransaction={openFasonHamEntryModal} onEditTransaction={openFasonHamEntryModal} onDeleteTransaction={deleteFasonHamEntry} />
              ) : null
            ) : activeOperation === 'users' ? (
              <UsersSection apiRequest={apiRequest} showNotice={showNotice} isActive />
            ) : activeOperation === 'orders' ? (
              <OrdersSection
                apiRequest={apiRequest}
                showNotice={showNotice}
                isActive
                currentUserName={authData?.user?.userName || authData?.user?.name || userName || 'المستخدم'}
              />
            ) : activeOperation === 'fabrics' ? (
              <FabricsSection
                apiRequest={apiRequest}
                showNotice={showNotice}
                isActive
                currentUserName={authData?.user?.userName || authData?.user?.name || userName || 'المستخدم'}
              />
            ) : activeOperation === 'hamBoya' ? (
              <HamBoyaTransactionsSection
                apiRequest={apiRequest}
                showNotice={showNotice}
                isActive
                currentUserName={authData?.user?.userName || authData?.user?.name || userName || 'المستخدم'}
              />
            ) : activeOperation === 'boyaliSiparis' ? (
              <BoyaliSiparisTakipSection apiRequest={apiRequest} showNotice={showNotice} isActive />
            ) : activeOperation === 'orderFactory' ? (
              <OrderFactoryTransactionsSection apiRequest={apiRequest} showNotice={showNotice} isActive />
            ) : activeOperation === 'yarnWeaving' ? (
              <YarnWeavingTransactionsSection
                apiRequest={apiRequest}
                showNotice={showNotice}
                isActive
                currentUserName={authData?.user?.userName || authData?.user?.name || userName || 'المستخدم'}
              />
            ) : activeOperation === 'depoHamFabric' ? (
              <DepoHamFabricSection apiRequest={apiRequest} showNotice={showNotice} isActive />
            ) : activeOperation === 'weavingOrders' ? (
              <WeavingOrdersSection apiRequest={apiRequest} showNotice={showNotice} isActive />
            ) : activeOperation === 'weavingOrderPlanning' ? (
              <WeavingOrderPlanningSection apiRequest={apiRequest} showNotice={showNotice} isActive />
            ) : activeOperation === 'fasonHamEntry' ? (
              <FasonHamEntrySection apiRequest={apiRequest} showNotice={showNotice} isActive refreshKey={fasonHamEntryRefreshKey} onNewTransaction={openFasonHamEntryModal} onEditTransaction={openFasonHamEntryModal} onDeleteTransaction={deleteFasonHamEntry} />
            ) : activeOperation === 'yarns' ? (
              <YarnsSection
                apiRequest={apiRequest}
                showNotice={showNotice}
                isActive
                currentUserName={authData?.user?.userName || authData?.user?.name || userName || 'المستخدم'}
              />
            ) : null}
          </section>
        </div>
      </div>

      <AddFabricTransactionModal
        isOpen={isAddFabricModalOpen}
        isLoading={isAddFabricModalLoading}
        error={addFabricModalError}
        form={addFabricForm}
        shiftOptions={SHIFT_OPTIONS}
        operatorOptions={operatorOptions}
        machines={activeMachinePlans}
        currentUserName={authData?.user?.userName || authData?.user?.name || userName || ''}
        isAddingDetail={isAddFabricMachineLoading}
        savingDetailIndex={savingAddFabricDetailIndex}
        onFieldChange={updateAddFabricField}
        onDetailFieldChange={updateAddFabricDetailField}
        onAddDetail={addAddFabricDetail}
        onSaveDetail={saveAddFabricDetail}
        onClose={closeAddFabricModal}
      />


      <FasonHamEntryModal
        isOpen={isFasonHamEntryModalOpen}
        isLoading={isFasonHamEntryModalLoading}
        isSaving={isFasonHamEntryModalSaving}
        error={fasonHamEntryModalError}
        form={fasonHamEntryForm}
        factoryOptions={fasonHamEntryFactoryOptions}
        availableMachines={fasonAvailableMachines}
        fabricTypeOptions={FABRIC_TYPE_OPTIONS}
        onFieldChange={updateFasonHamEntryField}
        onDetailFieldChange={updateFasonHamEntryDetailField}
        onFactorySelect={handleFasonHamEntryFactorySelect}
        onAddDetailRow={addFasonHamEntryDetailRow}
        onRemoveDetailRow={removeFasonHamEntryDetailRow}
        onClose={closeFasonHamEntryModal}
        onSave={saveFasonHamEntry}
      />
    </main>
  )
}

export default App
