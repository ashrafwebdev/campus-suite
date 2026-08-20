import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, ErrorNote, Field, PrimaryButton, SecondaryButton, SectionCard, Table, TableToolbar } from '../../components/ui'
import type { Student } from '../../types/api'
import {
  CERTIFICATE_STATUS,
  type Certificate,
  type CertificateIssueCreate,
  type CertificateType,
  type CertificateTypeCreate,
} from '../../types/api'

function CertificateTypesSection() {
  const [form, setForm] = useState<CertificateTypeCreate>({ name: '', requires_graduation: false })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<CertificateTypeCreate>({ name: '', requires_graduation: false })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['certificate-types'],
    queryFn: async () => (await api.get<CertificateType[]>('/certificates/types')).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['certificate-types'] })

  const createMutation = useMutation({
    mutationFn: async (payload: CertificateTypeCreate) => (await api.post('/certificates/types', payload)).data,
    onSuccess: () => {
      invalidate()
      setForm({ name: '', requires_graduation: false })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: CertificateTypeCreate }) =>
      (await api.put(`/certificates/types/${id}`, payload)).data,
    onSuccess: () => {
      invalidate()
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/certificates/types/${id}`),
    onSuccess: invalidate,
  })

  function startEdit(t: CertificateType) {
    setEditingId(t.id)
    setEditForm({ name: t.name, description: t.description ?? '', requires_graduation: t.requires_graduation })
  }

  function handleDelete(id: number) {
    if (window.confirm('Delete this certificate type? This cannot be undone.')) deleteMutation.mutate(id)
  }

  return (
    <SectionCard
      title="Certificate Types"
      description="e.g. Transfer Certificate, Bonafide, Provisional Degree."
      action={
        <TableToolbar
          title="Certificate Types"
          filename="certificate-types"
          rows={data}
          columns={[
            { label: 'Name', value: (t) => t.name },
            { label: 'Requires graduation', value: (t) => (t.requires_graduation ? 'Yes' : 'No') },
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
        <div className="col-span-2">
          <Field label="Name" required>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
              placeholder="e.g. Transfer Certificate"
            />
          </Field>
        </div>
        <Field label="Requires graduation?">
          <input
            type="checkbox"
            checked={form.requires_graduation ?? false}
            onChange={(e) => setForm((f) => ({ ...f, requires_graduation: e.target.checked }))}
            className="mt-2 h-4 w-4"
          />
        </Field>
        <div className="flex items-end">
          <PrimaryButton type="submit" disabled={createMutation.isPending} className="w-full">
            + Add
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={createMutation.error ?? updateMutation.error ?? deleteMutation.error} />
      <Table columns={['Name', 'Requires graduation', '']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((t) =>
          editingId === t.id ? (
            <tr key={t.id} className="bg-slate-50">
              <td className="px-4 py-3">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="input"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={editForm.requires_graduation ?? false}
                  onChange={(e) => setEditForm((f) => ({ ...f, requires_graduation: e.target.checked }))}
                  className="h-4 w-4"
                />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <PrimaryButton
                    onClick={() => updateMutation.mutate({ id: t.id, payload: editForm })}
                    disabled={updateMutation.isPending}
                  >
                    Save
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setEditingId(null)}>Cancel</SecondaryButton>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={t.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
              <td className="px-4 py-3">
                <Badge color={t.requires_graduation ? 'amber' : 'slate'}>{t.requires_graduation ? 'Yes' : 'No'}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <SecondaryButton onClick={() => startEdit(t)}>Edit</SecondaryButton>
                  <SecondaryButton onClick={() => handleDelete(t.id)} disabled={deleteMutation.isPending}>
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

function CertificatesSection() {
  const [form, setForm] = useState<CertificateIssueCreate>({ certificate_type_id: 0, student_id: 0 })
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const queryClient = useQueryClient()

  const typesQuery = useQuery({
    queryKey: ['certificate-types'],
    queryFn: async () => (await api.get<CertificateType[]>('/certificates/types')).data,
  })
  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get<Student[]>('/students')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => (await api.get<Certificate[]>('/certificates')).data,
  })

  const issueMutation = useMutation({
    mutationFn: async (payload: CertificateIssueCreate) => (await api.post('/certificates', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
      setForm({ certificate_type_id: 0, student_id: 0 })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) =>
      (await api.post(`/certificates/${id}/revoke`, { reason })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
      setRevokingId(null)
      setRevokeReason('')
    },
  })

  const typeById = new Map((typesQuery.data ?? []).map((t) => [t.id, t.name]))
  const studentById = new Map((studentsQuery.data ?? []).map((s) => [s.id, s.name]))

  return (
    <SectionCard
      title="Certificates"
      description="Issue a certificate to a student; revoking keeps the record with a reason."
      action={
        <TableToolbar
          title="Certificates"
          filename="certificates"
          rows={data}
          columns={[
            { label: 'Certificate No.', value: (c) => c.certificate_no },
            { label: 'Type', value: (c) => typeById.get(c.certificate_type_id) ?? `#${c.certificate_type_id}` },
            { label: 'Student', value: (c) => studentById.get(c.student_id) ?? `#${c.student_id}` },
            { label: 'Issue date', value: (c) => c.issue_date },
            { label: 'Status', value: (c) => CERTIFICATE_STATUS[c.status] },
          ]}
        />
      }
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!form.certificate_type_id || !form.student_id) return
          issueMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Field label="Type" required>
          <select
            required
            value={form.certificate_type_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, certificate_type_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {typesQuery.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
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
        <div className="flex items-end">
          <PrimaryButton type="submit" disabled={issueMutation.isPending} className="w-full">
            Issue
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={issueMutation.error ?? revokeMutation.error} />
      <Table
        columns={['Certificate No.', 'Type', 'Student', 'Issue date', 'Status', '']}
        isLoading={isLoading}
        error={error}
        isEmpty={data?.length === 0}
      >
        {data?.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.certificate_no}</td>
            <td className="px-4 py-3 text-slate-900">{typeById.get(c.certificate_type_id) ?? `#${c.certificate_type_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{studentById.get(c.student_id) ?? `#${c.student_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{c.issue_date}</td>
            <td className="px-4 py-3">
              <Badge color={c.status === 1 ? 'emerald' : 'red'}>{CERTIFICATE_STATUS[c.status]}</Badge>
            </td>
            <td className="px-4 py-3 text-right">
              {c.status === 1 &&
                (revokingId === c.id ? (
                  <form
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault()
                      revokeMutation.mutate({ id: c.id, reason: revokeReason })
                    }}
                    className="flex justify-end gap-2"
                  >
                    <input
                      required
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      className="input w-40"
                      placeholder="Reason"
                    />
                    <PrimaryButton type="submit" disabled={revokeMutation.isPending}>
                      Confirm
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={() => setRevokingId(null)}>
                      Cancel
                    </SecondaryButton>
                  </form>
                ) : (
                  <SecondaryButton onClick={() => setRevokingId(c.id)}>Revoke</SecondaryButton>
                ))}
            </td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

export function CertificatesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Certificates</h1>
      <p className="mt-1 text-sm text-slate-500">Certificate types, issuance, and revocation.</p>
      <div className="mt-6 space-y-6">
        <CertificateTypesSection />
        <CertificatesSection />
      </div>
    </div>
  )
}
