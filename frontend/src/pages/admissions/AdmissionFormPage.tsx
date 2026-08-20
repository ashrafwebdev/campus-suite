import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { api, apiErrorMessage } from '../../lib/api'
import { ADMISSION_SOURCE, type AdmissionEnquiry, type AdmissionEnquiryCreate } from '../../types/api'

const emptyForm: AdmissionEnquiryCreate = {
  name: '',
  phone_no: '',
  email: '',
  guardian_name: '',
  guardian_phone_no: '',
  address: '',
  source: 1,
  note: '',
}

function toForm(enquiry: AdmissionEnquiry): AdmissionEnquiryCreate {
  return {
    name: enquiry.name,
    phone_no: enquiry.phone_no,
    email: enquiry.email ?? '',
    guardian_name: enquiry.guardian_name ?? '',
    guardian_phone_no: enquiry.guardian_phone_no ?? '',
    address: enquiry.address ?? '',
    class_id: enquiry.class_id,
    source: enquiry.source,
    note: enquiry.note ?? '',
  }
}

export function AdmissionFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [form, setForm] = useState<AdmissionEnquiryCreate>(emptyForm)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const enquiryQuery = useQuery({
    queryKey: ['admissions', id],
    queryFn: async () => (await api.get<AdmissionEnquiry>(`/admissions/${id}`)).data,
    enabled: isEditing,
  })

  useEffect(() => {
    if (enquiryQuery.data) setForm(toForm(enquiryQuery.data))
  }, [enquiryQuery.data])

  const createMutation = useMutation({
    mutationFn: async (payload: AdmissionEnquiryCreate) =>
      (await api.post('/admissions', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      navigate('/admissions')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: AdmissionEnquiryCreate) => (await api.put(`/admissions/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      navigate('/admissions')
    },
  })

  const saveMutation = isEditing ? updateMutation : createMutation

  function update<K extends keyof AdmissionEnquiryCreate>(key: K, value: AdmissionEnquiryCreate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {isEditing ? 'Edit Admission Enquiry' : 'New Admission Enquiry'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {isEditing ? 'Update this enquiry’s details.' : 'Capture a lead from advertisement, website, referral, or a walk-in visit.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Phone" required>
            <input
              required
              value={form.phone_no}
              onChange={(e) => update('phone_no', e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => update('email', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Source">
            <select
              value={form.source}
              onChange={(e) => update('source', Number(e.target.value))}
              className="input"
            >
              {Object.entries(ADMISSION_SOURCE).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
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

        <Field label="Address">
          <textarea
            value={form.address ?? ''}
            onChange={(e) => update('address', e.target.value)}
            className="input"
            rows={2}
          />
        </Field>

        <Field label="Note">
          <textarea
            value={form.note ?? ''}
            onChange={(e) => update('note', e.target.value)}
            className="input"
            rows={2}
          />
        </Field>

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
            {saveMutation.isPending ? 'Saving…' : 'Save enquiry'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admissions')}
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
