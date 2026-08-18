import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, ErrorNote, Field, PrimaryButton, SecondaryButton, SectionCard, Table } from '../../components/ui'
import {
  EMPLOYEE_STATUS,
  LEAVE_STATUS,
  LEAVE_TYPE,
  PAYROLL_STATUS,
  type Employee,
  type EmployeeCreate,
  type LeaveRequest,
  type LeaveRequestCreate,
  type Payroll,
  type PayrollGenerate,
} from '../../types/api'

function EmployeesSection() {
  const [form, setForm] = useState<EmployeeCreate>({ name: '', designation: '' })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get<Employee[]>('/hr/employees')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: EmployeeCreate) => (await api.post('/hr/employees', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setForm({ name: '', designation: '' })
    },
  })

  return (
    <SectionCard title="Employees" description="Teaching and non-teaching staff.">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          createMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-4 gap-2"
      >
        <Field label="Name" required>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" />
        </Field>
        <Field label="Designation" required>
          <input
            required
            value={form.designation}
            onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
            className="input"
            placeholder="e.g. Teacher"
          />
        </Field>
        <Field label="Basic salary">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.basic_salary ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, basic_salary: e.target.value }))}
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
      <Table
        columns={['Employee No.', 'Name', 'Designation', 'Basic Salary', 'Status']}
        isLoading={isLoading}
        error={error}
        isEmpty={data?.length === 0}
      >
        {data?.map((e) => (
          <tr key={e.id}>
            <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.employee_no}</td>
            <td className="px-4 py-3 font-medium text-slate-900">{e.name}</td>
            <td className="px-4 py-3 text-slate-600">{e.designation}</td>
            <td className="px-4 py-3 text-slate-600">{e.basic_salary}</td>
            <td className="px-4 py-3">
              <Badge color={e.status === 1 ? 'emerald' : 'slate'}>{EMPLOYEE_STATUS[e.status]}</Badge>
            </td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function LeaveRequestsSection() {
  const [form, setForm] = useState<LeaveRequestCreate>({ employee_id: 0, start_date: '', end_date: '' })
  const queryClient = useQueryClient()

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get<Employee[]>('/hr/employees')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => (await api.get<LeaveRequest[]>('/hr/leaves')).data,
  })

  const requestMutation = useMutation({
    mutationFn: async (payload: LeaveRequestCreate) => (await api.post('/hr/leaves', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      setForm({ employee_id: 0, start_date: '', end_date: '' })
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/hr/leaves/${id}/approve`, {})).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave-requests'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/hr/leaves/${id}/reject`, {})).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave-requests'] }),
  })

  const employeeById = new Map((employeesQuery.data ?? []).map((e) => [e.id, e.name]))
  const statusColor = { 1: 'amber', 2: 'emerald', 3: 'red' } as const

  return (
    <SectionCard title="Leave Requests" description="Approve or reject pending requests.">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!form.employee_id) return
          requestMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-5 gap-2"
      >
        <Field label="Employee" required>
          <select
            required
            value={form.employee_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, employee_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {employeesQuery.data?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select
            value={form.leave_type ?? 1}
            onChange={(e) => setForm((f) => ({ ...f, leave_type: Number(e.target.value) }))}
            className="input"
          >
            {Object.entries(LEAVE_TYPE).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start date" required>
          <input
            required
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="End date" required>
          <input
            required
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            className="input"
          />
        </Field>
        <div className="flex items-end">
          <PrimaryButton type="submit" disabled={requestMutation.isPending} className="w-full">
            Request
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={requestMutation.error ?? approveMutation.error ?? rejectMutation.error} />
      <Table
        columns={['Employee', 'Type', 'Dates', 'Status', '']}
        isLoading={isLoading}
        error={error}
        isEmpty={data?.length === 0}
      >
        {data?.map((l) => (
          <tr key={l.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{employeeById.get(l.employee_id) ?? `#${l.employee_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{LEAVE_TYPE[l.leave_type]}</td>
            <td className="px-4 py-3 text-slate-600">
              {l.start_date} → {l.end_date}
            </td>
            <td className="px-4 py-3">
              <Badge color={statusColor[l.status as 1 | 2 | 3]}>{LEAVE_STATUS[l.status]}</Badge>
            </td>
            <td className="px-4 py-3 text-right">
              {l.status === 1 && (
                <div className="flex justify-end gap-2">
                  <SecondaryButton onClick={() => approveMutation.mutate(l.id)} disabled={approveMutation.isPending}>
                    Approve
                  </SecondaryButton>
                  <SecondaryButton onClick={() => rejectMutation.mutate(l.id)} disabled={rejectMutation.isPending}>
                    Reject
                  </SecondaryButton>
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function PayrollSection() {
  const now = new Date()
  const [form, setForm] = useState<PayrollGenerate>({
    employee_id: 0,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  })
  const queryClient = useQueryClient()

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get<Employee[]>('/hr/employees')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['payroll'],
    queryFn: async () => (await api.get<Payroll[]>('/hr/payroll')).data,
  })

  const generateMutation = useMutation({
    mutationFn: async (payload: PayrollGenerate) => (await api.post('/hr/payroll', payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  })

  const payMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/hr/payroll/${id}/pay`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  })

  const employeeById = new Map((employeesQuery.data ?? []).map((e) => [e.id, e.name]))

  return (
    <SectionCard title="Payroll" description="Generate a month's payroll from the employee's basic salary, then mark it paid.">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!form.employee_id) return
          generateMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-5 gap-2"
      >
        <Field label="Employee" required>
          <select
            required
            value={form.employee_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, employee_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {employeesQuery.data?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Month" required>
          <input
            required
            type="number"
            min={1}
            max={12}
            value={form.month}
            onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
            className="input"
          />
        </Field>
        <Field label="Year" required>
          <input
            required
            type="number"
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
            className="input"
          />
        </Field>
        <Field label="Allowances">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.allowances ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, allowances: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Deductions">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.deductions ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))}
            className="input"
          />
        </Field>
        <div className="col-span-5 flex justify-end">
          <PrimaryButton type="submit" disabled={generateMutation.isPending}>
            Generate
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={generateMutation.error ?? payMutation.error} />
      <Table
        columns={['Employee', 'Period', 'Net Salary', 'Status', '']}
        isLoading={isLoading}
        error={error}
        isEmpty={data?.length === 0}
      >
        {data?.map((p) => (
          <tr key={p.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{employeeById.get(p.employee_id) ?? `#${p.employee_id}`}</td>
            <td className="px-4 py-3 text-slate-600">
              {p.month}/{p.year}
            </td>
            <td className="px-4 py-3 text-slate-600">{p.net_salary}</td>
            <td className="px-4 py-3">
              <Badge color={p.status === 2 ? 'emerald' : 'amber'}>{PAYROLL_STATUS[p.status]}</Badge>
            </td>
            <td className="px-4 py-3 text-right">
              {p.status === 1 && (
                <SecondaryButton onClick={() => payMutation.mutate(p.id)} disabled={payMutation.isPending}>
                  Mark paid
                </SecondaryButton>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

export function HRPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">HR & Payroll</h1>
      <p className="mt-1 text-sm text-slate-500">Employees, leave requests, and payroll.</p>
      <div className="mt-6 space-y-6">
        <EmployeesSection />
        <LeaveRequestsSection />
        <PayrollSection />
      </div>
    </div>
  )
}
