import { useEffect } from 'react'

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-auto bg-slate-950/40 px-4 py-6" role="dialog" aria-modal="true">
      <section className="w-full max-w-2xl overflow-hidden rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg max-h-[90vh] sm:max-h-none overflow-y-auto sm:overflow-y-visible">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-base sm:text-lg font-semibold text-slate-900">
              {form.id ? 'تعديل المستخدم' : 'مستخدم جديد'}
            </h4>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="h-8 w-8 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-200 transition disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-6">
          {isLoading ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-600">جاري التحميل...</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
              <div>
                <label htmlFor="realName" className="block text-sm font-medium text-slate-700 mb-1.5">
                  الاسم الحقيقي <span className="text-red-500">*</span>
                </label>
                <input
                  id="realName"
                  type="text"
                  value={form.realName}
                  onChange={(event) => onChange('realName', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div>
                <label htmlFor="editUserName" className="block text-sm font-medium text-slate-700 mb-1.5">
                  اسم المستخدم <span className="text-red-500">*</span>
                </label>
                <input
                  id="editUserName"
                  type="text"
                  value={form.userName}
                  onChange={(event) => onChange('userName', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div>
                <label htmlFor="editPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                  كلمة المرور {!form.id && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="editPassword"
                  type="password"
                  value={form.password}
                  onChange={(event) => onChange('password', event.target.value)}
                  placeholder={form.id ? 'اتركها فارغة للإبقاء على الكلمة الحالية' : ''}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-1.5">
                  رقم الهاتف
                </label>
                <input
                  id="phoneNumber"
                  type="text"
                  value={form.phoneNumber}
                  onChange={(event) => onChange('phoneNumber', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                  العنوان
                </label>
                <input
                  id="address"
                  type="text"
                  value={form.address}
                  onChange={(event) => onChange('address', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div>
                <label htmlFor="editUserType" className="block text-sm font-medium text-slate-700 mb-1.5">
                  نوع المستخدم
                </label>
                <select
                  id="editUserType"
                  value={Number(form.userType) || 1}
                  onChange={(event) => onChange('userType', Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
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

          {error ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
              {error}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end sticky bottom-0 sm:static">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={isSaving || isLoading}
            onClick={onSave}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default UserModal
