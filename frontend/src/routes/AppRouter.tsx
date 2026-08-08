// ============================================================
// Router — Master Canonical Routes for Knowledge AI (16 Views)
// ============================================================

import React, { Suspense, lazy } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'

// Layouts
import { PublicLayout }    from '@/layouts/PublicLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { AuthLayout }      from '@/layouts/AuthLayout'
import { AdminLayout }     from '@/layouts/AdminLayout'
import { ErrorLayout }     from '@/layouts/ErrorLayout'

// Guards
import { ProtectedRoute }  from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

// Loading fallback
import { PageLoader }      from '@/components/common/PageLoader'

// ── Lazy Page Imports (16 Canonical Specified Views) ──────
// Public & Marketing
const HomePage            = lazy(() => import('@/pages/public/HomePage'))

// Auth
const LoginPage           = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage        = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPassword      = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPassword       = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const OTPVerification     = lazy(() => import('@/pages/auth/OTPVerificationPage'))
const AccountVerified     = lazy(() => import('@/pages/auth/AccountVerifiedPage'))

// User Dashboard & Sub-pages
const DashboardPage       = lazy(() => import('@/pages/dashboard/DashboardPage'))
const MyProjectsPage      = lazy(() => import('@/pages/dashboard/MyProjectsPage'))
const VoicePage           = lazy(() => import('@/pages/dashboard/VoicePage'))
const PersonalLibraryPage = lazy(() => import('@/pages/dashboard/PersonalLibraryPage'))
const SettingsPage        = lazy(() => import('@/pages/dashboard/SettingsPage'))
const ChatPage            = lazy(() => import('@/pages/dashboard/ChatPage'))
const HistoryPage         = lazy(() => import('@/pages/dashboard/HistoryPage'))

// Admin Pages
const AdminPage           = lazy(() => import('@/pages/admin/AdminPage'))
const AdminModelsPage     = lazy(() => import('@/pages/admin/AdminModelsPage'))
const AdminDatasetsPage   = lazy(() => import('@/pages/admin/AdminDatasetsPage'))
const AdminUsersPage      = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminMonitoringPage  = lazy(() => import('@/pages/admin/AdminMonitoringPage'))
const AdminSettingsPage   = lazy(() => import('@/pages/admin/AdminSettingsPage'))

// Errors
const NotFoundPage        = lazy(() => import('@/pages/errors/NotFoundPage'))
const UnauthorizedPage    = lazy(() => import('@/pages/errors/UnauthorizedPage'))

// ── Suspense wrapper ──────────────────────────────────────
const Suspended = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
)

// ── Router definition ─────────────────────────────────────
const router = createBrowserRouter([
  // ── Public Marketing Routes ────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Suspended><HomePage /></Suspended> },
    ],
  },

  // ── Auth Routes (Public Only) ──────────────────────────
  {
    element: <PublicOnlyRoute><AuthLayout /></PublicOnlyRoute>,
    children: [
      { path: '/login',            element: <Suspended><LoginPage /></Suspended> },
      { path: '/register',         element: <Suspended><RegisterPage /></Suspended> },
      { path: '/forgot-password',  element: <Suspended><ForgotPassword /></Suspended> },
      { path: '/reset-password',   element: <Suspended><ResetPassword /></Suspended> },
      { path: '/otp-verification', element: <Suspended><OTPVerification /></Suspended> },
      { path: '/account-verified', element: <Suspended><AccountVerified /></Suspended> },
    ],
  },

  // ── Protected User Routes ──────────────────────────────
  {
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: '/dashboard',        element: <Suspended><DashboardPage /></Suspended> },
      { path: '/projects',         element: <Suspended><MyProjectsPage /></Suspended> },
      { path: '/knowledgebase',    element: <Navigate to="/dashboard" replace /> },
      { path: '/voice',            element: <Suspended><VoicePage /></Suspended> },
      { path: '/personal-library', element: <Suspended><PersonalLibraryPage /></Suspended> },
      { path: '/settings',         element: <Suspended><SettingsPage /></Suspended> },

      // Legacy/alias routes
      { path: '/chat',             element: <Suspended><ChatPage /></Suspended> },
      { path: '/chat/:id',         element: <Suspended><ChatPage /></Suspended> },
      { path: '/documents',        element: <Navigate to="/dashboard" replace /> },
      { path: '/knowledgehub',     element: <Navigate to="/dashboard" replace /> },
      { path: '/history',          element: <Suspended><HistoryPage /></Suspended> },
      { path: '/profile',          element: <Navigate to="/settings?tab=profile" replace /> },
    ],
  },

  // ── Protected Admin Routes ─────────────────────────────
  {
    element: <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>,
    children: [
      { path: '/admin',                element: <Suspended><AdminPage /></Suspended> },
      { path: '/admin/models',         element: <Suspended><AdminModelsPage /></Suspended> },
      { path: '/admin/datasets',       element: <Suspended><AdminDatasetsPage /></Suspended> },
      { path: '/admin/users',          element: <Suspended><AdminUsersPage /></Suspended> },
      { path: '/admin/monitoring',     element: <Suspended><AdminMonitoringPage /></Suspended> },
      { path: '/admin/system-health',  element: <Navigate to="/admin/monitoring" replace /> },
      { path: '/admin/logs',           element: <Navigate to="/admin/monitoring" replace /> },
      { path: '/admin/settings',       element: <Suspended><AdminSettingsPage /></Suspended> },
      { path: '/admin/documents',      element: <Navigate to="/admin/datasets" replace /> },
    ],
  },

  // ── Error Routes ───────────────────────────────────────
  {
    element: <ErrorLayout />,
    children: [
      { path: '/401', element: <Suspended><UnauthorizedPage /></Suspended> },
      { path: '/404', element: <Suspended><NotFoundPage /></Suspended> },
      { path: '*',    element: <Navigate to="/404" replace /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
