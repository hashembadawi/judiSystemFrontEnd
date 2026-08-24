/**
 * Component Usage Examples - Real-World Patterns
 * أمثلة استخدام المكونات - أنماط واقعية
 * 
 * This file demonstrates real-world usage patterns for all UI components
 */

import { useState } from 'react'
import {
  // Buttons
  PrimaryButton,
  SecondaryButton,
  IconButton,
  
  // Form inputs
  TextInput,
  SelectInput,
  DateInput,
  TextArea,
  FormGrid,
  FormError,
  
  // Tables
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableEmpty,
  
  // Mobile Cards
  MobileCard,
  MobileCardHeader,
  MobileCardRow,
  MobileCardFooter,
  
  // Modal
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  
  // Status
  Badge,
  Alert,
  
  // Pagination
  Pagination,
  
  // Sections
  Section,
  SectionHeader,
  SectionContent,
  SectionFooter,
  
  // Utilities
  LoadingSpinner,
  LoadingOverlay,
} from './UIComponents'

import { RESPONSIVE } from '../styles/designSystem'

// ============================================
// EXAMPLE 1: Management List with CRUD
// ============================================

/**
 * Example: User/Product Management List
 * Full-featured management interface with:
 * - Search and filters
 * - Desktop table + Mobile cards
 * - Add/Edit/Delete actions
 * - Pagination
 */
export function ManagementListExample() {
  const [searchText, setSearchText] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [error, setError] = useState('')

  // Mock data
  const items = [
    { id: 1, name: 'أحمد محمد', email: 'ahmed@example.com', type: 'admin', status: 'نشط' },
    { id: 2, name: 'فاطمة علي', email: 'fatima@example.com', type: 'user', status: 'نشط' },
    { id: 3, name: 'محمود حسن', email: 'mahmoud@example.com', type: 'editor', status: 'معطل' },
  ]

  const totalRecords = items.length
  const totalPages = Math.ceil(totalRecords / pageSize)

  const handleAddNew = () => {
    setEditingItem(null)
    setError('')
    setIsModalOpen(true)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setError('')
    setIsModalOpen(true)
  }

  const handleDelete = () => {
    if (confirm('هل تريد حذف هذا السجل؟')) {
      // Delete logic here
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    // Save logic
    setTimeout(() => {
      setIsModalOpen(false)
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Section>
      <SectionHeader
        title="إدارة المستخدمين"
        description="عرض وإدارة جميع المستخدمين في النظام"
        action={<PrimaryButton onClick={handleAddNew}>+ مستخدم جديد</PrimaryButton>}
      />

      <SectionContent>
        {/* Filters */}
        <div className="mb-6 p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TextInput
              label="بحث"
              value={searchText}
              onChange={setSearchText}
              placeholder="ابحث عن اسم أو بريد إلكتروني..."
            />
            <SelectInput
              label="النوع"
              options={[
                { value: 'admin', label: 'مدير' },
                { value: 'user', label: 'مستخدم' },
                { value: 'editor', label: 'محرر' },
              ]}
            />
            <SelectInput
              label="الحالة"
              options={[
                { value: 'نشط', label: 'نشط' },
                { value: 'معطل', label: 'معطل' },
              ]}
            />
          </div>
        </div>

        {/* Desktop Table */}
        <Table className={RESPONSIVE.desktopOnly}>
          <TableHead>
            <TableRow>
              <TableHeader>الاسم</TableHeader>
              <TableHeader>البريد الإلكتروني</TableHeader>
              <TableHeader>النوع</TableHeader>
              <TableHeader>الحالة</TableHeader>
              <TableHeader>الإجراءات</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableEmpty message="لا توجد بيانات" />
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'نشط' ? 'success' : 'warning'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell isAction>
                    <IconButton icon="✏️" onClick={() => handleEdit(item)} title="تعديل" />
                    <IconButton icon="🗑️" isDanger onClick={() => handleDelete(item.id)} title="حذف" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Mobile Cards */}
        <div className={`${RESPONSIVE.mobileOnly} space-y-3`}>
          {items.map((item) => (
            <MobileCard key={item.id}>
              <MobileCardHeader
                title={item.name}
                subtitle={item.email}
                action={
                  <Badge variant={item.status === 'نشط' ? 'success' : 'warning'}>
                    {item.status}
                  </Badge>
                }
              />
              <MobileCardRow label="النوع" value={item.type} />
              <MobileCardFooter>
                <IconButton icon="✏️" onClick={() => handleEdit(item)} title="تعديل" />
                <IconButton icon="🗑️" isDanger onClick={() => handleDelete(item.id)} title="حذف" />
              </MobileCardFooter>
            </MobileCard>
          ))}
        </div>
      </SectionContent>

      {/* Pagination */}
      <SectionFooter>
        <Pagination
          currentPage={pageNumber}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageChange={setPageNumber}
        />
      </SectionFooter>

      {/* Edit Modal */}
      <CRUDModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
        isLoading={isLoading}
        error={error}
        onSave={handleSave}
        item={editingItem}
      />
    </Section>
  )
}

// ============================================
// EXAMPLE 2: CRUD Modal
// ============================================

function CRUDModal({ isOpen, onClose, title, isLoading, error, onSave, item }) {
  const [form, setForm] = useState(
    item || {
      name: '',
      email: '',
      type: 'user',
      status: 'نشط',
    },
  )

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />
      <ModalBody>
        {error && <FormError message={error} className="mb-4" />}
        <FormGrid columns={2}>
          <TextInput
            label="الاسم"
            value={form.name}
            onChange={(val) => handleChange('name', val)}
            required
          />
          <TextInput
            label="البريد الإلكتروني"
            type="email"
            value={form.email}
            onChange={(val) => handleChange('email', val)}
            required
          />
          <SelectInput
            label="النوع"
            value={form.type}
            onChange={(val) => handleChange('type', val)}
            options={[
              { value: 'admin', label: 'مدير' },
              { value: 'user', label: 'مستخدم' },
              { value: 'editor', label: 'محرر' },
            ]}
            required
          />
          <SelectInput
            label="الحالة"
            value={form.status}
            onChange={(val) => handleChange('status', val)}
            options={[
              { value: 'نشط', label: 'نشط' },
              { value: 'معطل', label: 'معطل' },
            ]}
            required
          />
        </FormGrid>
        <TextArea
          label="الملاحظات"
          value={form.notes || ''}
          onChange={(val) => handleChange('notes', val)}
          placeholder="أضف أي ملاحظات إضافية..."
          rows={4}
        />
      </ModalBody>
      <ModalFooter>
        <SecondaryButton onClick={onClose} disabled={isLoading}>
          إلغاء
        </SecondaryButton>
        <PrimaryButton onClick={onSave} disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : 'حفظ'}
        </PrimaryButton>
      </ModalFooter>
      <LoadingOverlay isLoading={isLoading} />
    </Modal>
  )
}

// ============================================
// EXAMPLE 3: Form with Validation
// ============================================

export function FormWithValidationExample() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    type: '',
    date: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const validateForm = () => {
    const newErrors = {}
    if (!form.firstName.trim()) newErrors.firstName = 'الاسم الأول مطلوب'
    if (!form.lastName.trim()) newErrors.lastName = 'الاسم الأخير مطلوب'
    if (!form.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب'
    if (!form.type) newErrors.type = 'النوع مطلوب'
    return newErrors
  }

  const handleSubmit = async () => {
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert('تم الحفظ بنجاح!')
      setForm({ firstName: '', lastName: '', email: '', phone: '', type: '', date: '' })
    } catch {
      setSubmitError('حدث خطأ أثناء الحفظ. حاول مرة أخرى.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Section>
      <SectionHeader
        title="نموذج جديد"
        description="ملء النموذج بجميع البيانات المطلوبة"
      />
      <SectionContent>
        {submitError && <Alert variant="error" className="mb-6">{submitError}</Alert>}

        <FormGrid columns={2}>
          <TextInput
            label="الاسم الأول"
            value={form.firstName}
            onChange={(val) => handleChange('firstName', val)}
            error={errors.firstName}
            required
          />
          <TextInput
            label="الاسم الأخير"
            value={form.lastName}
            onChange={(val) => handleChange('lastName', val)}
            error={errors.lastName}
            required
          />
          <TextInput
            label="البريد الإلكتروني"
            type="email"
            value={form.email}
            onChange={(val) => handleChange('email', val)}
            error={errors.email}
            required
          />
          <TextInput
            label="الهاتف"
            type="tel"
            value={form.phone}
            onChange={(val) => handleChange('phone', val)}
          />
          <SelectInput
            label="النوع"
            value={form.type}
            onChange={(val) => handleChange('type', val)}
            options={[
              { value: 'individual', label: 'فرد' },
              { value: 'company', label: 'شركة' },
            ]}
            error={errors.type}
            required
          />
          <DateInput
            label="التاريخ"
            value={form.date}
            onChange={(val) => handleChange('date', val)}
          />
        </FormGrid>
      </SectionContent>
      <SectionFooter>
        <SecondaryButton onClick={() => setForm({firstName: '', lastName: '', email: '', phone: '', type: '', date: ''})}>
          إعادة تعيين
        </SecondaryButton>
        <PrimaryButton onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <LoadingSpinner size="sm" /> : 'حفظ'}
        </PrimaryButton>
      </SectionFooter>
    </Section>
  )
}

// ============================================
// EXAMPLE 4: Alerts & Status Display
// ============================================

export function AlertsAndStatusExample() {
  return (
    <Section>
      <SectionHeader
        title="التنبيهات والحالات"
        description="أمثلة على عرض الحالات والتنبيهات"
      />
      <SectionContent className="space-y-6">
        {/* Success Alert */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">نجاح</h3>
          <Alert variant="success">تم إكمال العملية بنجاح!</Alert>
        </div>

        {/* Error Alert */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">خطأ</h3>
          <Alert variant="error">حدث خطأ أثناء معالجة الطلب. الرجاء المحاولة مجددًا.</Alert>
        </div>

        {/* Warning Alert */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">تحذير</h3>
          <Alert variant="warning">هذا الإجراء سيؤدي إلى حذف البيانات بشكل نهائي.</Alert>
        </div>

        {/* Info Alert */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">معلومة</h3>
          <Alert variant="info">تم تحديث النظام بنجاح. الرجاء تحديث الصفحة.</Alert>
        </div>

        {/* Badges */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">الشارات</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">نشط</Badge>
            <Badge variant="error">معطل</Badge>
            <Badge variant="warning">قيد الانتظار</Badge>
            <Badge variant="info">معلومة</Badge>
            <Badge variant="default">افتراضي</Badge>
          </div>
        </div>
      </SectionContent>
    </Section>
  )
}

// ============================================
// EXPORT ALL EXAMPLES
// ============================================

export default {
  ManagementListExample,
  FormWithValidationExample,
  AlertsAndStatusExample,
}
