import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, apiErrorMessage } from '../../lib/api'
import { TableToolbar } from '../../components/ui'
import { RESIDENCY_TYPE, STUDENT_STATUS, type Student } from '../../types/api'

export function StudentsListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get<Student[]>('/students')).data,
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Students</h1>
          <p className="mt-1 text-sm text-slate-500">Enrolled students, day scholar and hosteller alike.</p>
        </div>
        <Link
          to="/students/new"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Enroll student
        </Link>
      </div>

      <div className="mt-5 flex justify-end">
        <TableToolbar
          title="Students"
          filename="students"
          rows={data}
          columns={[
            { label: 'Admission No.', value: (s) => s.admission_no },
            { label: 'Name', value: (s) => s.name },
            { label: 'Phone', value: (s) => s.phone_no ?? '' },
            { label: 'Residency', value: (s) => RESIDENCY_TYPE[s.residency_type] },
            { label: 'Status', value: (s) => STUDENT_STATUS[s.status] },
          ]}
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Admission No</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Residency</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-red-600">
                  {apiErrorMessage(error)}
                </td>
              </tr>
            )}
            {data?.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No students enrolled yet.
                </td>
              </tr>
            )}
            {data?.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{student.admission_no}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{student.name}</td>
                <td className="px-4 py-3 text-slate-600">{student.phone_no ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      student.residency_type === 2
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {RESIDENCY_TYPE[student.residency_type]}
                    {student.hostel_room_no ? ` · ${student.hostel_room_no}` : ''}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{STUDENT_STATUS[student.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
