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
