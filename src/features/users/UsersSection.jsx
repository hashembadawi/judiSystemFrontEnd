import { useCallback, useEffect, useMemo, useState } from 'react'
import UserModal from './UserModal'

const USERS_URL = '/api/users'
const UPSERT_USER_URL = '/api/users/upsert'

const USER_TYPE_OPTIONS = [
  { value: 1, label: 'مدير عام' },
  { value: 2, label: 'محاسب' },
  { value: 3, label: 'مسؤول المستودع' },
  { value: 4, label: 'مدير الانتاج' },
  { value: 5, label: 'متابع المصابغ' },
  { value: 6, label: 'فاحص قماش' },
]

const getUserTypeLabel = (value) => {
  const normalizedValue = Number(value)
  const matchingOption = USER_TYPE_OPTIONS.find((option) => Number(option.value) === normalizedValue)

  if (matchingOption) {
    return matchingOption.label
  }

  if (normalizedValue === 6) {
    return 'فاحص قماش'
  }

  return value || 'غير محدد'
}

const createEmptyUserForm = () => ({
  id: 0,
  realName: '',
  userName: '',
  password: '',
  address: '',
  phoneNumber: '',
  userType: 1,
})

function UsersSection({ apiRequest, showNotice, isActive }) {
  const [searchText, setSearchText] = useState('')
  const [filterUserType, setFilterUserType] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isModalSaving, setIsModalSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [form, setForm] = useState(createEmptyUserForm())

  const totalPages = useMemo(() => {
    const rawPages = Math.ceil(totalCount / pageSize)
    return rawPages > 0 ? rawPages : 1
  }, [pageSize, totalCount])

  const fetchUsers = useCallback(async () => {
    setError('')
    setIsLoading(true)

    try {
      const query = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        searchText: searchText.trim(),
        userType: String(filterUserType),
      })

      const response = await apiRequest(`${USERS_URL}?${query.toString()}`)
      const data = response.data || {}

      setUsers(Array.isArray(data.items) ? data.items : [])
      setTotalCount(data.totalCount || 0)
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError('تعذر الاتصال بالخادم. تأكد أن API متاحة على judimensucat.runasp.net وأن الخادم يسمح بطلبات CORS.')
      } else {
        setError(requestError.message || 'تعذر جلب المستخدمين.')
      }
      setUsers([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, filterUserType, pageNumber, pageSize, searchText])

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const timer = setTimeout(() => {
      fetchUsers()
    }, 350)

    return () => clearTimeout(timer)
  }, [fetchUsers, isActive])

  const resetModalState = () => {
    setIsModalOpen(false)
    setIsModalLoading(false)
    setModalError('')
    setForm(createEmptyUserForm())
  }

  const openCreateModal = () => {
    setModalError('')
    setForm(createEmptyUserForm())
    setIsModalOpen(true)
  }

  const openEditModal = async (id) => {
    setIsModalOpen(true)
    setModalError('')
    setIsModalLoading(true)

    try {
      const response = await apiRequest(`${USERS_URL}/${id}`)
      const data = response.data

      setForm({
        id: data.id,
        realName: data.realName || '',
        userName: data.userName || '',
        password: '',
        address: data.address || '',
        phoneNumber: data.phoneNumber || '',
        userType: data.userType || 1,
      })
    } catch (requestError) {
      setModalError(requestError.message || 'تعذر جلب بيانات المستخدم.')
      showNotice('error', requestError.message || 'تعذر جلب بيانات المستخدم.')
    } finally {
      setIsModalLoading(false)
    }
  }

  const closeModal = () => {
    if (isModalSaving) {
      return
    }

    resetModalState()
  }

  const onFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const saveUser = async () => {
    setModalError('')

    if (!form.realName.trim() || !form.userName.trim()) {
      setModalError('الاسم الحقيقي واسم المستخدم حقول مطلوبة.')
      return
    }

    if (!form.id && !form.password.trim()) {
      setModalError('كلمة المرور مطلوبة عند إضافة مستخدم جديد.')
      return
    }

    setIsModalSaving(true)
    const isEditMode = Boolean(form.id)

    try {
      const payload = {
        id: form.id || 0,
        realName: form.realName.trim(),
        userName: form.userName.trim(),
        password: form.password,
        address: form.address,
        phoneNumber: form.phoneNumber,
        userType: Number(form.userType),
      }

      await apiRequest(UPSERT_USER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setIsModalSaving(false)
      resetModalState()
      fetchUsers()
      showNotice('success', isEditMode ? 'تم تعديل المستخدم بنجاح.' : 'تم إضافة المستخدم بنجاح.')
    } catch (requestError) {
      setModalError(requestError.message || 'تعذر حفظ المستخدم.')
      showNotice('error', requestError.message || 'تعذر حفظ المستخدم.')
      setIsModalSaving(false)
    }
  }

  const deleteUser = async (id) => {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')
    if (!confirmed) {
      return
    }

    try {
      await apiRequest(`${USERS_URL}/${id}`, {
        method: 'DELETE',
      })

      fetchUsers()
      showNotice('success', 'تم حذف المستخدم بنجاح.')
    } catch (requestError) {
      setError(requestError.message || 'تعذر حذف المستخدم.')
      showNotice('error', requestError.message || 'تعذر حذف المستخدم.')
    }
  }

  return (
    <>
      <div className="space-y-6">
        <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-sky-900">المستخدمون</h3>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-800 active:bg-sky-900"
            >
              إضافة مستخدم
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="usersSearch" className="text-xs font-medium text-slate-600">البحث</label>
              <input
                id="usersSearch"
                type="text"
                value={searchText}
                onChange={(event) => {
                  setSearchText(event.target.value)
                  setPageNumber(1)
                }}
                placeholder="ابحث..."
                className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-0 transition focus:bg-slate-50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="userTypeFilter" className="text-xs font-medium text-slate-600">نوع المستخدم</label>
              <select
                id="userTypeFilter"
                value={filterUserType}
                onChange={(event) => {
                  setFilterUserType(Number(event.target.value))
                  setPageNumber(1)
                }}
                className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
              >
                <option value={0}>الكل</option>
                {USER_TYPE_OPTIONS.map((typeOption) => (
                  <option key={typeOption.value} value={typeOption.value}>
                    {typeOption.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="usersPageSize" className="text-xs font-medium text-slate-600">حجم الصفحة</label>
              <select
                id="usersPageSize"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setPageNumber(1)
                }}
                className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* عرض الجدول على الأجهزة الكبيرة فقط */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-6 py-3 text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">المعرف</span>
                  </th>
                  <th className="px-6 py-3 text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">الاسم الحقيقي</span>
                  </th>
                  <th className="px-6 py-3 text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">اسم المستخدم</span>
                  </th>
                  <th className="px-6 py-3 text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">الهاتف</span>
                  </th>
                  <th className="px-6 py-3 text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">النوع</span>
                  </th>
                  <th className="px-6 py-3 text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">العنوان</span>
                  </th>
                  <th className="px-6 py-3 text-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">الإجراءات</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      جاري تحميل البيانات...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      لا توجد بيانات
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => openEditModal(user.id)}
                      className="cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-slate-900">{user.id}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-slate-900">{user.realName}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-mono text-slate-700">{user.userName}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-slate-600">{user.phoneNumber || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {user.userTypeName || getUserTypeLabel(user.userType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-slate-600 line-clamp-2">{user.address || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-2.5 justify-center items-center">
                          <button
                            type="button"
                            title="تعديل المستخدم"
                            onClick={(event) => {
                              event.stopPropagation()
                              openEditModal(user.id)
                            }}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition duration-200"
                          >
                            <span className="text-lg">✏️</span>
                          </button>
                          <button
                            type="button"
                            title="حذف المستخدم"
                            onClick={(event) => {
                              event.stopPropagation()
                              deleteUser(user.id)
                            }}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-400 transition duration-200"
                          >
                            <span className="text-lg">🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* عرض البطاقات على الهواتف والأجهزة اللوحية */}
          <div className="md:hidden">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-slate-500">جاري تحميل البيانات...</div>
            ) : users.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-500">لا توجد بيانات</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => openEditModal(user.id)}
                    className="cursor-pointer p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-slate-100 text-xs font-semibold text-slate-700">
                            {user.id}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 truncate">{user.realName}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{user.userName}</span>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          title="تعديل المستخدم"
                          onClick={(event) => {
                            event.stopPropagation()
                            openEditModal(user.id)
                          }}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 transition duration-200"
                        >
                          <span className="text-base">✏️</span>
                        </button>
                        <button
                          type="button"
                          title="حذف المستخدم"
                          onClick={(event) => {
                            event.stopPropagation()
                            deleteUser(user.id)
                          }}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition duration-200"
                        >
                          <span className="text-base">🗑️</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      {user.phoneNumber && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">الهاتف:</span>
                          <span className="font-medium text-slate-900">{user.phoneNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-600">النوع:</span>
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {user.userTypeName || getUserTypeLabel(user.userType)}
                        </span>
                      </div>
                      {user.address && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">العنوان:</span>
                          <span className="font-medium text-slate-900 text-right max-w-xs">{user.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-4">
          <p>إجمالي المستخدمين: <strong className="text-slate-900">{totalCount}</strong></p>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{pageSize} لكل صفحة</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pageNumber <= 1 || isLoading}
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
          >
            السابق
          </button>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">صفحة {pageNumber} من {totalPages}</span>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pageNumber >= totalPages || isLoading}
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, totalPages))}
          >
            التالي
          </button>
        </div>
      </footer>

      <UserModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSaving={isModalSaving}
        error={modalError}
        form={form}
        onChange={onFormChange}
        onClose={closeModal}
        onSave={saveUser}
      />
    </>
  )
}

export default UsersSection
