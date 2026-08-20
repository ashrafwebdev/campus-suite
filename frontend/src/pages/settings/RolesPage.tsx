import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { ErrorNote, Field, PrimaryButton, SecondaryButton, SectionCard, Table } from '../../components/ui'
import type { Permission, Role, RoleCreate } from '../../types/api'

function PermissionChecklist({
  permissions,
  selected,
  onChange,
}: {
  permissions: Permission[]
  selected: number[]
  onChange: (ids: number[]) => void
}) {
  const groups = new Map<string, Permission[]>()
  for (const p of permissions) {
    if (!groups.has(p.group)) groups.set(p.group, [])
    groups.get(p.group)!.push(p)
  }

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...groups.entries()].map(([group, perms]) => (
        <div key={group} className="rounded-md border border-slate-200 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</div>
          <div className="space-y-1">
            {perms.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4" />
                {p.name}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function RolesPage() {
  const [form, setForm] = useState<RoleCreate>({ name: '', permission_ids: [] })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<RoleCreate>({ name: '', permission_ids: [] })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get<Role[]>('/roles')).data,
  })

  const permissionsQuery = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => (await api.get<Permission[]>('/roles/permissions')).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['roles'] })

  const createMutation = useMutation({
    mutationFn: async (payload: RoleCreate) => (await api.post('/roles', payload)).data,
    onSuccess: () => {
      invalidate()
      setForm({ name: '', permission_ids: [] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: RoleCreate }) => (await api.put(`/roles/${id}`, payload)).data,
    onSuccess: () => {
      invalidate()
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/roles/${id}`),
    onSuccess: invalidate,
  })

  function startEdit(r: Role) {
    setEditingId(r.id)
    setEditForm({ name: r.name, permission_ids: r.permissions.map((p) => p.id) })
  }

  function handleDelete(id: number) {
    if (window.confirm('Delete this role? Users with this role will lose their permissions.')) deleteMutation.mutate(id)
  }

  const permissions = permissionsQuery.data ?? []

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Roles & Permissions</h1>
      <p className="mt-1 text-sm text-slate-500">What each role is allowed to see and do.</p>

      <div className="mt-6 space-y-6">
        <SectionCard title="Add a role" description="Pick a name and the permissions this role should have.">
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              createMutation.mutate(form)
            }}
            className="space-y-4"
          >
            <div className="max-w-xs">
              <Field label="Role name" required>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" />
              </Field>
            </div>
            <PermissionChecklist
              permissions={permissions}
              selected={form.permission_ids ?? []}
              onChange={(ids) => setForm((f) => ({ ...f, permission_ids: ids }))}
            />
            <PrimaryButton type="submit" disabled={createMutation.isPending}>
              + Add role
            </PrimaryButton>
          </form>
          <ErrorNote error={createMutation.error} />
        </SectionCard>

        <SectionCard title="Roles">
          <ErrorNote error={updateMutation.error ?? deleteMutation.error} />
          <Table columns={['Name', 'Permissions', '']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
            {data?.map((r) =>
              editingId === r.id ? (
                <tr key={r.id} className="bg-slate-50">
                  <td colSpan={3} className="px-4 py-4">
                    <div className="max-w-xs">
                      <Field label="Role name" required>
                        <input
                          required
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="input"
                        />
                      </Field>
                    </div>
                    <div className="mt-4">
                      <PermissionChecklist
                        permissions={permissions}
                        selected={editForm.permission_ids ?? []}
                        onChange={(ids) => setEditForm((f) => ({ ...f, permission_ids: ids }))}
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
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
                  <td className="px-4 py-3 text-slate-600">
                    {r.permissions.length} of {permissions.length}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <SecondaryButton onClick={() => startEdit(r)}>Edit</SecondaryButton>
                      {r.deletable && (
                        <SecondaryButton onClick={() => handleDelete(r.id)} disabled={deleteMutation.isPending}>
                          Delete
                        </SecondaryButton>
                      )}
                    </div>
                  </td>
                </tr>
              ),
            )}
          </Table>
        </SectionCard>
      </div>
    </div>
  )
}
