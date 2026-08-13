/**
 * Design System - Comprehensive Tailwind Design Patterns
 * نظام التصميم - أنماط Tailwind الموحدة والشاملة
 * 
 * This file contains all reusable design patterns and Tailwind classes
 * for consistent styling across all features
 */

// Color Palette - Slate (Professional & Calm)
export const COLORS = {
  // Primary/Neutral - Slate palette
  slate: {
    50: 'bg-slate-50',
    100: 'bg-slate-100',
    200: 'bg-slate-200',
    300: 'bg-slate-300',
    400: 'bg-slate-400',
    500: 'bg-slate-500',
    600: 'bg-slate-600',
    700: 'bg-slate-700',
    800: 'bg-slate-800',
    900: 'bg-slate-900',
  },
  
  // Status colors
  status: {
    success: 'bg-green-50',
    error: 'bg-red-50',
    warning: 'bg-amber-50',
    info: 'bg-blue-50',
  },
  
  // Text colors
  text: {
    primary: 'text-slate-900',
    secondary: 'text-slate-600',
    tertiary: 'text-slate-500',
    light: 'text-slate-400',
    white: 'text-white',
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-amber-800',
    info: 'text-blue-800',
  },
  
  // Border colors
  border: {
    light: 'border-slate-200',
    medium: 'border-slate-300',
    dark: 'border-slate-400',
    error: 'border-red-200',
  },
}

// Spacing - Consistent margins and padding
export const SPACING = {
  xs: 'gap-2 sm:gap-2',
  sm: 'gap-3 sm:gap-3',
  md: 'gap-4 sm:gap-4',
  lg: 'gap-5 sm:gap-6',
  xl: 'gap-6 sm:gap-8',
}

export const PADDING = {
  section: 'px-4 sm:px-6 py-5 sm:py-7',
  card: 'p-4 sm:p-5',
  container: 'px-4 sm:px-8',
  modal: 'px-4 sm:px-6 py-4',
}

// ============================================
// SECTION & CONTAINER STYLES
// ============================================

export const SECTION_STYLES = {
  // Main section container
  container: 'rounded-2xl border border-slate-200 bg-white shadow-sm',
  
  // Header section
  header: 'border-b border-slate-200 bg-slate-50 rounded-t-2xl px-4 sm:px-6 py-4 sm:py-5',
  
  // Header title
  title: 'text-lg sm:text-xl font-bold text-slate-900',
  
  // Header description
  description: 'text-sm text-slate-600 mt-1',
  
  // Content area
  content: 'px-4 sm:px-6 py-5 sm:py-7',
  
  // Footer area
  footer: 'border-t border-slate-200 bg-slate-50 rounded-b-2xl px-4 sm:px-6 py-4 sm:py-5 flex gap-3 sm:gap-4 justify-end',
}

// ============================================
// BUTTON STYLES
// ============================================

export const BUTTON_STYLES = {
  // Primary button (Slate)
  primary: 'rounded-lg bg-slate-900 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Secondary button (Light slate)
  secondary: 'rounded-lg border border-slate-300 bg-white px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Danger button (Red)
  danger: 'rounded-lg bg-red-600 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Success button (Green)
  success: 'rounded-lg bg-green-600 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Ghost button (No background)
  ghost: 'rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors duration-200',
  
  // Small action buttons (for tables/cards)
  small: 'p-1.5 rounded border border-slate-300 hover:bg-slate-50 transition-colors',
  dangerSmall: 'p-1.5 rounded bg-red-50 border border-red-200 hover:bg-red-100 transition-colors',
  
  // Full width (for modals on mobile)
  fullWidth: 'w-full',
  
  // Large for mobile forms
  large: 'rounded-lg bg-slate-900 px-4 py-3 text-base font-medium text-white hover:bg-slate-800 transition-colors w-full sm:w-auto',
}

// ============================================
// FORM INPUT STYLES
// ============================================

export const INPUT_STYLES = {
  // Base input style
  base: 'rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
  
  // Error state
  error: 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:border-red-400 focus:ring-red-400',
  
  // Small input (compact)
  small: 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs',
  
  // Large input (full-width on mobile)
  large: 'rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base w-full sm:w-auto',
  
  // Select/Dropdown
  select: 'rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed',
}

// ============================================
// LABEL & FORM STYLES
// ============================================

export const FORM_STYLES = {
  // Label text
  label: 'block text-sm font-medium text-slate-700 mb-1.5',
  
  // Required asterisk
  required: 'text-red-600',
  
  // Help text
  helpText: 'mt-1 text-xs text-slate-500',
  
  // Error message
  error: 'mt-1 text-xs text-red-600',
  
  // Form group container
  group: 'space-y-1.5',
  
  // Form field container
  field: 'mb-4 sm:mb-5',
  
  // Two column grid (mobile single, desktop two)
  twoColumn: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  
  // Three column grid
  threeColumn: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5',
  
  // Error state container
  errorContainer: 'border border-red-200 bg-red-50 p-3.5 rounded-lg text-sm text-red-800',
}

// ============================================
// TABLE STYLES
// ============================================

export const TABLE_STYLES = {
  // Desktop table container
  container: 'hidden md:block overflow-x-auto',
  
  // Mobile card container (hidden on md+)
  mobileContainer: 'md:hidden space-y-3',
  
  // Table
  table: 'w-full',
  
  // Table header
  thead: 'bg-slate-100 border-b border-slate-200',
  
  // Table header cell
  th: 'px-4 py-3 text-left text-xs font-semibold text-slate-700',
  
  // Table body
  tbody: '',
  
  // Table row
  tr: 'border-b border-slate-200 hover:bg-slate-50 transition-colors',
  
  // Last row no border
  trLast: 'border-b-0',
  
  // Table cell
  td: 'px-4 py-4 text-sm text-slate-700',
  
  // Action cell (icons/buttons)
  actionTd: 'px-4 py-4 text-center flex gap-2 justify-center',
  
  // Empty state
  empty: 'text-center py-12 text-slate-500',
  
  // Loading state
  loading: 'text-center py-8 text-slate-500',
}

// ============================================
// CARD STYLES (Mobile Table View)
// ============================================

export const CARD_STYLES = {
  // Card container
  container: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow',
  
  // Card header
  header: 'flex justify-between items-start gap-4 pb-3 border-b border-slate-200 mb-3',
  
  // Card title
  title: 'font-semibold text-slate-900',
  
  // Card subtitle
  subtitle: 'text-xs text-slate-500 mt-1',
  
  // Card body
  body: 'space-y-2',
  
  // Card row (label + value)
  row: 'flex justify-between gap-4',
  
  // Card label
  label: 'text-xs font-medium text-slate-600',
  
  // Card value
  value: 'text-sm text-slate-900 text-right',
  
  // Card footer
  footer: 'flex gap-2 justify-end pt-3 border-t border-slate-200 mt-3',
}

// ============================================
// MODAL STYLES
// ============================================

export const MODAL_STYLES = {
  // Overlay
  overlay: 'fixed inset-0 bg-black/50 transition-opacity',
  
  // Modal container
  container: 'fixed inset-0 z-50 flex items-center justify-center sm:items-center p-0 sm:p-4',
  
  // Modal on mobile: slide from bottom
  mobile: 'items-end sm:items-center',
  
  // Modal content
  content: 'w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto',
  
  // Modal header
  header: 'sticky top-0 border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-4 flex justify-between items-center rounded-t-2xl',
  
  // Modal title
  title: 'text-lg sm:text-xl font-bold text-slate-900',
  
  // Close button
  closeBtn: 'text-slate-400 hover:text-slate-600 text-2xl leading-none',
  
  // Modal body
  body: 'px-4 sm:px-6 py-5 sm:py-6',
  
  // Modal footer
  footer: 'sticky bottom-0 border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-4 sm:py-5 flex gap-3 sm:gap-4 justify-end rounded-b-2xl',
  
  // Full width on mobile
  fullWidthMobile: 'sm:max-w-lg',
}

// ============================================
// FILTER & SEARCH STYLES
// ============================================

export const FILTER_STYLES = {
  // Filter container
  container: 'bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5',
  
  // Filter grid (responsive)
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5',
  
  // Filter group
  group: 'space-y-2',
  
  // Filter label
  label: 'text-xs font-semibold text-slate-700 uppercase tracking-wide',
  
  // Filter input
  input: 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:ring-1 focus:ring-slate-400',
  
  // Button group
  buttons: 'flex gap-2 sm:gap-3 flex-wrap sm:flex-nowrap',
}

// ============================================
// PAGINATION STYLES
// ============================================

export const PAGINATION_STYLES = {
  // Container
  container: 'flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 mt-6',
  
  // Info text
  info: 'text-sm text-slate-600',
  
  // Pagination group
  group: 'flex gap-2',
  
  // Page button
  button: 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors',
  
  // Active page
  active: 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800',
  
  // Disabled button
  disabled: 'opacity-50 cursor-not-allowed hover:bg-white',
}

// ============================================
// STATUS BADGE STYLES
// ============================================

export const BADGE_STYLES = {
  // Base badge
  base: 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
  
  // Success badge
  success: 'bg-green-100 text-green-800',
  
  // Error badge
  error: 'bg-red-100 text-red-800',
  
  // Warning badge
  warning: 'bg-amber-100 text-amber-800',
  
  // Info badge
  info: 'bg-blue-100 text-blue-800',
  
  // Default badge
  default: 'bg-slate-100 text-slate-800',
}

// ============================================
// ALERT & NOTIFICATION STYLES
// ============================================

export const ALERT_STYLES = {
  // Base alert
  base: 'rounded-lg p-4 border',
  
  // Success alert
  success: 'border-green-200 bg-green-50 text-green-800',
  
  // Error alert
  error: 'border-red-200 bg-red-50 text-red-800',
  
  // Warning alert
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  
  // Info alert
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

// ============================================
// LOADING & SKELETON STYLES
// ============================================

export const LOADING_STYLES = {
  // Spinner
  spinner: 'inline-block animate-spin',
  
  // Skeleton
  skeleton: 'animate-pulse bg-slate-200 rounded',
  
  // Loading overlay
  overlay: 'absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg',
}

// ============================================
// RESPONSIVE UTILITIES
// ============================================

export const RESPONSIVE = {
  // Container queries
  container: 'w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl',
  
  // Hidden on mobile, shown on md+
  desktopOnly: 'hidden md:block',
  
  // Shown on mobile, hidden on md+
  mobileOnly: 'md:hidden',
  
  // Full width on mobile
  fullWidthMobile: 'w-full sm:w-auto',
  
  // Flex direction mobile to desktop
  flexCol: 'flex flex-col sm:flex-row',
}

// ============================================
// COMPOSITION HELPERS
// ============================================

/**
 * Build complete section styles
 * أنشئ أنماط القسم الكاملة
 */
export const buildSectionClasses = ({
  withRounded = true,
  withBorder = true,
  withShadow = true,
  withBg = true,
} = {}) => {
  const classes = []
  if (withRounded) classes.push('rounded-2xl')
  if (withBorder) classes.push('border', 'border-slate-200')
  if (withBg) classes.push('bg-white')
  if (withShadow) classes.push('shadow-sm')
  return classes.join(' ')
}

/**
 * Build complete button classes
 * أنشئ أنماط الزر الكاملة
 */
export const buildButtonClasses = (variant = 'primary', size = 'md') => {
  let classes = 'rounded-lg font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  // Variants
  switch (variant) {
    case 'primary':
      classes += ' bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-800'
      break
    case 'secondary':
      classes += ' border border-slate-300 bg-white px-5 py-2.5 text-slate-900 hover:bg-slate-50'
      break
    case 'danger':
      classes += ' bg-red-600 px-5 py-2.5 text-white hover:bg-red-700'
      break
    case 'ghost':
      classes += ' px-5 py-2.5 text-slate-700 hover:bg-slate-100'
      break
  }
  
  // Sizes
  switch (size) {
    case 'sm':
      classes = classes.replace('px-5 py-2.5 text-sm', 'px-3 py-1.5 text-xs')
      break
    case 'lg':
      classes = classes.replace('px-5 py-2.5 text-sm', 'px-6 py-3 text-base')
      break
  }
  
  return classes
}

/**
 * Build complete input classes
 * أنشئ أنماط الإدخال الكاملة
 */
export const buildInputClasses = (hasError = false) => {
  const base = 'rounded-lg border bg-white px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-1'
  
  if (hasError) {
    return `${base} border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:border-red-400 focus:ring-red-400`
  }
  
  return `${base} border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-slate-400`
}

export default {
  COLORS,
  SPACING,
  PADDING,
  SECTION_STYLES,
  BUTTON_STYLES,
  INPUT_STYLES,
  FORM_STYLES,
  TABLE_STYLES,
  CARD_STYLES,
  MODAL_STYLES,
  FILTER_STYLES,
  PAGINATION_STYLES,
  BADGE_STYLES,
  ALERT_STYLES,
  LOADING_STYLES,
  RESPONSIVE,
  buildSectionClasses,
  buildButtonClasses,
  buildInputClasses,
}
