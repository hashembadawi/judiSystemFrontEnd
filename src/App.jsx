import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import OrdersSection from './features/orders/OrdersSection'
import UsersSection from './features/users/UsersSection'
import FabricsSection from './features/fabrics/FabricsSection'
import AddFabricTransactionModal from './features/fabrics/AddFabricTransactionModal'
import FasonFabricTransactionModal from './features/fasonFabricTransactions/FasonFabricTransactionModal'
import HamBoyaTransactionsSection from './features/hamBoyaTransactions/HamBoyaTransactionsSection'
import YarnsSection from './features/yarns/YarnsSection'
import YarnWeavingTransactionsSection from './features/yarnWeavingTransactions/YarnWeavingTransactionsSection'
import OrderFactoryTransactionsSection from './features/orderFactoryTransactions/OrderFactoryTransactionsSection'
import BoyaliSiparisTakipSection from './features/boyaliSiparisTakip/BoyaliSiparisTakipSection'
import DepoHamFabricSection from './features/depoHamFabric/DepoHamFabricSection'
import WeavingOrdersSection from './features/weavingOrders/WeavingOrdersSection'
import { loginRequest, requestApi } from './services/api'

const TOKEN_KEY = 'judi_auth_token'
const DAILY_FABRICS_URL = '/api/DailyHamFabricsTransaction'
const getTodayDate = () => new Date().toISOString().slice(0, 10)

const getOptionDisplayText = (item) => {
  if (item == null) {
    return ''
  }

  if (typeof item === 'string') {
    return item
  }

  if (typeof item === 'object') {
    return (
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
  }

  return String(item)
}

function App() {
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [authData, setAuthData] = useState(null)

  const [activeOperation, setActiveOperation] = useState('users')
  const [notice, setNotice] = useState(null)
  const currentUserType = Number(authData?.user?.userType ?? authData?.user?.userTypeValue ?? authData?.user?.UserType ?? authData?.user?.type ?? 0)
  const isRestrictedFabricInspectorUser = currentUserType === 6
  const isProductionManagerUser = currentUserType === 4
  const [pendingRequests, setPendingRequests] = useState(0)
  const [isAddFabricModalOpen, setIsAddFabricModalOpen] = useState(false)
  const [isAddFabricModalLoading, setIsAddFabricModalLoading] = useState(false)
  const [isAddFabricModalSaving, setIsAddFabricModalSaving] = useState(false)
  const [addFabricModalError, setAddFabricModalError] = useState('')
  const [isFasonFabricModalOpen, setIsFasonFabricModalOpen] = useState(false)
  const [isFasonFabricModalLoading, setIsFasonFabricModalLoading] = useState(false)
  const [isFasonFabricModalSaving, setIsFasonFabricModalSaving] = useState(false)
  const [fasonFabricModalError, setFasonFabricModalError] = useState('')
  const [fasonFabricForm, setFasonFabricForm] = useState({
    Id: 0,
    Shift: 'A',
    Date: getTodayDate(),
    Personal: '',
    Details: [
      {
        FabricGender: '',
        FabricGSM: '',
        FabricLot: '',
        Count: '',
        Weight: '',
        OrderId: '',
        FactoryId: '',
        FabricType: 1,
      },
    ],
  })
  const [fasonFactoryOptions, setFasonFactoryOptions] = useState([])
  const [weavingOrdersByRow, setWeavingOrdersByRow] = useState({})
  const [fabricsByRow, setFabricsByRow] = useState({})
  const [fabricGenderOptions, setFabricGenderOptions] = useState([])
  const [orderOptions, setOrderOptions] = useState([])
  const [factoryOptions, setFactoryOptions] = useState([])
  const [operatorOptions, setOperatorOptions] = useState([])
  const [addFabricForm, setAddFabricForm] = useState({
    Id: 0,
    Shift: 'A',
    Date: getTodayDate(),
    Personal: '',
    Details: [
      {
        FabricGender: '',
        FabricGSM: '',
        FabricLot: '',
        Count: '',
        Weight: '',
        OrderId: '',
        FactoryId: '',
        FabricType: 1,
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
      if (!['fabrics', 'weavingOrders', 'depoHamFabric'].includes(activeOperation)) {
        setActiveOperation('fabrics')
      }
      return
    }

    if (activeOperation === 'fabricEntry') {
      setActiveOperation('users')
    }
  }, [activeOperation, isProductionManagerUser, isRestrictedFabricInspectorUser])

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
    setFabricGenderOptions([])
    setOrderOptions([])
    setFactoryOptions([])
    setAddFabricForm({
      Id: 0,
      Shift: 'A',
      Date: getTodayDate(),
      Personal: authData?.user?.userName || authData?.user?.name || userName || '',
      Details: [
        {
          FabricGender: '',
          FabricGSM: '',
          FabricLot: '',
          Count: '',
          Weight: '',
          Makine: '',
          Operator: '',
          OrderId: '',
          FactoryId: '',
          FabricType: 1,
        },
      ],
    })

    try {
      const response = await apiRequest('/api/fill-options?requestedValues=1')
      const data = response.data || {}
      setFabricGenderOptions(Array.isArray(data.items) ? data.items.map((item) => getOptionDisplayText(item)) : [])
      setOrderOptions(Array.isArray(data.customerOrders) ? data.customerOrders : Array.isArray(data.orders) ? data.orders : [])
      setFactoryOptions(
        Array.isArray(data.fasonFactories)
          ? data.fasonFactories
          : Array.isArray(data.boyaFactories)
          ? data.boyaFactories
          : Array.isArray(data.factories)
          ? data.factories
          : [],
      )
      setOperatorOptions(Array.isArray(data.operatorsNames) ? data.operatorsNames.map((item) => item.operatorName) : [])
    } catch (requestError) {
      const message = requestError.message || 'Seçenekler alınırken bir hata oluştu.'
      setAddFabricModalError(message)
      showNotice('error', message)
    } finally {
      setIsAddFabricModalLoading(false)
    }
  }, [apiRequest, authData, userName, showNotice])

  const closeAddFabricModal = useCallback(() => {
    if (isAddFabricModalSaving) {
      return
    }
    setIsAddFabricModalOpen(false)
    setAddFabricModalError('')
  }, [isAddFabricModalSaving])

  const openFasonFabricModal = useCallback(async () => {
    setFasonFabricModalError('')
    setIsFasonFabricModalOpen(true)
    setIsFasonFabricModalLoading(true)
    setFasonFabricForm({
      Id: 0,
      Shift: 'A',
      Date: getTodayDate(),
      Personal: authData?.user?.userName || authData?.user?.name || userName || '',
      Details: [
        {
          FabricGender: '',
          FabricGSM: '',
          FabricLot: '',
          Count: '',
          Weight: '',
          OrderId: '',
          FactoryId: '',
          FabricType: 1,
        },
      ],
    })
    setFasonFactoryOptions([])
    setWeavingOrdersByRow({})
    setFabricsByRow({})

    try {
      const response = await apiRequest('/api/fill-options?requestedValues=1')
      const data = response.data || {}
      setFasonFactoryOptions(Array.isArray(data.fasonFactories) ? data.fasonFactories : [])
    } catch (requestError) {
      const message = requestError.message || 'Seçenekler alınırken bir hata oluştu.'
      setFasonFabricModalError(message)
      showNotice('error', message)
    } finally {
      setIsFasonFabricModalLoading(false)
    }
  }, [apiRequest, authData, userName, showNotice])

  const closeFasonFabricModal = useCallback(() => {
    if (isFasonFabricModalSaving) {
      return
    }
    setIsFasonFabricModalOpen(false)
    setFasonFabricModalError('')
  }, [isFasonFabricModalSaving])

  const updateFasonFabricField = useCallback((field, value) => {
    setFasonFabricForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const updateFasonFabricDetailField = useCallback((index, field, value) => {
    setFasonFabricForm((prev) => ({
      ...prev,
      Details: prev.Details.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, [field]: value } : detail,
      ),
    }))
  }, [])

  const addFasonFabricDetailRow = useCallback(() => {
    setFasonFabricForm((prev) => ({
      ...prev,
      Details: [
        ...prev.Details,
        {
          FabricGender: '',
          FabricGSM: '',
          FabricLot: '',
          Count: '',
          Weight: '',
          OrderId: '',
          FactoryId: '',
          FabricType: 1,
        },
      ],
    }))
  }, [])

  const removeFasonFabricDetailRow = useCallback((index) => {
    setFasonFabricForm((prev) => ({
      ...prev,
      Details: prev.Details.filter((_, detailIndex) => detailIndex !== index),
    }))
  }, [])

  const loadWeavingOrdersForFactory = useCallback(async (factoryId, rowIndex) => {
    if (!factoryId) {
      setWeavingOrdersByRow((prev) => ({ ...prev, [rowIndex]: [] }))
      setFabricsByRow((prev) => ({ ...prev, [rowIndex]: [] }))
      return
    }

    try {
      const res = await apiRequest(`/api/DailyHamFabricsTransaction/GetAllWeavingOrderByFactory?factoryId=${factoryId}`)
      const orders = Array.isArray(res?.data) ? res.data : []
      setWeavingOrdersByRow((prev) => ({ ...prev, [rowIndex]: orders }))
      setFabricsByRow((prev) => ({ ...prev, [rowIndex]: [] }))
    } catch (error) {
      setWeavingOrdersByRow((prev) => ({ ...prev, [rowIndex]: [] }))
      setFabricsByRow((prev) => ({ ...prev, [rowIndex]: [] }))
    }
  }, [apiRequest])

  const handleFasonFactorySelect = useCallback((index, factoryId) => {
    updateFasonFabricDetailField(index, 'FactoryId', factoryId)
    updateFasonFabricDetailField(index, 'OrderId', '')
    updateFasonFabricDetailField(index, 'FabricGender', '')
    updateFasonFabricDetailField(index, 'FabricGSM', '')
    updateFasonFabricDetailField(index, 'FabricLot', '')
    updateFasonFabricDetailField(index, 'Count', '')
    updateFasonFabricDetailField(index, 'Weight', '')
    loadWeavingOrdersForFactory(factoryId, index)
  }, [loadWeavingOrdersForFactory, updateFasonFabricDetailField])

  const loadFabricsForWeavingOrder = useCallback(async (factoryId, weavingOrderId, rowIndex) => {
    if (!factoryId || !weavingOrderId) {
      setFabricsByRow((prev) => ({ ...prev, [rowIndex]: [] }))
      return
    }

    try {
      const res = await apiRequest(`/api/DailyHamFabricsTransaction/getFabricByFactoryByWeavingOrder?Id=${weavingOrderId}&FactoryId=${factoryId}`)
      const items = res?.data?.items ?? []
      setFabricsByRow((prev) => ({ ...prev, [rowIndex]: items }))
    } catch (error) {
      setFabricsByRow((prev) => ({ ...prev, [rowIndex]: [] }))
    }
  }, [apiRequest])

  const handleFasonWeavingOrderSelect = useCallback((index, value) => {
    updateFasonFabricDetailField(index, 'OrderId', value)
    updateFasonFabricDetailField(index, 'FabricGender', '')
    updateFasonFabricDetailField(index, 'FabricGSM', '')
    updateFasonFabricDetailField(index, 'FabricLot', '')
    updateFasonFabricDetailField(index, 'Count', '')
    updateFasonFabricDetailField(index, 'Weight', '')
    const factoryId = fasonFabricForm.Details[index]?.FactoryId ?? ''
    loadFabricsForWeavingOrder(factoryId, value, index)
  }, [fasonFabricForm.Details, loadFabricsForWeavingOrder, updateFasonFabricDetailField])

  const handleFasonFabricSelect = useCallback((index, value) => {
    updateFasonFabricDetailField(index, 'FabricGender', value)

    const rowItems = fabricsByRow[index] ?? []
    const selectedItem = rowItems.find((item) => {
      const fabricGender = item?.fabricGender ?? item?.FabricGender ?? ''
      return String(fabricGender).trim() === String(value).trim()
    })

    if (selectedItem) {
      updateFasonFabricDetailField(index, 'OrderId', selectedItem.orderId ?? selectedItem.OrderId ?? '')
      updateFasonFabricDetailField(index, 'FabricGSM', selectedItem.fabricGr ?? selectedItem.FabricGr ?? '')
      updateFasonFabricDetailField(index, 'FabricLot', selectedItem.fabricLot ?? selectedItem.FabricLot ?? '')
      updateFasonFabricDetailField(index, 'Weight', selectedItem.weight ?? selectedItem.Weight ?? '')
    }
  }, [fabricsByRow, updateFasonFabricDetailField])

  const saveFasonFabricTransaction = useCallback(async () => {
    setFasonFabricModalError('')
    setIsFasonFabricModalSaving(true)

    try {
      const payload = {
        ...fasonFabricForm,
        Details: (fasonFabricForm.Details ?? []).map((detail) => ({
          FabricGender: detail.FabricGender ?? '',
          FabricGSM: detail.FabricGSM ?? '',
          FabricLot: detail.FabricLot ?? '',
          Count: Number(detail.Count) || 1,
          Weight: Number(detail.Weight) || 0,
          OrderId: detail.OrderId ? Number(detail.OrderId) : 0,
          FactoryId: detail.FactoryId ? Number(detail.FactoryId) : 0,
          FabricType: Number(detail.FabricType ?? 1) || 1,
        })).filter((detail) => detail.FabricGender || detail.FabricLot || detail.OrderId || detail.Count || detail.Weight),
      }

      if (!payload.Details.length) {
        throw new Error('لا توجد تفاصيل صالحة للحفظ.')
      }

      await apiRequest(`${DAILY_FABRICS_URL}/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      showNotice('success', 'Fason kumaş hareketi başarıyla kaydedildi.')
      setIsFasonFabricModalOpen(false)
    } catch (requestError) {
      const message = requestError.message || 'Fason kumaş hareketi kaydedilirken bir hata oluştu.'
      setFasonFabricModalError(message)
      showNotice('error', message)
    } finally {
      setIsFasonFabricModalSaving(false)
    }
  }, [apiRequest, fasonFabricForm, showNotice])

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
        detailIndex === index ? { ...detail, [field]: value } : detail,
      ),
    }))
  }, [])

  const addAddFabricDetailRow = useCallback(() => {
    setAddFabricForm((prev) => ({
      ...prev,
      Details: [
        ...prev.Details,
        {
          FabricGender: '',
          FabricGSM: '',
          FabricLot: '',
          Count: '',
          Weight: '',
          Makine: '',
          OrderId: '',
          FactoryId: '',
          FabricType: 1,
        },
      ],
    }))
  }, [])

  const copyAddFabricDetailRow = useCallback(
    (index) => {
      setAddFabricForm((prev) => ({
        ...prev,
        Details: [
          ...prev.Details.slice(0, index + 1),
          { ...prev.Details[index], Id: 0 },
          ...prev.Details.slice(index + 1),
        ],
      }))
    },
    [],
  )

  const removeAddFabricDetailRow = useCallback(
    (index) => {
      setAddFabricForm((prev) => ({
        ...prev,
        Details: prev.Details.filter((_, detailIndex) => detailIndex !== index),
      }))
    },
    [],
  )

  const aggregateFabricDetails = useCallback((details = []) => {
    const groupedDetails = new Map()

    const normalizeNumericValue = (value) => {
      if (value === null || value === undefined || value === '') {
        return 0
      }

      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0
      }

      const numericValue = Number(String(value).replace(/,/g, '').trim())
      return Number.isFinite(numericValue) ? numericValue : 0
    }

    const extractWeight = (detail) => {
      const candidates = [detail?.Weight, detail?.weight, detail?.TotalWeight, detail?.totalWeight, detail?.WeightKg, detail?.weightKg]
      for (const candidate of candidates) {
        const parsed = normalizeNumericValue(candidate)
        if (parsed > 0) {
          return parsed
        }
      }
      return 0
    }

    details.forEach((detail) => {
      const fabricGender = String(detail?.FabricGender ?? '').trim()
      const fabricGSM = detail?.FabricGSM ?? ''
      const fabricLot = String(detail?.FabricLot ?? '').trim()
      const orderId = detail?.OrderId ?? ''
      const fabricType = Number(detail?.FabricType ?? 1) || 1
      const count = 1
      const weight = extractWeight(detail)
      const factoryId = detail?.FactoryId ?? ''

      if (!fabricGender && !fabricLot && !orderId && !count && !weight) {
        return
      }

      const key = `${fabricGender}::${fabricGSM}::${fabricLot}::${orderId}::${fabricType}`
      const existing = groupedDetails.get(key)

      if (!existing) {
        groupedDetails.set(key, {
          FabricGender: fabricGender,
          FabricGSM: normalizeNumericValue(fabricGSM),
          FabricLot: fabricLot,
          Count: count,
          Weight: weight,
          OrderId: orderId ? Number(orderId) || 0 : 0,
          FactoryId: factoryId ? Number(factoryId) || 0 : 0,
          FabricType: fabricType,
        })
        return
      }

      existing.Count += count
      existing.Weight += weight

      if (!existing.FactoryId && factoryId) {
        existing.FactoryId = Number(factoryId) || 0
      }
    })

    return Array.from(groupedDetails.values()).filter((detail) => detail.FabricGender || detail.FabricLot || detail.OrderId || detail.Count || detail.Weight)
  }, [])

  const saveAddFabricTransaction = useCallback(async () => {
    setAddFabricModalError('')
    setIsAddFabricModalSaving(true)

    try {
      const payload = {
        ...addFabricForm,
        Details: aggregateFabricDetails(addFabricForm.Details),
      }

      if (!payload.Details.length) {
        throw new Error('لا توجد تفاصيل صالحة للحفظ.')
      }

      await apiRequest(`${DAILY_FABRICS_URL}/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      showNotice('success', 'Kumaş hareketi başarıyla kaydedildi.')
      setIsAddFabricModalOpen(false)
    } catch (requestError) {
      const message = requestError.message || 'Kumaş hareketi kaydedilirken bir hata oluştu.'
      setAddFabricModalError(message)
      showNotice('error', message)
    } finally {
      setIsAddFabricModalSaving(false)
    }
  }, [aggregateFabricDetails, apiRequest, addFabricForm, showNotice])

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
      showNotice('success', 'تم تسجيل الدخول بنجاح.')
    } catch (error) {
      if (error instanceof TypeError) {
        setLoginError('تعذر الاتصال بالخادم. تأكد أن API متاحة على judimensucat.runasp.net وأن الخادم يسمح بطلبات CORS.')
      } else {
        setLoginError(error.message || 'حدث خطأ غير متوقع.')
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
      <main className="page-shell" dir="rtl">
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

        <section className="login-card" aria-label="نموذج تسجيل الدخول">
          <p className="brand-chip">JUDI SYSTEM</p>
          <h1>تسجيل الدخول</h1>
          <p className="subtitle">أدخل بيانات الحساب للمتابعة إلى النظام.</p>

          <form onSubmit={onSubmitLogin} className="login-form">
            <label htmlFor="username">اسم المستخدم</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="ali"
              required
            />

            <label htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="*****"
              required
            />

            {loginError ? <p className="error-box">{loginError}</p> : null}

            <button type="submit" disabled={isLoginLoading}>
              {isLoginLoading ? 'جاري تسجيل الدخول...' : 'دخول'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard-shell" dir="rtl">
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

      <div className="topbar-user-card" aria-label="معلومات المستخدم">
        <div className="user-chip">
          <span className="user-avatar" aria-hidden="true">👤</span>
          <span>{authData?.user?.userName || authData?.user?.name || 'المستخدم'}</span>
        </div>
        <button type="button" className="icon-btn" onClick={handleLogout} aria-label="تسجيل الخروج">
          ⎋
        </button>
      </div>

      <aside className="side-menu" aria-label="قائمة العمليات">
        <h2>العمليات</h2>
        {isRestrictedFabricInspectorUser ? (
          <button
            type="button"
            className="menu-item"
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
              className={activeOperation === 'fabrics' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('fabrics')}
            >
              GÜNLÜK KUMAŞ HAREKETİ
            </button>
            <button
              type="button"
              className={activeOperation === 'depoHamFabric' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('depoHamFabric')}
            >
              HAM KUMAŞ DEPO
            </button>
            <button
              type="button"
              className={activeOperation === 'weavingOrders' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('weavingOrders')}
            >
              Dokuma Siparişleri Yönetimi
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={activeOperation === 'users' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('users')}
            >
              ادارة المستخدمين
            </button>
            <button
              type="button"
              className={activeOperation === 'orders' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('orders')}
            >
              ادارة الطلبيات
            </button>
            <button
              type="button"
              className={activeOperation === 'depoHamFabric' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('depoHamFabric')}
            >
              HAM KUMAŞ DEPO
            </button>
            <button
              type="button"
              className={activeOperation === 'yarns' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('yarns')}
            >
              ادارة مخزون الخيط
            </button>
            <button
              type="button"
              className={activeOperation === 'fabrics' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('fabrics')}
            >
              GÜNLÜK KUMAŞ HAREKETİ
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={openAddFabricModal}
            >
              KUMAŞ HAREKETİ EKLE
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={openFasonFabricModal}
            >
              FASON KUMAŞ HAREKETİ EKLE
            </button>
            <button
              type="button"
              className={activeOperation === 'hamBoya' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('hamBoya')}
            >
              ادارة خام مرسل للمصابغ
            </button>
            <button
              type="button"
              className={activeOperation === 'boyaliSiparis' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('boyaliSiparis')}
            >
              BOYALI SİPARİŞ TAKİP
            </button>
            <button
              type="button"
              className={activeOperation === 'orderFactory' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('orderFactory')}
            >
              BOYALI SİPARİŞ
            </button>
            <button
              type="button"
              className={activeOperation === 'yarnWeaving' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('yarnWeaving')}
            >
              ادارة حركات الحياكة
            </button>
            <button
              type="button"
              className={activeOperation === 'weavingOrders' ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveOperation('weavingOrders')}
            >
              Dokuma Siparişleri Yönetimi
            </button>
          </>
        )}
      </aside>

      <AddFabricTransactionModal
        isOpen={isAddFabricModalOpen}
        isLoading={isAddFabricModalLoading}
        isSaving={isAddFabricModalSaving}
        error={addFabricModalError}
        form={addFabricForm}
        shiftOptions={SHIFT_OPTIONS}
        fabricGenderOptions={fabricGenderOptions}
        orderOptions={orderOptions}
        factoryOptions={factoryOptions}
        fabricTypeOptions={FABRIC_TYPE_OPTIONS}
        operatorOptions={operatorOptions}
        apiRequest={apiRequest}
        onFieldChange={updateAddFabricField}
        onDetailFieldChange={updateAddFabricDetailField}
        onAddDetailRow={addAddFabricDetailRow}
        onCopyDetailRow={copyAddFabricDetailRow}
        onRemoveDetailRow={removeAddFabricDetailRow}
        onClose={closeAddFabricModal}
        onSave={saveAddFabricTransaction}
      />

      <FasonFabricTransactionModal
        isOpen={isFasonFabricModalOpen}
        isLoading={isFasonFabricModalLoading}
        isSaving={isFasonFabricModalSaving}
        error={fasonFabricModalError}
        form={fasonFabricForm}
        factoryOptions={fasonFactoryOptions}
        weavingOrdersByRow={weavingOrdersByRow}
        fabricsByRow={fabricsByRow}
        fabricTypeOptions={FABRIC_TYPE_OPTIONS}
        apiRequest={apiRequest}
        onFieldChange={updateFasonFabricField}
        onDetailFieldChange={updateFasonFabricDetailField}
        onFactorySelect={handleFasonFactorySelect}
        onWeavingOrderSelect={handleFasonWeavingOrderSelect}
        onFabricSelect={handleFasonFabricSelect}
        onAddDetailRow={addFasonFabricDetailRow}
        onRemoveDetailRow={removeFasonFabricDetailRow}
        onClose={closeFasonFabricModal}
        onSave={saveFasonFabricTransaction}
      />

      <section className="content-panel">
        {isRestrictedFabricInspectorUser ? null : isProductionManagerUser ? (
          activeOperation === 'fabrics' ? (
            <FabricsSection
              apiRequest={apiRequest}
              showNotice={showNotice}
              isActive
              currentUserName={authData?.user?.userName || authData?.user?.name || userName || 'المستخدم'}
            />
          ) : activeOperation === 'weavingOrders' ? (
            <WeavingOrdersSection apiRequest={apiRequest} showNotice={showNotice} isActive />
           ) : activeOperation === 'depoHamFabric' ? (
            <DepoHamFabricSection apiRequest={apiRequest} showNotice={showNotice} isActive />
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
        ) : activeOperation === 'yarns' ? (
          <YarnsSection
            apiRequest={apiRequest}
            showNotice={showNotice}
            isActive
            currentUserName={authData?.user?.userName || authData?.user?.name || userName || 'المستخدم'}
          />
        ) : null}
      </section>
    </main>
  )
}

export default App
