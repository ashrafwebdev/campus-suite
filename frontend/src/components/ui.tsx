import type { ReactNode } from 'react'
import { apiErrorMessage } from '../lib/api'
import { exportCsv, printTable, type ExportColumn } from '../lib/export'

export function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function Badge({ children, color = 'slate' }: { children: ReactNode; color?: BadgeColor }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_COLORS[color]}`}>{children}</span>
}

export type BadgeColor = 'slate' | 'blue' | 'amber' | 'emerald' | 'red' | 'purple'

const BADGE_COLORS: Record<BadgeColor, string> = {
  slate: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
}

export function Table({
  columns,
  isLoading,
  error,
  isEmpty,
  emptyLabel = 'Nothing here yet.',
  children,
}: {
  columns: string[]
  isLoading: boolean
  error: unknown
  isEmpty: boolean
  emptyLabel?: string
  children: ReactNode
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400">
                Loading…
              </td>
            </tr>
          )}
          {Boolean(error) && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-red-600">
                {apiErrorMessage(error)}
              </td>
            </tr>
          )}
          {isEmpty && !isLoading && !error && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400">
                {emptyLabel}
              </td>
            </tr>
          )}
          {children}
        </tbody>
      </table>
    </div>
  )
}

export function TableToolbar<T>({
  title,
  filename,
  columns,
  rows,
}: {
  title: string
  filename: string
  columns: ExportColumn<T>[]
  rows: T[] | undefined
}) {
  const data = rows ?? []
  return (
    <div className="flex gap-2">
      <SecondaryButton type="button" disabled={data.length === 0} onClick={() => printTable(title, columns, data)}>
        Print
      </SecondaryButton>
      <SecondaryButton type="button" disabled={data.length === 0} onClick={() => exportCsv(filename, columns, data)}>
        Export
      </SecondaryButton>
    </div>
  )
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {apiErrorMessage(error)}
    </div>
  )
}
