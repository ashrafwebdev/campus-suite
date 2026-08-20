import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, apiErrorMessage } from '../../lib/api'
import { TableToolbar } from '../../components/ui'
import { ADMISSION_SOURCE, ADMISSION_STATUS, type AdmissionEnquiry } from '../../types/api'

const STATUS_COLORS: Record<number, string> = {
  1: 'bg-slate-100 text-slate-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-emerald-100 text-emerald-700',
  5: 'bg-red-100 text-red-700',
}

export function AdmissionsListPage() {
  const [statusFilter, setStatusFilter] = useState<number | ''>('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admissions', { status: statusFilter || undefined }],
    queryFn: async () =>
      (
        await api.get<AdmissionEnquiry[]>('/admissions', {
          params: statusFilter ? { status: statusFilter } : undefined,
        })
      ).data,
  })

  const convertMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/admissions/${id}/convert`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admissions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admissions'] }),
  })

  function handleDelete(id: number) {
    if (window.confirm('Delete this enquiry? This cannot be undone.')) deleteMutation.mutate(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Admission Enquiries
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Leads from advertisement, website, referral, and walk-ins.
          </p>
        </div>
        <Link
          to="/admissions/new"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + New enquiry
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm font-medium text-slate-600">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : '')}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {Object.entries(ADMISSION_STATUS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <TableToolbar
          title="Admission Enquiries"
          filename="admission-enquiries"
          rows={data}
          columns={[
            { label: 'Enquiry', value: (e) => e.enquiry_no },
            { label: 'Name', value: (e) => e.name },
            { label: 'Phone', value: (e) => e.phone_no },
            { label: 'Source', value: (e) => ADMISSION_SOURCE[e.source] },
            { label: 'Status', value: (e) => ADMISSION_STATUS[e.status] },
          ]}
        />
      </div>

      {(convertMutation.isError || deleteMutation.isError) && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {apiErrorMessage(convertMutation.error ?? deleteMutation.error)}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Enquiry</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-red-600">
                  {apiErrorMessage(error)}
                </td>
              </tr>
            )}
            {data?.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No enquiries yet.
                </td>
              </tr>
            )}
            {data?.map((enquiry) => (
              <tr key={enquiry.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{enquiry.enquiry_no}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{enquiry.name}</td>
                <td className="px-4 py-3 text-slate-600">{enquiry.phone_no}</td>
                <td className="px-4 py-3 text-slate-600">{ADMISSION_SOURCE[enquiry.source]}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[enquiry.status]}`}
                  >
                    {ADMISSION_STATUS[enquiry.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {enquiry.status !== 4 && enquiry.status !== 5 && (
                      <button
                        onClick={() => convertMutation.mutate(enquiry.id)}
                        disabled={convertMutation.isPending}
                        className="rounded-md border border-emerald-300 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        Convert to student
                      </button>
                    )}
                    {enquiry.status === 4 && enquiry.student_id && (
                      <Link
                        to="/students"
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        View student →
                      </Link>
                    )}
                    <Link
                      to={`/admissions/${enquiry.id}/edit`}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(enquiry.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
