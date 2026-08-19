import { useState } from 'react'
import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { href: '#departments', label: 'Departments' },
  { href: '#facilities', label: 'Facilities' },
  { href: '#faculty', label: 'Faculty' },
  { href: '#achievements', label: 'Achievements' },
  { href: '#careers', label: 'Career Guidance' },
  { href: '#contact', label: 'Contact' },
]

const STATS = [
  { label: 'Established', value: '1998' },
  { label: 'Students', value: '6,200+' },
  { label: 'Faculty members', value: '340+' },
  { label: 'Programs offered', value: '42' },
]

const DEPARTMENTS = [
  { name: 'Computer Science & IT', blurb: 'Software engineering, AI/ML, data science, and networking, with dedicated computing labs.' },
  { name: 'Engineering & Technology', blurb: 'Mechanical, electrical, and civil engineering foundations with hands-on workshop training.' },
  { name: 'Business & Commerce', blurb: 'Accounting, finance, and business administration, paired with a student-run enterprise lab.' },
  { name: 'Science', blurb: 'Physics, chemistry, and biology with fully equipped research and demonstration laboratories.' },
  { name: 'Arts & Humanities', blurb: 'Literature, history, and social sciences, with an active debate and publishing society.' },
  { name: 'Mathematics & Statistics', blurb: 'Pure and applied mathematics, statistics, and a peer-tutoring center for every grade.' },
  { name: 'Fine Arts & Design', blurb: 'Visual arts, music, and design studios, culminating in an annual public exhibition.' },
  { name: 'Physical Education & Sports', blurb: 'Structured athletics, team sports, and fitness programs across all age groups.' },
]

const FACILITIES = [
  {
    name: 'Central Library',
    blurb: 'Over 40,000 volumes, digital journal access, and quiet study halls open through the evening.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
    ),
  },
  {
    name: 'Science & Computer Labs',
    blurb: 'Dedicated physics, chemistry, biology, and computing labs with modern instrumentation.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5m4.75-11.396A24.3 24.3 0 0112 2.5c.795 0 1.578.037 2.35.104M9.75 3.104c-.09.542-.152 1.09-.184 1.646M14.25 3.104v5.714a2.25 2.25 0 00.659 1.591L19.5 14.5M14.25 3.104c.09.542.152 1.09.184 1.646M5 14.5l1.35 6.75a2 2 0 001.962 1.606h7.376a2 2 0 001.962-1.606L19.5 14.5M5 14.5h14.5" />,
  },
  {
    name: 'Sports Complex',
    blurb: 'Indoor and outdoor courts, an athletics track, and a fully equipped fitness center.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />,
  },
  {
    name: 'Hostel',
    blurb: 'Separate boys’ and girls’ residences with wardens on-site, mess halls, and study rooms.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75M4.5 10.5V21h15V10.5M9 21v-6h6v6" />,
  },
  {
    name: 'Transport',
    blurb: 'A fleet of monitored buses covering every major route, with live pickup and drop timings.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.9 17.9 0 00-3.213-9.193 2.06 2.06 0 00-1.58-.87H14.25M16.5 18.75h-2.25m0-11.25h-8.28c-.98 0-1.87.6-2.238 1.51L2.34 12.9c-.09.22.06.45.29.45H4.5" />,
  },
  {
    name: 'Auditorium',
    blurb: 'A 900-seat auditorium hosting assemblies, cultural events, and guest lectures.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 12v6.75a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5V12M3 12l9-9 9 9" />,
  },
  {
    name: 'Health Center',
    blurb: 'An on-campus nurse, first-aid facilities, and a tie-up with the nearby general hospital.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6M12 3a9 9 0 100 18 9 9 0 000-18z" />,
  },
  {
    name: 'Wi-Fi Campus',
    blurb: 'High-speed internet across every classroom, lab, and common area.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856a10 10 0 0113.788 0M1.923 8.674a14.5 14.5 0 0120.154 0M12 20.25h.01" />,
  },
]

const FACULTY_STRENGTH = [
  { department: 'Computer Science & IT', count: 48 },
  { department: 'Engineering & Technology', count: 62 },
  { department: 'Business & Commerce', count: 40 },
  { department: 'Science', count: 55 },
  { department: 'Arts & Humanities', count: 44 },
  { department: 'Mathematics & Statistics', count: 30 },
  { department: 'Fine Arts & Design', count: 21 },
  { department: 'Physical Education & Sports', count: 18 },
]

const ACHIEVEMENTS = [
  { year: '2025', title: 'State-Level Science Fair — 1st Place', detail: 'Robotics team recognized for an autonomous water-quality monitoring project.' },
  { year: '2024', title: 'National Debate Championship — Finalist', detail: 'The debate society reached the national final for the second year running.' },
  { year: '2024', title: 'NAAC A+ Accreditation', detail: 'Awarded the highest institutional accreditation grade for academic quality.' },
  { year: '2023', title: 'Inter-College Sports Meet — Overall Champions', detail: 'Won the overall trophy across athletics, football, and basketball.' },
  { year: '2022', title: '100% Board Result — Senior Secondary', detail: 'Every senior-secondary candidate cleared the board examinations.' },
  { year: '2021', title: 'Best Campus Sustainability Initiative', detail: 'Recognized regionally for a solar power and rainwater harvesting program.' },
]

const CAREER_SERVICES = [
  {
    title: 'Placement Cell',
    blurb: 'A dedicated team runs campus recruitment drives with recurring industry partners each year.',
  },
  {
    title: 'Career Counseling',
    blurb: 'One-on-one guidance on stream selection, higher studies, and career planning from grade 9 onward.',
  },
  {
    title: 'Internship Program',
    blurb: 'Structured internships with partner organizations during the final two years of every program.',
  },
  {
    title: 'Alumni Network',
    blurb: 'An active alumni association offering mentorship, referrals, and an annual networking meet.',
  },
]

const CAREER_STATS = [
  { label: 'Placement rate', value: '92%' },
  { label: 'Recruiting partners', value: '85+' },
  { label: 'Avg. starting package', value: '₹6.2L' },
  { label: 'Highest package', value: '₹18L' },
]

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
      {children}
    </svg>
  )
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base text-slate-600">{description}</p>}
    </div>
  )
}

export function PublicCampusPage() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <span className="truncate text-lg font-semibold tracking-tight">
            <span className="sm:hidden">Greenwood</span>
            <span className="hidden sm:inline">Greenwood International School &amp; College</span>
          </span>
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Staff Login
            </Link>
          </nav>
          <button
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle menu"
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {navOpen && (
          <div className="border-t border-slate-200 px-4 py-3 lg:hidden">
            <nav className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setNavOpen(false)}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/login"
                className="rounded-md bg-indigo-600 px-3.5 py-2 text-center text-sm font-medium text-white hover:bg-indigo-500"
              >
                Staff Login
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Welcome to Greenwood</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Shaping curious minds, from first grade through graduation
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            A single campus spanning school and college education — eight departments, modern facilities, and a
            dedicated career guidance cell, all committed to helping every student go further.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#departments"
              className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Explore Departments
            </a>
            <a
              href="#contact"
              className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Contact Us
            </a>
          </div>
          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="text-sm text-slate-500">{stat.label}</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="About Us"
          title="Education built around every stage of growth"
          description="Greenwood brings school and college education onto one campus, so students move from their first classroom to their first career step without ever changing address. Our mission is simple: strong academics, well-rounded facilities, and guidance that follows every student past graduation."
        />
      </section>

      {/* Departments */}
      <section id="departments" className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Academics" title="Departments" description="Eight departments spanning the sciences, humanities, and the arts." />
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DEPARTMENTS.map((dept) => (
              <div key={dept.name} className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">{dept.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{dept.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section id="facilities" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Campus Life" title="Facilities" description="Everything a student needs, on one campus." />
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FACILITIES.map((facility) => (
              <div key={facility.name} className="rounded-lg border border-slate-200 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                  <SectionIcon>{facility.icon}</SectionIcon>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{facility.name}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{facility.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Faculty */}
      <section id="faculty" className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our People"
            title="Faculty"
            description="340+ qualified educators, most holding postgraduate or doctoral degrees in their subject."
          />
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FACULTY_STRENGTH.map((f) => (
              <div key={f.department} className="rounded-lg border border-slate-200 bg-white p-5 text-center">
                <div className="text-2xl font-semibold text-indigo-600">{f.count}</div>
                <div className="mt-1 text-sm text-slate-600">{f.department}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section id="achievements" className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Recognition" title="Achievements" description="A few milestones from recent years." />
          <div className="mt-12 space-y-0 divide-y divide-slate-200 border-y border-slate-200">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.title} className="flex flex-col gap-1 py-5 sm:flex-row sm:gap-6">
                <div className="shrink-0 text-sm font-semibold text-indigo-600 sm:w-16">{a.year}</div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{a.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Guidance */}
      <section id="careers" className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Beyond Graduation"
            title="Career Guidance & Placement"
            description="Support that starts with stream selection and continues well after the final exam."
          />
          <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
            {CAREER_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-sm text-slate-500">{stat.label}</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CAREER_SERVICES.map((service) => (
              <div key={service.title} className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{service.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Want to know more?</h2>
          <p className="mt-4 text-base text-slate-600">
            Reach out to our admissions office for a campus tour, a prospectus, or answers to any question about our
            programs.
          </p>
          <div className="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-4 text-sm text-slate-600 sm:grid-cols-3">
            <div>
              <div className="font-semibold text-slate-900">Phone</div>
              <div className="mt-1">+1 (555) 010-2030</div>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Email</div>
              <div className="mt-1">admissions@greenwood.example</div>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Address</div>
              <div className="mt-1">45 College Road, Greenwood</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Greenwood International School &amp; College</p>
          <Link to="/login" className="text-sm font-medium text-indigo-600 hover:underline">
            Staff Login &rarr;
          </Link>
        </div>
      </footer>
    </div>
  )
}
