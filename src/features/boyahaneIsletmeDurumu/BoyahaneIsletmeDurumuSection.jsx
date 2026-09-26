import { useCallback, useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FileDown, LoaderCircle, Search } from 'lucide-react'
import './BoyahaneIsletmeDurumuSection.css'

const REPORT_URL = '/api/boyaHaneIsletmeDurumu/getReport'
const FILL_OPTIONS_URL = '/api/fill-options?requestedValues=1'

const getDefaultFilters = () => ({
  FactoryId: '0',
  OrderNo: '',
  Etiket_Basligi: '',
  PartiNo: '',
  Renk: '',
  Status: '',
  DateFrom: '',
  DateTo: '',
})

const COLUMNS = [
  'orderNo',
  'factoryName',
  'orderDate',
  'etiket_Basligi',
  'partiNo',
  'renk',
  'proses',
  'kumasCinsi',
  'siparisMiktari',
  'kazanGiris',
  'paketMiktari',
  'durum',
  'en',
  'gr',
  'girisTopSayisi',
  'cikisTopSayisi',
]
const TOTAL_COLUMNS = ['siparisMiktari', 'kazanGiris', 'paketMiktari']

const COPY = {
  ar: {
    direction: 'rtl',
    title: 'حالة تشغيل المصبغة',
    eyebrow: 'تقرير المصبغة',
    switchLanguage: 'Türkçe',
    switchLanguageLabel: 'Türkçe diline geç',
    factory: 'المصبغة',
    allFactories: 'كل المصابغ',
    orderNo: 'رقم الطلب',
    label: 'عنوان الملصق',
    batch: 'رقم الدفعة',
    color: 'اللون',
    status: 'الحالة',
    allStatuses: 'كل الحالات',
    dateFrom: 'من تاريخ',
    dateTo: 'إلى تاريخ',
    showReport: 'عرض التقرير',
    loading: 'جارٍ التحميل...',
    noData: 'لا توجد بيانات مطابقة للفلاتر.',
    loadingData: 'جارٍ تحميل بيانات التقرير...',
    dateError: 'تاريخ البداية يجب ألا يتجاوز تاريخ النهاية.',
    rowNumber: '#',
    total: 'المجموع',
    exportPdf: 'تصدير PDF',
    exportingPdf: 'جارٍ إنشاء PDF...',
    pdfReady: 'تم إنشاء ملف PDF.',
    pdfError: 'تعذر إنشاء ملف PDF.',
    pdfFontError: 'تعذر تحميل خط PDF.',
    columns: [
      'رقم الطلب', 'المصبغة', 'تاريخ الطلب', 'عنوان الملصق', 'رقم الدفعة', 'اللون',
      'المعالجة', 'نوع القماش', 'كمية الطلب', 'دخول الغلاية', 'كمية العبوات', 'الوضع',
      'العرض', 'الوزن', 'عدد لفات الدخول', 'عدد لفات الخروج',
    ],
  },
  tr: {
    direction: 'ltr',
    title: 'BOYAHANE İŞLETME DURUMU',
    eyebrow: 'BOYAHANE RAPORU',
    switchLanguage: 'العربية',
    switchLanguageLabel: 'Arapça diline geç',
    factory: 'Boyahane',
    allFactories: 'Tüm boyahaneler',
    orderNo: 'Sipariş No',
    label: 'Etiket Başlığı',
    batch: 'Parti No',
    color: 'Renk',
    status: 'Durum',
    allStatuses: 'Tüm durumlar',
    dateFrom: 'Başlangıç tarihi',
    dateTo: 'Bitiş tarihi',
    showReport: 'Raporu göster',
    loading: 'Yükleniyor...',
    noData: 'Filtrelerle eşleşen kayıt bulunamadı.',
    loadingData: 'Rapor verileri yükleniyor...',
    dateError: 'Başlangıç tarihi bitiş tarihinden sonra olamaz.',
    rowNumber: '#',
    total: 'TOPLAM',
    exportPdf: 'PDF dışa aktar',
    exportingPdf: 'PDF oluşturuluyor...',
    pdfReady: 'PDF dosyası oluşturuldu.',
    pdfError: 'PDF dosyası oluşturulamadı.',
    pdfFontError: 'PDF yazı tipi yüklenemedi.',
    columns: [
      'Sipariş No', 'Fabrika', 'Sipariş Tarihi', 'Etiket Başlığı', 'Parti No', 'Renk',
      'Proses', 'Kumaş Cinsi', 'Sipariş Miktarı', 'Kazan Giriş', 'Paket Miktarı', 'Durum',
      'En', 'Gr', 'Giriş Top Sayısı', 'Çıkış Top Sayısı',
    ],
  },
}

const getFactoryId = (factory) => factory?.id ?? factory?.factoryId ?? factory?.FactoryId ?? 0
const getFactoryName = (factory) => factory?.name ?? factory?.factoryName ?? factory?.Name ?? ''
const displayValue = (value) => value == null || value === '' ? '-' : value
const displayDate = (value) => value ? String(value).split('T')[0] : '-'

function BoyahaneIsletmeDurumuSection({ apiRequest, showNotice, isActive }) {
  const [filters, setFilters] = useState(getDefaultFilters)
  const [factories, setFactories] = useState([])
  const [statusOptions, setStatusOptions] = useState([])
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('ar')
  const text = COPY[language]

  const loadReport = useCallback(async (criteria) => {
    setError('')
    setIsLoading(true)

    try {
      const query = new URLSearchParams({ FactoryId: criteria.FactoryId || '0' })
      Object.entries(criteria).forEach(([name, value]) => {
        if (name !== 'FactoryId' && value !== '' && value != null) {
          query.set(name, String(value))
        }
      })
      const response = await apiRequest(`${REPORT_URL}?${query.toString()}`)
      const orders = Array.isArray(response.data) ? response.data : []
      const reportRows = orders.flatMap((order) => {
        const details = Array.isArray(order.details) && order.details.length > 0 ? order.details : [{}]
        return details.map((detail) => ({ ...order, ...detail }))
      })

      setRows(reportRows)
    } catch (requestError) {
      const message = requestError.message || 'تعذر تحميل تقرير حالة تشغيل المصبغة.'
      setError(message)
      setRows([])
      showNotice('error', message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, showNotice])

  const loadOptions = useCallback(async () => {
    try {
      const response = await apiRequest(FILL_OPTIONS_URL)
      const optionsData = response.data || {}
      setFactories(Array.isArray(optionsData.boyaFactories) ? optionsData.boyaFactories : [])
      setStatusOptions(Array.isArray(optionsData.siparisDurum) ? optionsData.siparisDurum : [])
    } catch (requestError) {
      const message = requestError.message || 'تعذر تحميل قائمة المصابغ.'
      showNotice('error', message)
    }
  }, [apiRequest, showNotice])

  useEffect(() => {
    if (!isActive) {
      return
    }

    void Promise.resolve().then(() => {
      void loadOptions()
      void loadReport(getDefaultFilters())
    })
  }, [isActive, loadOptions, loadReport])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const submitFilters = (event) => {
    event.preventDefault()
    if (filters.DateFrom && filters.DateTo && filters.DateFrom > filters.DateTo) {
      setError(text.dateError)
      return
    }

    void loadReport(filters)
  }

  const totals = TOTAL_COLUMNS.reduce((result, key) => {
    result[key] = rows.reduce((sum, row) => {
      const numericValue = Number(String(row[key] ?? '').replace(',', '.'))
      return sum + (Number.isFinite(numericValue) ? numericValue : 0)
    }, 0)
    return result
  }, {})
  const numberFormatter = new Intl.NumberFormat(language === 'ar' ? 'ar' : 'tr-TR', {
    maximumFractionDigits: 2,
  })
  const formatNumber = (value) => numberFormatter.format(value)

  const exportReportPdf = async () => {
    if (rows.length === 0 || isExportingPdf) {
      return
    }

    setIsExportingPdf(true)

    try {
      const fontResponse = await fetch('/fonts/arial.ttf')
      if (!fontResponse.ok) {
        throw new Error(text.pdfFontError)
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
      const body = rows.map((row, rowIndex) => [
        String(rowIndex + 1),
        ...COLUMNS.map((key) => String(displayValue(key === 'orderDate' ? displayDate(row[key]) : row[key]))),
      ])
      const foot = [[
        '',
        ...COLUMNS.map((key, index) => {
          if (TOTAL_COLUMNS.includes(key)) {
            return formatNumber(totals[key])
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

      const fileDate = new Date().toISOString().slice(0, 10)
      pdfDocument.save(`boyahane-isletme-durumu-${fileDate}.pdf`)
      showNotice('success', text.pdfReady)
    } catch (requestError) {
      showNotice('error', requestError.message || text.pdfError)
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <section className="boyahane-report" dir={text.direction} lang={language}>
      <header className="boyahane-report__header">
        <div>
          <p className="boyahane-report__eyebrow">{text.eyebrow}</p>
          <h2>{text.title}</h2>
        </div>
        <div className="boyahane-report__toolbar">
          <button
            type="button"
            className="boyahane-report__language-button"
            onClick={() => setLanguage((current) => current === 'ar' ? 'tr' : 'ar')}
            aria-label={text.switchLanguageLabel}
          >
            {text.switchLanguage}
          </button>
        </div>
      </header>

      <form className="boyahane-report__filters" onSubmit={submitFilters}>
        <label className="boyahane-report__field">
          <span>{text.factory}</span>
          <select name="FactoryId" value={filters.FactoryId} onChange={updateFilter}>
            <option value="0">{text.allFactories}</option>
            {factories.map((factory, index) => (
              <option key={getFactoryId(factory) || index} value={getFactoryId(factory)}>
                {getFactoryName(factory)}
              </option>
            ))}
          </select>
        </label>
        <label className="boyahane-report__field">
          <span>{text.orderNo}</span>
          <input name="OrderNo" value={filters.OrderNo} onChange={updateFilter} />
        </label>
        <label className="boyahane-report__field">
          <span>{text.label}</span>
          <input name="Etiket_Basligi" value={filters.Etiket_Basligi} onChange={updateFilter} />
        </label>
        <label className="boyahane-report__field">
          <span>{text.batch}</span>
          <input name="PartiNo" value={filters.PartiNo} onChange={updateFilter} />
        </label>
        <label className="boyahane-report__field">
          <span>{text.color}</span>
          <input name="Renk" value={filters.Renk} onChange={updateFilter} />
        </label>
        <label className="boyahane-report__field">
          <span>{text.status}</span>
          <select name="Status" value={filters.Status} onChange={updateFilter}>
            <option value="">{text.allStatuses}</option>
            {statusOptions.map((status, index) => (
              <option key={status.id ?? index} value={status.id}>
                {status.durum}
              </option>
            ))}
          </select>
        </label>
        <label className="boyahane-report__field">
          <span>{text.dateFrom}</span>
          <input name="DateFrom" type="date" value={filters.DateFrom} onChange={updateFilter} />
        </label>
        <label className="boyahane-report__field">
          <span>{text.dateTo}</span>
          <input name="DateTo" type="date" value={filters.DateTo} onChange={updateFilter} />
        </label>
        <div className="boyahane-report__actions">
          <button
            type="submit"
            className="boyahane-report__search-button"
            title={isLoading ? text.loading : text.showReport}
            aria-label={isLoading ? text.loading : text.showReport}
            disabled={isLoading}
          >
            {isLoading ? <LoaderCircle className="boyahane-report__spinner" aria-hidden="true" /> : <Search aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="boyahane-report__export-button"
            onClick={exportReportPdf}
            disabled={isLoading || isExportingPdf || rows.length === 0}
            title={isExportingPdf ? text.exportingPdf : text.exportPdf}
            aria-label={isExportingPdf ? text.exportingPdf : text.exportPdf}
          >
            {isExportingPdf ? <LoaderCircle className="boyahane-report__spinner" aria-hidden="true" /> : <FileDown aria-hidden="true" />}
          </button>
        </div>
      </form>

      {error ? <p className="boyahane-report__error" role="alert">{error}</p> : null}

      <div className="boyahane-report__sheet" aria-busy={isLoading}>
        <table>
          <thead>
            <tr>
              <th className="boyahane-report__row-number">{text.rowNumber}</th>
              {COLUMNS.map((key, index) => <th key={key}>{text.columns[index]}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${row.takipId ?? row.detailId ?? row.orderId}-${rowIndex}`}>
                <td className="boyahane-report__row-number">{rowIndex + 1}</td>
                {COLUMNS.map((key) => (
                  <td key={key}>{displayValue(key === 'orderDate' ? displayDate(row[key]) : row[key])}</td>
                ))}
              </tr>
            ))}
            {rows.length > 0 ? (
              <tr className="boyahane-report__total-row">
                <td className="boyahane-report__row-number"></td>
                {COLUMNS.map((key, index) => (
                  <td key={key}>
                    {TOTAL_COLUMNS.includes(key)
                      ? formatNumber(totals[key])
                      : index === 0 ? text.total : ''}
                  </td>
                ))}
              </tr>
            ) : null}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td className="boyahane-report__empty" colSpan={COLUMNS.length + 1}>{text.noData}</td>
              </tr>
            ) : null}
            {isLoading ? (
              <tr>
                <td className="boyahane-report__empty" colSpan={COLUMNS.length + 1}>{text.loadingData}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default BoyahaneIsletmeDurumuSection
