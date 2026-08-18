import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, ErrorNote, Field, PrimaryButton, SecondaryButton, SectionCard, Table } from '../../components/ui'
import type { Student } from '../../types/api'
import { BOOK_ISSUE_STATUS, type Book, type BookCreate, type BookIssue, type BookIssueCreate } from '../../types/api'

function BooksSection() {
  const [form, setForm] = useState<BookCreate>({ title: '', author: '', total_copies: 1 })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['books'],
    queryFn: async () => (await api.get<Book[]>('/library/books')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: BookCreate) => (await api.post('/library/books', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      setForm({ title: '', author: '', total_copies: 1 })
    },
  })

  return (
    <SectionCard title="Books" description="Available copies is always computed live from outstanding issues.">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          createMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-4 gap-2"
      >
        <Field label="Title" required>
          <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" />
        </Field>
        <Field label="Author">
          <input value={form.author ?? ''} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} className="input" />
        </Field>
        <Field label="Total copies">
          <input
            type="number"
            min={1}
            value={form.total_copies}
            onChange={(e) => setForm((f) => ({ ...f, total_copies: Number(e.target.value) }))}
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
      <Table columns={['Title', 'Author', 'Available / Total']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((b) => (
          <tr key={b.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{b.title}</td>
            <td className="px-4 py-3 text-slate-600">{b.author ?? '—'}</td>
            <td className="px-4 py-3">
              <Badge color={b.available_copies === 0 ? 'red' : 'emerald'}>
                {b.available_copies} / {b.total_copies}
              </Badge>
            </td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function IssuesSection() {
  const [form, setForm] = useState<BookIssueCreate>({ book_id: 0, student_id: 0, due_date: '' })
  const queryClient = useQueryClient()

  const booksQuery = useQuery({
    queryKey: ['books'],
    queryFn: async () => (await api.get<Book[]>('/library/books')).data,
  })
  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get<Student[]>('/students')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['book-issues'],
    queryFn: async () => (await api.get<BookIssue[]>('/library/issues')).data,
  })

  const issueMutation = useMutation({
    mutationFn: async (payload: BookIssueCreate) => (await api.post('/library/issues', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-issues'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      setForm({ book_id: 0, student_id: 0, due_date: '' })
    },
  })

  const returnMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/library/issues/${id}/return`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-issues'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })

  const lostMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/library/issues/${id}/lost`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-issues'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })

  const bookById = new Map((booksQuery.data ?? []).map((b) => [b.id, b.title]))
  const studentById = new Map((studentsQuery.data ?? []).map((s) => [s.id, s.name]))
  const statusColor = { 1: 'blue', 2: 'emerald', 3: 'red' } as const

  return (
    <SectionCard title="Issues" description="Issuing checks availability; returning after the due date charges a fine automatically.">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!form.book_id || !form.student_id) return
          issueMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-4 gap-2"
      >
        <Field label="Book" required>
          <select
            required
            value={form.book_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, book_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {booksQuery.data?.map((b) => (
              <option key={b.id} value={b.id} disabled={b.available_copies === 0}>
                {b.title} ({b.available_copies} available)
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
          <PrimaryButton type="submit" disabled={issueMutation.isPending} className="w-full">
            Issue
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={issueMutation.error ?? returnMutation.error ?? lostMutation.error} />
      <Table
        columns={['Book', 'Student', 'Due date', 'Status', 'Fine', '']}
        isLoading={isLoading}
        error={error}
        isEmpty={data?.length === 0}
      >
        {data?.map((issue) => (
          <tr key={issue.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{bookById.get(issue.book_id) ?? `#${issue.book_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{studentById.get(issue.student_id) ?? `#${issue.student_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{issue.due_date}</td>
            <td className="px-4 py-3">
              <Badge color={statusColor[issue.status as 1 | 2 | 3]}>{BOOK_ISSUE_STATUS[issue.status]}</Badge>
            </td>
            <td className="px-4 py-3 text-slate-600">{issue.fine_amount !== '0.00' ? issue.fine_amount : '—'}</td>
            <td className="px-4 py-3 text-right">
              {issue.status === 1 && (
                <div className="flex justify-end gap-2">
                  <SecondaryButton onClick={() => returnMutation.mutate(issue.id)} disabled={returnMutation.isPending}>
                    Return
                  </SecondaryButton>
                  <SecondaryButton onClick={() => lostMutation.mutate(issue.id)} disabled={lostMutation.isPending}>
                    Mark lost
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

export function LibraryPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Library</h1>
      <p className="mt-1 text-sm text-slate-500">Books, issues, returns, and lost-book tracking.</p>
      <div className="mt-6 space-y-6">
        <BooksSection />
        <IssuesSection />
      </div>
    </div>
  )
}
