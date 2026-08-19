export interface Permission {
  id: number
  slug: string
  name: string
  group: string
}

export interface Role {
  id: number
  name: string
  deletable: boolean
  permissions: Permission[]
}

export interface CurrentUser {
  id: number
  name: string
  email: string
  is_active: boolean
  role: Role | null
}

export const ADMISSION_STATUS: Record<number, string> = {
  1: 'New',
  2: 'Contacted',
  3: 'Follow Up',
  4: 'Admitted',
  5: 'Rejected',
}

export const ADMISSION_SOURCE: Record<number, string> = {
  1: 'Advertisement',
  2: 'Website',
  3: 'Referral',
  4: 'Walk-in',
  5: 'Social Media',
  6: 'Other',
}

export interface AdmissionEnquiry {
  id: number
  enquiry_no: string
  name: string
  phone_no: string
  email: string | null
  guardian_name: string | null
  guardian_phone_no: string | null
  address: string | null
  class_id: number | null
  source: number
  status: number
  follow_up_date: string | null
  note: string | null
  student_id: number | null
}

export interface AdmissionEnquiryCreate {
  name: string
  phone_no: string
  email?: string | null
  guardian_name?: string | null
  guardian_phone_no?: string | null
  address?: string | null
  class_id?: number | null
  source?: number
  follow_up_date?: string | null
  note?: string | null
}

export const RESIDENCY_TYPE: Record<number, string> = {
  1: 'Day Scholar',
  2: 'Hosteller',
}

export const STUDENT_STATUS: Record<number, string> = {
  1: 'Active',
  2: 'Inactive',
  3: 'Graduated',
  4: 'Dropped',
}

export interface Student {
  id: number
  admission_no: string
  name: string
  dob: string | null
  gender: number | null
  email: string | null
  phone_no: string | null
  guardian_name: string | null
  guardian_phone_no: string | null
  present_address: string | null
  permanent_address: string | null
  residency_type: number
  hostel_room_no: string | null
  class_id: number | null
  section_id: number | null
  status: number
}

export interface StudentCreate {
  name: string
  dob?: string | null
  gender?: number | null
  email?: string | null
  phone_no?: string | null
  guardian_name?: string | null
  guardian_phone_no?: string | null
  present_address?: string | null
  permanent_address?: string | null
  residency_type?: number
  hostel_room_no?: string | null
  class_id?: number | null
  section_id?: number | null
}

export interface SchoolClass {
  id: number
  name: string
  order: number
  is_active: boolean
}

export interface SchoolClassCreate {
  name: string
  order?: number
}

export const SUBJECT_TYPE: Record<number, string> = {
  1: 'Core',
  2: 'Elective',
  3: 'Selective',
}

export interface Subject {
  id: number
  name: string
  code: string
  subject_type: number
  class_id: number
  is_active: boolean
}

export interface SubjectCreate {
  name: string
  code: string
  subject_type?: number
  class_id: number
}

// -- Hostel -----------------------------------------------------------

export interface Hostel {
  id: number
  name: string
  address: string | null
  warden_id: number | null
  is_active: boolean
}

export interface HostelCreate {
  name: string
  address?: string | null
}

export interface HostelRoom {
  id: number
  hostel_id: number
  room_no: string
  capacity: number
  is_active: boolean
  occupied: number
}

export interface HostelRoomCreate {
  hostel_id: number
  room_no: string
  capacity?: number
}

export const HOSTEL_ALLOCATION_STATUS: Record<number, string> = { 1: 'Active', 2: 'Vacated' }

export interface HostelAllocation {
  id: number
  student_id: number
  room_id: number
  bed_no: string | null
  allocated_date: string
  vacated_date: string | null
  status: number
  note: string | null
}

export interface HostelAllocationCreate {
  student_id: number
  room_id: number
  bed_no?: string | null
}

// -- Fees ---------------------------------------------------------------

export interface FeeHead {
  id: number
  name: string
  description: string | null
  is_active: boolean
}

export interface FeeHeadCreate {
  name: string
  description?: string | null
}

export const INVOICE_STATUS: Record<number, string> = {
  1: 'Unpaid',
  2: 'Partial',
  3: 'Paid',
  4: 'Cancelled',
}

export interface Invoice {
  id: number
  invoice_no: string
  student_id: number
  fee_head_id: number
  amount: string
  discount: string
  fine: string
  issued_date: string
  due_date: string
  note: string | null
  status: number
  paid_amount: string
  balance: string
}

export interface InvoiceCreate {
  student_id: number
  fee_head_id: number
  amount: string
  discount?: string
  fine?: string
  due_date: string
  note?: string | null
}

export const PAYMENT_METHOD: Record<number, string> = {
  1: 'Cash',
  2: 'Bank Transfer',
  3: 'Mobile Banking',
  4: 'Card',
  5: 'Cheque',
}

export interface Payment {
  id: number
  invoice_id: number
  amount: string
  payment_date: string
  method: number
  reference_no: string | null
  received_by_id: number | null
  note: string | null
}

export interface PaymentCreate {
  amount: string
  method?: number
  reference_no?: string | null
  note?: string | null
}

// -- Library --------------------------------------------------------------

export interface Book {
  id: number
  isbn: string | null
  title: string
  author: string | null
  publisher: string | null
  category: string | null
  total_copies: number
  is_active: boolean
  available_copies: number
}

export interface BookCreate {
  title: string
  isbn?: string | null
  author?: string | null
  publisher?: string | null
  category?: string | null
  total_copies?: number
}

export const BOOK_ISSUE_STATUS: Record<number, string> = { 1: 'Issued', 2: 'Returned', 3: 'Lost' }

export interface BookIssue {
  id: number
  book_id: number
  student_id: number
  issue_date: string
  due_date: string
  return_date: string | null
  status: number
  fine_amount: string
  note: string | null
}

export interface BookIssueCreate {
  book_id: number
  student_id: number
  due_date: string
  note?: string | null
}

// -- Transport --------------------------------------------------------

export interface Vehicle {
  id: number
  registration_no: string
  vehicle_type: string
  capacity: number
  driver_name: string | null
  driver_phone: string | null
  is_active: boolean
}

export interface VehicleCreate {
  registration_no: string
  vehicle_type: string
  capacity?: number
  driver_name?: string | null
  driver_phone?: string | null
}

export interface Route {
  id: number
  name: string
  fare: string
  vehicle_id: number | null
  is_active: boolean
  capacity: number | null
  occupied: number
}

export interface RouteCreate {
  name: string
  fare?: string
  vehicle_id?: number | null
}

export const TRANSPORT_ALLOCATION_STATUS: Record<number, string> = { 1: 'Active', 2: 'Ended' }

export interface TransportAllocation {
  id: number
  student_id: number
  route_id: number
  stop_id: number | null
  start_date: string
  end_date: string | null
  status: number
  note: string | null
}

export interface TransportAllocationCreate {
  student_id: number
  route_id: number
}

// -- Exams ------------------------------------------------------------

export interface Exam {
  id: number
  name: string
  is_active: boolean
}

export interface ExamCreate {
  name: string
}

export interface GradeScale {
  id: number
  name: string
  min_percent: string
  max_percent: string
  grade_point: string
  is_active: boolean
}

export interface GradeScaleCreate {
  name: string
  min_percent: string
  max_percent: string
  grade_point: string
}

export interface ExamRule {
  id: number
  exam_id: number
  class_id: number
  subject_id: number
  total_marks: string
  pass_marks: string
}

export interface ExamRuleCreate {
  exam_id: number
  class_id: number
  subject_id: number
  total_marks: string
  pass_marks: string
}

export interface Mark {
  id: number
  exam_id: number
  student_id: number
  subject_id: number
  marks_obtained: string
  is_absent: boolean
}

export interface MarkCreate {
  exam_id: number
  student_id: number
  subject_id: number
  marks_obtained?: string
  is_absent?: boolean
}

export interface Result {
  id: number
  exam_id: number
  student_id: number
  total_obtained: string
  total_max: string
  percentage: string
  grade: string | null
  grade_point: string | null
  is_pass: boolean
}

// -- Certificates -----------------------------------------------------

export interface CertificateType {
  id: number
  name: string
  description: string | null
  requires_graduation: boolean
  is_active: boolean
}

export interface CertificateTypeCreate {
  name: string
  description?: string | null
  requires_graduation?: boolean
}

export const CERTIFICATE_STATUS: Record<number, string> = { 1: 'Issued', 2: 'Revoked' }

export interface Certificate {
  id: number
  certificate_no: string
  certificate_type_id: number
  student_id: number
  issue_date: string
  issued_by_id: number | null
  remarks: string | null
  status: number
  revoked_reason: string | null
  revoked_date: string | null
}

export interface CertificateIssueCreate {
  certificate_type_id: number
  student_id: number
  remarks?: string | null
}

// -- HR & Payroll -------------------------------------------------------

export const EMPLOYEE_STATUS: Record<number, string> = { 1: 'Active', 2: 'Resigned' }

export interface Employee {
  id: number
  employee_no: string
  user_id: number | null
  name: string
  designation: string
  phone_no: string | null
  email: string | null
  joining_date: string
  basic_salary: string
  status: number
}

export interface EmployeeCreate {
  name: string
  designation: string
  phone_no?: string | null
  email?: string | null
  basic_salary?: string
}

export const LEAVE_TYPE: Record<number, string> = {
  1: 'Casual',
  2: 'Sick',
  3: 'Earned',
  4: 'Maternity',
  5: 'Unpaid',
}

export const LEAVE_STATUS: Record<number, string> = { 1: 'Pending', 2: 'Approved', 3: 'Rejected' }

export interface LeaveRequest {
  id: number
  employee_id: number
  leave_type: number
  start_date: string
  end_date: string
  reason: string | null
  status: number
  approved_by_id: number | null
  decided_date: string | null
  decision_note: string | null
}

export interface LeaveRequestCreate {
  employee_id: number
  leave_type?: number
  start_date: string
  end_date: string
  reason?: string | null
}

export const PAYROLL_STATUS: Record<number, string> = { 1: 'Pending', 2: 'Paid' }

export interface Payroll {
  id: number
  employee_id: number
  month: number
  year: number
  basic_salary: string
  allowances: string
  deductions: string
  net_salary: string
  status: number
  paid_date: string | null
}

export interface PayrollGenerate {
  employee_id: number
  month: number
  year: number
  allowances?: string
  deductions?: string
}

export interface DepartmentItem {
  name: string
  blurb: string
}

export interface FacilityItem {
  name: string
  blurb: string
}

export interface FacultyStrengthItem {
  department: string
  count: number
}

export interface AchievementItem {
  year: string
  title: string
  detail: string
}

export interface CareerServiceItem {
  title: string
  blurb: string
}

export const ATTENDANCE_STATUS: Record<number, string> = {
  1: 'Present',
  2: 'Absent',
  3: 'Late',
  4: 'Excused',
}

export interface RosterEntry {
  student_id: number
  student_name: string
  admission_no: string
  status: number | null
  note: string | null
}

export interface AttendanceEntry {
  student_id: number
  status: number
  note?: string | null
}

export interface AttendanceBulkMark {
  class_id: number
  date: string
  entries: AttendanceEntry[]
}

export interface Attendance {
  id: number
  student_id: number
  class_id: number
  date: string
  status: number
  note: string | null
  marked_by_id: number | null
}

export interface SiteContent {
  institution_name: string
  hero_eyebrow: string
  hero_title: string
  hero_description: string
  established_year: string
  students_count: string
  faculty_count: string
  programs_count: string
  about_description: string
  departments: DepartmentItem[]
  facilities: FacilityItem[]
  faculty_strength: FacultyStrengthItem[]
  achievements: AchievementItem[]
  placement_rate: string
  recruiting_partners: string
  avg_package: string
  highest_package: string
  career_services: CareerServiceItem[]
  contact_phone: string
  contact_email: string
  contact_address: string
}
