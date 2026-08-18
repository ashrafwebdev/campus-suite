import { Fragment, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, ErrorNote, Field, PrimaryButton, SecondaryButton, SectionCard, Table, TableToolbar } from '../../components/ui'
import type { Student } from '../../types/api'
import {
  INVOICE_STATUS,
  PAYMENT_METHOD,
  type FeeHead,
  type FeeHeadCreate,
  type Invoice,
  type InvoiceCreate,
  type PaymentCreate,
} from '../../types/api'

function FeeHeadsSection() {
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['fee-heads'],
    queryFn: async () => (await api.get<FeeHead[]>('/fees/heads')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: FeeHeadCreate) => (await api.post('/fees/heads', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] })
      setName('')
    },
  })

  return (
    <SectionCard
      title="Fee Heads"
      description="Categories, e.g. Tuition Fee, Exam Fee, Transport Fee."
      action={
        <TableToolbar title="Fee Heads" filename="fee-heads" rows={data} columns={[{ label: 'Name', value: (fh) => fh.name }]} />
      }
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          createMutation.mutate({ name })
        }}
        className="mb-4 flex items-end gap-2"
      >
        <div className="flex-1">
          <Field label="Name" required>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Tuition Fee" />
          </Field>
        </div>
        <PrimaryButton type="submit" disabled={createMutation.isPending}>
          + Add
        </PrimaryButton>
      </form>
      <ErrorNote error={createMutation.error} />
      <Table columns={['Name']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((fh) => (
          <tr key={fh.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{fh.name}</td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function InvoicesSection() {
  const [form, setForm] = useState<InvoiceCreate>({ student_id: 0, fee_head_id: 0, amount: '', due_date: '' })
  const [payingId, setPayingId] = useState<number | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState(1)
  const queryClient = useQueryClient()

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get<Student[]>('/students')).data,
  })
  const feeHeadsQuery = useQuery({
    queryKey: ['fee-heads'],
    queryFn: async () => (await api.get<FeeHead[]>('/fees/heads')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => (await api.get<Invoice[]>('/fees/invoices')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: InvoiceCreate) => (await api.post('/fees/invoices', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setForm({ student_id: 0, fee_head_id: 0, amount: '', due_date: '' })
    },
  })

  const payMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: PaymentCreate }) =>
      (await api.post(`/fees/invoices/${id}/payments`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setPayingId(null)
      setPayAmount('')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/fees/invoices/${id}/cancel`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const studentById = new Map((studentsQuery.data ?? []).map((s) => [s.id, s.name]))
  const feeHeadById = new Map((feeHeadsQuery.data ?? []).map((f) => [f.id, f.name]))
  const statusColor = { 1: 'amber', 2: 'blue', 3: 'emerald', 4: 'slate' } as const

  return (
    <SectionCard
      title="Invoices"
      description="Balance is always computed live from recorded payments."
      action={
        <TableToolbar
          title="Invoices"
          filename="invoices"
          rows={data}
          columns={[
            { label: 'Invoice', value: (inv) => inv.invoice_no },
            { label: 'Student', value: (inv) => studentById.get(inv.student_id) ?? `#${inv.student_id}` },
            { label: 'Fee Head', value: (inv) => feeHeadById.get(inv.fee_head_id) ?? `#${inv.fee_head_id}` },
            { label: 'Amount', value: (inv) => inv.amount },
            { label: 'Balance', value: (inv) => inv.balance },
            { label: 'Status', value: (inv) => INVOICE_STATUS[inv.status] },
          ]}
        />
      }
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!form.student_id || !form.fee_head_id) return
          createMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
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
        <Field label="Fee head" required>
          <select
            required
            value={form.fee_head_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, fee_head_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {feeHeadsQuery.data?.map((fh) => (
              <option key={fh.id} value={fh.id}>
                {fh.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount" required>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Due date" required>
          <input
            required
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            className="input"
          />
        </Field>
        <div className="flex items-end">
          <PrimaryButton type="submit" disabled={createMutation.isPending} className="w-full">
            + Issue
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={createMutation.error ?? payMutation.error ?? cancelMutation.error} />
      <Table
        columns={['Invoice', 'Student', 'Fee Head', 'Amount', 'Balance', 'Status', '']}
        isLoading={isLoading}
        error={error}
        isEmpty={data?.length === 0}
      >
        {data?.map((inv) => (
          <Fragment key={inv.id}>
            <tr>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{inv.invoice_no}</td>
              <td className="px-4 py-3 text-slate-900">{studentById.get(inv.student_id) ?? `#${inv.student_id}`}</td>
              <td className="px-4 py-3 text-slate-600">{feeHeadById.get(inv.fee_head_id) ?? `#${inv.fee_head_id}`}</td>
              <td className="px-4 py-3 text-slate-600">{inv.amount}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{inv.balance}</td>
              <td className="px-4 py-3">
                <Badge color={statusColor[inv.status as 1 | 2 | 3 | 4]}>{INVOICE_STATUS[inv.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                {(inv.status === 1 || inv.status === 2) && (
                  <div className="flex justify-end gap-2">
                    <SecondaryButton
                      onClick={() => {
                        setPayingId(payingId === inv.id ? null : inv.id)
                        setPayAmount(inv.balance)
                      }}
                    >
                      Record payment
                    </SecondaryButton>
                    {inv.status === 1 && (
                      <SecondaryButton onClick={() => cancelMutation.mutate(inv.id)} disabled={cancelMutation.isPending}>
                        Cancel
                      </SecondaryButton>
                    )}
                  </div>
                )}
              </td>
            </tr>
            {payingId === inv.id && (
              <tr className="bg-slate-50">
                <td colSpan={7} className="px-4 py-3">
                  <form
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault()
                      payMutation.mutate({ id: inv.id, payload: { amount: payAmount, method: payMethod } })
                    }}
                    className="flex items-end gap-2"
                  >
                    <Field label="Amount">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="input w-32"
                      />
                    </Field>
                    <Field label="Method">
                      <select value={payMethod} onChange={(e) => setPayMethod(Number(e.target.value))} className="input">
                        {Object.entries(PAYMENT_METHOD).map(([v, label]) => (
                          <option key={v} value={v}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <PrimaryButton type="submit" disabled={payMutation.isPending}>
                      Confirm payment
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={() => setPayingId(null)}>
                      Cancel
                    </SecondaryButton>
                  </form>
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </Table>
    </SectionCard>
  )
}

export function FeesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Fees & Finance</h1>
      <p className="mt-1 text-sm text-slate-500">Fee heads, invoices, and payments.</p>
      <div className="mt-6 space-y-6">
        <FeeHeadsSection />
        <InvoicesSection />
      </div>
    </div>
  )
}
