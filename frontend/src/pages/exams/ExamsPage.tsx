import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, ErrorNote, Field, PrimaryButton, SectionCard, Table, TableToolbar } from '../../components/ui'
import type { SchoolClass, Student, Subject } from '../../types/api'
import {
  type Exam,
  type ExamCreate,
  type ExamRule,
  type ExamRuleCreate,
  type GradeScale,
  type GradeScaleCreate,
  type MarkCreate,
  type Result,
} from '../../types/api'

function ExamsSection() {
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => (await api.get<Exam[]>('/exams')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: ExamCreate) => (await api.post('/exams', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      setName('')
    },
  })

  return (
    <SectionCard
      title="Exams"
      description="e.g. Mid Term, Final Term."
      action={<TableToolbar title="Exams" filename="exams" rows={data} columns={[{ label: 'Name', value: (e) => e.name }]} />}
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
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </Field>
        </div>
        <PrimaryButton type="submit" disabled={createMutation.isPending}>
          + Add
        </PrimaryButton>
      </form>
      <ErrorNote error={createMutation.error} />
      <Table columns={['Name']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((e) => (
          <tr key={e.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{e.name}</td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function GradeScalesSection() {
  const [form, setForm] = useState<GradeScaleCreate>({ name: '', min_percent: '', max_percent: '', grade_point: '' })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['grade-scales'],
    queryFn: async () => (await api.get<GradeScale[]>('/exams/grade-scales')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: GradeScaleCreate) => (await api.post('/exams/grade-scales', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-scales'] })
      setForm({ name: '', min_percent: '', max_percent: '', grade_point: '' })
    },
  })

  return (
    <SectionCard
      title="Grade Scales"
      description="Percentage bands mapped to a letter grade and GPA point."
      action={
        <TableToolbar
          title="Grade Scales"
          filename="grade-scales"
          rows={data}
          columns={[
            { label: 'Grade', value: (g) => g.name },
            { label: 'Min %', value: (g) => g.min_percent },
            { label: 'Max %', value: (g) => g.max_percent },
            { label: 'GPA', value: (g) => g.grade_point },
          ]}
        />
      }
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          createMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
      >
        <Field label="Grade" required>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" placeholder="A+" />
        </Field>
        <Field label="Min %" required>
          <input
            required
            type="number"
            value={form.min_percent}
            onChange={(e) => setForm((f) => ({ ...f, min_percent: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Max %" required>
          <input
            required
            type="number"
            value={form.max_percent}
            onChange={(e) => setForm((f) => ({ ...f, max_percent: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="GPA point" required>
          <input
            required
            type="number"
            step="0.01"
            value={form.grade_point}
            onChange={(e) => setForm((f) => ({ ...f, grade_point: e.target.value }))}
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
      <Table columns={['Grade', 'Range', 'GPA']} isLoading={isLoading} error={error} isEmpty={data?.length === 0}>
        {data?.map((g) => (
          <tr key={g.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{g.name}</td>
            <td className="px-4 py-3 text-slate-600">
              {g.min_percent}% – {g.max_percent}%
            </td>
            <td className="px-4 py-3 text-slate-600">{g.grade_point}</td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function ExamRulesSection() {
  const [form, setForm] = useState<ExamRuleCreate>({ exam_id: 0, class_id: 0, subject_id: 0, total_marks: '100', pass_marks: '33' })
  const queryClient = useQueryClient()

  const examsQuery = useQuery({ queryKey: ['exams'], queryFn: async () => (await api.get<Exam[]>('/exams')).data })
  const classesQuery = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<SchoolClass[]>('/academic/classes')).data,
  })
  const subjectsQuery = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => (await api.get<Subject[]>('/academic/subjects')).data,
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['exam-rules'],
    queryFn: async () => (await api.get<ExamRule[]>('/exams/rules')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: ExamRuleCreate) => (await api.post('/exams/rules', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-rules'] })
      setForm((f) => ({ ...f, subject_id: 0 }))
    },
  })

  const examById = new Map((examsQuery.data ?? []).map((e) => [e.id, e.name]))
  const classById = new Map((classesQuery.data ?? []).map((c) => [c.id, c.name]))
  const subjectById = new Map((subjectsQuery.data ?? []).map((s) => [s.id, s.name]))
  const subjectsForClass = (subjectsQuery.data ?? []).filter((s) => s.class_id === form.class_id)

  return (
    <SectionCard
      title="Exam Rules"
      description="Total/pass marks per exam + class + subject."
      action={
        <TableToolbar
          title="Exam Rules"
          filename="exam-rules"
          rows={data}
          columns={[
            { label: 'Exam', value: (r) => examById.get(r.exam_id) ?? `#${r.exam_id}` },
            { label: 'Class', value: (r) => classById.get(r.class_id) ?? `#${r.class_id}` },
            { label: 'Subject', value: (r) => subjectById.get(r.subject_id) ?? `#${r.subject_id}` },
            { label: 'Total', value: (r) => r.total_marks },
            { label: 'Pass', value: (r) => r.pass_marks },
          ]}
        />
      }
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!form.exam_id || !form.class_id || !form.subject_id) return
          createMutation.mutate(form)
        }}
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6"
      >
        <Field label="Exam" required>
          <select
            required
            value={form.exam_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, exam_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {examsQuery.data?.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Class" required>
          <select
            required
            value={form.class_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, class_id: Number(e.target.value), subject_id: 0 }))}
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
        <Field label="Subject" required>
          <select
            required
            value={form.subject_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, subject_id: Number(e.target.value) }))}
            className="input"
            disabled={!form.class_id}
          >
            <option value="">Select…</option>
            {subjectsForClass.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Total marks" required>
          <input
            required
            type="number"
            value={form.total_marks}
            onChange={(e) => setForm((f) => ({ ...f, total_marks: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Pass marks" required>
          <input
            required
            type="number"
            value={form.pass_marks}
            onChange={(e) => setForm((f) => ({ ...f, pass_marks: e.target.value }))}
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
        columns={['Exam', 'Class', 'Subject', 'Total', 'Pass']}
        isLoading={isLoading}
        error={error}
        isEmpty={data?.length === 0}
      >
        {data?.map((r) => (
          <tr key={r.id}>
            <td className="px-4 py-3 font-medium text-slate-900">{examById.get(r.exam_id) ?? `#${r.exam_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{classById.get(r.class_id) ?? `#${r.class_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{subjectById.get(r.subject_id) ?? `#${r.subject_id}`}</td>
            <td className="px-4 py-3 text-slate-600">{r.total_marks}</td>
            <td className="px-4 py-3 text-slate-600">{r.pass_marks}</td>
          </tr>
        ))}
      </Table>
    </SectionCard>
  )
}

function MarksAndResultsSection() {
  const [markForm, setMarkForm] = useState<MarkCreate>({ exam_id: 0, student_id: 0, subject_id: 0, marks_obtained: '' })
  const [resultQuery, setResultQuery] = useState<{ exam_id: number; student_id: number } | null>(null)
  const [generatedResult, setGeneratedResult] = useState<Result | null>(null)
  const queryClient = useQueryClient()

  const examsQuery = useQuery({ queryKey: ['exams'], queryFn: async () => (await api.get<Exam[]>('/exams')).data })
  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get<Student[]>('/students')).data,
  })
  const subjectsQuery = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => (await api.get<Subject[]>('/academic/subjects')).data,
  })

  const markMutation = useMutation({
    mutationFn: async (payload: MarkCreate) => (await api.post('/exams/marks', payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marks'] }),
  })

  const generateMutation = useMutation({
    mutationFn: async ({ exam_id, student_id }: { exam_id: number; student_id: number }) =>
      (await api.post<Result>(`/exams/results/generate?exam_id=${exam_id}&student_id=${student_id}`)).data,
    onSuccess: (result) => setGeneratedResult(result),
  })

  const studentClassId = studentsQuery.data?.find((s) => s.id === markForm.student_id)?.class_id
  const subjectsForStudent = (subjectsQuery.data ?? []).filter((s) => s.class_id === studentClassId)

  return (
    <SectionCard title="Marks & Results" description="Record a mark, then generate the result once every subject is recorded.">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!markForm.exam_id || !markForm.student_id || !markForm.subject_id) return
          markMutation.mutate(markForm)
        }}
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6"
      >
        <Field label="Exam" required>
          <select
            required
            value={markForm.exam_id || ''}
            onChange={(e) => setMarkForm((f) => ({ ...f, exam_id: Number(e.target.value) }))}
            className="input"
          >
            <option value="">Select…</option>
            {examsQuery.data?.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Student" required>
          <select
            required
            value={markForm.student_id || ''}
            onChange={(e) => setMarkForm((f) => ({ ...f, student_id: Number(e.target.value), subject_id: 0 }))}
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
        <Field label="Subject" required>
          <select
            required
            value={markForm.subject_id || ''}
            onChange={(e) => setMarkForm((f) => ({ ...f, subject_id: Number(e.target.value) }))}
            className="input"
            disabled={!markForm.student_id}
          >
            <option value="">Select…</option>
            {subjectsForStudent.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Marks">
          <input
            type="number"
            value={markForm.marks_obtained}
            onChange={(e) => setMarkForm((f) => ({ ...f, marks_obtained: e.target.value }))}
            className="input"
            disabled={markForm.is_absent}
          />
        </Field>
        <Field label="Absent?">
          <input
            type="checkbox"
            checked={markForm.is_absent ?? false}
            onChange={(e) => setMarkForm((f) => ({ ...f, is_absent: e.target.checked }))}
            className="mt-2 h-4 w-4"
          />
        </Field>
        <div className="flex items-end">
          <PrimaryButton type="submit" disabled={markMutation.isPending} className="w-full">
            Save mark
          </PrimaryButton>
        </div>
      </form>
      <ErrorNote error={markMutation.error} />

      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="flex items-end gap-2">
          <Field label="Exam">
            <select
              value={resultQuery?.exam_id ?? ''}
              onChange={(e) => setResultQuery((q) => ({ exam_id: Number(e.target.value), student_id: q?.student_id ?? 0 }))}
              className="input"
            >
              <option value="">Select…</option>
              {examsQuery.data?.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Student">
            <select
              value={resultQuery?.student_id ?? ''}
              onChange={(e) => setResultQuery((q) => ({ exam_id: q?.exam_id ?? 0, student_id: Number(e.target.value) }))}
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
          <PrimaryButton
            type="button"
            disabled={!resultQuery?.exam_id || !resultQuery?.student_id || generateMutation.isPending}
            onClick={() => resultQuery && generateMutation.mutate(resultQuery)}
          >
            Generate result
          </PrimaryButton>
        </div>
        <ErrorNote error={generateMutation.error} />
        {generatedResult && (
          <div className="mt-4 flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <Badge color={generatedResult.is_pass ? 'emerald' : 'red'}>{generatedResult.is_pass ? 'Pass' : 'Fail'}</Badge>
            <span className="text-sm text-slate-700">
              {generatedResult.total_obtained} / {generatedResult.total_max} ({generatedResult.percentage}%)
            </span>
            {generatedResult.grade && (
              <span className="text-sm font-semibold text-slate-900">
                Grade {generatedResult.grade} · GPA {generatedResult.grade_point}
              </span>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )
}

export function ExamsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Exams & Results</h1>
      <p className="mt-1 text-sm text-slate-500">Exams, grade scales, exam rules, marks, and generated results.</p>
      <div className="mt-6 space-y-6">
        <ExamsSection />
        <GradeScalesSection />
        <ExamRulesSection />
        <MarksAndResultsSection />
      </div>
    </div>
  )
}
