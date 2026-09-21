import { useCallback, useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import OrderFactoryTransactionsModal from './OrderFactoryTransactionsModal'

const ORDER_FACTORY_TRANSACTIONS_URL = '/api/order-factory-transactions'
const getTodayDate = () => new Date().toISOString().slice(0, 10)
const PROCESS_LABELS = [
  ['fiks', 'Fiks'],
  ['kasar', 'Kasar'],
  ['tekBoya', 'Tek Boya'],
  ['ciftBoya', 'Çift Boya'],
  ['enzim', 'Enzim'],
  ['silikon', 'Silikon'],
  ['ram', 'Ram'],
  ['sardon', 'Şardon'],
  ['kenarKola', 'Kenar Kola'],
  ['kenarKesim', 'Kenar Kesim'],
  ['tras', 'Tıraş'],
  ['firca', 'Fırça'],
  ['aEnkaucukSanfor', 'A. En Kauçuk Sanfor'],
  ['tupSanfor', 'Tüp Sanfor'],
]

function OrderFactoryTransactionsSection({ apiRequest, showNotice, isActive }) {
  const [searchText, setSearchText] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isModalSaving, setIsModalSaving] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [modalError, setModalError] = useState('')
  const [customerOrdersOptions, setCustomerOrdersOptions] = useState([])
  const [boyaFactoriesOptions, setBoyaFactoriesOptions] = useState([])
  const [fabricTypesOptions, setFabricTypesOptions] = useState([])
  const [transactionForm, setTransactionForm] = useState({
    Id: 0,
    OrderNo: '',
    FactoryId: '',
    Date: getTodayDate(),
    TransactionStatus: 1,
    Notes: '',
    Details: [
      {
        Id: 0,
        Etiket_Basligi: '',
        FabricGender: '',
        En: '',
        Gr: '',
        Renk: '',
        RenkCode: '',
        SiparisMiktari: '',
        Fiyat: 0,
        fiks: false,
        kasar: false,
        tekBoya: false,
        ciftBoya: false,
        enzim: false,
        silikon: false,
        ram: false,
        sardon: false,
        kenarKola: false,
        kenarKesim: false,
        tras: false,
        firca: false,
        aEnkaucukSanfor: false,
        tupSanfor: false,
      },
    ],
  })

  const loadTransactions = useCallback(async () => {
    setError('')
    setIsLoading(true)

    try {
      const query = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
      })

      if (searchText.trim() !== '') {
        query.set('searchText', searchText.trim())
      }

      const response = await apiRequest(`${ORDER_FACTORY_TRANSACTIONS_URL}?${query.toString()}`)
      const data = response.data || {}

      setTransactions(Array.isArray(data.items) ? data.items : [])
      setTotalCount(data.totalRecords ?? 0)
    } catch (requestError) {
      const message = requestError.message || 'Hareket verileri alınırken bir hata oluştu.'
      setError(message)
      setTransactions([])
      setTotalCount(0)
      showNotice('error', message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, pageNumber, pageSize, searchText, showNotice])

  const deleteTransaction = useCallback(
    async (id) => {
      if (!id) {
        return
      }

      const confirmed = window.confirm('Bu hareketi silmek istediğinizden emin misiniz?')
      if (!confirmed) {
        return
      }

      try {
        await apiRequest(`${ORDER_FACTORY_TRANSACTIONS_URL}/${id}`, {
          method: 'DELETE',
        })

        showNotice('success', 'Hareket başarıyla silindi.')
        loadTransactions()
      } catch (requestError) {
        const message = requestError.message || 'Hareket silinirken bir hata oluştu.'
        showNotice('error', message)
      }
    },
    [apiRequest, loadTransactions, showNotice],
  )

  const openCreateModal = useCallback(async () => {
    setModalError('')
    setIsModalOpen(true)
    setIsModalLoading(true)
    setCustomerOrdersOptions([])
    setBoyaFactoriesOptions([])
    setFabricTypesOptions([])
    setTransactionForm({
      Id: 0,
      OrderNo: '',
      FactoryId: '',
      Date: getTodayDate(),
      TransactionStatus: 1,
      Notes: '',
      Details: [
        {
          Id: 0,
          Etiket_Basligi: '',
          FabricGender: '',
          En: '',
          Gr: '',
          Renk: '',
          RenkCode: '',
          SiparisMiktari: '',
          Fiyat: 0,
          fiks: false,
          kasar: false,
          tekBoya: false,
          ciftBoya: false,
          enzim: false,
          silikon: false,
          ram: false,
          sardon: false,
          kenarKola: false,
          kenarKesim: false,
          tras: false,
          firca: false,
          aEnkaucukSanfor: false,
          tupSanfor: false,
        },
      ],
    })

    try {
      const response = await apiRequest('/api/fill-options?requestedValues=1')
      const data = response.data || {}
      setCustomerOrdersOptions(Array.isArray(data.customerOrders) ? data.customerOrders : [])
      setBoyaFactoriesOptions(Array.isArray(data.boyaFactories) ? data.boyaFactories : [])
      setFabricTypesOptions(Array.isArray(data.items) ? data.items.map((it) => it.value ?? it) : [])
    } catch (requestError) {
      const message = requestError.message || 'Hareket seçenekleri alınırken bir hata oluştu.'
      setModalError(message)
      showNotice('error', message)
    } finally {
      setIsModalLoading(false)
    }
  }, [apiRequest, showNotice])

  

  const openEditModal = useCallback(
    async (id) => {
      if (!id) {
        return
      }

      setModalError('')
      setIsModalOpen(true)
      setIsModalLoading(true)
      setCustomerOrdersOptions([])
      setBoyaFactoriesOptions([])
      

      try {
        const [optionsResponse, transactionResponse] = await Promise.all([
          apiRequest('/api/fill-options?requestedValues=1'),
          apiRequest(`${ORDER_FACTORY_TRANSACTIONS_URL}/${id}`),
        ])

        const optionsData = optionsResponse.data || {}
        const transactionData = transactionResponse.data || {}

        setCustomerOrdersOptions(Array.isArray(optionsData.customerOrders) ? optionsData.customerOrders : [])
        setBoyaFactoriesOptions(Array.isArray(optionsData.boyaFactories) ? optionsData.boyaFactories : [])
        setFabricTypesOptions(Array.isArray(optionsData.items) ? optionsData.items.map((it) => it.value ?? it) : [])
        setTransactionForm({
          Id: transactionData.id || 0,
          OrderNo: transactionData.orderNo ?? transactionData.OrderNo ?? '',
          FactoryId: transactionData.factoryId ?? '',
          Date: transactionData.date ? transactionData.date.split('T')[0] : getTodayDate(),
          TransactionStatus: transactionData.transactionStatus ?? 1,
          Notes: transactionData.notes ?? transactionData.Notes ?? '',
          Details: Array.isArray(transactionData.details)
            ? transactionData.details.map((detail) => ({
                Id: detail.id || 0,
                Etiket_Basligi: detail.etiket_Basligi ?? detail.Etiket_Basligi ?? '',
                FabricGender: detail.fabricGender ?? detail.FabricGender ?? '',
                En: detail.en ?? '',
                Gr: detail.gr ?? '',
                Renk: detail.renk ?? detail.Renk ?? '',
                RenkCode: detail.renkCode ?? detail.RenkCode ?? '',
                SiparisMiktari: detail.siparisMiktari ?? detail.SiparisMiktari ?? '',
                Fiyat: detail.fiyat ?? detail.Fiyat ?? detail.price ?? detail.Price ?? 0,
                fiks: detail.fiks ?? detail.Fiks ?? false,
                kasar: detail.kasar ?? detail.Kasar ?? false,
                tekBoya: detail.tekBoya ?? detail.TekBoya ?? false,
                ciftBoya: detail.ciftBoya ?? detail.CiftBoya ?? false,
                enzim: detail.enzim ?? detail.Enzim ?? false,
                silikon: detail.silikon ?? detail.Silikon ?? false,
                ram: detail.ram ?? detail.Ram ?? false,
                sardon: detail.sardon ?? detail.Sardon ?? false,
                kenarKola: detail.kenarKola ?? detail.KenarKola ?? false,
                kenarKesim: detail.kenarKesim ?? detail.KenarKesim ?? false,
                tras: detail.tras ?? detail.Tras ?? false,
                firca: detail.firca ?? detail.Firca ?? false,
                aEnkaucukSanfor: detail.aEnkaucukSanfor ?? detail.AEnkaucukSanfor ?? false,
                tupSanfor: detail.tupSanfor ?? detail.TupSanfor ?? false,
              }))
            : [
                {
                  Id: 0,
                  Etiket_Basligi: '',
                  FabricGender: '',
                  En: '',
                  Gr: '',
                  Renk: '',
                  RenkCode: '',
                  SiparisMiktari: '',
                  Fiyat: 0,
                  fiks: false,
                  kasar: false,
                  tekBoya: false,
                  ciftBoya: false,
                  enzim: false,
                  silikon: false,
                  ram: false,
                  sardon: false,
                  kenarKola: false,
                  kenarKesim: false,
                  tras: false,
                  firca: false,
                  aEnkaucukSanfor: false,
                  tupSanfor: false,
                },
              ],
        })

        // previously we loaded available sent fabrics per factory; removed per-request fabric fetching
      } catch (requestError) {
        const message = requestError.message || 'Hareket verileri alınırken bir hata oluştu.'
        setModalError(message)
        showNotice('error', message)
        setIsModalOpen(false)
      } finally {
        setIsModalLoading(false)
      }
    }, [apiRequest, showNotice])

  const closeModal = useCallback(() => {
    if (isModalSaving) {
      return
    }
    setIsModalOpen(false)
    setModalError('')
  }, [isModalSaving])

  const updateTransactionField = useCallback((field, value) => {
    setTransactionForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const updateDetailField = useCallback((index, field, value) => {
    setTransactionForm((prev) => ({
      ...prev,
      Details: prev.Details.map((detail, rowIndex) =>
        rowIndex === index ? { ...detail, [field]: value } : detail,
      ),
    }))
  }, [])

  const addDetailRow = useCallback(() => {
    setTransactionForm((prev) => ({
      ...prev,
      Details: [
        ...prev.Details,
        {
          Id: 0,
          Etiket_Basligi: '',
          FabricGender: '',
          En: '',
          Gr: '',
          Renk: '',
          RenkCode: '',
          SiparisMiktari: '',
          Fiyat: 0,
          fiks: false,
          kasar: false,
          tekBoya: false,
          ciftBoya: false,
          enzim: false,
          silikon: false,
          ram: false,
          sardon: false,
          kenarKola: false,
          kenarKesim: false,
          tras: false,
          firca: false,
          aEnkaucukSanfor: false,
          tupSanfor: false,
        },
      ],
    }))
  }, [])

  const copyDetailRow = useCallback((index) => {
    setTransactionForm((prev) => {
      const detailToCopy = prev.Details[index]
      if (!detailToCopy) {
        return prev
      }
      
      // إنشاء نسخة من الصف مع تعيين Id إلى 0 (للإشارة أنه صف جديد)
      const copiedDetail = {
        ...detailToCopy,
        Id: 0,
      }
      
      return {
        ...prev,
        Details: [...prev.Details, copiedDetail],
      }
    })
  }, [])

  const removeDetailRow = useCallback((index) => {
    setTransactionForm((prev) => ({
      ...prev,
      Details: prev.Details.filter((_, rowIndex) => rowIndex !== index),
    }))
  }, [])

  const saveTransaction = useCallback(async () => {
    setModalError('')

    if (!transactionForm.Details.length) {
      setModalError('En az bir detay satırı eklenmelidir.')
      return
    }

    const hasInvalidDetailRow = transactionForm.Details.some(
      (detail) =>
        !String(detail.FabricGender ?? '').trim() ||
        !String(detail.Renk ?? '').trim() ||
        String(detail.SiparisMiktari ?? '').trim() === '',
    )

    if (hasInvalidDetailRow) {
      setModalError('Her detay satırı için KUMAŞ CİNSİ, Renk ve Sipariş Miktarı alanları zorunludur.')
      return
    }

    setIsModalSaving(true)

    try {
      const payload = {
        id: Number(transactionForm.Id) || 0,
        orderNo: String(transactionForm.OrderNo ?? '').trim(),
        factoryId: Number(transactionForm.FactoryId) || 0,
        date: transactionForm.Date,
        transactionStatus: Number(transactionForm.TransactionStatus) || 1,
        notes: String(transactionForm.Notes ?? '').trim(),
        details: transactionForm.Details.map((detail) => ({
          id: Number(detail.Id) || 0,
          etiket_Basligi: detail.Etiket_Basligi || '',
          fabricGender: detail.FabricGender || '',
          en: Number(detail.En) || 0,
          gr: Number(detail.Gr) || 0,
          renk: detail.Renk || '',
          renkCode: detail.RenkCode || '',
          siparisMiktari: Number(detail.SiparisMiktari) || 0,
          fiyat: Number(detail.Fiyat ?? detail.Price ?? 0) || 0,
          fiks: Boolean(detail.fiks),
          kasar: Boolean(detail.kasar),
          tekBoya: Boolean(detail.tekBoya),
          ciftBoya: Boolean(detail.ciftBoya),
          enzim: Boolean(detail.enzim),
          silikon: Boolean(detail.silikon),
          ram: Boolean(detail.ram),
          sardon: Boolean(detail.sardon),
          kenarKola: Boolean(detail.kenarKola),
          kenarKesim: Boolean(detail.kenarKesim),
          tras: Boolean(detail.tras),
          firca: Boolean(detail.firca),
          aEnkaucukSanfor: Boolean(detail.aEnkaucukSanfor),
          tupSanfor: Boolean(detail.tupSanfor),
        })),
      }

      await apiRequest(`${ORDER_FACTORY_TRANSACTIONS_URL}/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setIsModalSaving(false)
      setIsModalOpen(false)
      loadTransactions()
      const message = transactionForm.Id ? 'Hareket başarıyla güncellendi.' : 'Yeni hareket başarıyla kaydedildi.'
      showNotice('success', message)
    } catch (requestError) {
      const message = requestError.message || 'Hareket kaydedilirken bir hata oluştu.'
      setModalError(message)
      showNotice('error', message)
      setIsModalSaving(false)
    }
  }, [apiRequest, loadTransactions, showNotice, transactionForm])

  const exportTransactionPdf = useCallback(async () => {
    if (isExportingPdf || !transactionForm.Details.length) {
      return
    }

    setIsExportingPdf(true)

    try {
      const factory = boyaFactoriesOptions.find((item) => String(item.id) === String(transactionForm.FactoryId))
      const fontResponse = await fetch('/fonts/arial.ttf')
      if (!fontResponse.ok) {
        throw new Error('PDF yazı tipi yüklenemedi.')
      }

      const fontBytes = new Uint8Array(await fontResponse.arrayBuffer())
      let fontBinary = ''
      for (let offset = 0; offset < fontBytes.length; offset += 0x8000) {
        fontBinary += String.fromCharCode(...fontBytes.subarray(offset, offset + 0x8000))
      }

      const pdfDocument = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      pdfDocument.addFileToVFS('Arial.ttf', btoa(fontBinary))
      pdfDocument.addFont('Arial.ttf', 'Arial', 'normal')
      pdfDocument.addFont('Arial.ttf', 'Arial', 'bold')
      pdfDocument.setFont('Arial', 'normal')
      const orderNumber = String(transactionForm.OrderNo ?? '').trim() || 'Sipariş'
      const factoryName = factory?.name || '-'
      const safeFilePart = orderNumber.replace(/[<>:"/\\|?*]+/g, '-').trim() || 'siparis'

      pdfDocument.setFillColor(15, 76, 129)
      pdfDocument.rect(0, 0, 297, 14, 'F')
      pdfDocument.setTextColor(255, 255, 255)
      pdfDocument.setFontSize(16)
      pdfDocument.setFont('Arial', 'bold')
      pdfDocument.text('BOYALI SİPARİŞ FORMU', 15, 9)

      pdfDocument.setTextColor(31, 41, 55)
      pdfDocument.setFont('Arial', 'normal')
      pdfDocument.setFontSize(13)
      pdfDocument.text(orderNumber, 15, 27)
      pdfDocument.setFont('Arial', 'normal')
      pdfDocument.setFontSize(9)
      pdfDocument.text(`Boya fabrikası: ${factoryName}`, 15, 34)
      pdfDocument.text(`Tarih: ${transactionForm.Date || '-'}`, 15, 40)

      const rows = transactionForm.Details.map((detail, index) => {
        return [
          String(index + 1),
          detail.Etiket_Basligi || '-',
          detail.FabricGender || '-',
          detail.En || '-',
          detail.Gr || '-',
          detail.Renk || '-',
          detail.RenkCode || '-',
          detail.SiparisMiktari || '-',
          ...PROCESS_LABELS.map(([field]) => detail[field] ? '1' : ''),
        ]
      })
      const totalOrderQuantity = transactionForm.Details.reduce(
        (total, detail) => total + (Number(String(detail.SiparisMiktari ?? '').replace(',', '.')) || 0),
        0,
      )

      autoTable(pdfDocument, {
        startY: 48,
        head: [['No', 'Etiket Başlığı', 'Kumaş Cinsi', 'En', 'Gr', 'Renk', 'Renk Kodu', 'Sipariş Miktarı', ...PROCESS_LABELS.map(([, label]) => label)]],
        body: rows,
        foot: [['', '', '', '', '', '', 'TOPLAM', String(totalOrderQuantity), ...PROCESS_LABELS.map(() => '')]],
        theme: 'grid',
        pageBreak: 'avoid',
        rowPageBreak: 'avoid',
        styles: { font: 'Arial', fontSize: 5, cellPadding: 1.5, minCellHeight: 8, lineWidth: 0.3, lineColor: [148, 163, 184], textColor: [31, 41, 55], overflow: 'linebreak', halign: 'center', valign: 'middle' },
        headStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'normal', minCellHeight: 13, cellPadding: 1.5, lineWidth: 0.3, lineColor: [100, 116, 139] },
        footStyles: { fillColor: [219, 234, 254], textColor: [15, 23, 42], fontStyle: 'normal', minCellHeight: 8, cellPadding: 1.5, lineWidth: 0.3, lineColor: [100, 116, 139] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 7 },
          1: { cellWidth: 18, halign: 'left' },
          2: { cellWidth: 55, halign: 'left' },
          3: { cellWidth: 8 },
          4: { cellWidth: 8 },
          5: { cellWidth: 15, halign: 'left' },
          6: { cellWidth: 14 },
          7: { cellWidth: 16 },
          ...Object.fromEntries(PROCESS_LABELS.map(([,], index) => [index + 8, { cellWidth: index === 6 ? 14 : 8 }])),
        },
        margin: { left: 5, right: 5 },
        willDrawCell: ({ section, column, cell }) => {
          if (section === 'body' && column.index >= 8 && column.index < PROCESS_LABELS.length + 8 && cell.raw === '1') {
            cell.text = []
          }
        },
        didDrawCell: ({ section, column, cell }) => {
          if (section !== 'body' || column.index < 8 || column.index >= PROCESS_LABELS.length + 8 || cell.raw !== '1') {
            return
          }

          const left = cell.x + cell.width / 2 - 1.8
          const top = cell.y + cell.height / 2
          pdfDocument.setDrawColor(15, 118, 110)
          pdfDocument.setLineWidth(0.6)
          pdfDocument.line(left, top, left + 1.3, top + 1.5)
          pdfDocument.line(left + 1.3, top + 1.5, left + 4, top - 2)
        },
      })

      const notesTop = Math.min((pdfDocument.lastAutoTable?.finalY ?? 190) + 7, 190)
      const notesText = pdfDocument.splitTextToSize(String(transactionForm.Notes || '-'), 270)
      const notesHeight = Math.max(24, 15 + notesText.length * 4)
      pdfDocument.setFillColor(248, 250, 252)
      pdfDocument.setDrawColor(148, 163, 184)
      pdfDocument.setLineWidth(0.2)
      pdfDocument.roundedRect(5, notesTop, 287, notesHeight, 2, 2, 'FD')
      pdfDocument.setTextColor(15, 76, 129)
      pdfDocument.setFont('Arial', 'normal')
      pdfDocument.setFontSize(8)
      pdfDocument.text('AÇIKLAMALAR', 10, notesTop + 6)
      pdfDocument.setTextColor(31, 41, 55)
      pdfDocument.setFont('Arial', 'normal')
      pdfDocument.setFontSize(8)
      pdfDocument.text(notesText, 10, notesTop + 16)

      const pdfBlob = pdfDocument.output('blob')
      const fileName = `boyali-siparis-${safeFilePart}-${transactionForm.Date || getTodayDate()}.pdf`

      if (typeof window.showSaveFilePicker === 'function') {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'PDF dosyası', accept: { 'application/pdf': ['.pdf'] } }],
        })
        const writable = await fileHandle.createWritable()
        await writable.write(pdfBlob)
        await writable.close()
      } else {
        const downloadUrl = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = fileName
        link.click()
        URL.revokeObjectURL(downloadUrl)
      }

      showNotice('success', 'PDF dosyası başarıyla hazırlandı.')
    } catch (requestError) {
      if (requestError?.name !== 'AbortError') {
        showNotice('error', requestError.message || 'PDF dosyası oluşturulamadı.')
      }
    } finally {
      setIsExportingPdf(false)
    }
  }, [boyaFactoriesOptions, isExportingPdf, showNotice, transactionForm])

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const timer = setTimeout(loadTransactions, 300)
    return () => clearTimeout(timer)
  }, [isActive, loadTransactions])

  return (
    <div className="space-y-6" dir="ltr" style={{ direction: 'ltr' }}>
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6" dir="ltr">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-sky-900">Boyalı Sipariş</h3>
          </div>

          <button type="button" className="inline-flex items-center justify-center rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-800 active:bg-sky-900" onClick={openCreateModal}>
            Yeni Sipariş
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="orderFactorySearch" className="text-xs font-medium text-slate-600 text-left">Ara</label>
            <input
              id="orderFactorySearch"
              type="text"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value)
                setPageNumber(1)
              }}
              placeholder="Sipariş veya fabrika numarasına göre ara"
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-slate-50"
              dir="ltr"
              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="orderFactoryPageSize" className="text-xs font-medium text-slate-600 text-left">Sayfa boyutu</label>
            <select
              id="orderFactoryPageSize"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPageNumber(1)
              }}
              className="w-full rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
              dir="ltr"
              style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 text-left" dir="ltr">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100" dir="ltr">
        <div className="overflow-x-auto" dir="ltr">
          <table className="w-full text-sm" dir="ltr" style={{ direction: 'ltr' }}>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Sipariş No</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Fabrika</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Tarih</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Hareket Durumu</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Detay Sayısı</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Renkler</span></th>
                <th className="px-6 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">İşlemler</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200" dir="ltr">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-left">Hareketler yükleniyor...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-left">Eşleşen veri bulunamadı.</td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id ?? transaction.orderNo} className="hover:bg-slate-50" dir="ltr">
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-900 font-medium">{transaction.orderNo ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{transaction.factoryName ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{transaction.date ? transaction.date.split('T')[0] : '-'}</span></td>
                    <td className="px-6 py-4 text-left">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(transaction.transactionStatus)}`}>
                        {transaction.transactionStatusName ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{transaction.detailsCount ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left"><span className="text-sm text-slate-700">{transaction.colors ?? '-'}</span></td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-start gap-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(transaction.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-300 bg-blue-50 text-blue-600 text-base transition hover:bg-blue-100"
                          title="Düzenle"
                          aria-label={`Düzenle ${transaction.orderNo ?? ''}`}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(transaction.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-300 bg-red-50 text-red-600 text-base transition hover:bg-red-100"
                          title="Sil"
                          aria-label={`Sil ${transaction.orderNo ?? ''}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between sm:px-6" dir="ltr">
        <div className="text-left text-sm text-slate-700" dir="ltr">
          <p className="text-left">Sonuç sayısı: <strong className="text-slate-900">{totalCount}</strong></p>
        </div>
        <div className="flex items-center justify-end gap-2" dir="ltr">
          <button
            type="button"
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1 || isLoading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Önceki
          </button>
          <span className="text-sm text-slate-600">
            Sayfa {pageNumber} / {Math.max(Math.ceil(totalCount / pageSize), 1)}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, Math.max(Math.ceil(totalCount / pageSize), 1)))}
            disabled={pageNumber >= Math.max(Math.ceil(totalCount / pageSize), 1) || isLoading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      </footer>

      <OrderFactoryTransactionsModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSaving={isModalSaving}
        error={modalError}
        form={transactionForm}
        customerOrdersOptions={customerOrdersOptions}
        boyaFactoriesOptions={boyaFactoriesOptions}
        fabricTypesOptions={fabricTypesOptions}
        onFieldChange={updateTransactionField}
        onDetailFieldChange={updateDetailField}
        onAddDetailRow={addDetailRow}
        onCopyDetailRow={copyDetailRow}
        onRemoveDetailRow={removeDetailRow}
        onClose={closeModal}
        onExportPdf={exportTransactionPdf}
        isExportingPdf={isExportingPdf}
        onSave={saveTransaction}
      />
    </div>
  )
}

function getStatusClass(status) {
  switch (status) {
    case 1:
      return 'bg-blue-100 text-blue-800'
    case 2:
      return 'bg-green-100 text-green-800'
    case 3:
      return 'bg-slate-100 text-slate-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

export default OrderFactoryTransactionsSection
