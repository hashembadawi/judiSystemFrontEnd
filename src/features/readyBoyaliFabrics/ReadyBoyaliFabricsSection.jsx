import { useCallback, useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FileDown, LoaderCircle, Search } from 'lucide-react'

const FILL_OPTIONS_URL = '/api/fill-options?requestedValues=1'
const READY_FABRICS_URL = '/api/ReadyBoyaliFabrics/getReadFabrics'
const COLUMNS = ['orderNo', 'factoryName', 'etiket_Basligi', 'fabricGender', 'cikisTopSayisi', 'cikisWeight', 'renk']
const COPY = {
  ar: {
    direction: 'rtl', title: 'القماش الجاهز للتصدير', eyebrow: 'تجهيز التصدير', switchLabel: 'Türkçe diline geç',
    factory: 'المعمل', allFactories: 'كل المعامل', orderNo: 'رقم الطلب', label: 'عنوان الملصق',
    columns: ['رقم الطلب', 'المعمل', 'عنوان الملصق', 'نوع القماش', 'عدد لفات الخروج', 'وزن الخروج', 'اللون'],
    rowNumber: '#',
    total: 'الإجمالي',
    search: 'بحث', loading: 'جارٍ تحميل البيانات...', noData: 'لا توجد بيانات مطابقة للفلاتر.',
    count: 'إجمالي النتائج', exportPdf: 'تصدير PDF', exportingPdf: 'جارٍ إنشاء PDF...',
    pdfReady: 'تم إنشاء ملف PDF.', pdfError: 'تعذر إنشاء ملف PDF.', fontError: 'تعذر تحميل خط PDF.',
    loadError: 'تعذر تحميل الأقمشة الجاهزة للتصدير.', factoryError: 'تعذر تحميل قائمة المعامل.',
    generatedAt: 'تاريخ التقرير',
  },
  tr: {
    direction: 'ltr', title: 'İhracata Hazır Boyalı Kumaşlar', eyebrow: 'İHRACAT HAZIRLIK', switchLabel: 'Arapça diline geç',
    factory: 'Boyahane', allFactories: 'Tüm boyahaneler', orderNo: 'Sipariş No', label: 'Etiket Başlığı',
    columns: ['Sipariş No', 'Boyahane', 'Etiket Başlığı', 'Kumaş Cinsi', 'Çıkış Top Sayısı', 'Çıkış Ağırlığı', 'Renk'],
    rowNumber: '#',
    total: 'TOPLAM',
    search: 'Ara', loading: 'Veriler yükleniyor...', noData: 'Filtrelerle eşleşen kayıt bulunamadı.',
    count: 'Toplam sonuç', exportPdf: 'PDF dışa aktar', exportingPdf: 'PDF oluşturuluyor...',
    pdfReady: 'PDF dosyası oluşturuldu.', pdfError: 'PDF dosyası oluşturulamadı.', fontError: 'PDF yazı tipi yüklenemedi.',
    loadError: 'İhracata hazır kumaşlar yüklenemedi.', factoryError: 'Boyahane listesi yüklenemedi.',
    generatedAt: 'Rapor tarihi',
  },
}

const getFactoryId = (factory) => factory?.id ?? factory?.factoryId ?? factory?.FactoryId ?? ''
const getFactoryName = (factory) => factory?.name ?? factory?.factoryName ?? factory?.Name ?? factory?.label ?? '-'
const displayValue = (value) => value == null || value === '' ? '-' : String(value)
const parseWeight = (value) => {
  const parsedValue = Number(String(value ?? 0).trim().replace(',', '.'))
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function ReadyBoyaliFabricsSection({ apiRequest, showNotice, isActive }) {
  const [factories, setFactories] = useState([])
  const [filters, setFilters] = useState({ FactoryId: '0', OrderNo: '', Etiket_Basligi: '' })
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('ar')
  const text = COPY[language]
  const totalWeight = items.reduce((total, item) => total + parseWeight(item.cikisWeight), 0)
  const totalRollCount = items.reduce((total, item) => total + parseWeight(item.cikisTopSayisi), 0)
  const formatWeight = (value) => new Intl.NumberFormat(language === 'ar' ? 'ar' : 'tr-TR', { maximumFractionDigits: 2 }).format(value)
  const formatRollCount = (value) => new Intl.NumberFormat(language === 'ar' ? 'ar' : 'tr-TR', { maximumFractionDigits: 0 }).format(value)

  const loadFabrics = useCallback(async (criteria) => {
    setIsLoading(true)
    setError('')

    try {
      const query = new URLSearchParams({ FactoryId: criteria.FactoryId || '0' })
      if (criteria.OrderNo.trim()) {
        query.set('OrderNo', criteria.OrderNo.trim())
      }
      if (criteria.Etiket_Basligi.trim()) {
        query.set('Etiket_Basligi', criteria.Etiket_Basligi.trim())
      }

      const response = await apiRequest(`${READY_FABRICS_URL}?${query.toString()}`)
      setItems(Array.isArray(response?.data) ? response.data : [])
    } catch (requestError) {
      const message = requestError.message || 'تعذر تحميل الأقمشة الجاهزة للتصدير.'
      setItems([])
      setError(requestError.message || 'loadError')
      if (requestError.message) {
        showNotice('error', message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, showNotice])

  const loadFactories = useCallback(async () => {
    try {
      const response = await apiRequest(FILL_OPTIONS_URL)
      const options = response?.data?.boyaFactories
      setFactories(Array.isArray(options) ? options : [])
    } catch (requestError) {
      setError(requestError.message || 'factoryError')
      if (requestError.message) {
        showNotice('error', requestError.message)
      }
    }
  }, [apiRequest, showNotice])

  useEffect(() => {
    if (!isActive) {
      return
    }

    void Promise.resolve().then(() => {
      void loadFactories()
      void loadFabrics({ FactoryId: '0', OrderNo: '', Etiket_Basligi: '' })
    })
  }, [isActive, loadFactories, loadFabrics])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const submitFilters = (event) => {
    event.preventDefault()
    void loadFabrics(filters)
  }

  const exportReportPdf = async () => {
    if (!items.length || isExportingPdf) {
      return
    }

    setIsExportingPdf(true)

    try {
      const fontResponse = await fetch('/fonts/arial.ttf')
      if (!fontResponse.ok) {
        throw new Error(text.fontError)
      }

      const fontBytes = new Uint8Array(await fontResponse.arrayBuffer())
      let fontBinary = ''
      for (let offset = 0; offset < fontBytes.length; offset += 0x8000) {
        fontBinary += String.fromCharCode(...fontBytes.subarray(offset, offset + 0x8000))
      }

      const pdfDocument = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
      pdfDocument.addFileToVFS('Arial.ttf', btoa(fontBinary))
      pdfDocument.addFont('Arial.ttf', 'Arial', 'normal')
      pdfDocument.addFont('Arial.ttf', 'Arial', 'bold')
      pdfDocument.setFont('Arial', 'normal')
      const head = [[text.rowNumber, ...text.columns]]
      const body = items.map((item, rowIndex) => [
        String(rowIndex + 1),
        ...COLUMNS.map((key) => displayValue(item[key])),
      ])
      const foot = [[
        '',
        ...COLUMNS.map((key, index) => {
          if (key === 'cikisTopSayisi') {
            return formatRollCount(totalRollCount)
          }
          if (key === 'cikisWeight') {
            return formatWeight(totalWeight)
          }
          return index === 0 ? text.total : ''
        }),
      ]]

      pdfDocument.setFontSize(15)
      pdfDocument.text(
        language === 'ar' ? pdfDocument.processArabic(text.title) : text.title,
        pdfDocument.internal.pageSize.getWidth() / 2,
        12,
        { align: 'center' },
      )

      autoTable(pdfDocument, {
        startY: 20,
        head,
        body,
        foot,
        showFoot: 'lastPage',
        theme: 'grid',
        styles: {
          font: 'Arial',
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: language === 'ar' ? 'right' : 'left',
          valign: 'middle',
        },
        headStyles: { fillColor: [231, 239, 233], textColor: [41, 70, 56], fontStyle: 'bold' },
        footStyles: { fillColor: [220, 232, 223], textColor: [41, 70, 56], fontStyle: 'bold' },
        didParseCell: (cellData) => {
          if (language === 'ar') {
            cellData.cell.text = cellData.cell.text.map((line) => pdfDocument.processArabic(line))
          }
        },
        margin: { left: 8, right: 8 },
      })

      pdfDocument.save(`ready-boyali-fabrics-${new Date().toISOString().slice(0, 10)}.pdf`)
      showNotice('success', text.pdfReady)
    } catch (requestError) {
      showNotice('error', requestError.message || text.pdfError)
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <section className="space-y-5" dir={text.direction} lang={language}>
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-l from-sky-100 via-sky-50 to-emerald-50 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-sky-800">{text.eyebrow}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{text.title}</h2>
          </div>
          <button
            type="button"
            onClick={() => setLanguage((current) => current === 'ar' ? 'tr' : 'ar')}
            aria-label={text.switchLabel}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {language === 'ar' ? 'Türkçe' : 'العربية'}
          </button>
        </div>
        <form className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto]" onSubmit={submitFilters}>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>{text.factory}</span>
            <select name="FactoryId" value={filters.FactoryId} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">
              <option value="0">{text.allFactories}</option>
              {factories.map((factory, index) => (
                <option key={getFactoryId(factory) || index} value={getFactoryId(factory)}>{getFactoryName(factory)}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>{text.orderNo}</span>
            <input name="OrderNo" value={filters.OrderNo} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            <span>{text.label}</span>
            <input name="Etiket_Basligi" value={filters.Etiket_Basligi} onChange={updateFilter} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={isLoading} className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto" aria-label="بحث">
              {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
              <span>{text.search}</span>
            </button>
          </div>
        </form>
      </header>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error === 'loadError' ? text.loadError : error === 'factoryError' ? text.factoryError : error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <p className="text-sm text-slate-600">{text.count}: <strong className="text-slate-900">{items.length}</strong></p>
        <button
          type="button"
          onClick={exportReportPdf}
          disabled={isLoading || isExportingPdf || items.length === 0}
          title={isExportingPdf ? text.exportingPdf : text.exportPdf}
          aria-label={isExportingPdf ? text.exportingPdf : text.exportPdf}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 p-0 text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExportingPdf ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileDown className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-busy={isLoading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>{COLUMNS.map((key, index) => <th key={key} className="whitespace-nowrap px-4 py-3 text-start text-xs font-bold">{text.columns[index]}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-slate-500">{text.loading}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-slate-500">{text.noData}</td></tr>
              ) : items.map((item, index) => (
                <tr key={item.id ?? index} className="transition hover:bg-slate-50">
                  {COLUMNS.map((key) => <td key={key} className="whitespace-nowrap px-4 py-3 text-start text-slate-700">{displayValue(item[key])}</td>)}
                </tr>
              ))}
            </tbody>
            {items.length > 0 ? (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
                  <td colSpan={COLUMNS.indexOf('cikisTopSayisi')} className="px-4 py-3 text-end">{text.total}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-start">{formatRollCount(totalRollCount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-start">{formatWeight(totalWeight)}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </section>
  )
}

export default ReadyBoyaliFabricsSection