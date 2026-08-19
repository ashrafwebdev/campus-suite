import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { ErrorNote, Field, ListEditor, PrimaryButton, SectionCard } from '../../components/ui'
import type { SiteContent } from '../../types/api'

function useSiteContentQuery() {
  return useQuery({
    queryKey: ['site-content'],
    queryFn: async () => (await api.get<SiteContent>('/site-content')).data,
  })
}

export function SiteContentPage() {
  const { data, isLoading, error } = useSiteContentQuery()
  const [form, setForm] = useState<SiteContent | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (data && !form) setForm(data)
  }, [data, form])

  const saveMutation = useMutation({
    mutationFn: async (payload: SiteContent) => (await api.put<SiteContent>('/site-content', payload)).data,
    onSuccess: (saved) => {
      queryClient.setQueryData(['site-content'], saved)
      setForm(saved)
    },
  })

  if (isLoading || !form) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Public Site Content</h1>
        <p className="mt-4 text-sm text-slate-500">{error ? 'Failed to load.' : 'Loading…'}</p>
      </div>
    )
  }

  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form) saveMutation.mutate(form)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Public Site Content</h1>
          <p className="mt-1 text-sm text-slate-500">
            Edits what visitors see on the public campus page at <code className="font-mono text-xs">/about</code>.
          </p>
        </div>
        <a href="/about" target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">
          View public page &rarr;
        </a>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <SectionCard title="Institution & Hero" description="Shown at the top of the public page.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Institution name" required>
              <input
                required
                value={form.institution_name}
                onChange={(e) => update('institution_name', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Hero eyebrow">
              <input value={form.hero_eyebrow} onChange={(e) => update('hero_eyebrow', e.target.value)} className="input" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Hero title" required>
              <input required value={form.hero_title} onChange={(e) => update('hero_title', e.target.value)} className="input" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Hero description">
              <textarea
                value={form.hero_description}
                onChange={(e) => update('hero_description', e.target.value)}
                className="input"
                rows={3}
              />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Established year">
              <input value={form.established_year} onChange={(e) => update('established_year', e.target.value)} className="input" />
            </Field>
            <Field label="Students">
              <input value={form.students_count} onChange={(e) => update('students_count', e.target.value)} className="input" />
            </Field>
            <Field label="Faculty members">
              <input value={form.faculty_count} onChange={(e) => update('faculty_count', e.target.value)} className="input" />
            </Field>
            <Field label="Programs offered">
              <input value={form.programs_count} onChange={(e) => update('programs_count', e.target.value)} className="input" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="About" description="A short mission / about blurb.">
          <Field label="About description">
            <textarea value={form.about_description} onChange={(e) => update('about_description', e.target.value)} className="input" rows={3} />
          </Field>
        </SectionCard>

        <SectionCard title="Departments">
          <ListEditor
            items={form.departments}
            onChange={(items) => update('departments', items)}
            newItem={{ name: '', blurb: '' }}
            addLabel="+ Add department"
            fields={[
              { key: 'name', label: 'Name' },
              { key: 'blurb', label: 'Description', type: 'textarea' },
            ]}
          />
        </SectionCard>

        <SectionCard title="Facilities">
          <ListEditor
            items={form.facilities}
            onChange={(items) => update('facilities', items)}
            newItem={{ name: '', blurb: '' }}
            addLabel="+ Add facility"
            fields={[
              { key: 'name', label: 'Name' },
              { key: 'blurb', label: 'Description', type: 'textarea' },
            ]}
          />
        </SectionCard>

        <SectionCard title="Faculty Strength" description="Faculty count shown per department.">
          <ListEditor
            items={form.faculty_strength}
            onChange={(items) => update('faculty_strength', items)}
            newItem={{ department: '', count: 0 }}
            addLabel="+ Add department"
            fields={[
              { key: 'department', label: 'Department' },
              { key: 'count', label: 'Faculty count', type: 'number' },
            ]}
          />
        </SectionCard>

        <SectionCard title="Achievements">
          <ListEditor
            items={form.achievements}
            onChange={(items) => update('achievements', items)}
            newItem={{ year: '', title: '', detail: '' }}
            addLabel="+ Add achievement"
            fields={[
              { key: 'year', label: 'Year' },
              { key: 'title', label: 'Title' },
              { key: 'detail', label: 'Detail', type: 'textarea' },
            ]}
          />
        </SectionCard>

        <SectionCard title="Career Guidance & Placement">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Placement rate">
              <input value={form.placement_rate} onChange={(e) => update('placement_rate', e.target.value)} className="input" />
            </Field>
            <Field label="Recruiting partners">
              <input value={form.recruiting_partners} onChange={(e) => update('recruiting_partners', e.target.value)} className="input" />
            </Field>
            <Field label="Avg. starting package">
              <input value={form.avg_package} onChange={(e) => update('avg_package', e.target.value)} className="input" />
            </Field>
            <Field label="Highest package">
              <input value={form.highest_package} onChange={(e) => update('highest_package', e.target.value)} className="input" />
            </Field>
          </div>
          <div className="mt-4">
            <ListEditor
              items={form.career_services}
              onChange={(items) => update('career_services', items)}
              newItem={{ title: '', blurb: '' }}
              addLabel="+ Add service"
              fields={[
                { key: 'title', label: 'Title' },
                { key: 'blurb', label: 'Description', type: 'textarea' },
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard title="Contact">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Phone">
              <input value={form.contact_phone} onChange={(e) => update('contact_phone', e.target.value)} className="input" />
            </Field>
            <Field label="Email">
              <input value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} className="input" />
            </Field>
            <Field label="Address">
              <input value={form.contact_address} onChange={(e) => update('contact_address', e.target.value)} className="input" />
            </Field>
          </div>
        </SectionCard>

        <ErrorNote error={saveMutation.error} />
        <div className="flex items-center gap-3">
          <PrimaryButton type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </PrimaryButton>
          {saveMutation.isSuccess && <span className="text-sm text-emerald-600">Saved.</span>}
        </div>
      </form>
    </div>
  )
}
