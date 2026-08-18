import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, ErrorNote, Field, PrimaryButton, SecondaryButton, SectionCard, Table, TableToolbar } from '../../components/ui'
import type { Student } from '../../types/api'
import {
  HOSTEL_ALLOCATION_STATUS,
  type Hostel,
  type HostelAllocation,
  type HostelAllocationCreate,
  type HostelCreate,
  type HostelRoom,
  type HostelRoomCreate,
} from '../../types/api'

function HostelsSection() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['hostels'],
    queryFn: async () => (await api.get<Hostel[]>('/hostel')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: HostelCreate) => (await api.post('/hostel', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] })
      setName('')
      setAddress('')
    },
  })

  return (
    <SectionCard
      title="Hostels"
      description="Buildings/blocks, each with its own rooms."
      action={
        <TableToolbar
          title="Hostels"
          filename="hostels"
          rows={data}
          columns={[
            { label: 'Name', value: (h) => h.name },
            { label: 'Address', value: (h) => h.address ?? '' },
          ]}
        />
      }
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          createMutation.mutate({ name, address: address || null })
        }}
        className="mb-4 flex items-end gap-2"
      >
        <div className="flex-1">
          <Field label="Name" required>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Boys Hostel A" />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Address">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
          </Field>
        </div>
        <PrimaryButton type="submit" disabled={createMutation.isPending}>
          + Add
        </PrimaryButton>
      </form>
      <ErrorNote error={createMutation.error} />
      <Table columns={['Name', 'Address']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((h) => (
          <tr key={h.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{h.name}</td>
            <td className="px-4 py-3 text-slate-600">{h.address ?? '—'}</td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function RoomsSection() {
  const [form, setForm] = useState<HostelRoomCreate>({ hostel_id: 0, room_no: '', capacity: 1 })
  const queryClient = useQueryClient()

  const hostelsQuery = useQuery({
    queryKey: ['hostels'],
    queryFn: async () => (await api.get<Hostel[]>('/hostel')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['hostel-rooms'],
    queryFn: async () => (await api.get<HostelRoom[]>('/hostel/rooms')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: HostelRoomCreate) => (await api.post('/hostel/rooms', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostel-rooms'] })
      setForm({ hostel_id: 0, room_no: '', capacity: 1 })
    },
  })

  const hostelById = new Map((hostelsQuery.data ?? []).map((h) => [h.id, h.name]))

  return (
    <SectionCard
      title="Rooms"
      description="Capacity per room; occupied count updates live as students are allocated."
      action={
        <TableToolbar
          title="Rooms"
          filename="hostel-rooms"
          rows={data}
          columns={[
            { label: 'Room', value: (r) => r.room_no },
            { label: 'Hostel', value: (r) => hostelById.get(r.hostel_id) ?? `#${r.hostel_id}` },
            { label: 'Occupied', value: (r) => r.occupied },
            { label: 'Capacity', value: (r) => r.capacity },
          ]}
        />
      }
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!form.hostel_id) return
          createMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Field label="Hostel" required>
          <select
            required
            value={form.hostel_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, hostel_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {hostelsQuery.data?.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Room no." required>
          <input required value={form.room_no} onChange={(e) => setForm((f) => ({ ...f, room_no: e.target.value }))} className="input" />
        </Field>
        <Field label="Capacity">
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
            className="input"
          />
        </Field>
        <div className="flex items-end">
          <PrimaryButton type="submit" disabled={createMutation.isPending} className="w-full">
            + Add
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={createMutation.error} />
      <Table columns={['Room', 'Hostel', 'Occupied / Capacity']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((r) => (
          <tr key={r.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{r.room_no}</td>
            <td className="px-4 py-3 text-slate-600">{hostelById.get(r.hostel_id) ?? `#${r.hostel_id}`}</td>
            <td className="px-4 py-3">
              <Badge color={r.occupied >= r.capacity ? 'red' : 'emerald'}>
                {r.occupied} / {r.capacity}
              </Badge>
            </td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function AllocationsSection() {
  const [form, setForm] = useState<HostelAllocationCreate>({ student_id: 0, room_id: 0, bed_no: '' })
  const queryClient = useQueryClient()

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get<Student[]>('/students')).data,
  })
  const roomsQuery = useQuery({
    queryKey: ['hostel-rooms'],
    queryFn: async () => (await api.get<HostelRoom[]>('/hostel/rooms')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['hostel-allocations'],
    queryFn: async () => (await api.get<HostelAllocation[]>('/hostel/allocations')).data,
  })

  const allocateMutation = useMutation({
    mutationFn: async (payload: HostelAllocationCreate) => (await api.post('/hostel/allocations', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostel-allocations'] })
      queryClient.invalidateQueries({ queryKey: ['hostel-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setForm({ student_id: 0, room_id: 0, bed_no: '' })
    },
  })

  const vacateMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/hostel/allocations/${id}/vacate`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostel-allocations'] })
      queryClient.invalidateQueries({ queryKey: ['hostel-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const studentById = new Map((studentsQuery.data ?? []).map((s) => [s.id, s.name]))
  const roomById = new Map((roomsQuery.data ?? []).map((r) => [r.id, r.room_no]))

  return (
    <SectionCard
      title="Allocations"
      description="Assign a student to a room; one active allocation per student."
      action={
        <TableToolbar
          title="Hostel Allocations"
          filename="hostel-allocations"
          rows={data}
          columns={[
            { label: 'Student', value: (a) => studentById.get(a.student_id) ?? `#${a.student_id}` },
            { label: 'Room', value: (a) => roomById.get(a.room_id) ?? `#${a.room_id}` },
            { label: 'Bed', value: (a) => a.bed_no ?? '' },
            { label: 'Status', value: (a) => HOSTEL_ALLOCATION_STATUS[a.status] },
          ]}
        />
      }
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!form.student_id || !form.room_id) return
          allocateMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Field label="Student" required>
          <select
            required
            value={form.student_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, student_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {studentsQuery.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Room" required>
          <select
            required
            value={form.room_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, room_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {roomsQuery.data?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_no} ({r.occupied}/{r.capacity})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bed no.">
          <input value={form.bed_no ?? ''} onChange={(e) => setForm((f) => ({ ...f, bed_no: e.target.value }))} className="input" />
        </Field>
        <div className="flex items-end">
          <PrimaryButton type="submit" disabled={allocateMutation.isPending} className="w-full">
            Allocate
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={allocateMutation.error ?? vacateMutation.error} />
      <Table
        columns={['Student', 'Room', 'Bed', 'Status', '']}
        isLoading={isLoading}
        error={error}
        isEmpty={data?.length === 0}
      >
        {data?.map((a) => (
          <tr key={a.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{studentById.get(a.student_id) ?? `#${a.student_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{roomById.get(a.room_id) ?? `#${a.room_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{a.bed_no ?? '—'}</td>
            <td className="px-4 py-3">
              <Badge color={a.status === 1 ? 'emerald' : 'slate'}>{HOSTEL_ALLOCATION_STATUS[a.status]}</Badge>
            </td>
            <td className="px-4 py-3 text-right">
              {a.status === 1 && (
                <SecondaryButton onClick={() => vacateMutation.mutate(a.id)} disabled={vacateMutation.isPending}>
                  Vacate
                </SecondaryButton>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

export function HostelPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Hostel Management</h1>
      <p className="mt-1 text-sm text-slate-500">Hostels, rooms, and student allocations.</p>
      <div className="mt-6 space-y-6">
        <HostelsSection />
        <RoomsSection />
        <AllocationsSection />
      </div>
    </div>
  )
}
