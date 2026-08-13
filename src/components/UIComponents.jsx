/**
 * Reusable Components Library - Built with Tailwind CSS
 * مكتبة المكونات القابلة لإعادة الاستخدام
 * 
 * All components follow the unified design system
 * جميع المكونات تتبع نظام التصميم الموحد
 */

import React from 'react'
import {
  BUTTON_STYLES,
  INPUT_STYLES,
  FORM_STYLES,
  TABLE_STYLES,
  CARD_STYLES,
  MODAL_STYLES,
  PAGINATION_STYLES,
  BADGE_STYLES,
  ALERT_STYLES,
  LOADING_STYLES,
  RESPONSIVE,
  buildButtonClasses,
  buildInputClasses,
} from './designSystem'

// ============================================
// BUTTON COMPONENTS
// ============================================

/**
 * PrimaryButton - Main action button (Slate)
 * الزر الأساسي - زر الإجراء الرئيسي
 */
export const PrimaryButton = ({ children, onClick, disabled = false, className = '', ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${BUTTON_STYLES.primary} ${className}`}
    {...props}
  >
    {children}
  </button>
)

/**
 * SecondaryButton - Cancel/Secondary action button
 * الزر الثانوي - زر الإلغاء/الإجراء الثانوي
 */
export const SecondaryButton = ({ children, onClick, disabled = false, className = '', ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${BUTTON_STYLES.secondary} ${className}`}
    {...props}
  >
    {children}
  </button>
)

/**
 * DangerButton - Delete/Destructive action button
 * زر الحذف - الإجراء الهدام
 */
export const DangerButton = ({ children, onClick, disabled = false, className = '', ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${BUTTON_STYLES.danger} ${className}`}
    {...props}
  >
    {children}
  </button>
)

/**
 * IconButton - Small action button (for tables/cards)
 * زر الأيقونة - زر الإجراء الصغير
 */
export const IconButton = ({ icon, onClick, isDanger = false, title = '', className = '', ...props }) => (
  <button
    onClick={onClick}
    title={title}
    className={`${isDanger ? BUTTON_STYLES.dangerSmall : BUTTON_STYLES.small} ${className}`}
    {...props}
  >
    <span className="text-sm">{icon}</span>
  </button>
)

// ============================================
// INPUT COMPONENTS
// ============================================

/**
 * TextInput - Standard text input field
 * حقل الإدخال النصي
 */
export const TextInput = ({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  disabled = false,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div className={FORM_STYLES.field}>
      {label && (
        <label className={FORM_STYLES.label}>
          {label}
          {required && <span className={FORM_STYLES.required}> *</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${buildInputClasses(!!error)} ${className}`}
        {...props}
      />
      {error && <span className={FORM_STYLES.error}>{error}</span>}
    </div>
  )
}

/**
 * SelectInput - Dropdown/Select field
 * حقل الاختيار
 */
export const SelectInput = ({
  label,
  value,
  onChange,
  options = [],
  required = false,
  error = '',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={FORM_STYLES.field}>
      {label && (
        <label className={FORM_STYLES.label}>
          {label}
          {required && <span className={FORM_STYLES.required}> *</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${INPUT_STYLES.select} ${error ? INPUT_STYLES.error : ''} ${className}`}
        {...props}
      >
        <option value="">-- اختر --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className={FORM_STYLES.error}>{error}</span>}
    </div>
  )
}

/**
 * DateInput - Date picker field
 * حقل اختيار التاريخ
 */
export const DateInput = ({
  label,
  value,
  onChange,
  required = false,
  error = '',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <TextInput
      type="date"
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      error={error}
      disabled={disabled}
      className={className}
      {...props}
    />
  )
}

/**
 * TextArea - Multi-line text input
 * حقل النص متعدد الأسطر
 */
export const TextArea = ({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  disabled = false,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className={FORM_STYLES.field}>
      {label && (
        <label className={FORM_STYLES.label}>
          {label}
          {required && <span className={FORM_STYLES.required}> *</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`${buildInputClasses(!!error)} resize-none ${className}`}
        {...props}
      />
      {error && <span className={FORM_STYLES.error}>{error}</span>}
    </div>
  )
}

// ============================================
// FORM COMPONENTS
// ============================================

/**
 * FormGrid - Two-column responsive grid for forms
 * شبكة النموذج - شبكة موحدة الأعمدة
 */
export const FormGrid = ({ children, columns = 2, className = '' }) => {
  const gridClass = columns === 3 ? FORM_STYLES.threeColumn : FORM_STYLES.twoColumn
  return <div className={`${gridClass} ${className}`}>{children}</div>
}

/**
 * FormGroup - Container for related form fields
 * مجموعة النموذج
 */
export const FormGroup = ({ children, label, className = '' }) => (
  <div className={`${FORM_STYLES.group} ${className}`}>
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    {children}
  </div>
)

/**
 * FormError - Error message display
 * رسالة الخطأ
 */
export const FormError = ({ message, className = '' }) => {
  if (!message) return null
  return <div className={`${ALERT_STYLES.error} ${className}`}>{message}</div>
}

// ============================================
// TABLE COMPONENTS
// ============================================

/**
 * Table - Desktop table component
 * جدول سطح المكتب
 */
export const Table = ({ children, className = '' }) => (
  <div className={`${TABLE_STYLES.container} ${className}`}>
    <table className={TABLE_STYLES.table}>{children}</table>
  </div>
)

/**
 * TableHead - Table header
 * رأس الجدول
 */
export const TableHead = ({ children, className = '' }) => (
  <thead className={`${TABLE_STYLES.thead} ${className}`}>{children}</thead>
)

/**
 * TableBody - Table body
 * جسم الجدول
 */
export const TableBody = ({ children, className = '' }) => (
  <tbody className={`${TABLE_STYLES.tbody} ${className}`}>{children}</tbody>
)

/**
 * TableRow - Table row
 * صف الجدول
 */
export const TableRow = ({ children, isLast = false, className = '' }) => (
  <tr className={`${TABLE_STYLES.tr} ${isLast ? TABLE_STYLES.trLast : ''} ${className}`}>{children}</tr>
)

/**
 * TableHeader - Table header cell
 * خلية رأس الجدول
 */
export const TableHeader = ({ children, className = '' }) => (
  <th className={`${TABLE_STYLES.th} ${className}`}>{children}</th>
)

/**
 * TableCell - Table data cell
 * خلية البيانات
 */
export const TableCell = ({ children, isAction = false, className = '' }) => (
  <td className={`${isAction ? TABLE_STYLES.actionTd : TABLE_STYLES.td} ${className}`}>{children}</td>
)

/**
 * TableEmpty - Empty state message
 * حالة الجدول الفارغ
 */
export const TableEmpty = ({ message = 'لا توجد بيانات', className = '' }) => (
  <tr>
    <td colSpan="100" className={`${TABLE_STYLES.empty} ${className}`}>
      {message}
    </td>
  </tr>
)

/**
 * MobileCard - Card for mobile table view
 * بطاقة الهاتف
 */
export const MobileCard = ({ children, className = '' }) => (
  <div className={`${CARD_STYLES.container} ${className}`}>{children}</div>
)

/**
 * MobileCardHeader - Card header with title
 * رأس البطاقة
 */
export const MobileCardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`${CARD_STYLES.header} ${className}`}>
    <div>
      <div className={CARD_STYLES.title}>{title}</div>
      {subtitle && <div className={CARD_STYLES.subtitle}>{subtitle}</div>}
    </div>
    {action && <div>{action}</div>}
  </div>
)

/**
 * MobileCardRow - Row with label and value
 * صف البطاقة
 */
export const MobileCardRow = ({ label, value, className = '' }) => (
  <div className={`${CARD_STYLES.row} ${className}`}>
    <span className={CARD_STYLES.label}>{label}</span>
    <span className={CARD_STYLES.value}>{value}</span>
  </div>
)

/**
 * MobileCardFooter - Card footer with actions
 * تذييل البطاقة
 */
export const MobileCardFooter = ({ children, className = '' }) => (
  <div className={`${CARD_STYLES.footer} ${className}`}>{children}</div>
)

// ============================================
// MODAL COMPONENTS
// ============================================

/**
 * Modal - Dialog/Modal wrapper
 * نافذة مشروط
 */
export const Modal = ({ isOpen, onClose, children, className = '' }) => {
  if (!isOpen) return null

  return (
    <>
      <div className={MODAL_STYLES.overlay} onClick={onClose} />
      <div className={`${MODAL_STYLES.container} ${MODAL_STYLES.mobile}`}>
        <div className={`${MODAL_STYLES.content} ${className}`}>{children}</div>
      </div>
    </>
  )
}

/**
 * ModalHeader - Modal header with title and close button
 * رأس النافذة
 */
export const ModalHeader = ({ title, onClose, className = '' }) => (
  <div className={`${MODAL_STYLES.header} ${className}`}>
    <h2 className={MODAL_STYLES.title}>{title}</h2>
    <button onClick={onClose} className={MODAL_STYLES.closeBtn}>
      ×
    </button>
  </div>
)

/**
 * ModalBody - Modal content area
 * محتوى النافذة
 */
export const ModalBody = ({ children, className = '' }) => (
  <div className={`${MODAL_STYLES.body} ${className}`}>{children}</div>
)

/**
 * ModalFooter - Modal footer with action buttons
 * تذييل النافذة
 */
export const ModalFooter = ({ children, className = '' }) => (
  <div className={`${MODAL_STYLES.footer} ${className}`}>{children}</div>
)

// ============================================
// BADGE & STATUS COMPONENTS
// ============================================

/**
 * Badge - Status badge/tag
 * شارة الحالة
 */
export const Badge = ({ children, variant = 'default', className = '' }) => {
  let variantClass = BADGE_STYLES.default
  switch (variant) {
    case 'success':
      variantClass = BADGE_STYLES.success
      break
    case 'error':
      variantClass = BADGE_STYLES.error
      break
    case 'warning':
      variantClass = BADGE_STYLES.warning
      break
    case 'info':
      variantClass = BADGE_STYLES.info
      break
  }
  return <span className={`${BADGE_STYLES.base} ${variantClass} ${className}`}>{children}</span>
)

// ============================================
// ALERT COMPONENTS
// ============================================

/**
 * Alert - Notification/Alert message
 * تنبيه/إشعار
 */
export const Alert = ({ children, variant = 'info', className = '' }) => {
  let variantClass = ALERT_STYLES.info
  switch (variant) {
    case 'success':
      variantClass = ALERT_STYLES.success
      break
    case 'error':
      variantClass = ALERT_STYLES.error
      break
    case 'warning':
      variantClass = ALERT_STYLES.warning
      break
  }
  return <div className={`${ALERT_STYLES.base} ${variantClass} ${className}`}>{children}</div>
}

// ============================================
// PAGINATION COMPONENTS
// ============================================

/**
 * Pagination - Page navigation
 * التنقل بين الصفحات
 */
export const Pagination = ({ currentPage, totalPages, onPageChange, totalRecords, pageSize, className = '' }) => {
  if (totalPages <= 1) return null

  return (
    <div className={`${PAGINATION_STYLES.container} ${className}`}>
      <div className={PAGINATION_STYLES.info}>
        إجمالي السجلات: <strong>{totalRecords}</strong> | الصفحة <strong>{currentPage}</strong> من{' '}
        <strong>{totalPages}</strong>
      </div>
      <div className={PAGINATION_STYLES.group}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`${PAGINATION_STYLES.button} ${currentPage <= 1 ? PAGINATION_STYLES.disabled : ''}`}
        >
          السابق
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = Math.max(1, currentPage - 2) + i
          if (page > totalPages) return null
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`${PAGINATION_STYLES.button} ${page === currentPage ? PAGINATION_STYLES.active : ''}`}
            >
              {page}
            </button>
          )
        })}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`${PAGINATION_STYLES.button} ${currentPage >= totalPages ? PAGINATION_STYLES.disabled : ''}`}
        >
          التالي
        </button>
      </div>
    </div>
  )
}

// ============================================
// SECTION COMPONENTS
// ============================================

/**
 * Section - Main content section
 * القسم الرئيسي
 */
export const Section = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
)

/**
 * SectionHeader - Section header with title
 * رأس القسم
 */
export const SectionHeader = ({ title, description, action, className = '' }) => (
  <div className={`border-b border-slate-200 bg-slate-50 rounded-t-2xl px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-start gap-4 ${className}`}>
    <div>
      <h2 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
)

/**
 * SectionContent - Section body
 * محتوى القسم
 */
export const SectionContent = ({ children, className = '' }) => (
  <div className={`px-4 sm:px-6 py-5 sm:py-7 ${className}`}>{children}</div>
)

/**
 * SectionFooter - Section footer
 * تذييل القسم
 */
export const SectionFooter = ({ children, className = '' }) => (
  <div className={`border-t border-slate-200 bg-slate-50 rounded-b-2xl px-4 sm:px-6 py-4 sm:py-5 flex gap-3 sm:gap-4 justify-end ${className}`}>
    {children}
  </div>
)

// ============================================
// LOADING & UTILITY COMPONENTS
// ============================================

/**
 * LoadingSpinner - Loading indicator
 * مؤشر التحميل
 */
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
  return (
    <div className={`${LOADING_STYLES.spinner} ${sizeClass} border-2 border-slate-300 border-t-slate-900 rounded-full ${className}`} />
  )
}

/**
 * LoadingOverlay - Full overlay loading state
 * تحميل كامل الشاشة
 */
export const LoadingOverlay = ({ isLoading, className = '' }) => {
  if (!isLoading) return null
  return (
    <div className={`${LOADING_STYLES.overlay} ${className}`}>
      <LoadingSpinner size="lg" />
    </div>
  )
}

// Export all components as default
export default {
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  IconButton,
  TextInput,
  SelectInput,
  DateInput,
  TextArea,
  FormGrid,
  FormGroup,
  FormError,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableEmpty,
  MobileCard,
  MobileCardHeader,
  MobileCardRow,
  MobileCardFooter,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Badge,
  Alert,
  Pagination,
  Section,
  SectionHeader,
  SectionContent,
  SectionFooter,
  LoadingSpinner,
  LoadingOverlay,
}
