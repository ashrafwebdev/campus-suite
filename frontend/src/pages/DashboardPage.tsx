import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { AdmissionEnquiry, Student } from '../types/api'
import { useAuth } from '../auth/AuthContext'

function StatCard({ label, value, to }: { label: string; value: string | number; to: string }) {
  return (
    <Link
      to={to}
      className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow"
    >
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
    </Link>
  )
}

export function DashboardPage() {
  const { user } = useAuth()

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get<Student[]>('/students')).data,
  })

  const enquiriesQuery = useQuery({
    queryKey: ['admissions', { status: 1 }],
    queryFn: async () => (await api.get<AdmissionEnquiry[]>('/admissions', { params: { status: 1 } })).data,
  })

  const allEnquiriesQuery = useQuery({
    queryKey: ['admissions'],
    queryFn: async () => (await api.get<AdmissionEnquiry[]>('/admissions')).data,
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Welcome, {user?.name}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Here's what's happening across your institution.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Enrolled students"
          value={studentsQuery.isLoading ? '…' : studentsQuery.data?.length ?? 0}
          to="/students"
        />
        <StatCard
          label="New admission enquiries"
          value={enquiriesQuery.isLoading ? '…' : enquiriesQuery.data?.length ?? 0}
          to="/admissions"
        />
        <StatCard
          label="Total enquiries"
          value={allEnquiriesQuery.isLoading ? '…' : allEnquiriesQuery.data?.length ?? 0}
          to="/admissions"
        />
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/admissions/new"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            + New admission enquiry
          </Link>
          <Link
            to="/students/new"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            + Enroll student directly
          </Link>
        </div>
      </div>
    </div>
  )
}
