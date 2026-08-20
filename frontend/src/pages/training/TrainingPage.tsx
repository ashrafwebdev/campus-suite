import { useState } from 'react'
import { Link } from 'react-router-dom'

const CONTENTS = [
  { href: '#getting-started', label: 'Getting Started' },
  { href: '#dashboard', label: 'Dashboard' },
  { href: '#academic', label: 'Academic Structure' },
  { href: '#admissions', label: 'Admissions (CRM)' },
  { href: '#students', label: 'Students' },
  { href: '#attendance', label: 'Attendance' },
  { href: '#hostel', label: 'Hostel' },
  { href: '#fees', label: 'Fees & Finance' },
  { href: '#library', label: 'Library' },
  { href: '#transport', label: 'Transport' },
  { href: '#exams', label: 'Exams & Results' },
  { href: '#certificates', label: 'Certificates' },
  { href: '#hr', label: 'HR & Payroll' },
  { href: '#site-content', label: 'Public Site Content' },
  { href: '#print-export', label: 'Print & Export' },
  { href: '#mobile', label: 'Using It On Mobile' },
]

function Shot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <img src={src} alt={alt} loading="lazy" className="w-full" />
      <figcaption className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">{caption}</figcaption>
    </figure>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm text-slate-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {i + 1}
          </span>
          <span className="pt-px">{step}</span>
        </li>
      ))}
    </ol>
  )
}

function GuideSection({
  id,
  title,
  description,
  steps,
  shots,
  tip,
}: {
  id: string
  title: string
  description: string
  steps: string[]
  shots: { src: string; alt: string; caption: string }[]
  tip?: string
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-slate-200 py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
          <div className="mt-5">
            <Steps items={steps} />
          </div>
          {tip && (
            <div className="mt-5 rounded-md border border-indigo-100 bg-indigo-50 px-3.5 py-2.5 text-xs text-indigo-800">
              <span className="font-semibold">Tip: </span>
              {tip}
            </div>
          )}
        </div>
        <div className={`space-y-4 lg:col-span-3 ${shots.length > 1 ? 'sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0' : ''}`}>
          {shots.map((s) => (
            <Shot key={s.src} {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function TrainingPage() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <span className="min-w-0 truncate text-lg font-semibold tracking-tight">Training Guide</span>
          <nav className="hidden items-center gap-5 sm:flex">
            <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Campus Site
            </Link>
            <Link to="/login" className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Staff Login
            </Link>
          </nav>
          <button
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle menu"
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 sm:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {navOpen && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:hidden">
            <Link to="/about" onClick={() => setNavOpen(false)} className="text-sm font-medium text-slate-600">
              Campus Site
            </Link>
            <Link
              to="/login"
              onClick={() => setNavOpen(false)}
              className="rounded-md bg-indigo-600 px-3.5 py-2 text-center text-sm font-medium text-white"
            >
              Staff Login
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">How To</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Using SMA Campus Suite
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600">
            A walkthrough of every module, with real screenshots from a working instance — from setting up your
            first class to issuing a certificate. Each section below is short: what it's for, the steps, and what
            it looks like on screen.
          </p>
        </div>
      </section>

      {/* Contents */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Contents</h2>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {CONTENTS.map((c) => (
            <a key={c.href} href={c.href} className="text-sm text-indigo-600 hover:underline">
              {c.label}
            </a>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <GuideSection
          id="getting-started"
          title="Getting Started"
          description="Staff sign in with an email and password created by an administrator — there's no public self-signup for the dashboard, only for viewing the public campus page."
          steps={[
            'Go to /login (linked from the public campus page).',
            'Enter your email and password.',
            "You'll land on the Dashboard once signed in.",
          ]}
          shots={[{ src: '/screenshots/login.png', alt: 'Login screen', caption: 'Login — /login' }]}
        />

        <GuideSection
          id="dashboard"
          title="Dashboard"
          description="A quick read on where things stand — enrolled students, new admission enquiries, and total enquiries — plus one-click shortcuts to the two most common actions."
          steps={[
            'Check the three summary counts at a glance.',
            'Use "+ New admission enquiry" to log a lead.',
            'Use "+ Enroll student directly" to skip the enquiry step for a walk-in enrollment.',
          ]}
          shots={[{ src: '/screenshots/dashboard.png', alt: 'Dashboard with live counts', caption: 'Dashboard, after some data has been entered' }]}
        />

        <GuideSection
          id="academic"
          title="Academic Structure"
          description="Classes and subjects are the foundation everything else builds on — students are assigned to a class, and exams/attendance are recorded against it. Set this up first."
          steps={[
            'Go to Academic in the sidebar.',
            'Add each class (e.g. Class 9, Class 10).',
            'Add subjects, each tied to one class.',
          ]}
          shots={[{ src: '/screenshots/academic.png', alt: 'Academic structure page', caption: 'Classes and subjects' }]}
        />

        <GuideSection
          id="admissions"
          title="Admissions (CRM)"
          description="Every enquiry — from a website form, a phone call, a walk-in — gets logged here and tracked through a simple pipeline: New → Contacted → Follow Up → Admitted or Rejected."
          steps={[
            'Click "+ New enquiry" and record the prospect\'s name, phone, and source.',
            'Update its status as you follow up.',
            'Click "Convert to student" once they enroll — this creates the Student record for you.',
          ]}
          tip="Converting an enquiry doesn't ask you to re-type anything — the student record is created from the enquiry's own details."
          shots={[
            { src: '/screenshots/admissions-list.png', alt: 'Admission enquiries list', caption: 'Enquiries, tracked by status' },
            { src: '/screenshots/admissions-converted.png', alt: 'Converted enquiry with a link to the student', caption: 'One converted — note the "View student" link' },
          ]}
        />

        <GuideSection
          id="students"
          title="Students"
          description="The full student roster — whether enrolled directly or converted from an enquiry. Each student has a class, section, and residency type (day scholar or hosteller)."
          steps={[
            'Go to Students, click "+ Enroll student".',
            'Fill in the profile and assign a class.',
            'Mark residency as Day Scholar or Hosteller (hostel room is set automatically when you allocate a room later).',
          ]}
          shots={[{ src: '/screenshots/students.png', alt: 'Students list', caption: 'Enrolled students' }]}
        />

        <GuideSection
          id="attendance"
          title="Attendance"
          description="Daily, per-class attendance — mark a whole roster in one screen, then review history by class, student, or date range."
          steps={[
            'Go to Attendance, pick a class and date — the roster loads automatically.',
            'Mark each student Present / Absent / Late / Excused, with an optional note.',
            'Click "Save attendance". Re-marking the same day updates the record rather than duplicating it.',
          ]}
          shots={[{ src: '/screenshots/attendance-saved.png', alt: 'Attendance marked and saved, with history below', caption: 'A marked roster, and the history filter below it' }]}
        />

        <GuideSection
          id="hostel"
          title="Hostel"
          description="Hostels contain rooms, rooms have a capacity, and allocating a student to a room automatically updates their residency type."
          steps={[
            'Add a hostel (name + address).',
            'Add rooms to it, each with a bed capacity.',
            'Allocate a student to a room — capacity is enforced, and only one active allocation per student.',
          ]}
          shots={[{ src: '/screenshots/hostel.png', alt: 'Hostel management page', caption: 'Hostels, rooms, and allocations' }]}
        />

        <GuideSection
          id="fees"
          title="Fees & Finance"
          description="Fee heads are categories (Tuition, Transport, Exam Fee...). Invoices are issued per student against a fee head, and payments are recorded against the invoice."
          steps={[
            'Create a fee head, e.g. "Tuition Fee".',
            'Issue an invoice to a student with an amount and due date.',
            'Record a payment — balance updates live and the invoice status flips Unpaid → Partial → Paid automatically.',
          ]}
          shots={[{ src: '/screenshots/fees.png', alt: 'Fees and finance page with a paid invoice', caption: 'A fully paid invoice' }]}
        />

        <GuideSection
          id="library"
          title="Library"
          description="Track a book catalog and who currently has each copy checked out. Availability is always computed live from what's actually issued."
          steps={[
            'Add a book with a title, author, and total copies.',
            'Issue it to a student with a due date — copies already out are disabled in the picker.',
            'Return it (or mark it lost) from the issues list; overdue returns are fined automatically.',
          ]}
          shots={[{ src: '/screenshots/library.png', alt: 'Library page with a book issued', caption: 'A book checked out to a student' }]}
        />

        <GuideSection
          id="transport"
          title="Transport"
          description="Vehicles carry a seat capacity, routes are assigned to a vehicle, and student allocations to a route respect that vehicle's capacity."
          steps={[
            'Add a vehicle with its registration and seat capacity.',
            'Add a route and assign it a vehicle — the route inherits the vehicle\'s capacity.',
            'Allocate students to the route; ending an allocation frees the seat.',
          ]}
          shots={[{ src: '/screenshots/transport.png', alt: 'Transport page with a route and allocation', caption: 'A route with an assigned vehicle and a student allocation' }]}
        />

        <GuideSection
          id="exams"
          title="Exams & Results"
          description="Set up an exam, define grade scales and per-subject exam rules, then record marks. A result can only be generated once every subject for that student has a mark."
          steps={[
            'Create an exam (e.g. "Mid Term 2026") and a grade scale (percentage band → letter grade + GPA).',
            'Add an exam rule per class + subject, setting total and pass marks.',
            'Record each student\'s mark per subject, then click "Generate result" for their overall grade and GPA.',
          ]}
          tip="A student fails overall if any single subject is below its own pass mark — even if the combined percentage would otherwise pass."
          shots={[{ src: '/screenshots/exams.png', alt: 'Exam rules, marks entry, and a generated result', caption: 'A generated result: Pass, 92%, Grade A+' }]}
        />

        <GuideSection
          id="certificates"
          title="Certificates"
          description="Define certificate types (Transfer Certificate, Bonafide, Course Completion...), some of which can require the student to have graduated first, then issue them."
          steps={[
            'Create a certificate type, optionally flagging "Requires graduation".',
            'Issue it to a student — a graduation-required type blocks issuance until the student\'s status is Graduated.',
            'Revoke a certificate with a reason if it was issued in error; that frees the type up for reissue.',
          ]}
          shots={[{ src: '/screenshots/certificates.png', alt: 'Certificates page with one issued', caption: 'An issued certificate' }]}
        />

        <GuideSection
          id="hr"
          title="HR & Payroll"
          description="Employee records, leave requests with a one-time approve/reject decision, and monthly payroll generation from each employee's basic salary."
          steps={[
            'Add an employee with a designation and basic salary.',
            'Employees can request leave; approve or reject it (a decision can\'t be reversed or made twice).',
            'Generate that employee\'s payroll for a month — net salary is computed automatically — then mark it paid.',
          ]}
          shots={[{ src: '/screenshots/hr-payroll.png', alt: 'HR and payroll page', caption: 'An employee, an approved leave, and generated payroll' }]}
        />

        <GuideSection
          id="site-content"
          title="Public Site Content"
          description="The public campus page at /about isn't hardcoded — an admin edits its hero text, departments, facilities, faculty numbers, achievements, career guidance, and contact info from this screen, and it goes live immediately."
          steps={[
            'Go to Public Site Content in the sidebar (admin only).',
            'Edit any section — add or remove rows in the repeatable lists (departments, facilities, achievements...).',
            'Click "Save changes" — the public page reflects it right away, no deploy needed.',
          ]}
          shots={[
            { src: '/screenshots/site-content-editor.png', alt: 'Public site content editor', caption: 'The admin editor' },
            { src: '/screenshots/public-about.png', alt: 'The resulting public campus page', caption: 'What visitors see at /about' },
          ]}
        />

        <GuideSection
          id="print-export"
          title="Print & Export"
          description="Every list in the system — not just a few — has a Print button and an Export button next to its title."
          steps={[
            'Print opens a clean, printer-friendly version of just that table in a new tab.',
            'Export downloads a CSV file that opens correctly formatted in Excel.',
          ]}
          shots={[{ src: '/screenshots/print-export.png', alt: 'Print and Export buttons on a list', caption: 'Print and Export, next to every section title' }]}
        />

        <GuideSection
          id="mobile"
          title="Using It On Mobile"
          description="The whole staff dashboard is responsive — the sidebar collapses behind a menu button, and every form stacks to a single column on a phone screen."
          steps={[
            'Open the app on a phone; the sidebar is replaced by a hamburger menu.',
            'Tap the menu icon to open the same navigation as a slide-in drawer.',
          ]}
          shots={[
            { src: '/screenshots/mobile-dashboard.png', alt: 'Dashboard on a phone screen', caption: 'Dashboard, phone width' },
            { src: '/screenshots/mobile-menu.png', alt: 'Mobile navigation drawer open', caption: 'The navigation drawer' },
          ]}
        />
      </div>

      <footer className="mt-8 border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p className="text-sm text-slate-500">Questions not covered here? Contact your administrator.</p>
          <div className="flex gap-4">
            <Link to="/about" className="text-sm font-medium text-indigo-600 hover:underline">
              Campus Site
            </Link>
            <Link to="/login" className="text-sm font-medium text-indigo-600 hover:underline">
              Staff Login &rarr;
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
