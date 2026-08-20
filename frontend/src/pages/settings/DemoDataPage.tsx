import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { ErrorNote, PrimaryButton, SecondaryButton, SectionCard } from '../../components/ui'

interface DemoDataStatus {
  installed: boolean
  counts: Record<string, number>
}

const TABLE_LABELS: Record<string, string> = {
  school_classes: 'Classes',
  sections: 'Sections',
  subjects: 'Subjects',
  students: 'Students',
  admission_enquiries: 'Admission enquiries',
  attendance: 'Attendance records',
  exams: 'Exams',
  grade_scales: 'Grade scales',
  exam_rules: 'Exam rules',
  marks: 'Marks',
  results: 'Results',
  fee_heads: 'Fee heads',
  invoices: 'Invoices',
  payments: 'Payments',
  hostels: 'Hostels',
  hostel_rooms: 'Hostel rooms',
  hostel_allocations: 'Hostel allocations',
  vehicles: 'Vehicles',
  routes: 'Transport routes',
  route_stops: 'Route stops',
  transport_allocations: 'Transport allocations',
  books: 'Library books',
  book_issues: 'Book issues',
  certificate_types: 'Certificate types',
  certificates: 'Certificates',
  employees: 'Staff records',
  leave_requests: 'Leave requests',
  payrolls: 'Payroll entries',
}

function useDemoDataStatus() {
  return useQuery({
    queryKey: ['demo-data-status'],
    queryFn: async () => (await api.get<DemoDataStatus>('/demo-data/status')).data,
  })
}

export function DemoDataPage() {
  const { data, isLoading } = useDemoDataStatus()
  const queryClient = useQueryClient()

  const installMutation = useMutation({
    mutationFn: async () => (await api.post<DemoDataStatus>('/demo-data/install')).data,
    onSuccess: (result) => queryClient.setQueryData(['demo-data-status'], result),
    // A failed install (e.g. a dropped connection partway through) can still
    // have created and tracked some rows server-side -- refetch so the page
    // reflects that instead of staying stuck on a stale "not installed" state.
    onError: () => queryClient.invalidateQueries({ queryKey: ['demo-data-status'] }),
  })

  const removeMutation = useMutation({
    mutationFn: async () => (await api.post<DemoDataStatus>('/demo-data/remove')).data,
    onSuccess: (result) => queryClient.setQueryData(['demo-data-status'], result),
    onError: () => queryClient.invalidateQueries({ queryKey: ['demo-data-status'] }),
  })

  function handleRemove() {
    if (window.confirm('Remove all sample data? This deletes every demo student, class, invoice, and other demo record it created.')) {
      removeMutation.mutate()
    }
  }

  const installed = data?.installed ?? false
  const counts = installMutation.data?.counts ?? removeMutation.data?.counts

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sample Data</h1>
      <p className="mt-1 text-sm text-slate-500">
        Fill every module with realistic fictional data for testing, demos, or training — and take it all out again
        when you're done.
      </p>

      <div className="mt-6 space-y-6">
        <SectionCard title="Install sample data" description="Creates classes, students, attendance, fees, hostel, transport, library, exams, and staff records — all clearly fictional.">
          <p className="text-sm text-slate-600">
            One click adds a full working example: a handful of classes and students, a week of attendance, fee
            invoices with some paid and some outstanding, hostel and transport allocations, library loans, an exam
            with results, and a small staff list with payroll. Nothing here overlaps with real data — every row it
            creates is tracked, so removing it later is exact.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <PrimaryButton onClick={() => installMutation.mutate()} disabled={isLoading || installed || installMutation.isPending}>
              {installMutation.isPending ? 'Installing…' : installed ? 'Already installed' : 'Install sample data'}
            </PrimaryButton>
            {installMutation.isSuccess && <span className="text-sm text-emerald-600">Installed.</span>}
          </div>
          <ErrorNote error={installMutation.error} />
          {installMutation.isError && (
            <p className="mt-2 text-xs text-slate-500">
              If this failed partway through, some sample data may already be installed — this page has refreshed
              to reflect that. Use Remove sample data below, then try installing again.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Remove sample data" description="Deletes exactly the rows the installer created, nothing else.">
          <p className="text-sm text-slate-600">
            {installed
              ? 'Sample data is currently installed. Removing it deletes every demo row across every module — real data you entered yourself is never touched.'
              : 'No sample data is currently installed.'}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <SecondaryButton onClick={handleRemove} disabled={isLoading || !installed || removeMutation.isPending}>
              {removeMutation.isPending ? 'Removing…' : 'Remove sample data'}
            </SecondaryButton>
            {removeMutation.isSuccess && <span className="text-sm text-emerald-600">Removed.</span>}
          </div>
          <ErrorNote error={removeMutation.error} />
        </SectionCard>

        {counts && Object.keys(counts).length > 0 && (
          <SectionCard title={removeMutation.isSuccess ? 'Rows removed' : 'Rows created'}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
              {Object.entries(counts).map(([table, count]) => (
                <div key={table} className="flex justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">{TABLE_LABELS[table] ?? table}</span>
                  <span className="font-medium text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
