# ⚡ مرجع سريع | Quick Reference Card

**نظام التصميم الموحد - JudiSystem**

---

## 🎯 ابدأ في دقيقة واحدة | Start in 1 Minute

```javascript
// 1. استيراد
import { Section, SectionHeader, SectionContent, PrimaryButton, TextInput } from '../components/UIComponents'

// 2. البناء
<Section>
  <SectionHeader title="عنواني" />
  <SectionContent>
    <TextInput label="الاسم" value={name} onChange={setName} />
    <PrimaryButton onClick={handleSave}>حفظ</PrimaryButton>
  </SectionContent>
</Section>

// 3. انتهيت! ✅
```

---

## 📚 الملفات الأساسية | Core Files

| الملف | الموقع | الغرض |
|------|--------|-------|
| **designSystem.js** | `src/styles/` | جميع ثوابت Tailwind |
| **UIComponents.jsx** | `src/components/` | 25+ مكون React |
| **ComponentExamples.jsx** | `src/components/` | 4 أمثلة حقيقية |
| **QUICK_START.md** | المجلد الجذر | بدء سريع (5 دقائق) |
| **DESIGN_SYSTEM_GUIDE.md** | المجلد الجذر | دليل شامل (30 دقيقة) |

---

## 🧩 المكونات الأكثر استخداماً | Most Used Components

### الأزرار | Buttons
```javascript
<PrimaryButton onClick={handleSave}>حفظ</PrimaryButton>
<SecondaryButton onClick={handleCancel}>إلغاء</SecondaryButton>
<DangerButton onClick={handleDelete}>حذف</DangerButton>
<IconButton icon="✏️" onClick={handleEdit} />
```

### حقول الإدخال | Inputs
```javascript
<TextInput label="الاسم" value={name} onChange={setName} required error={errors.name} />
<SelectInput label="النوع" value={type} onChange={setType} options={[...]} />
<DateInput label="التاريخ" value={date} onChange={setDate} />
<TextArea label="الملاحظات" value={notes} onChange={setNotes} rows={4} />
```

### الجدول والبطاقات | Table & Cards
```javascript
<Table className={RESPONSIVE.desktopOnly}>
  <TableHead><TableRow>
    <TableHeader>الاسم</TableHeader>
    <TableHeader>الإجراءات</TableHeader>
  </TableRow></TableHead>
  <TableBody>{/* rows */}</TableBody>
</Table>

<div className={RESPONSIVE.mobileOnly}>
  {items.map(item => (
    <MobileCard key={item.id}>
      <MobileCardHeader title={item.name} />
      <MobileCardRow label="النوع" value={item.type} />
    </MobileCard>
  ))}
</div>
```

### النموذج | Modal
```javascript
<Modal isOpen={isOpen} onClose={closeModal}>
  <ModalHeader title="إضافة" onClose={closeModal} />
  <ModalBody>{/* form fields */}</ModalBody>
  <ModalFooter>
    <SecondaryButton onClick={closeModal}>إلغاء</SecondaryButton>
    <PrimaryButton onClick={handleSave}>حفظ</PrimaryButton>
  </ModalFooter>
</Modal>
```

### القسم | Section
```javascript
<Section>
  <SectionHeader title="العنوان" description="الوصف" />
  <SectionContent>{/* محتوى */}</SectionContent>
  <SectionFooter>{/* أزرار */}</SectionFooter>
</Section>
```

### الحالات | Status
```javascript
<Badge variant="success">نشط</Badge>
<Alert variant="error">حدث خطأ!</Alert>
<Pagination currentPage={1} totalPages={5} onPageChange={setPage} />
```

---

## 🎨 الألوان والأنماط | Colors & Styles

### الألوان الموحدة | Colors
```javascript
import { COLORS } from '../styles/designSystem'

// الوصول إلى الألوان:
COLORS.slate.900   // الأسود الأساسي
COLORS.slate.50    // الأبيض الفاتح
COLORS.status.success  // النجاح
COLORS.status.error    // الخطأ
```

### الأنماط المباشرة | Direct Styles
```javascript
import { BUTTON_STYLES, INPUT_STYLES, TABLE_STYLES } from '../styles/designSystem'

<button className={BUTTON_STYLES.primary}>
<input className={INPUT_STYLES.base} />
<div className={TABLE_STYLES.container}>
```

### الاستجابة | Responsive
```javascript
import { RESPONSIVE } from '../styles/designSystem'

<Table className={RESPONSIVE.desktopOnly} />
<div className={RESPONSIVE.mobileOnly} />
```

---

## 📋 النماذج الشائعة | Common Patterns

### النمط 1: إدارة بسيطة
```javascript
<Section>
  <SectionHeader action={<PrimaryButton>+ جديد</PrimaryButton>} />
  <SectionContent>
    {/* جدول + بطاقات */}
  </SectionContent>
  <SectionFooter>
    <Pagination />
  </SectionFooter>
</Section>
```

### النمط 2: نموذج
```javascript
<Modal isOpen={isOpen}>
  <ModalHeader title="نموذج" />
  <ModalBody>
    <FormGrid>
      <TextInput />
      <SelectInput />
    </FormGrid>
  </ModalBody>
  <ModalFooter>
    <SecondaryButton />
    <PrimaryButton />
  </ModalFooter>
</Modal>
```

### النمط 3: بحث وفلاتر
```javascript
<div className="bg-slate-50 rounded p-5 mb-6">
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <TextInput label="بحث" />
    <SelectInput label="النوع" />
    <DateInput label="التاريخ" />
  </div>
  <PrimaryButton>بحث</PrimaryButton>
</div>
```

---

## ⚡ نصائح سريعة | Pro Tips

✅ **للجداول الذكية:**
```javascript
// استخدم RESPONSIVE للتبديل التلقائي
<Table className={RESPONSIVE.desktopOnly} />
<div className={RESPONSIVE.mobileOnly}>{/* cards */}</div>
```

✅ **للأخطاء:**
```javascript
<TextInput error={errors.name} />
// العرض التلقائي للخطأ بالأحمر
```

✅ **للتحميل:**
```javascript
{isLoading && <LoadingSpinner />}
<Modal><LoadingOverlay isLoading={isSaving} /></Modal>
```

✅ **للتنبيهات:**
```javascript
<Alert variant="success">تم بنجاح!</Alert>
<Alert variant="error">خطأ!</Alert>
```

✅ **للشارات:**
```javascript
<Badge variant="success">نشط</Badge>
<Badge variant="error">ملغى</Badge>
```

---

## 🔍 الأسئلة السريعة | Quick Q&A

**س: أين أبدأ؟**
ج: اقرأ README_DESIGN_SYSTEM.md

**س: كيف أضيف جدول؟**
ج: استخدم `<Table>` و `TableRow` و `TableCell`

**س: كيف يكون متجاوب؟**
ج: استخدم `RESPONSIVE.desktopOnly` و `RESPONSIVE.mobileOnly`

**س: كيف أغير الألوان؟**
ج: عدّل `COLORS` في `designSystem.js`

**س: أين الأمثلة؟**
ج: انظر `ComponentExamples.jsx`

**س: كم وقت التطبيق؟**
ج: 30 دقيقة لكل ميزة

---

## 📂 الملفات المهمة | Important Files

```
d:/judiSystemFrontEnd/
├─ src/
│  ├─ styles/
│  │  └─ designSystem.js ⭐
│  └─ components/
│     ├─ UIComponents.jsx ⭐
│     └─ ComponentExamples.jsx ⭐
├─ README_DESIGN_SYSTEM.md ⭐ (ابدأ هنا)
├─ QUICK_START.md ⭐
├─ DESIGN_SYSTEM_GUIDE.md
├─ SYSTEM_ROADMAP.md
└─ PROJECT_COMPLETION_SUMMARY.md
```

---

## ✨ الخطوات الأساسية | Basic Steps

```
1. استيراد المكونات
2. البناء مع Section
3. إضافة البيانات والمنطق
4. اختبار على الهاتف
5. انتهيت! ✅
```

---

## 🎓 المزيد من المعلومات | Learn More

- **QUICK_START.md** - البدء السريع (5 دقائق)
- **DESIGN_SYSTEM_GUIDE.md** - الدليل الشامل (30 دقيقة)
- **SYSTEM_ROADMAP.md** - خريطة كاملة (ساعة)
- **ComponentExamples.jsx** - أمثلة حقيقية (15 دقيقة)

---

## 🎯 كمرجع سريع

```
احفظ هذا الملف!
استخدمه عندما تنسى الأشياء.
كل المعلومات موجودة هنا.
```

**استمتع! 🎉**
