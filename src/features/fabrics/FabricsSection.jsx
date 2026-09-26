import React, { useCallback, useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FileDown, LoaderCircle } from 'lucide-react'

const DAILY_FABRICS_URL = '/api/DailyHamFabricsTransaction'
const getLocalDate = () => {
  const currentDate = new Date()
  const month = String(currentDate.getMonth() + 1).padStart(2, '0')
  const day = String(currentDate.getDate()).padStart(2, '0')
  return `${currentDate.getFullYear()}-${month}-${day}`
}

const formatApiDate = (value) => String(value ?? '').split('T')[0] || '-'

function FabricsSection({ apiRequest, showNotice, isActive }) {
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [shifts, setShifts] = useState([])
  const today = getLocalDate()
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [isLoading, setIsLoading] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [error, setError] = useState('')
  const [expandedShifts, setExpandedShifts] = useState([])

  const loadTransactions = useCallback(
    async ({ page = pageNumber, size = pageSize, from = dateFrom, to = dateTo } = {}) => {
      setError('')
      setIsLoading(true)

      try {
        const query = new URLSearchParams({
          pageNumber: String(page),
          pageSize: String(size),
          DateFrom: from,
          DateTo: to,
        })

        const response = await apiRequest(`${DAILY_FABRICS_URL}?${query.toString()}`)
        const data = response.data || {}

        setShifts(Array.isArray(data.shifts) ? data.shifts : [])
        setTotalCount(data.totalRecords ?? 0)
        setPageNumber(page)
        setPageSize(size)
      } catch (requestError) {
        if (requestError instanceof TypeError) {
          setError('تعذر الاتصال بالخادم. تأكد أن API متاحة على judimensucat.runasp.net وأن الخادم يسمح بطلبات CORS.')
        } else {
          setError(requestError.message || 'Günlük kumaş hareketleri alınırken bir hata oluştu.')
        }

        setShifts([])
        setTotalCount(0)
        showNotice('error', requestError.message || 'Günlük kumaş hareketleri alınırken bir hata oluştu.')
      } finally {
        setIsLoading(false)
      }
    },
    [apiRequest, dateFrom, dateTo, pageNumber, pageSize, showNotice],
  )

  const handleDateFromChange = (value) => {
    setDateFrom(value)
    loadTransactions({ page: 1, size: pageSize, from: value })
  }

  const handleDateToChange = (value) => {
    setDateTo(value)
    loadTransactions({ page: 1, size: pageSize, to: value })
  }

  const handlePageChange = (newPage) => {
    loadTransactions({ page: newPage, size: pageSize })
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    loadTransactions({ page: 1, size: newSize })
  }

  useEffect(() => {
    if (isActive) {
      loadTransactions({ page: 1, size: pageSize })
    }
  }, [isActive, loadTransactions, pageSize])

  const getShiftKey = (shift, index) => `${shift.date ?? 'unknown'}-${shift.shift ?? 'unknown'}-${index}`
  const isShiftExpanded = (shiftKey) => expandedShifts.includes(shiftKey)

  const handleToggleExpand = (shiftKey) => {
    setExpandedShifts((prev) => prev.includes(shiftKey)
      ? prev.filter((key) => key !== shiftKey)
      : [...prev, shiftKey])
  }

  const exportTableToPdf = async () => {
    if (!shifts.length || isExportingPdf) {
      return
    }

    setIsExportingPdf(true)

    try {
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
      pdfDocument.setFont('Arial', 'bold')
      pdfDocument.setFontSize(15)
      pdfDocument.setTextColor(13, 42, 62)
      pdfDocument.text('Günlük Üretim Takibi', 14, 14)
      pdfDocument.setFont('Arial', 'normal')
      pdfDocument.setFontSize(9)
      pdfDocument.text(`Tarih aralığı: ${dateFrom || '-'} - ${dateTo || '-'}`, 14, 21)

      autoTable(pdfDocument, {
        startY: 26,
        head: [['Tarih', 'Vardiya', 'Toplam Ağırlık', 'Sağlam Ağırlık', 'Hatalı Ağırlık', 'Makine Sayısı']],
        body: shifts.map((shift) => [
          formatApiDate(shift.date),
          shift.shiftName ?? shift.shift ?? '-',
          String(shift.totalWeight ?? 0),
          String(shift.saglamWeight ?? 0),
          String(shift.hataWeight ?? 0),
          String(Array.isArray(shift.machines) ? shift.machines.length : 0),
        ]),
        theme: 'grid',
        styles: { font: 'Arial', fontSize: 8, cellPadding: 2, textColor: [46, 81, 102] },
        headStyles: { fillColor: [233, 242, 247], textColor: [13, 42, 62], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 251, 253] },
        margin: { left: 14, right: 14 },
      })

      shifts.forEach((shift) => {
        const machines = Array.isArray(shift.machines) ? shift.machines : []
        if (!machines.length) {
          return
        }

        let sectionTop = (pdfDocument.lastAutoTable?.finalY ?? 26) + 8
        if (sectionTop > 180) {
          pdfDocument.addPage()
          sectionTop = 15
        }

        pdfDocument.setFont('Arial', 'bold')
        pdfDocument.setFontSize(10)
        pdfDocument.setTextColor(13, 42, 62)
        pdfDocument.text(
          `${formatApiDate(shift.date)} | ${shift.shiftName ?? shift.shift ?? '-'} - Makine Detayları`,
          14,
          sectionTop,
        )

        autoTable(pdfDocument, {
          startY: sectionTop + 3,
          head: [['Makine No', 'Makine Operatörü', 'Top Sayısı', 'Toplam Ağırlık', 'Sağlam', 'Hatalı']],
          body: machines.map((machine) => [
            String(machine.makineNo ?? machine.machineId ?? '-'),
            String(machine.operator ?? '-'),
            String(machine.rollsCount ?? 0),
            String(machine.totalWeight ?? 0),
            String(machine.saglamWeight ?? 0),
            String(machine.hataWeight ?? 0),
          ]),
          theme: 'grid',
          styles: { font: 'Arial', fontSize: 7, cellPadding: 1.8, textColor: [46, 81, 102] },
          headStyles: { fillColor: [241, 247, 250], textColor: [13, 42, 62], fontStyle: 'bold' },
          margin: { left: 14, right: 14 },
        })
      })

      const fileName = `gunluk-uretim-takibi-${dateFrom}-${dateTo}.pdf`
      pdfDocument.save(fileName)
      showNotice('success', 'PDF dosyası başarıyla oluşturuldu.')
    } catch (requestError) {
      showNotice('error', requestError.message || 'PDF dosyası oluşturulamadı.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <>
      <div className="space-y-6" dir="ltr">
        <section className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-50 px-4 py-6 shadow-sm sm:px-6" aria-label="Günlük kumaş hareketleri arama">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-sky-900">Günlük Üretim Takibi</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="dateFrom" className="text-xs font-medium text-slate-600">Başlangıç Tarihi</label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(event) => handleDateFromChange(event.target.value)}
                className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
                dir="ltr"
                style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="dateTo" className="text-xs font-medium text-slate-600">Bitiş Tarihi</label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(event) => handleDateToChange(event.target.value)}
                className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
                dir="ltr"
                style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="fabricsPageSize" className="text-xs font-medium text-slate-600">Vardiya Sayısı</label>
              <select
                id="fabricsPageSize"
                value={pageSize}
                onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-slate-50"
                dir="ltr"
                style={{ unicodeBidi: 'plaintext', textAlign: 'left' }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto" dir="ltr">
            <table className="w-full text-sm" style={{ direction: 'ltr' }} dir="ltr">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Vardiya</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Toplam Ağırlık</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Sağlam Ağırlık</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Hatalı Ağırlık</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Makineler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Günlük üretim verileri yükleniyor...</td></tr>
                ) : shifts.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Seçilen tarih aralığında veri bulunamadı.</td></tr>
                ) : shifts.map((shift, index) => {
                  const shiftKey = getShiftKey(shift, index)
                  const isExpanded = isShiftExpanded(shiftKey)
                  const machines = Array.isArray(shift.machines) ? shift.machines : []

                  return (
                    <React.Fragment key={shiftKey}>
                      <tr onClick={() => handleToggleExpand(shiftKey)} className="cursor-pointer transition hover:bg-slate-50">
                        <td className="px-6 py-4 text-left">{formatApiDate(shift.date)}</td>
                        <td className="px-6 py-4 text-left font-semibold">{shift.shiftName ?? shift.shift ?? '-'}</td>
                        <td className="px-6 py-4 text-left">{shift.totalWeight ?? 0}</td>
                        <td className="px-6 py-4 text-left text-emerald-700">{shift.saglamWeight ?? 0}</td>
                        <td className="px-6 py-4 text-left text-rose-700">{shift.hataWeight ?? 0}</td>
                        <td className="px-6 py-4 text-left">{isExpanded ? '▼' : '▶'} {machines.length}</td>
                      </tr>
                      {isExpanded ? (
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="px-6 py-4">
                            {machines.length ? (
                              <table className="w-full text-sm" dir="ltr">
                                <thead><tr className="border-b border-slate-200 bg-white">
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Makine No</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Makine Operatörü</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Top Sayısı</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Toplam Ağırlık</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Sağlam</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Hatalı</th>
                                </tr></thead>
                                <tbody className="divide-y divide-slate-200">
                                  {machines.map((machine) => (
                                    <tr key={`${shiftKey}-${machine.machineId}`}>
                                      <td className="px-4 py-2">{machine.makineNo ?? machine.machineId ?? '-'}</td>
                                      <td className="px-4 py-2">{machine.operator ?? '-'}</td>
                                      <td className="px-4 py-2">{machine.rollsCount ?? 0}</td>
                                      <td className="px-4 py-2">{machine.totalWeight ?? 0}</td>
                                      <td className="px-4 py-2 text-emerald-700">{machine.saglamWeight ?? 0}</td>
                                      <td className="px-4 py-2 text-rose-700">{machine.hataWeight ?? 0}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : <p className="text-sm text-slate-500">Bu vardiya için makine verisi bulunamadı.</p>}
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-left text-sm text-slate-700">
            <p>Toplam sonuç: <strong className="text-slate-900">{totalCount}</strong> | Sayfa: <strong className="text-slate-900">{pageNumber}</strong> / <strong className="text-slate-900">{Math.max(Math.ceil(totalCount / pageSize), 1)}</strong></p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-[4px] border border-[#b8cfde] bg-white text-[#0d5988] transition hover:bg-[#eef6fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6fa7] disabled:cursor-not-allowed disabled:opacity-50"
              title={isExportingPdf ? 'PDF oluşturuluyor...' : 'PDF indir'}
              aria-label={isExportingPdf ? 'PDF oluşturuluyor...' : 'PDF indir'}
              disabled={!shifts.length || isLoading || isExportingPdf}
              onClick={exportTableToPdf}
            >
              {isExportingPdf ? <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" /> : <FileDown className="h-6 w-6" aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pageNumber <= 1 || isLoading}
              onClick={() => handlePageChange(Math.max(pageNumber - 1, 1))}
            >
              Önceki
            </button>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
              Sayfa {pageNumber}
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pageNumber >= Math.max(Math.ceil(totalCount / pageSize), 1) || isLoading}
              onClick={() => handlePageChange(Math.min(pageNumber + 1, Math.max(Math.ceil(totalCount / pageSize), 1)))}
            >
              Sonraki
            </button>
          </div>
        </footer>
      </div>
    </>
  )
}

export default FabricsSection
