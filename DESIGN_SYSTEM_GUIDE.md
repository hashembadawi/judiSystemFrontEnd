# 📚 نظام التصميم الموحد - Tailwind Component Library
# Design System - Unified Tailwind Component Library

## 🎨 النظرة العامة | Overview

هذا المشروع يستخدم نظام تصميم موحد وشامل مبني على Tailwind CSS. جميع الواجهات تتبع نمط واحد متسق للألوان والمسافات والأيقونات والتصميم المتجاوب.

This project uses a comprehensive unified design system built with Tailwind CSS. All interfaces follow one consistent pattern for colors, spacing, icons, and responsive design.

---

## 📂 هيكل الملفات | File Structure

```
src/
├── styles/
│   └── designSystem.js          # ✨ ثابتات النظام الكاملة
│                                # All design system constants
├── components/
│   └── UIComponents.jsx         # 🧩 مكونات معاد استخدامها
│                                # Reusable UI components
└── features/
    ├── users/                   # ✅ Users (مكتمل - Complete)
    ├── orders/                  # ⏳ Orders (قادم - Coming)
    ├── fabrics/                 # ⏳ Fabrics (قادم - Coming)
    └── ... (باقي الميزات)
```

---

## 🎯 مبادئ النظام | Design Principles

### 1. **الألوان | Color Palette**
```javascript
// نستخدم لوحة Slate (رمادي) - تخلق مظهراً احترافياً وهادئاً
// We use Slate palette (gray) - creates professional, calm appearance

Primary: slate-900 (dark) → الأساسي
Secondary: slate-50 to slate-200 → الثانوي
Accents: red (danger), green (success), blue (info)
```

### 2. **المسافات | Spacing**
```javascript
// موحد عبر جميع المكونات
// Unified across all components

sm: gap-2 (الأصغر)
md: gap-4 (الوسط) 
lg: gap-5-6 (الكبير)
```

### 3. **الأزرار | Buttons**
```javascript
// ثلاثة أنواع رئيسية + نسخ صغيرة
// Three main types + small versions

Primary (أساسي): bg-slate-900
Secondary (ثانوي): border + bg-white
Danger (حذف): bg-red-600
Small Icons: للجداول والبطاقات
```

### 4. **الاستجابة | Responsiveness**
```javascript
// Mobile-first approach
// sm: 640px | md: 768px | lg: 1024px

Mobile (محمول): 
  - Full width layouts
  - Card view for lists
  - Bottom slide-up modals
  
Desktop (سطح مكتب):
  - Table view for lists
  - Centered modals
  - Multi-column layouts
```

---

## 🚀 الاستخدام السريع | Quick Start

### **استيراد المكونات | Import Components**
```javascript
import {
  PrimaryButton,
  TextInput,
  SelectInput,
  Section,
  SectionHeader,
  SectionContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  MobileCard,
  MobileCardHeader,
  MobileCardRow,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Pagination,
  LoadingSpinner,
} from '../components/UIComponents'

// نظام التصميم الثابت
import { COLORS, SECTION_STYLES, TABLE_STYLES } from '../styles/designSystem'
```

### **مثال: تطبيق يدوي | Manual Example**
```javascript
// For advanced cases where you need raw Tailwind classes
import { SECTION_STYLES, TABLE_STYLES, BUTTON_STYLES } from '../styles/designSystem'

<div className={SECTION_STYLES.container}>
  <div className={SECTION_STYLES.header}>
    <h2 className={SECTION_STYLES.title}>العنوان</h2>
  </div>
  <div className={SECTION_STYLES.content}>
    {/* Content */}
  </div>
</div>
```

---

## 💡 أمثلة استخدام | Usage Examples

### **1️⃣ قسم جديد | New Section**
```javascript
import {
  Section,
  SectionHeader,
  SectionContent,
  SectionFooter,
  PrimaryButton,
  SecondaryButton,
} from '../components/UIComponents'

export function ExampleSection() {
  return (
    <Section>
      <SectionHeader 
        title="العنوان الرئيسي"
        description="وصف قصير هنا"
        action={<PrimaryButton onClick={() => {}}>إضافة جديد</PrimaryButton>}
      />
      <SectionContent>
        {/* محتوى هنا */}
      </SectionContent>
      <SectionFooter>
        <SecondaryButton>إلغاء</SecondaryButton>
        <PrimaryButton>حفظ</PrimaryButton>
      </SectionFooter>
    </Section>
  )
}
```

### **2️⃣ نموذج مع مدخلات | Form with Inputs**
```javascript
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  SelectInput,
  DateInput,
  FormGrid,
  PrimaryButton,
  SecondaryButton,
} from '../components/UIComponents'

export function ExampleModal() {
  const [form, setForm] = React.useState({ name: '', type: '', date: '' })

  return (
    <Modal isOpen={true} onClose={() => {}}>
      <ModalHeader title="إضافة سجل جديد" onClose={() => {}} />
      <ModalBody>
        <FormGrid columns={2}>
          <TextInput
            label="الاسم"
            value={form.name}
            onChange={(val) => setForm({...form, name: val})}
            required
          />
          <SelectInput
            label="النوع"
            value={form.type}
            onChange={(val) => setForm({...form, type: val})}
            options={[
              { value: 1, label: 'نوع أول' },
              { value: 2, label: 'نوع ثاني' },
            ]}
            required
          />
          <DateInput
            label="التاريخ"
            value={form.date}
            onChange={(val) => setForm({...form, date: val})}
            required
          />
        </FormGrid>
      </ModalBody>
      <ModalFooter>
        <SecondaryButton>إلغاء</SecondaryButton>
        <PrimaryButton>حفظ</PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}
```

### **3️⃣ جدول متجاوب | Responsive Table**
```javascript
import {
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
  IconButton,
  RESPONSIVE,
} from '../components/UIComponents'

export function DataList({ items }) {
  return (
    <>
      {/* Desktop Table */}
      <Table className={RESPONSIVE.desktopOnly}>
        <TableHead>
          <TableRow>
            <TableHeader>ID</TableHeader>
            <TableHeader>الاسم</TableHeader>
            <TableHeader>النوع</TableHeader>
            <TableHeader>الإجراءات</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableEmpty />
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell isAction>
                  <IconButton icon="✏️" onClick={() => {}} title="تعديل" />
                  <IconButton icon="🗑️" isDanger onClick={() => {}} title="حذف" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Mobile Cards */}
      <div className={RESPONSIVE.mobileOnly}>
        <div className="space-y-3">
          {items.map((item) => (
            <MobileCard key={item.id}>
              <MobileCardHeader 
                title={item.name} 
                subtitle={`ID: ${item.id}`}
              />
              <MobileCardRow label="النوع" value={item.type} />
              <MobileCardFooter>
                <IconButton icon="✏️" onClick={() => {}} title="تعديل" />
                <IconButton icon="🗑️" isDanger onClick={() => {}} title="حذف" />
              </MobileCardFooter>
            </MobileCard>
          ))}
        </div>
      </div>
    </>
  )
}
```

### **4️⃣ الترقيم | Pagination**
```javascript
import { Pagination } from '../components/UIComponents'

export function ListWithPagination() {
  const [page, setPage] = React.useState(1)
  const totalPages = 5

  return (
    <>
      {/* الجدول والبيانات */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={250}
        pageSize={50}
        onPageChange={setPage}
      />
    </>
  )
}
```

### **5️⃣ التنبيهات والشارات | Alerts & Badges**
```javascript
import { Alert, Badge } from '../components/UIComponents'

// تنبيهات
<Alert variant="success">تم العملية بنجاح!</Alert>
<Alert variant="error">حدث خطأ أثناء الحفظ</Alert>
<Alert variant="warning">تحذير مهم</Alert>

// شارات
<Badge variant="success">نشط</Badge>
<Badge variant="error">ملغى</Badge>
<Badge variant="warning">قيد الانتظار</Badge>
```

---

## 🔄 نمط الترقية | Migration Pattern

### **قبل (CSS) | Before (CSS)**
```javascript
// Old approach with separate CSS file
import './OrdersSection.css'

<div className="orders-section">
  <div className="orders-header">
    <h2 className="orders-title">الطلبات</h2>
  </div>
  <table className="orders-table">
    {/* ... */}
  </table>
</div>
```

### **بعد (Tailwind Components) | After (Tailwind Components)**
```javascript
// New approach with reusable components
import {
  Section,
  SectionHeader,
  SectionContent,
  Table,
  TableHead,
  TableBody,
  // ...
} from '../components/UIComponents'

export function OrdersSection() {
  return (
    <Section>
      <SectionHeader 
        title="الطلبات"
        description="إدارة طلبات العملاء"
        action={<PrimaryButton>+ طلب جديد</PrimaryButton>}
      />
      <SectionContent>
        <Table>
          <TableHead>
            {/* ... */}
          </TableHead>
          <TableBody>
            {/* ... */}
          </TableBody>
        </Table>
      </SectionContent>
    </Section>
  )
}
```

---

## 📋 قائمة الميزات المطبقة | Implemented Features

| Feature | Component | Status | Notes |
|---------|-----------|--------|-------|
| Users | UsersSection.jsx | ✅ Complete | Fully migrated to Tailwind |
| Orders | OrdersSection.jsx | ⏳ Pending | Will use new component pattern |
| Fabrics | FabricsSection.jsx | ⏳ Pending | Will use new component pattern |
| Yarns | YarnsSection.jsx | ⏳ Pending | Will use new component pattern |
| ... | ... | ⏳ Pending | Remaining features |

---

## 🎓 خطوات التطبيق | Implementation Steps

### **للميزات الجديدة | For Each Feature:**

1. **احذف ملف CSS القديم**
   ```bash
   # Remove old CSS import
   - import './OrdersSection.css'
   ```

2. **أضف استيراد المكونات الجديدة**
   ```javascript
   import {
     Section,
     SectionHeader,
     SectionContent,
     Table,
     TableHead,
     TableBody,
     // ... other components
   } from '../components/UIComponents'
   ```

3. **استبدل البنية**
   - أزل div-s القديمة وclasses-ها
   - استخدم Section, SectionHeader, SectionContent
   - استخدم Table components بدلاً من جداول HTML

4. **أضف الاستجابة**
   - استخدم RESPONSIVE.desktopOnly / mobileOnly
   - أضف MobileCard layout للهاتف
   - اختبر على جميع الأحجام

5. **احذف ملفات CSS**
   ```bash
   rm src/features/orders/OrdersSection.css
   ```

---

## 🛠️ Helper Functions | دوال مساعدة

### **بناء الفئات | Building Classes**
```javascript
import { buildButtonClasses, buildInputClasses } from '../styles/designSystem'

// Build custom button
const myButton = buildButtonClasses('primary', 'lg') // large primary button

// Build input with error
const myInput = buildInputClasses(true) // input with error state
```

---

## 📱 Breakpoints المستخدمة | Used Breakpoints

```javascript
// sm:  640px  (tablets)
// md:  768px  (small desktop)
// lg:  1024px (large desktop)

// Examples:
<div className="w-full sm:w-1/2 lg:w-1/3"> {/* Responsive width */}
<button className="px-4 sm:px-6 lg:px-8"> {/* Responsive padding */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"> {/* Responsive grid */}
```

---

## ✅ Checklist للمشروع | Project Checklist

- [x] Create design system constants (designSystem.js)
- [x] Create reusable UI components (UIComponents.jsx)
- [x] Document design principles
- [x] Provide usage examples
- [ ] Migrate Orders feature
- [ ] Migrate Fabrics feature
- [ ] Migrate Yarns feature
- [ ] Migrate remaining 8 features
- [ ] Remove all CSS files
- [ ] Test responsive design on all devices
- [ ] Final polish and refinement

---

## 🎯 الخطوة التالية | Next Steps

1. **تطبيق على Orders** - Start with Orders feature (most complex)
2. **تطبيق على Fabrics** - Then Fabrics
3. **تطبيق على الباقي** - Systematically apply to all features
4. **الاختبار الشامل** - Comprehensive testing

---

## 📚 Reference | المرجع

- Tailwind CSS: https://tailwindcss.com
- Component patterns: See UIComponents.jsx
- Design constants: See designSystem.js
- Live example: See Users feature (UsersSection.jsx)

---

**النظام موحد وسهل الصيانة والتوسع!**
**The system is unified, easy to maintain and extend!** ✨
