import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, ErrorNote, Field, PrimaryButton, SecondaryButton, SectionCard, Table } from '../../components/ui'
import type { Student } from '../../types/api'
import {
  TRANSPORT_ALLOCATION_STATUS,
  type Route,
  type RouteCreate,
  type TransportAllocation,
  type TransportAllocationCreate,
  type Vehicle,
  type VehicleCreate,
} from '../../types/api'

function VehiclesSection() {
  const [form, setForm] = useState<VehicleCreate>({ registration_no: '', vehicle_type: 'Bus', capacity: 40 })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.get<Vehicle[]>('/transport/vehicles')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: VehicleCreate) => (await api.post('/transport/vehicles', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setForm({ registration_no: '', vehicle_type: 'Bus', capacity: 40 })
    },
  })

  return (
    <SectionCard title="Vehicles" description="Buses, vans, etc. with seat capacity.">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          createMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Field label="Registration no." required>
          <input
            required
            value={form.registration_no}
            onChange={(e) => setForm((f) => ({ ...f, registration_no: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Type" required>
          <input
            required
            value={form.vehicle_type}
            onChange={(e) => setForm((f) => ({ ...f, vehicle_type: e.target.value }))}
            className="input"
          />
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
      <Table columns={['Registration', 'Type', 'Capacity']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((v) => (
          <tr key={v.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{v.registration_no}</td>
            <td className="px-4 py-3 text-slate-600">{v.vehicle_type}</td>
            <td className="px-4 py-3 text-slate-600">{v.capacity}</td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function RoutesSection() {
  const [form, setForm] = useState<RouteCreate>({ name: '', fare: '0', vehicle_id: null })
  const queryClient = useQueryClient()

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.get<Vehicle[]>('/transport/vehicles')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get<Route[]>('/transport/routes')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: RouteCreate) => (await api.post('/transport/routes', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      setForm({ name: '', fare: '0', vehicle_id: null })
    },
  })

  return (
    <SectionCard title="Routes" description="A route's seat capacity comes from its assigned vehicle.">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          createMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Field label="Name" required>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" />
        </Field>
        <Field label="Fare">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.fare}
            onChange={(e) => setForm((f) => ({ ...f, fare: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Vehicle">
          <select
            value={form.vehicle_id ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value ? Number(e.target.value) : null }))}
            className="input"
          >
            <option value="">None</option>
            {vehiclesQuery.data?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registration_no}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-end">
          <PrimaryButton type="submit" disabled={createMutation.isPending} className="w-full">
            + Add
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={createMutation.error} />
      <Table columns={['Name', 'Fare', 'Occupied / Capacity']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((r) => (
          <tr key={r.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
            <td className="px-4 py-3 text-slate-600">{r.fare}</td>
            <td className="px-4 py-3">
              {r.capacity == null ? (
                <Badge color="slate">No vehicle</Badge>
              ) : (
                <Badge color={r.occupied >= r.capacity ? 'red' : 'emerald'}>
                  {r.occupied} / {r.capacity}
                </Badge>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function AllocationsSection() {
  const [form, setForm] = useState<TransportAllocationCreate>({ student_id: 0, route_id: 0 })
  const queryClient = useQueryClient()

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get<Student[]>('/students')).data,
  })
  const routesQuery = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get<Route[]>('/transport/routes')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['transport-allocations'],
    queryFn: async () => (await api.get<TransportAllocation[]>('/transport/allocations')).data,
  })

  const allocateMutation = useMutation({
    mutationFn: async (payload: TransportAllocationCreate) => (await api.post('/transport/allocations', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-allocations'] })
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      setForm({ student_id: 0, route_id: 0 })
    },
  })

  const endMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/transport/allocations/${id}/end`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-allocations'] })
      queryClient.invalidateQueries({ queryKey: ['routes'] })
    },
  })

  const studentById = new Map((studentsQuery.data ?? []).map((s) => [s.id, s.name]))
  const routeById = new Map((routesQuery.data ?? []).map((r) => [r.id, r.name]))

  return (
    <SectionCard title="Allocations" description="Assign a student to a route; requires a route with a vehicle assigned.">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!form.student_id || !form.route_id) return
          allocateMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
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
        <Field label="Route" required>
          <select
            required
            value={form.route_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, route_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {routesQuery.data?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-end">
          <PrimaryButton type="submit" disabled={allocateMutation.isPending} className="w-full">
            Allocate
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={allocateMutation.error ?? endMutation.error} />
      <Table columns={['Student', 'Route', 'Status', '']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((a) => (
          <tr key={a.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{studentById.get(a.student_id) ?? `#${a.student_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{routeById.get(a.route_id) ?? `#${a.route_id}`}</td>
            <td className="px-4 py-3">
              <Badge color={a.status === 1 ? 'emerald' : 'slate'}>{TRANSPORT_ALLOCATION_STATUS[a.status]}</Badge>
            </td>
            <td className="px-4 py-3 text-right">
              {a.status === 1 && (
                <SecondaryButton onClick={() => endMutation.mutate(a.id)} disabled={endMutation.isPending}>
                  End
                </SecondaryButton>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

export function TransportPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Transport</h1>
      <p className="mt-1 text-sm text-slate-500">Vehicles, routes, and student allocations.</p>
      <div className="mt-6 space-y-6">
        <VehiclesSection />
        <RoutesSection />
        <AllocationsSection />
      </div>
    </div>
  )
}
