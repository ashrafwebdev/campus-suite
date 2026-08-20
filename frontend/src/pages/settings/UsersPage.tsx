import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, ErrorNote, Field, PrimaryButton, SecondaryButton, SectionCard, Table } from '../../components/ui'
import type { Role, User, UserCreate, UserUpdate } from '../../types/api'

const emptyForm: UserCreate = { name: '', email: '', password: '', role_id: null }

export function UsersPage() {
  const [form, setForm] = useState<UserCreate>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<UserUpdate>({})
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<User[]>('/users')).data,
  })

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get<Role[]>('/roles')).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const createMutation = useMutation({
    mutationFn: async (payload: UserCreate) => (await api.post('/users', payload)).data,
    onSuccess: () => {
      invalidate()
      setForm(emptyForm)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UserUpdate }) =>
      (await api.put(`/users/${id}`, payload)).data,
    onSuccess: () => {
      invalidate()
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/users/${id}`),
    onSuccess: invalidate,
  })

  function startEdit(u: User) {
    setEditingId(u.id)
    setEditForm({ name: u.name, email: u.email, role_id: u.role?.id ?? null, is_active: u.is_active })
  }

  function handleDelete(id: number) {
    if (window.confirm('Delete this user? They will no longer be able to log in.')) deleteMutation.mutate(id)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Staff Logins</h1>
      <p className="mt-1 text-sm text-slate-500">Accounts that can sign in to this system, and the role each one has.</p>

      <div className="mt-6 space-y-6">
        <SectionCard title="Users" description="Create a login for a staff member and assign them a role.">
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              createMutation.mutate(form)
            }}
            className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
          >
            <Field label="Name" required>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" />
            </Field>
            <Field label="Email" required>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input"
              />
            </Field>
            <Field label="Password" required>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="input"
              />
            </Field>
            <Field label="Role">
              <select
                value={form.role_id ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value ? Number(e.target.value) : null }))}
                className="input"
              >
                <option value="">No role</option>
                {rolesQuery.data?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <PrimaryButton type="submit" disabled={createMutation.isPending} className="w-full">
                + Add user
              </PrimaryButton>
            </div>
          </form>
          <ErrorNote error={createMutation.error ?? updateMutation.error ?? deleteMutation.error} />
          <Table columns={['Name', 'Email', 'Role', 'Status', '']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
            {data?.map((u) =>
              editingId === u.id ? (
                <tr key={u.id} className="bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                      value={editForm.name ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="input"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="email"
                      value={editForm.email ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className="input"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="password"
                      placeholder="Leave blank to keep"
                      value={editForm.password ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value || undefined }))}
                      className="input mb-1"
                    />
                    <select
                      value={editForm.role_id ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, role_id: e.target.value ? Number(e.target.value) : null }))}
                      className="input"
                    >
                      <option value="">No role</option>
                      {rolesQuery.data?.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={editForm.is_active === false ? 'inactive' : 'active'}
                      onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.value === 'active' }))}
                      className="input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <PrimaryButton
                        onClick={() => updateMutation.mutate({ id: u.id, payload: editForm })}
                        disabled={updateMutation.isPending}
                      >
                        Save
                      </PrimaryButton>
                      <SecondaryButton onClick={() => setEditingId(null)}>Cancel</SecondaryButton>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.role?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge color={u.is_active ? 'emerald' : 'slate'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <SecondaryButton onClick={() => startEdit(u)}>Edit</SecondaryButton>
                      <SecondaryButton onClick={() => handleDelete(u.id)} disabled={deleteMutation.isPending}>
                        Delete
                      </SecondaryButton>
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
