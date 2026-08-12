import { useCallback, useEffect, useMemo, useState } from 'react'
import './UsersSection.css'
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
      <header className="content-header">
        <div>
          <h3>ادارة المستخدمين</h3>
          <p>عرض وتعديل وإضافة وحذف المستخدمين.</p>
        </div>
        <button type="button" className="add-button" onClick={openCreateModal}>
          + اضافة مستخدم
        </button>
      </header>

      <section className="filters-panel" aria-label="فلترة المستخدمين">
        <div className="field-group">
          <label htmlFor="usersSearch">بحث</label>
          <input
            id="usersSearch"
            type="text"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value)
              setPageNumber(1)
            }}
            placeholder="اسم المستخدم او الاسم الحقيقي"
          />
        </div>

        <div className="field-group">
          <label htmlFor="userTypeFilter">نوع المستخدم</label>
          <select
            id="userTypeFilter"
            value={filterUserType}
            onChange={(event) => {
              setFilterUserType(Number(event.target.value))
              setPageNumber(1)
            }}
          >
            <option value={0}>الكل</option>
            {USER_TYPE_OPTIONS.map((typeOption) => (
              <option key={typeOption.value} value={typeOption.value}>
                {typeOption.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group page-size-group">
          <label htmlFor="usersPageSize">حجم الصفحة</label>
          <select
            id="usersPageSize"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              setPageNumber(1)
            }}
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
              <th>المعرف</th>
              <th>الاسم الحقيقي</th>
              <th>اسم المستخدم</th>
              <th>الهاتف</th>
              <th>النوع</th>
              <th>العنوان</th>
              <th>الاجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="table-state">جاري تحميل البيانات...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-state">لا توجد بيانات مطابقة.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} onClick={() => openEditModal(user.id)}>
                  <td>{user.id}</td>
                  <td>{user.realName}</td>
                  <td>{user.userName}</td>
                  <td>{user.phoneNumber}</td>
                  <td>{user.userTypeName || getUserTypeLabel(user.userType)}</td>
                  <td>{user.address}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="action-btn edit"
                        onClick={(event) => {
                          event.stopPropagation()
                          openEditModal(user.id)
                        }}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="action-btn delete"
                        onClick={(event) => {
                          event.stopPropagation()
                          deleteUser(user.id)
                        }}
                      >
                        حذف
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
        <p>
          عدد النتائج: <strong>{totalCount}</strong>
        </p>
        <div className="pagination-controls">
          <button
            type="button"
            className="pager-btn"
            disabled={pageNumber <= 1 || isLoading}
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
          >
            السابق
          </button>
          <span>
            الصفحة {pageNumber} من {totalPages}
          </span>
          <button
            type="button"
            className="pager-btn"
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
