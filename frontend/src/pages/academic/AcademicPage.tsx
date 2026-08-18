import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Field, SectionCard, Table, PrimaryButton, ErrorNote } from '../../components/ui'
import { SUBJECT_TYPE, type SchoolClass, type SchoolClassCreate, type Subject, type SubjectCreate } from '../../types/api'

function ClassesSection() {
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<SchoolClass[]>('/academic/classes')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: SchoolClassCreate) => (await api.post('/academic/classes', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setName('')
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    createMutation.mutate({ name })
  }

  return (
    <SectionCard title="Classes" description="Grades / year levels, e.g. Class 5, Grade 10.">
      <form onSubmit={handleSubmit} className="mb-4 flex items-end gap-2">
        <div className="flex-1">
          <Field label="Class name" required>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Class 5" />
          </Field>
        </div>
        <PrimaryButton type="submit" disabled={createMutation.isPending}>
          + Add
        </PrimaryButton>
      </form>
      <ErrorNote error={createMutation.error} />
      <Table columns={['Name', 'Order']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
            <td className="px-4 py-3 text-slate-600">{c.order}</td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function SubjectsSection() {
  const [form, setForm] = useState<SubjectCreate>({ name: '', code: '', subject_type: 1, class_id: 0 })
  const queryClient = useQueryClient()

  const classesQuery = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<SchoolClass[]>('/academic/classes')).data,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => (await api.get<Subject[]>('/academic/subjects')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: SubjectCreate) => (await api.post('/academic/subjects', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setForm({ name: '', code: '', subject_type: 1, class_id: 0 })
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.class_id) return
    createMutation.mutate(form)
  }

  const classById = new Map((classesQuery.data ?? []).map((c) => [c.id, c.name]))

  return (
    <SectionCard title="Subjects" description="Belong to a class; used by exam rules.">
      <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-4 gap-2">
        <Field label="Name" required>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" />
        </Field>
        <Field label="Code" required>
          <input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="input" />
        </Field>
        <Field label="Class" required>
          <select
            required
            value={form.class_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, class_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {classesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
      <Table columns={['Name', 'Code', 'Class', 'Type']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((s) => (
          <tr key={s.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
            <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.code}</td>
            <td className="px-4 py-3 text-slate-600">{classById.get(s.class_id) ?? `#${s.class_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{SUBJECT_TYPE[s.subject_type]}</td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

export function AcademicPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Academic Structure</h1>
      <p className="mt-1 text-sm text-slate-500">Classes and subjects, used across enrollment and exams.</p>
      <div className="mt-6 space-y-6">
        <ClassesSection />
        <SubjectsSection />
      </div>
    </div>
  )
}
