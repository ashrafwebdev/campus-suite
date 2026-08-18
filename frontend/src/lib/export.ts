export interface ExportColumn<T> {
  label: string
  value: (row: T) => string | number | null | undefined
}

function cell(v: string | number | null | undefined): string {
  return v === null || v === undefined ? '' : String(v)
}

export function toCsv<T>(columns: ExportColumn<T>[], rows: T[]): string {
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const header = columns.map((c) => escape(c.label)).join(',')
  const lines = rows.map((row) => columns.map((c) => escape(cell(c.value(row)))).join(','))
  return [header, ...lines].join('\r\n')
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function exportCsv<T>(filename: string, columns: ExportColumn<T>[], rows: T[]): void {
  downloadCsv(filename, toCsv(columns, rows))
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function printTable<T>(title: string, columns: ExportColumn<T>[], rows: T[]): void {
  const win = window.open('', '_blank', 'width=960,height=720')
  if (!win) return
  const headerHtml = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('')
  const rowsHtml = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(cell(c.value(row)))}</td>`).join('')}</tr>`)
    .join('')
  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; padding: 24px; color: #0f172a; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { font-size: 12px; color: #64748b; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; }
  th { background: #f8fafc; text-transform: uppercase; font-size: 11px; letter-spacing: 0.02em; color: #64748b; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>Campus Suite &middot; generated ${escapeHtml(new Date().toLocaleString())}</p>
<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>
</body>
</html>`)
  win.document.close()
  win.focus()
  win.print()
}
