import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, ErrorNote, Field, PrimaryButton, SecondaryButton, SectionCard, Table, TableToolbar } from '../../components/ui'
import type { Student } from '../../types/api'
import {
  TRANSPORT_ALLOCATION_STATUS,
  type Route,
  type RouteCreate,
  type RouteStop,
  type RouteStopCreate,
  type TransportAllocation,
  type TransportAllocationCreate,
  type Vehicle,
  type VehicleCreate,
} from '../../types/api'

function VehiclesSection() {
  const [form, setForm] = useState<VehicleCreate>({ registration_no: '', vehicle_type: 'Bus', capacity: 40 })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<VehicleCreate>({ registration_no: '', vehicle_type: 'Bus', capacity: 40 })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.get<Vehicle[]>('/transport/vehicles')).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vehicles'] })

  const createMutation = useMutation({
    mutationFn: async (payload: VehicleCreate) => (await api.post('/transport/vehicles', payload)).data,
    onSuccess: () => {
      invalidate()
      setForm({ registration_no: '', vehicle_type: 'Bus', capacity: 40 })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: VehicleCreate }) =>
      (await api.put(`/transport/vehicles/${id}`, payload)).data,
    onSuccess: () => {
      invalidate()
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/transport/vehicles/${id}`),
    onSuccess: invalidate,
  })

  function startEdit(v: Vehicle) {
    setEditingId(v.id)
    setEditForm({
      registration_no: v.registration_no,
      vehicle_type: v.vehicle_type,
      capacity: v.capacity,
      driver_name: v.driver_name ?? '',
      driver_phone: v.driver_phone ?? '',
    })
  }

  function handleDelete(id: number) {
    if (window.confirm('Delete this vehicle? This cannot be undone.')) deleteMutation.mutate(id)
  }

  return (
    <SectionCard
      title="Vehicles"
      description="Buses, vans, etc. with seat capacity."
      action={
        <TableToolbar
          title="Vehicles"
          filename="vehicles"
          rows={data}
          columns={[
            { label: 'Registration', value: (v) => v.registration_no },
            { label: 'Type', value: (v) => v.vehicle_type },
            { label: 'Capacity', value: (v) => v.capacity },
          ]}
        />
      }
    >
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
      <ErrorNote error={createMutation.error ?? updateMutation.error ?? deleteMutation.error} />
      <Table columns={['Registration', 'Type', 'Capacity', '']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((v) =>
          editingId === v.id ? (
            <tr key={v.id} className="bg-slate-50">
              <td className="px-4 py-3 text-slate-900">{v.registration_no}</td>
              <td className="px-4 py-3">
                <input
                  value={editForm.vehicle_type}
                  onChange={(e) => setEditForm((f) => ({ ...f, vehicle_type: e.target.value }))}
                  className="input"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min={1}
                  value={editForm.capacity ?? 1}
                  onChange={(e) => setEditForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                  className="input w-20"
                />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <PrimaryButton
                    onClick={() => updateMutation.mutate({ id: v.id, payload: editForm })}
                    disabled={updateMutation.isPending}
                  >
                    Save
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setEditingId(null)}>Cancel</SecondaryButton>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={v.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{v.registration_no}</td>
              <td className="px-4 py-3 text-slate-600">{v.vehicle_type}</td>
              <td className="px-4 py-3 text-slate-600">{v.capacity}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <SecondaryButton onClick={() => startEdit(v)}>Edit</SecondaryButton>
                  <SecondaryButton onClick={() => handleDelete(v.id)} disabled={deleteMutation.isPending}>
                    Delete
                  </SecondaryButton>
                </div>
              </td>
            </tr>
          ),
        )}
      </Table>
    </SectionCard>
  )
}

function RoutesSection() {
  const [form, setForm] = useState<RouteCreate>({ name: '', fare: '0', vehicle_id: null })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<RouteCreate>({ name: '', fare: '0', vehicle_id: null })
  const queryClient = useQueryClient()

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.get<Vehicle[]>('/transport/vehicles')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get<Route[]>('/transport/routes')).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['routes'] })

  const createMutation = useMutation({
    mutationFn: async (payload: RouteCreate) => (await api.post('/transport/routes', payload)).data,
    onSuccess: () => {
      invalidate()
      setForm({ name: '', fare: '0', vehicle_id: null })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: RouteCreate }) =>
      (await api.put(`/transport/routes/${id}`, payload)).data,
    onSuccess: () => {
      invalidate()
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/transport/routes/${id}`),
    onSuccess: invalidate,
  })

  function handleDelete(id: number) {
    if (window.confirm('Delete this route? This cannot be undone.')) deleteMutation.mutate(id)
  }

  return (
    <SectionCard
      title="Routes"
      description="A route's seat capacity comes from its assigned vehicle."
      action={
        <TableToolbar
          title="Routes"
          filename="routes"
          rows={data}
          columns={[
            { label: 'Name', value: (r) => r.name },
            { label: 'Fare', value: (r) => r.fare },
            { label: 'Occupied', value: (r) => r.occupied },
            { label: 'Capacity', value: (r) => r.capacity ?? '' },
          ]}
        />
      }
    >
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
      <ErrorNote error={createMutation.error ?? updateMutation.error ?? deleteMutation.error} />
      <Table columns={['Name', 'Fare', 'Occupied / Capacity', '']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((r) =>
          editingId === r.id ? (
            <tr key={r.id} className="bg-slate-50">
              <td className="px-4 py-3">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="input"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.fare}
                  onChange={(e) => setEditForm((f) => ({ ...f, fare: e.target.value }))}
                  className="input w-24"
                />
              </td>
              <td className="px-4 py-3">
                <select
                  value={editForm.vehicle_id ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, vehicle_id: e.target.value ? Number(e.target.value) : null }))}
                  className="input"
                >
                  <option value="">None</option>
                  {vehiclesQuery.data?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration_no}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <PrimaryButton
                    onClick={() => updateMutation.mutate({ id: r.id, payload: editForm })}
                    disabled={updateMutation.isPending}
                  >
                    Save
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setEditingId(null)}>Cancel</SecondaryButton>
                </div>
              </td>
            </tr>
          ) : (
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
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <SecondaryButton
                    onClick={() => {
                      setEditingId(r.id)
                      setEditForm({ name: r.name, fare: r.fare, vehicle_id: r.vehicle_id })
                    }}
                  >
                    Edit
                  </SecondaryButton>
                  <SecondaryButton onClick={() => handleDelete(r.id)} disabled={deleteMutation.isPending}>
                    Delete
                  </SecondaryButton>
                </div>
              </td>
            </tr>
          ),
        )}
      </Table>
    </SectionCard>
  )
}

function RouteStopsSection() {
  const [form, setForm] = useState<RouteStopCreate>({ route_id: 0, name: '', sequence: 0 })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; sequence: number }>({ name: '', sequence: 0 })
  const queryClient = useQueryClient()

  const routesQuery = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get<Route[]>('/transport/routes')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['route-stops'],
    queryFn: async () => (await api.get<RouteStop[]>('/transport/stops')).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['route-stops'] })

  const createMutation = useMutation({
    mutationFn: async (payload: RouteStopCreate) => (await api.post('/transport/stops', payload)).data,
    onSuccess: () => {
      invalidate()
      setForm((f) => ({ ...f, name: '', sequence: 0 }))
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: { name: string; sequence: number } }) =>
      (await api.put(`/transport/stops/${id}`, payload)).data,
    onSuccess: () => {
      invalidate()
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/transport/stops/${id}`),
    onSuccess: invalidate,
  })

  function handleDelete(id: number) {
    if (window.confirm('Delete this stop? This cannot be undone.')) deleteMutation.mutate(id)
  }

  const routeById = new Map((routesQuery.data ?? []).map((r) => [r.id, r.name]))

  return (
    <SectionCard
      title="Route Stops"
      description="Stops along a route, in order."
      action={
        <TableToolbar
          title="Route Stops"
          filename="route-stops"
          rows={data}
          columns={[
            { label: 'Route', value: (s) => routeById.get(s.route_id) ?? `#${s.route_id}` },
            { label: 'Stop', value: (s) => s.name },
            { label: 'Sequence', value: (s) => s.sequence },
          ]}
        />
      }
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!form.route_id) return
          createMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
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
        <Field label="Stop name" required>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" />
        </Field>
        <Field label="Sequence">
          <input
            type="number"
            min={0}
            value={form.sequence ?? 0}
            onChange={(e) => setForm((f) => ({ ...f, sequence: Number(e.target.value) }))}
            className="input"
          />
        </Field>
        <div className="flex items-end">
          <PrimaryButton type="submit" disabled={createMutation.isPending} className="w-full">
            + Add
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={createMutation.error ?? updateMutation.error ?? deleteMutation.error} />
      <Table columns={['Route', 'Stop', 'Sequence', '']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((s) =>
          editingId === s.id ? (
            <tr key={s.id} className="bg-slate-50">
              <td className="px-4 py-3 text-slate-600">{routeById.get(s.route_id) ?? `#${s.route_id}`}</td>
              <td className="px-4 py-3">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="input"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min={0}
                  value={editForm.sequence}
                  onChange={(e) => setEditForm((f) => ({ ...f, sequence: Number(e.target.value) }))}
                  className="input w-20"
                />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <PrimaryButton
                    onClick={() => updateMutation.mutate({ id: s.id, payload: editForm })}
                    disabled={updateMutation.isPending}
                  >
                    Save
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setEditingId(null)}>Cancel</SecondaryButton>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={s.id}>
              <td className="px-4 py-3 text-slate-600">{routeById.get(s.route_id) ?? `#${s.route_id}`}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
              <td className="px-4 py-3 text-slate-600">{s.sequence}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <SecondaryButton
                    onClick={() => {
                      setEditingId(s.id)
                      setEditForm({ name: s.name, sequence: s.sequence })
                    }}
                  >
                    Edit
                  </SecondaryButton>
                  <SecondaryButton onClick={() => handleDelete(s.id)} disabled={deleteMutation.isPending}>
                    Delete
                  </SecondaryButton>
                </div>
              </td>
            </tr>
          ),
        )}
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
    <SectionCard
      title="Allocations"
      description="Assign a student to a route; requires a route with a vehicle assigned."
      action={
        <TableToolbar
          title="Transport Allocations"
          filename="transport-allocations"
          rows={data}
          columns={[
            { label: 'Student', value: (a) => studentById.get(a.student_id) ?? `#${a.student_id}` },
            { label: 'Route', value: (a) => routeById.get(a.route_id) ?? `#${a.route_id}` },
            { label: 'Status', value: (a) => TRANSPORT_ALLOCATION_STATUS[a.status] },
          ]}
        />
      }
    >
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
        <RouteStopsSection />
        <AllocationsSection />
      </div>
    </div>
  )
}
