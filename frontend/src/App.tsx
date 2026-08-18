import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AdmissionsListPage } from './pages/admissions/AdmissionsListPage'
import { AdmissionFormPage } from './pages/admissions/AdmissionFormPage'
import { StudentsListPage } from './pages/students/StudentsListPage'
import { StudentFormPage } from './pages/students/StudentFormPage'
import { AcademicPage } from './pages/academic/AcademicPage'
import { HostelPage } from './pages/hostel/HostelPage'
import { FeesPage } from './pages/fees/FeesPage'
import { LibraryPage } from './pages/library/LibraryPage'
import { TransportPage } from './pages/transport/TransportPage'
import { ExamsPage } from './pages/exams/ExamsPage'
import { CertificatesPage } from './pages/certificates/CertificatesPage'
import { HRPage } from './pages/hr/HRPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/admissions" element={<AdmissionsListPage />} />
          <Route path="/admissions/new" element={<AdmissionFormPage />} />
          <Route path="/students" element={<StudentsListPage />} />
          <Route path="/students/new" element={<StudentFormPage />} />
          <Route path="/academic" element={<AcademicPage />} />
          <Route path="/hostel" element={<HostelPage />} />
          <Route path="/fees" element={<FeesPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/transport" element={<TransportPage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/hr" element={<HRPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
