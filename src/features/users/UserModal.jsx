import { useEffect } from 'react'
import './UserModal.css'

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

function UserModal({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  onChange,
  onClose,
  onSave,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && !isSaving) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSaving, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="user-modal-card">
        <h4>{form.id ? 'تعديل بيانات المستخدم' : 'اضافة مستخدم جديد'}</h4>

        {isLoading ? (
          <p className="table-state">جاري تحميل بيانات المستخدم...</p>
        ) : (
          <div className="user-modal-form-grid">
            <div className="field-group">
              <label htmlFor="realName">الاسم الحقيقي</label>
              <input
                id="realName"
                type="text"
                value={form.realName}
                onChange={(event) => onChange('realName', event.target.value)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="editUserName">اسم المستخدم</label>
              <input
                id="editUserName"
                type="text"
                value={form.userName}
                onChange={(event) => onChange('userName', event.target.value)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="editPassword">
                كلمة المرور {form.id ? '(اتركها فارغة دون تغيير)' : ''}
              </label>
              <input
                id="editPassword"
                type="password"
                value={form.password}
                onChange={(event) => onChange('password', event.target.value)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="phoneNumber">رقم الهاتف</label>
              <input
                id="phoneNumber"
                type="text"
                value={form.phoneNumber}
                onChange={(event) => onChange('phoneNumber', event.target.value)}
              />
            </div>

            <div className="field-group full-width">
              <label htmlFor="address">العنوان</label>
              <input
                id="address"
                type="text"
                value={form.address}
                onChange={(event) => onChange('address', event.target.value)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="editUserType">نوع المستخدم</label>
              <select
                id="editUserType"
                value={Number(form.userType) || 1}
                onChange={(event) => onChange('userType', Number(event.target.value))}
              >
                {USER_TYPE_OPTIONS.map((typeOption) => (
                  <option key={typeOption.value} value={typeOption.value}>
                    {typeOption.label}
                  </option>
                ))}
                {!USER_TYPE_OPTIONS.some((option) => Number(option.value) === Number(form.userType)) ? (
                  <option value={Number(form.userType) || 1}>{getUserTypeLabel(form.userType)}</option>
                ) : null}
              </select>
            </div>
          </div>
        )}

        {error ? <p className="error-box inline-error">{error}</p> : null}

        <div className="user-modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            الغاء
          </button>
          <button type="button" disabled={isSaving || isLoading} onClick={onSave}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default UserModal
