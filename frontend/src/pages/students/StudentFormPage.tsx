import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { api, apiErrorMessage } from '../../lib/api'
import { RESIDENCY_TYPE, type SchoolClass, type Student, type StudentCreate } from '../../types/api'

const emptyForm: StudentCreate = {
  name: '',
  phone_no: '',
  email: '',
  guardian_name: '',
  guardian_phone_no: '',
  permanent_address: '',
  residency_type: 1,
  hostel_room_no: '',
  class_id: null,
}

function toForm(student: Student): StudentCreate {
  return {
    name: student.name,
    phone_no: student.phone_no ?? '',
    email: student.email ?? '',
    guardian_name: student.guardian_name ?? '',
    guardian_phone_no: student.guardian_phone_no ?? '',
    permanent_address: student.permanent_address ?? '',
    residency_type: student.residency_type,
    hostel_room_no: student.hostel_room_no ?? '',
    class_id: student.class_id,
  }
}

export function StudentFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [form, setForm] = useState<StudentCreate>(emptyForm)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const classesQuery = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<SchoolClass[]>('/academic/classes')).data,
  })

  const studentQuery = useQuery({
    queryKey: ['students', id],
    queryFn: async () => (await api.get<Student>(`/students/${id}`)).data,
    enabled: isEditing,
  })

  useEffect(() => {
    if (studentQuery.data) setForm(toForm(studentQuery.data))
  }, [studentQuery.data])

  const createMutation = useMutation({
    mutationFn: async (payload: StudentCreate) => (await api.post('/students', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      navigate('/students')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: StudentCreate) => (await api.put(`/students/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      navigate('/students')
    },
  })

  const saveMutation = isEditing ? updateMutation : createMutation

  function update<K extends keyof StudentCreate>(key: K, value: StudentCreate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  const isHosteller = form.residency_type === 2

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {isEditing ? 'Edit Student' : 'Enroll Student'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {isEditing ? 'Update this student’s details.' : 'Add a student directly, day scholar or hosteller.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Name" required>
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} className="input" />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input value={form.phone_no ?? ''} onChange={(e) => update('phone_no', e.target.value)} className="input" />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => update('email', e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Guardian name">
            <input
              value={form.guardian_name ?? ''}
              onChange={(e) => update('guardian_name', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Guardian phone">
            <input
              value={form.guardian_phone_no ?? ''}
              onChange={(e) => update('guardian_phone_no', e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Permanent address">
          <textarea
            value={form.permanent_address ?? ''}
            onChange={(e) => update('permanent_address', e.target.value)}
            className="input"
            rows={2}
          />
        </Field>

        <Field label="Class">
          <select
            value={form.class_id ?? ''}
            onChange={(e) => update('class_id', e.target.value ? Number(e.target.value) : null)}
            className="input"
          >
            <option value="">Unassigned</option>
            {classesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Residency">
            <select
              value={form.residency_type}
              onChange={(e) => update('residency_type', Number(e.target.value))}
              className="input"
            >
              {Object.entries(RESIDENCY_TYPE).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          {isHosteller && (
            <Field label="Hostel room no.">
              <input
                value={form.hostel_room_no ?? ''}
                onChange={(e) => update('hostel_room_no', e.target.value)}
                className="input"
              />
            </Field>
          )}
        </div>

        {saveMutation.isError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {apiErrorMessage(saveMutation.error)}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saveMutation.isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Enroll student'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}
