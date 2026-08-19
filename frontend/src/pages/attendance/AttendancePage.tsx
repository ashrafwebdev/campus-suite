import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, ErrorNote, Field, PrimaryButton, SecondaryButton, SectionCard, Table, TableToolbar } from '../../components/ui'
import {
  ATTENDANCE_STATUS,
  type Attendance,
  type AttendanceBulkMark,
  type RosterEntry,
  type SchoolClass,
} from '../../types/api'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_COLOR = { 1: 'emerald', 2: 'red', 3: 'amber', 4: 'blue' } as const

function MarkAttendanceSection() {
  const [classId, setClassId] = useState(0)
  const [date, setDate] = useState(todayISO())
  const [marks, setMarks] = useState<Record<number, { status: number; note: string }>>({})
  const queryClient = useQueryClient()

  const classesQuery = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<SchoolClass[]>('/academic/classes')).data,
  })

  const rosterQuery = useQuery({
    queryKey: ['attendance-roster', classId, date],
    queryFn: async () => (await api.get<RosterEntry[]>(`/attendance/roster?class_id=${classId}&date=${date}`)).data,
    enabled: classId > 0 && date.length > 0,
  })

  useEffect(() => {
    if (!rosterQuery.data) return
    const next: Record<number, { status: number; note: string }> = {}
    for (const r of rosterQuery.data) {
      next[r.student_id] = { status: r.status ?? 1, note: r.note ?? '' }
    }
    setMarks(next)
  }, [rosterQuery.data])

  const saveMutation = useMutation({
    mutationFn: async (payload: AttendanceBulkMark) => (await api.post('/attendance/mark', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-roster', classId, date] })
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
    },
  })

  function setStatus(studentId: number, status: number) {
    setMarks((m) => ({ ...m, [studentId]: { status, note: m[studentId]?.note ?? '' } }))
  }

  function setNote(studentId: number, note: string) {
    setMarks((m) => ({ ...m, [studentId]: { status: m[studentId]?.status ?? 1, note } }))
  }

  function markAllPresent() {
    if (!rosterQuery.data) return
    const next: Record<number, { status: number; note: string }> = {}
    for (const r of rosterQuery.data) {
      next[r.student_id] = { status: 1, note: marks[r.student_id]?.note ?? '' }
    }
    setMarks(next)
  }

  function handleSave() {
    if (!rosterQuery.data || rosterQuery.data.length === 0) return
    saveMutation.mutate({
      class_id: classId,
      date,
      entries: rosterQuery.data.map((r) => ({
        student_id: r.student_id,
        status: marks[r.student_id]?.status ?? 1,
        note: marks[r.student_id]?.note || null,
      })),
    })
  }

  return (
    <SectionCard title="Mark Attendance" description="Pick a class and date, then mark each student.">
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Class" required>
          <select value={classId || ''} onChange={(e) => setClassId(Number(e.target.value))} className="input">
            <option value="">Select…</option>
            {classesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" required>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </Field>
        <div className="flex items-end">
          <SecondaryButton type="button" onClick={markAllPresent} disabled={!rosterQuery.data?.length} className="w-full">
            Mark all present
          </SecondaryButton>
        </div>
        <div className="flex items-end">
          <PrimaryButton
            type="button"
            onClick={handleSave}
            disabled={!classId || saveMutation.isPending || !rosterQuery.data?.length}
            className="w-full"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save attendance'}
          </PrimaryButton>
        </div>
      </div>
      <ErrorNote error={saveMutation.error} />
      {saveMutation.isSuccess && <p className="mb-3 text-sm text-emerald-600">Saved.</p>}

      {!classId ? (
        <p className="py-6 text-center text-sm text-slate-400">Select a class to load its roster.</p>
      ) : (
        <Table
          columns={['Admission No.', 'Name', 'Status', 'Note']}
          isLoading={rosterQuery.isLoading}
          error={rosterQuery.error}
          isEmpty={rosterQuery.data?.length === 0}
          emptyLabel="No active students in this class."
        >
          {rosterQuery.data?.map((r) => (
            <tr key={r.student_id}>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.admission_no}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{r.student_name}</td>
              <td className="px-4 py-3">
                <select
                  value={marks[r.student_id]?.status ?? 1}
                  onChange={(e) => setStatus(r.student_id, Number(e.target.value))}
                  className="input w-32"
                >
                  {Object.entries(ATTENDANCE_STATUS).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <input
                  value={marks[r.student_id]?.note ?? ''}
                  onChange={(e) => setNote(r.student_id, e.target.value)}
                  className="input"
                  placeholder="Optional note"
                />
              </td>
            </tr>
          ))}
        </Table>
      )}
    </SectionCard>
  )
}

function HistorySection() {
  const [classId, setClassId] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const classesQuery = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<SchoolClass[]>('/academic/classes')).data,
  })

  const params = new URLSearchParams()
  if (classId) params.set('class_id', String(classId))
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)

  const { data, isLoading, error } = useQuery({
    queryKey: ['attendance-history', classId, dateFrom, dateTo],
    queryFn: async () => (await api.get<Attendance[]>(`/attendance?${params.toString()}`)).data,
  })

  const classById = new Map((classesQuery.data ?? []).map((c) => [c.id, c.name]))

  return (
    <SectionCard
      title="History"
      description="Filter by class and date range."
      action={
        <TableToolbar
          title="Attendance History"
          filename="attendance-history"
          rows={data}
          columns={[
            { label: 'Date', value: (a) => a.date },
            { label: 'Class', value: (a) => classById.get(a.class_id) ?? `#${a.class_id}` },
            { label: 'Student ID', value: (a) => a.student_id },
            { label: 'Status', value: (a) => ATTENDANCE_STATUS[a.status] },
            { label: 'Note', value: (a) => a.note ?? '' },
          ]}
        />
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field label="Class">
          <select value={classId || ''} onChange={(e) => setClassId(Number(e.target.value))} className="input">
            <option value="">All</option>
            {classesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
        </Field>
        <Field label="To">
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
        </Field>
      </div>
      <Table columns={['Date', 'Class', 'Status', 'Note']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((a) => (
          <tr key={a.id}>
            <td className="px-4 py-3 text-slate-600">{a.date}</td>
            <td className="px-4 py-3 text-slate-600">{classById.get(a.class_id) ?? `#${a.class_id}`}</td>
            <td className="px-4 py-3">
              <Badge color={STATUS_COLOR[a.status as 1 | 2 | 3 | 4]}>{ATTENDANCE_STATUS[a.status]}</Badge>
            </td>
            <td className="px-4 py-3 text-slate-600">{a.note ?? '—'}</td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

export function AttendancePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Attendance</h1>
      <p className="mt-1 text-sm text-slate-500">Daily class attendance, marked per student, with history.</p>
      <div className="mt-6 space-y-6">
        <MarkAttendanceSection />
        <HistorySection />
      </div>
    </div>
  )
}
